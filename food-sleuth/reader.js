/* Food Sleuth: reading a nutrition panel.

   Two parts, both running on this device:
   1. clean(): flattens the lighting in a photo and returns a grey image that
      the text recogniser (Tesseract, in ./ocr/) reads more reliably.
   2. parseLabel(): turns the recogniser's text into numbers. It knows the
      Australian/NZ panel (Energy in kJ, a per-serving and a per-100 g column)
      and the US "Nutrition Facts" panel (Calories, per serving only), and it
      cross-checks the two columns against the serving size to repair the
      commonest misreads, chiefly a lost decimal point (12.4 read as 124).

   Used by index.html, and by the test script in node. */
(function (root) {
  'use strict';

  /* ---------- 1. image clean-up ---------- */

  // rgba: Uint8ClampedArray, w x h. Returns a new Uint8ClampedArray (RGBA, grey).
  function clean(rgba, w, h) {
    const n = w * h, g = new Float32Array(n);
    for (let i = 0, j = 0; i < n; i++, j += 4) g[i] = 0.3 * rgba[j] + 0.59 * rgba[j + 1] + 0.11 * rgba[j + 2];
    // Light text on a dark panel: flip it so the text is dark.
    const hist = new Uint32Array(256);
    for (let i = 0; i < n; i++) hist[g[i] | 0]++;
    let acc = 0, median = 0;
    for (; median < 256; median++) { acc += hist[median]; if (acc > n / 2) break; }
    if (median < 100) for (let i = 0; i < n; i++) g[i] = 255 - g[i];
    // Background estimate: the brightest value nearby (text removed), smoothed.
    const r = Math.max(6, Math.round(Math.max(w, h) / 120));
    const bg = boxBlur(maxFilter(g, w, h, r), w, h, r * 2);
    const out = new Float32Array(n);
    for (let i = 0; i < n; i++) out[i] = Math.min(255, (g[i] / Math.max(bg[i], 1)) * 255);
    // Stretch so that the darkest 1% is black and the page is white.
    hist.fill(0);
    for (let i = 0; i < n; i++) hist[out[i] | 0]++;
    let lo = 0; acc = 0;
    for (; lo < 255; lo++) { acc += hist[lo]; if (acc > n * 0.01) break; }
    const hi = 235, k = 255 / Math.max(hi - lo, 20);
    const res = new Uint8ClampedArray(n * 4);
    for (let i = 0, j = 0; i < n; i++, j += 4) {
      const v = (out[i] - lo) * k;
      res[j] = res[j + 1] = res[j + 2] = v; res[j + 3] = 255;
    }
    return res;
  }

  // separable max filter, radius r
  function maxFilter(a, w, h, r) {
    const t = new Float32Array(a.length), o = new Float32Array(a.length);
    for (let y = 0; y < h; y++) {
      const row = y * w;
      for (let x = 0; x < w; x++) {
        let m = 0;
        const x0 = Math.max(0, x - r), x1 = Math.min(w - 1, x + r);
        for (let k = x0; k <= x1; k++) if (a[row + k] > m) m = a[row + k];
        t[row + x] = m;
      }
    }
    for (let x = 0; x < w; x++) {
      for (let y = 0; y < h; y++) {
        let m = 0;
        const y0 = Math.max(0, y - r), y1 = Math.min(h - 1, y + r);
        for (let k = y0; k <= y1; k++) if (t[k * w + x] > m) m = t[k * w + x];
        o[y * w + x] = m;
      }
    }
    return o;
  }

  // separable box blur, radius r, via running sums
  function boxBlur(a, w, h, r) {
    const t = new Float32Array(a.length), o = new Float32Array(a.length);
    for (let y = 0; y < h; y++) {
      const row = y * w;
      let s = 0, c = 0;
      for (let x = 0; x <= Math.min(r, w - 1); x++) { s += a[row + x]; c++; }
      for (let x = 0; x < w; x++) {
        t[row + x] = s / c;
        const add = x + r + 1, sub = x - r;
        if (add < w) { s += a[row + add]; c++; }
        if (sub >= 0) { s -= a[row + sub]; c--; }
      }
    }
    for (let x = 0; x < w; x++) {
      let s = 0, c = 0;
      for (let y = 0; y <= Math.min(r, h - 1); y++) { s += t[y * w + x]; c++; }
      for (let y = 0; y < h; y++) {
        o[y * w + x] = s / c;
        const add = y + r + 1, sub = y - r;
        if (add < h) { s += t[add * w + x]; c++; }
        if (sub >= 0) { s -= t[sub * w + x]; c--; }
      }
    }
    return o;
  }

  /* ---------- 2. text to numbers ---------- */

  const KJ_PER_KCAL = 4.184;
  const KEYS = ['kcal', 'protein', 'fat', 'carbs'];

  // Characters a recogniser commonly confuses inside numbers and units.
  function fixDigits(s) {
    return s
      .replace(/(?<=\d\s?)k\s?[j\]\)\}\|l1i](?![a-z])/gi, 'kJ')     // kJ read as k) k] k| kl
      .replace(/(?<=\d)[oO](?=[\d.,])/g, '0')
      .replace(/(?<=[\d.,])[oO]/g, '0')
      .replace(/(?<![a-z])[oO](?=[.,]\d)/g, '0')
      .replace(/(?<=\d)[lI|](?=\d)/g, '1')
      .replace(/(?<=\s)[lI|](?=[.,]\d)/g, '1')
      .replace(/(?<=\d)[sS](?=\d)/g, '5')
      .replace(/(?<=\d)\s?q\b/g, 'g')                                 // g read as q
      .replace(/(\d),(\d)(?!\d{2})/g, '$1.$2')                         // decimal comma
      .replace(/(\d)\.\s+(\d)/g, '$1.$2')
      .replace(/<\s*/g, '');
  }

  // Numeric tokens on a row, in reading order: {s: digits as read, unit}
  function tokens(line) {
    const out = [], re = /(\d+(?:\.\d+)?)\s*(kj|kcal|cal|calories|mg|mcg|µg|g|ml|%)?/gi;
    let m;
    while ((m = re.exec(line))) {
      let unit = (m[2] || '').toLowerCase();
      if (unit === 'calories' || unit === 'kcal') unit = 'cal';
      // a number run straight into letters ("Carbohydiifl8g") is less trustworthy
      out.push({ s: m[1], unit, glued: m.index > 0 && /[a-z]/i.test(line[m.index - 1]) });
    }
    return out;
  }

  // Readings a token might really be, each with a cost (0 = as read).
  //   "15.39" -> 15.3 (the 'g' was read as '9')
  //   "124"   -> 12.4 (the decimal point was lost)
  function readings(t, wantUnit) {
    const s = t.s, out = [{ v: parseFloat(s), c: 0 }];
    const bare = !t.unit;
    if (bare) out[0].c = 0.3;
    if (t.glued) out[0].c += 0.6;
    if (bare && /9$/.test(s) && s.length > 1) {
      const d = s.slice(0, -1).replace(/\.$/, '');
      const twoDp = /\.\d9$/.test(s);
      out.push({ v: parseFloat(d), c: twoDp ? 0.1 : 0.6 });
      if (twoDp) out[0].c = 1.2;
      if (!d.includes('.') && d.length >= 2) out.push({ v: parseFloat(d.slice(0, -1) + '.' + d.slice(-1)), c: 1.6 });
    }
    // energy: "16324" is often "1632kJ" with the J misread as a digit
    if (bare && wantUnit === 'kcal' && !s.includes('.') && s.length >= 4) out.push({ v: parseFloat(s.slice(0, -1)), c: 0.8 });
    if (!s.includes('.') && s.length >= 2 && wantUnit !== 'kcal')
      out.push({ v: parseFloat(s.slice(0, -1) + '.' + s.slice(-1)), c: 1.2 });
    return out;
  }

  function lev(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }

  // Which row a line is, from the words before its first number.
  function rowKind(l) {
    const lead = l.split(/\d/)[0].replace(/[^a-z\s]/g, ' ').trim().split(/\s+/).filter(w => w.length > 1);
    if (!lead.length) return null;
    let w = lead[0];
    if (w === 'total' || w === 'tota1' || w === 'tolal') { if (!lead[1]) return null; w = lead[1]; }
    if (w === 'avg' || w === 'average') { if (!lead[1]) return null; w = lead[1]; }
    const near = (word, max) => lev(w.slice(0, word.length + 1), word) <= max;
    if (near('energy', 2)) return 'energy';
    if (near('calories', 2)) return 'calories';
    if (near('protein', 2)) return 'protein';
    if (w === 'fat' || w === 'fats' || w === 'fal' || w === 'fet') return 'fat';
    if (near('carbohydrate', 4) || near('carbohydrates', 4) || /^c[ao]rb/.test(w)) return 'carbs';
    if (near('fibre', 1) || near('fiber', 1) || near('dietary', 2)) return 'fibre';
    return null;
  }

  function parseLabel(text) {
    const notes = [];
    const lines = text.split(/\r?\n/).map(s => fixDigits(s.trim()).toLowerCase()).filter(Boolean);
    const all = lines.join('\n');

    const isUS = /nutrition\s+facts|daily\s+value|%\s*dv|amount\s+per\s+serving/.test(all);
    const hasKJ = /\dkj|\bkj\b|kilojoule/.test(all) || !isUS;

    let unit = /100\s*m[l1i]|per\s*100\s*ml/.test(all) ? 'ml' : 'g';

    // Column order, from the header naming 'per serving' and 'per 100'.
    let order = isUS ? ['serve'] : ['serve', '100'];
    for (let i = 0; i < lines.length; i++) {
      if (/serv(ing|e)\s*s[i1l]ze/.test(lines[i])) continue;
      const l = lines[i] + ' ' + (lines[i + 1] || '');
      const a = l.search(/per\s*serv|serving\b|serve\b/), b = l.search(/per\s*100|100\s*(g|m[l1])/);
      if (a >= 0 && b >= 0) { order = a < b ? ['serve', '100'] : ['100', 'serve']; break; }
    }
    const rest = all.replace(/serv(ing|e)s?\s*(s[i1l]ze|per\s*(pack|cont|pkt|bag|bottle|jar|tub))[^\n]*/g, '');
    if (!isUS && !/serv/.test(rest) && /100\s*(g|m[l1])/.test(rest)) order = ['100'];

    // Serving size: candidate readings.
    let serveCands = [];
    for (const l of lines) {
      if (!/serv\w*\s*s[i1l][sz2]e/.test(l) || /per\s*(pack|cont)/.test(l)) continue;
      const after = l.replace(/.*serv\w*\s*s[i1l][sz2]e/, '');
      // US panels give the weight in brackets: "2/3 cup (55g)"
      const paren = after.match(/\((\d+(?:\.\d+)?)\s*([a-z]*)\s*\)/);
      const m = paren || after.replace(/\d+\s*\/\s*\d+/g, ' ').match(/(\d+(?:\.\d+)?)\s*(g|m[l1]|l)?\b/);
      if (!m) continue;
      const ustr = m[2] || '';
      const u = /m[l1]/.test(ustr) || ustr === 'l' ? 'ml' : 'g';
      const mult = ustr === 'l' ? 1000 : 1;
      if (u === 'ml') unit = 'ml';
      const s9 = /9$/.test(m[1]) && m[1].length > 1 && !m[1].includes('.');
      const v = parseFloat(m[1]);
      // a 'g' read as '9' ("309", "(409g)") is far commoner than a serving
      // size that really ends in 9
      serveCands = [{ v: v * mult, c: s9 ? (ustr ? 0.7 : 1.0) : 0 }];
      if (s9) serveCands.push({ v: parseFloat(m[1].slice(0, -1)) * mult, c: ustr ? 0.3 : 0.1 });
      break;
    }

    // Rows -> lists of tokens
    const rows = {};
    for (const l of lines) {
      const kind = rowKind(l);
      if (!kind) continue;
      const key = kind === 'energy' || kind === 'calories' ? 'kcal' : kind;
      if (rows[key]) continue;
      let ts = tokens(l).filter(t => t.unit !== '%' && t.unit !== 'mg' && t.unit !== 'mcg' && t.unit !== 'µg');
      if (key === 'kcal') {
        const kj = ts.filter(t => t.unit === 'kj'), cal = ts.filter(t => t.unit === 'cal');
        if (kind === 'calories') ts = ts.map(t => ({ ...t, kj: false }));
        else if (kj.length) ts = ts.filter(t => t.unit !== 'cal' && t.unit !== 'g' && t.s.length >= 2).map(t => ({ ...t, kj: true }));
        else if (cal.length) ts = cal.map(t => ({ ...t, kj: false }));
        else ts = ts.map(t => ({ ...t, kj: hasKJ }));
      } else ts = ts.filter(t => t.unit === 'g' || t.unit === '');
      if (ts.length) rows[key] = ts.slice(0, 2);
    }
    if (rows.fibre) rows.fibre = rows.fibre;

    // Options for each row: [{serve, 100, cost}] for the possible readings.
    function optionsFor(key, S) {
      const ts = rows[key];
      if (!ts) return [];
      const conv = (t, r) => key === 'kcal' && t.kj ? r.v / KJ_PER_KCAL : r.v;
      const opts = [];
      const cols = order.length === 1 ? [order] : ts.length >= 2 ? [order] : [[order[0]], [order[1]]];
      for (const col of cols) {
        const extra = cols.length > 1 ? 0.8 : 0;
        const rs = col.map((_, i) => readings(ts[i], key === 'kcal' ? 'kcal' : 'g').map(r => ({ v: conv(ts[i], r), c: r.c })));
        const combos = rs.length === 1 ? rs[0].map(a => [a]) : rs[0].flatMap(a => rs[1].map(b => [a, b]));
        for (const cb of combos) {
          const o = { serve: null, '100': null, cost: extra, match: false };
          col.forEach((name, i) => { o[name] = cb[i].v; o.cost += cb[i].c; });
          if (o['100'] != null && !plausible(key, o['100'])) continue;
          if (S && o.serve != null && o['100'] != null) {
            const want = o['100'] * S / 100, slack = key === 'kcal' ? 4 : 0.2;
            if (Math.abs(o.serve - want) <= Math.max(0.1 * Math.max(o.serve, want), slack)) o.match = true;
            else o.cost += 3;
          }
          if (o['100'] == null && S) { o['100'] = o.serve * 100 / S; if (!plausible(key, o['100'])) continue; }
          opts.push(o);
        }
      }
      return opts.sort((a, b) => a.cost - b.cost).slice(0, 6);
    }

    // Serving size unknown? Infer it from rows that have both columns.
    if (!serveCands.length && order.length === 2) {
      const ratios = [];
      for (const key of KEYS) {
        const ts = rows[key];
        if (!ts || ts.length < 2) continue;
        const a = parseFloat(ts[order.indexOf('serve')].s), b = parseFloat(ts[order.indexOf('100')].s);
        if (a > 0 && b > 0) ratios.push(a / b * 100);
      }
      ratios.sort((x, y) => x - y);
      if (ratios.length >= 2) {
        const mid = ratios[ratios.length >> 1];
        const agree = ratios.filter(r => Math.abs(r - mid) / mid < 0.1).length;
        if (agree >= 2) {
          const nice = [5, 10, 25, 50].map(st => Math.round(mid / st) * st).find(v => Math.abs(v - mid) / mid < 0.05) || Math.round(mid);
          serveCands = [{ v: nice, c: 1 }];
          notes.push(`The serving size wasn't read; ${nice} ${unit === 'ml' ? 'mL' : 'g'} was worked out from the two columns.`);
        }
      }
    }
    if (!serveCands.length) serveCands = [{ v: null, c: 0 }];

    // Choose the readings that agree best: columns with serving size, and
    // energy with 4 Cal/g protein and carbs, 9 Cal/g fat.
    let best = null;
    for (const sc of serveCands) {
      const S = sc.v;
      const opt = {};
      for (const key of [...KEYS, 'fibre']) opt[key] = optionsFor(key, S);
      const fib = opt.fibre[0] ? opt.fibre[0]['100'] || 0 : 0;
      const pick = k => [...opt[k], null];   // null: treat the row as unread
      for (const e of pick('kcal')) for (const p of pick('protein')) for (const f of pick('fat')) for (const c of pick('carbs')) {
        let cost = sc.c, energyOk = null;
        [e, p, f, c].forEach((o, i) => { cost += o ? o.cost : i === 0 ? 2.8 : 2.5; });
        if (e && p && f && c) {
          const est = 4 * p['100'] + 9 * f['100'] + 4 * c['100'] + (isUS ? 0 : 2 * fib);
          const d = Math.abs(est - e['100']) / Math.max(e['100'], 20);
          energyOk = d < 0.12;
          cost += d < 0.12 ? 0 : d < 0.25 ? 1.2 : 3.5;
        }
        if (p && f && c && p['100'] + f['100'] + c['100'] > 102) cost += 5;
        if (!best || cost < best.cost) best = { cost, S, e, p, f, c, energyOk, fib };
      }
    }

    const per100 = {}, sure = {};
    const pairs = { kcal: best.e, protein: best.p, fat: best.f, carbs: best.c };
    for (const k of KEYS) {
      const o = pairs[k];
      if (!o) continue;
      per100[k] = o['100'];
      sure[k] = !!(o.match || best.energyOk) && o.cost < 1;
      if (o.cost >= 1 && o.cost < 3) notes.push(`${cap(label(k))} was hard to read; check it.`);
      if (o.cost >= 3) notes.push(`${cap(label(k))}: the per-serve and per-100 columns don't agree. Check it.`);
    }
    if (best.energyOk === false) notes.push('Energy doesn\'t add up from protein, fat and carbs. One of them is probably misread.');

    // One missing: work it out from the other three.
    const missing = KEYS.filter(k => per100[k] == null);
    if (missing.length === 1) {
      const fibE = isUS ? 0 : 2 * best.fib;
      const m = missing[0], { kcal, protein, fat, carbs } = per100;
      let v;
      if (m === 'kcal') v = 4 * protein + 9 * fat + 4 * carbs + fibE;
      if (m === 'protein') v = (kcal - 9 * fat - 4 * carbs - fibE) / 4;
      if (m === 'fat') v = (kcal - 4 * protein - 4 * carbs - fibE) / 9;
      if (m === 'carbs') v = (kcal - 4 * protein - 9 * fat - fibE) / 4;
      if (v >= 0) { per100[m] = v; sure[m] = false; notes.push(`${cap(label(m))} wasn't read; it was worked out from the others. Check it.`); }
    }

    const found = KEYS.filter(k => per100[k] != null);
    return {
      ok: found.length > 0,
      style: isUS ? 'us' : 'au',
      unit, serve: best.S, basis: order.includes('100') ? '100' : 'serve',
      per100: { kcal: r1(per100.kcal), protein: r1(per100.protein), fat: r1(per100.fat), carbs: r1(per100.carbs) },
      sure, notes, found,
    };
  }

  function plausible(key, per100) { return key === 'kcal' ? per100 <= 950 : per100 <= 100; }
  function r1(x) { return x == null ? null : Math.round(x * 10) / 10; }
  function label(k) { return { kcal: 'energy', protein: 'protein', fat: 'fat', carbs: 'carbohydrate', fibre: 'fibre' }[k]; }
  function cap(s) { return s[0].toUpperCase() + s.slice(1); }

  const api = { clean, parseLabel, fixDigits };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FoodReader = api;
})(typeof self !== 'undefined' ? self : this);
