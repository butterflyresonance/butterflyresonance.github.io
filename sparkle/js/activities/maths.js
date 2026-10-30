/* ---------- maths for older children: written sums, fractions, missing numbers, sequences ----------
   Each kind (#mx/dec-add …) has a maker: MX[kind](level) returns a question
     { speech, steps: [step, (previous step's answers) => step, …] }
   with steps as described in mathpad.js. Five levels each. Three right first
   time in a row: a level harder. Needing "Show me", or two wrong tries: a
   level easier. Tapping a level dot jumps to that level. */

const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const gcd = (a, b) => b ? gcd(b, a % b) : Math.abs(a);
const lcm = (a, b) => a / gcd(a, b) * b;
const MX_LEVELS = 5;

/* -- written columns -- */
const mc = (t = '', cls = '') => `<span class="mc ${cls}">${t}</span>`;
const mrow = (cells, cls = '') => `<div class="mrow ${cls}">${cells.join('')}</div>`;
const mgrid = rows => `<div class="mgrid">${rows.join('')}</div>`;
/* Check a row of digit boxes against the expected digits (exp: one char per box,
   ' ' where the number hasn't started yet). Blank is fine where nothing would be
   written (before the number starts, a lone 0 before the point, zeros at the end
   after the point); everywhere else it needs the digit. Returns the wrong ones. */
function checkCols(ids, exp, vals, blankOk = new Set()) {
  const wrong = [];
  ids.forEach((id, i) => {
    const v = vals[id] || '', e = exp[i];
    const ok = e === ' ' ? v === '' || v === '0' : v === e || (v === '' && e === '0' && blankOk.has(i));
    if (!ok) wrong.push(id);
  });
  return wrong;
}
const anyFilled = (ids, vals) => ids.some(id => vals[id]);

/* -- decimals: + and −, each number with 0 to 3 places, lined up on the point -- */
function decNum(maxInt, minD, maxD) {
  const d = rnd(minD, maxD), i = rnd(0, maxInt);
  let f = 0;
  if (d) do { f = rnd(1, 10 ** d - 1); } while (f % 10 === 0);   // never ends in 0: 2.5, not 2.50
  return { i, d, v: i * 1000 + f * 10 ** (3 - d) };               // v: in thousandths, so no rounding errors
}
const decStr = (v, d) => d ? `${Math.floor(v / 1000)}.${String(v % 1000).padStart(3, '0').slice(0, d)}` : String(Math.floor(v / 1000));
const decClean = v => decStr(v, 3).replace(/\.?0+$/, '');
const DEC_LV = [[9, 1, 1], [20, 1, 2], [99, 0, 2], [99, 0, 3], [999, 0, 3]];   // [biggest whole part, fewest places, most places]
function makeDec(lv, sub) {
  const [mi, lo, hi] = DEC_LV[lv];
  let a, b;
  do { a = decNum(mi, lo, hi); b = decNum(mi, lo, hi); } while ((!a.d && !b.d) || (sub && a.v === b.v) || (!sub && a.v + b.v === 0));
  if (sub && b.v > a.v) [a, b] = [b, a];
  const r = sub ? a.v - b.v : a.v + b.v;
  const D = Math.max(a.d, b.d), rs = decStr(r, D), [ri, rf = ''] = rs.split('.');
  // one spare column on the left when adding, so the number of boxes doesn't give away whether it carries
  const I = Math.max(String(a.i).length, String(b.i).length, ri.length) + (sub ? 0 : ri.length > Math.max(String(a.i).length, String(b.i).length) ? 0 : 1);
  const n = I + D;
  const opRow = (x, sign) => {
    const is = String(x.i).padStart(I, ' ');
    const cells = [mc(sign, 'sign'), ...[...is].map(ch => mc(ch === ' ' ? '' : ch))];
    if (D) {
      cells.push(mc('.', x.d ? 'pt' : 'pt faint'));
      const fs = String(x.v % 1000).padStart(3, '0');
      for (let j = 0; j < D; j++) cells.push(j < x.d ? mc(fs[j]) : mc('0', 'faint'));   // the empty places, shown faintly as 0s
    }
    return mrow(cells);
  };
  const ids = Array.from({ length: n }, (_, i) => 'c' + i);
  const withPoint = (arr, pt) => D ? [...arr.slice(0, I), pt, ...arr.slice(I)] : arr;
  const scratch = withPoint(ids.map((_, i) => padCell('s' + i, 'scr', 'rtl', 'mc scratch')), mc());
  const ans = withPoint(ids.map(id => padCell(id, 'ans', 'rtl', 'mc')), mc('.', 'pt'));
  const exp = ri.padStart(I, ' ') + rf;
  const blankOk = new Set();
  if (ri === '0') blankOk.add(I - 1);
  for (let j = n - 1; j >= I && exp[j] === '0'; j--) blankOk.add(j);
  const op = sub ? '−' : '+', said = sub ? 'take away' : 'plus';
  return {
    speech: `What is ${decStr(a.v, a.d)} ${said} ${decStr(b.v, b.d)}?`,
    steps: [{
      html: mgrid([mrow([mc(), ...scratch], 'scr'), opRow(a, ''), opRow(b, op), `<div class="mline"></div>`, mrow([mc(), ...ans])])
        + `<p class="mhint">Start on the right. The small boxes on top are for carrying${sub ? ' and borrowing' : ''}.</p>`,
      first: ids[n - 1], order: [ids[n - 1]],
      check: v => {
        if (!anyFilled(ids, v)) return { ok: false, wrong: ids, msg: 'Type the answer in the boxes, starting from the right.' };
        const wrong = checkCols(ids, exp, v, blankOk);
        return wrong.length ? { ok: false, wrong, msg: 'Not quite. Have another look at the red boxes.' }
          : { ok: true, msg: `Yes! ${decStr(a.v, a.d)} ${op} ${decStr(b.v, b.d)} = ${decClean(r)}` };
      },
      answer: () => Object.fromEntries(ids.map((id, i) => [id, exp[i] === ' ' ? '' : exp[i]])),
    }],
  };
}

/* -- long multiplication: one row of working for each digit of the bottom number -- */
const MUL_LV = [[2, 1], [3, 1], [2, 2], [3, 2], [4, 2]];
const numOfLen = l => rnd(10 ** (l - 1), 10 ** l - 1);
function makeMul(lv) {
  const [la, lb] = MUL_LV[lv];
  const a = numOfLen(la);
  let b; do { b = numOfLen(lb); } while (String(b).includes('0') || b === 1);
  const p = a * b, N = la + lb, bd = String(b).split('').reverse().map(Number);
  const cols = prefix => Array.from({ length: N }, (_, i) => prefix + i);
  const numRow = (x, sign) => mrow([mc(sign, 'sign'), ...[...String(x).padStart(N, ' ')].map(ch => mc(ch === ' ' ? '' : ch))]);
  const ans = cols('c'), rows = [mrow([mc(), ...cols('s').map(id => padCell(id, 'scr', 'rtl', 'mc scratch'))], 'scr'), numRow(a, ''), numRow(b, '×'), '<div class="mline"></div>'];
  const parts = [];
  if (lb > 1) {
    bd.forEach((d, k) => {
      const ids = cols(`p${k}_`), v = a * d * 10 ** k, exp = String(v).padStart(N, ' ');
      parts.push({ ids, exp, k, live: ids.slice(0, N - k) });
      rows.push(mrow([mc(k === lb - 1 ? '+' : '', 'sign'), ...ids.map((id, i) => i >= N - k
        ? `<button class="mf cell mc fixed" data-f="${id}" data-row="p${k}">0</button>` : padCell(id, 'p' + k, 'rtl', 'mc'))], 'part'));
    });
    rows.push('<div class="mline"></div>');
  }
  rows.push(mrow([mc(), ...ans.map(id => padCell(id, 'ans', 'rtl', 'mc'))]));
  const exp = String(p).padStart(N, ' ');
  const order = [...parts.map(pt => pt.live.at(-1)), ans.at(-1)];
  return {
    speech: `What is ${a} times ${b}?`,
    steps: [{
      html: mgrid(rows) + `<p class="mhint">${lb > 1 ? `One row for each digit of ${b}, then add the rows. The 0 at the end of a row is already there for you. ` : ''}Small boxes on top are for carrying. Rows of working are optional; only the answer counts.</p>`,
      first: order[0], order,
      check: v => {
        if (!anyFilled(ans, v)) return { ok: false, wrong: ans, msg: lb > 1 ? 'Fill in the bottom row too: that is the answer.' : 'Type the answer, starting from the right.' };
        const wrong = checkCols(ans, exp, v);
        if (!wrong.length) return { ok: true, msg: `Yes! ${a} × ${b} = ${p}` };
        for (const pt of parts) if (anyFilled(pt.live, v)) wrong.push(...checkCols(pt.live, pt.exp.slice(0, N - pt.k), v));
        return { ok: false, wrong, msg: 'Not quite. Have another look at the red boxes.' };
      },
      answer: () => {
        const o = Object.fromEntries(ans.map((id, i) => [id, exp[i].trim()]));
        for (const pt of parts) pt.live.forEach((id, i) => { o[id] = pt.exp[i].trim(); });
        return o;
      },
    }],
  };
}

/* -- short division ("the bus stop"), with a remainder: the answer fills left to right -- */
const DIV_LV = [[2, 5, 2, 2], [2, 9, 2, 3], [2, 9, 3, 3], [3, 9, 4, 4], [6, 12, 3, 4]];   // divisor from-to, digits in the number from-to
function makeDiv(lv) {
  const [d0, d1, l0, l1] = DIV_LV[lv];
  let d, a;
  do { d = rnd(d0, d1); a = numOfLen(rnd(l0, l1)); } while (a < d * 2);
  const q = Math.floor(a / d), r = a % d, as = String(a), L = as.length;
  const qids = Array.from({ length: L }, (_, i) => 'q' + i), exp = String(q).padStart(L, ' ');
  const html = `<div class="busstop">
    <div class="mrow"><span class="mc div0">${d}</span>${qids.map(id => padCell(id, 'q', 'ltr', 'mc')).join('')}<span class="mc rlab">r</span>${padNum('r', 2, 'mc rem')}</div>
    <div class="mrow"><span class="mc div0 dv">${d}</span>${[...as].map((ch, i) => `<span class="mc dig${i ? '' : ' first'}">${i ? padNum('s' + i, 2, 'scratch') : ''}${ch}</span>`).join('')}<span class="mc rlab"></span><span class="mc rem"></span></div>
  </div><p class="mhint">Work from the left: how many ${d}s go into each digit? Carry what's left over into the small box by the next digit. What's left at the end is the remainder (r).</p>`;
  return {
    speech: `What is ${a} divided by ${d}?`,
    steps: [{
      html, first: 'q0', order: ['q0', 'r'],
      check: v => {
        if (!anyFilled(qids, v)) return { ok: false, wrong: qids, msg: 'Type the answer on top, starting from the left.' };
        const wrong = checkCols(qids, exp, v), rv = +(v.r || 0);
        if (rv !== r) wrong.push('r');
        if (!wrong.length) return { ok: true, msg: r ? `Yes! ${a} ÷ ${d} = ${q} remainder ${r}` : `Yes! ${a} ÷ ${d} = ${q}, with nothing left over` };
        return { ok: false, wrong, msg: rv >= d ? `The remainder has to be smaller than ${d}, or another ${d} would fit.` : 'Not quite. Have another look at the red boxes.' };
      },
      answer: () => ({ ...Object.fromEntries(qids.map((id, i) => [id, exp[i].trim()])), r: String(r) }),
    }],
  };
}

/* -- missing number: □ + 7 = 15, 4 × □ = 28 … the box can be anywhere -- */
function makeMissing(lv) {
  const ops = [['+', '−'], ['+', '−'], ['×', '÷'], ['+', '−', '×', '÷'], ['+', '−', '×', '÷']][lv];
  const op = pick(ops);
  let a, b, c;
  if (op === '+' || op === '−') {
    const max = [20, 100, 100, 100, 1000][lv];
    c = rnd(lv ? 11 : 5, max); a = rnd(1, c - 1); b = c - a;          // a + b = c
    if (op === '−') [a, b, c] = [c, a, b];                              // c − a = b, written as a − b = c
  } else {
    const t = [10, 10, 10, 12, 12][lv];
    a = rnd(2, t); b = rnd(2, lv === 4 ? 25 : t); c = a * b;           // a × b = c
    if (op === '÷') [a, b, c] = [c, a, b];                              // c ÷ a = b
  }
  const blank = rnd(0, 2), flip = lv >= 3 && Math.random() < .25;     // sometimes the answer comes first: 15 = □ + 7
  const shown = [a, b, c].map((n, i) => i === blank ? padNum('x', 5, 'big') : `<b>${n}</b>`);
  const eq = flip ? `${shown[2]}<b>=</b>${shown[0]}<b>${op}</b>${shown[1]}` : `${shown[0]}<b>${op}</b>${shown[1]}<b>=</b>${shown[2]}`;
  const ans = [a, b, c][blank];
  const calc = (x, y) => op === '+' ? x + y : op === '−' ? x - y : op === '×' ? x * y : x / y;
  const said = { '+': 'plus', '−': 'take away', '×': 'times', '÷': 'divided by' }[op];
  const sp = [a, b, c].map((n, i) => i === blank ? 'what' : n);
  return {
    speech: `${sp[0]} ${said} ${sp[1]} equals ${sp[2]}. What number goes in the box?`.replace(/^w/, 'W'),
    steps: [{
      html: `<div class="eqn">${eq}</div><p class="mhint">What number makes this true?</p>`,
      first: 'x', order: ['x'],
      check: v => {
        if (!v.x) return { ok: false, wrong: ['x'], msg: 'Type a number in the box.' };
        const x = +v.x;
        if (x === ans) { const t = [a, b, c]; t[blank] = x; return { ok: true, msg: `Yes! ${t[0]} ${op} ${t[1]} = ${t[2]}` }; }
        // put her number in, and show what it makes
        const t = [a, b, c]; t[blank] = x;
        const got = calc(t[0], t[1]);
        const msg = blank === 2 ? `Not quite. Work out ${a} ${op} ${b}.`
          : Number.isInteger(got) && got >= 0 ? `With ${x}: ${t[0]} ${op} ${t[1]} = ${got}, not ${c}.` : `With ${x}, ${t[0]} ${op} ${t[1]} doesn't come out to ${c}.`;
        return { ok: false, wrong: ['x'], msg };
      },
      answer: () => ({ x: String(ans) }),
    }],
  };
}

/* -- fractions -- */
const fr = (n, d, cls = '') => `<span class="fr ${cls}"><span class="fn">${n}</span><span class="fd">${d}</span></span>`;
const frBox = (n, d) => fr(padNum(n, 3, 'mc'), padNum(d, 3, 'mc'));
const frSay = (n, d) => `${n} over ${d}`;
function simplest(n, d) { const g = gcd(n, d) || 1; return [n / g, d / g]; }
function asMixed(n, d) {          // 7/6 → "1 and 1/6" (or just "2" if it's whole)
  const [sn, sd] = simplest(n, d);
  if (sn < sd) return null;
  const w = Math.floor(sn / sd), rest = sn % sd;
  return rest ? `${w} and ${rest}/${sd}` : `${w}`;
}
function properFrac(d) { let n; do { n = rnd(1, d - 1); } while (gcd(n, d) !== 1); return n; }
// two denominators to suit the level
function denPair(lv) {
  if (lv === 0) { const d = rnd(3, 12); return [d, d]; }
  if (lv === 1) { const d = rnd(2, 6), k = rnd(2, Math.min(3, Math.floor(12 / d))); return shuffle([d, d * k]); }
  if (lv === 2) { let a, b; do { a = rnd(2, 7); b = rnd(2, 7); } while (a === b || gcd(a, b) !== 1); return [a, b]; }
  let a, b;   // share a factor, so the smallest common bottom is less than the two multiplied (6 and 4: 12, not 24)
  do { a = rnd(2, 12); b = rnd(2, 12); } while (a === b || a % b === 0 || b % a === 0 || gcd(a, b) === 1 || lcm(a, b) > 36);
  return [a, b];
}
function makeFracAddSub(lv, sub) {
  const L = Math.min(lv, 3);
  let b, d, a, c;
  for (;;) {
    [b, d] = denPair(L); a = properFrac(b); c = properFrac(d);
    if (sub && a * d === c * b) continue;
    if (sub && a * d < c * b) { [a, b, c, d] = [c, d, a, b]; }
    if (lv === 0 && !sub && a + c >= b) continue;             // first level: answers stay below 1
    break;
  }
  const op = sub ? '−' : '+', said = sub ? 'take away' : 'plus';
  const tn = sub ? a * d - c * b : a * d + c * b, td = b * d;  // the true answer, unsimplified
  const L2 = lcm(b, d);
  const same = b === d;
  // step 2, from whatever common bottom she chose in step 1
  const finalStep = (n1, n2, D) => ({
    html: `<div class="eqn">${fr(n1, D)}<b>${op}</b>${fr(n2, D)}<b>=</b>${frBox('n', 'd')}</div>
      <p class="mhint">${same ? 'The bottoms are already the same: ' : 'Now the bottoms match: '}${sub ? 'take away' : 'add'} the tops, and keep the bottom the same.</p>`,
    first: 'n', order: ['n', 'd'],
    check: v => {
      const n = +(v.n || 0), dd = +(v.d || 0);
      if (!v.n || !v.d) return { ok: false, wrong: ['n', 'd'].filter(k => !v[k]), msg: 'Fill in the top and the bottom.' };
      if (dd && n * td === tn * dd) {
        const [sn, sd] = simplest(n, dd), mix = asMixed(n, dd);
        let msg = `Yes! ${n}/${dd}.`;
        if (sn !== n) msg += ` It can also be written as ${sn}/${sd}, its simplest form.`;
        if (mix) msg += ` That's the same as ${mix}.`;
        return { ok: true, msg };
      }
      if (dd !== D) return { ok: false, wrong: ['d'], msg: `The bottom number stays ${D}.` };
      return { ok: false, wrong: ['n'], msg: `Not quite: what is ${n1} ${sub ? 'take away' : 'plus'} ${n2}?` };
    },
    answer: () => ({ n: String(sub ? n1 - n2 : n1 + n2), d: String(D) }),
  });
  if (same) return { speech: `What is ${frSay(a, b)} ${said} ${frSay(c, d)}?`, steps: [finalStep(a, c, b)] };
  const step1 = {
    html: `<div class="eqn">${fr(a, b)}<b>${op}</b>${fr(c, d)}</div>
      <div class="eqn"><b>=</b>${frBox('n1', 'd1')}<b>${op}</b>${frBox('n2', 'd2')}</div>
      <p class="mhint">First, write both fractions with the same bottom number. Whatever you multiply the bottom by, multiply the top by the same.</p>`,
    first: 'd1', order: ['d1', 'n1', 'd2', 'n2'],
    check: v => {
      const [n1, d1, n2, d2] = ['n1', 'd1', 'n2', 'd2'].map(k => +(v[k] || 0));
      const wrong = [];
      if (!d1 || !d2 || d1 !== d2) { wrong.push('d1', 'd2'); return { ok: false, wrong, msg: !d1 || !d2 ? 'Fill in both bottom numbers.' : 'The two bottom numbers need to be the same.' }; }
      if (n1 * b !== a * d1) wrong.push(d1 % b ? 'd1' : 'n1');
      if (n2 * d !== c * d2) wrong.push(d2 % d ? 'd2' : 'n2');
      if (wrong.length) {
        const bad = wrong.includes('d1') || wrong.includes('d2');
        return { ok: false, wrong, msg: bad ? `The new bottom has to be a number that both ${b} and ${d} go into.` : `Not quite. You multiplied the bottom by something: multiply the top by the same.` };
      }
      return { ok: true, msg: d1 === L2 ? `Yes! Both in ${d1}ths. That's the smallest bottom that works.` : `That works! ${L2} would work too, and keeps the numbers smaller.` };
    },
    answer: () => ({ d1: String(L2), n1: String(a * L2 / b), d2: String(L2), n2: String(c * L2 / d) }),
  };
  return {
    speech: `What is ${frSay(a, b)} ${said} ${frSay(c, d)}?`,
    steps: [step1, v => finalStep(+v.n1, +v.n2, +v.d1)],
  };
}
function makeFracMul(lv) {
  let a, b, c, d;
  if (lv === 0) { b = rnd(2, 5); d = rnd(2, 5); a = properFrac(b); c = properFrac(d); }
  else if (lv === 1) { b = rnd(2, 10); d = rnd(2, 10); a = properFrac(b); c = properFrac(d); }
  else if (lv === 2) { a = rnd(2, 6); b = 1; d = rnd(3, 10); c = properFrac(d); }                    // a whole number × a fraction
  else { do { b = rnd(2, 12); d = rnd(2, 12); a = properFrac(b); c = properFrac(d); } while (gcd(a * c, b * d) === 1); }   // there's something to simplify
  const whole = b === 1;
  const tn = a * c, td = b * d;
  return {
    speech: `What is ${whole ? a : frSay(a, b)} times ${frSay(c, d)}?`,
    steps: [{
      html: `<div class="eqn">${whole ? `<b>${a}</b>` : fr(a, b)}<b>×</b>${fr(c, d)}<b>=</b>${frBox('n', 'd')}</div>
        <p class="mhint">${whole ? `A whole number is the same as itself over 1: ${a} = ${a}/1. ` : ''}Multiply the tops together, and the bottoms together.</p>`,
      first: 'n', order: ['n', 'd'],
      check: v => {
        if (!v.n || !v.d) return { ok: false, wrong: ['n', 'd'].filter(k => !v[k]), msg: 'Fill in the top and the bottom.' };
        const n = +v.n, dd = +v.d;
        if (dd && n * td === tn * dd) {
          const [sn, sd] = simplest(n, dd), mix = asMixed(n, dd);
          let msg = `Yes! ${n}/${dd}.`;
          if (sn !== n) msg += ` In its simplest form that's ${sn}/${sd}.`;
          if (mix) msg += ` That's the same as ${mix}.`;
          return { ok: true, msg };
        }
        const wrong = [];
        if (n !== tn && !(dd && n * td === tn * dd)) wrong.push('n');
        if (dd !== td) wrong.push('d');
        return { ok: false, wrong: wrong.length ? wrong : ['n', 'd'], msg: 'Not quite. Top × top, and bottom × bottom.' };
      },
      answer: () => ({ n: String(tn), d: String(td) }),
    }],
  };
}

/* -- number sequences: made from a rule, never written out by hand --
   Each rule family makes the terms from a few random numbers, so there are
   thousands of different ones. Enough terms are shown that only one rule fits. */
const SEQ_RULES = [
  // [level from, make() -> { terms: [...thousandths], rule: 'words', len }]
  [0, () => { const s = rnd(0, 20), k = rnd(1, 5); return { f: i => s + k * i, rule: `It goes up by ${k} each time.` }; }],
  [1, () => { const k = rnd(2, 10), s = rnd(k * 6, k * 6 + 30); return { f: i => s - k * i, rule: `It goes down by ${k} each time.` }; }],
  [1, () => { const s = rnd(1, 30), k = rnd(6, 12); return { f: i => s + k * i, rule: `It goes up by ${k} each time.` }; }],
  [2, () => { const s = rnd(1, 5), k = pick([2, 3]); return { f: i => s * k ** i, rule: `Each number is ${k === 2 ? 'double' : 'three times'} the one before.` }; }],
  [2, () => { const s = rnd(1, 9) * 2 ** 5; return { f: i => s / 2 ** i, rule: 'Each number is half the one before.' }; }],
  [2, () => { const s = rnd(1, 9), k = pick([10, 5]); return { f: i => s * k ** i, len: 5, rule: `Each number is ${k} times the one before.` }; }],
  [2, () => { const s = rnd(5, 100), k = pick([15, 20, 25, 50]); return { f: i => s + k * i, rule: `It goes up by ${k} each time.` }; }],
  [3, () => { const u = rnd(3, 9), dn = rnd(1, u - 1), s = rnd(1, 20); return { f: i => s + Math.ceil(i / 2) * u - Math.floor(i / 2) * dn, len: 7, rule: `It goes up ${u}, then down ${dn}, again and again.` }; }],
  [3, () => { const s = rnd(1, 10), k = pick([1, 2]); return { f: i => s + k * i * (i + 1) / 2, len: 7, rule: `The jumps get bigger: +${k}, +${2 * k}, +${3 * k}…` }; }],
  [3, () => { const o = rnd(1, 5); return { f: i => (i + o) ** 2, rule: `Square numbers: ${o} × ${o}, ${o + 1} × ${o + 1}, ${o + 2} × ${o + 2}…` }; }],
  [4, () => { const x = rnd(1, 5), y = rnd(1, 6); const t = [x, y]; for (let i = 2; i < 8; i++) t.push(t[i - 1] + t[i - 2]); return { f: i => t[i], len: 7, rule: 'Each number is the two before it added together.' }; }],
  [4, () => { const o = rnd(1, 4); return { f: i => (i + o) * (i + o + 1) / 2, len: 7, rule: 'Triangle numbers: the jumps go +' + (o + 1) + ', +' + (o + 2) + ', +' + (o + 3) + '…' }; }],
  [4, () => { const k = pick([0.5, 0.25, 0.1, 0.2, 1.5]), s = rnd(0, 10) + pick([0, 0.5]); return { f: i => s + k * i, dec: true, rule: `It goes up by ${k} each time.` }; }],
];
const fmt = x => String(Math.round(x * 1000) / 1000);
function makeSeq(lv) {
  const rules = SEQ_RULES.filter(([from]) => from <= lv && from >= lv - 2);
  const R = pick(rules)[1]();
  const len = R.len || 6;
  const terms = Array.from({ length: len }, (_, i) => R.f(i));
  const blank = lv === 0 ? len - 1 : rnd(Math.min(2, len - 1), len - 1);
  const ans = terms[blank];
  const shown = terms.map((t, i) => `<span class="term">${i === blank ? padNum('x', 6, 'big', !!R.dec) : `<b>${fmt(t)}</b>`}${i < len - 1 ? '<span class="comma">,</span>' : ''}</span>`).join('');
  return {
    speech: `What number is missing? ${terms.map((t, i) => i === blank ? 'something' : fmt(t)).join(', ')}.`,
    steps: [{
      html: `<div class="eqn seq">${shown}</div><p class="mhint">What number goes in the box? Look at how each number changes to get to the next.</p>`,
      first: 'x', order: ['x'],
      check: v => {
        if (!v.x || v.x === '.') return { ok: false, wrong: ['x'], msg: 'Type a number in the box.' };
        if (Math.abs(+v.x - ans) < 1e-9) return { ok: true, msg: `Yes! ${R.rule}` };
        return { ok: false, wrong: ['x'], msg: mxMiss >= 1 ? `Here's a clue: ${R.rule}` : 'Not quite. Look at the jump from one number to the next.' };
      },
      answer: () => ({ x: fmt(ans) }),
    }],
  };
}

const MX = {
  'dec-add': lv => makeDec(lv, false), 'dec-sub': lv => makeDec(lv, true),
  mul: makeMul, div: makeDiv, missing: makeMissing,
  'frac-add': lv => makeFracAddSub(lv, false), 'frac-sub': lv => makeFracAddSub(lv, true), 'frac-mul': makeFracMul,
  seq: makeSeq,
};

/* ---------- the screen ---------- */
let mxKind = null, mxQn = null, mxStep = 0, mxMiss = 0, mxAllMiss = 0, mxShown = false, mxPrev = null;
const mxSt = k => Object.assign({ lv: 0, run: 0 }, store.get('mx:' + k) || {});
function mxLvl() {
  const s = mxSt(mxKind);
  el('mxLvl').innerHTML = Array.from({ length: MX_LEVELS }, (_, i) => `<span class="${i <= s.lv ? 'on' : ''}" data-lv="${i}"></span>`).join('');
  el('mxLvl').dataset.say = `Level ${s.lv + 1}`;
}
const mxMsg = (t, cls = '') => { el('mxMsg').textContent = t; el('mxMsg').className = 'mxmsg ' + cls; };
function mxLoadStep() {
  const s = mxQn.steps[mxStep];
  const step = typeof s === 'function' ? s(mxPrev) : s;
  mxMiss = 0;
  padLoad(step, mxCheck);
  el('mxShow').classList.add('hidden'); el('mxNext').classList.add('hidden');
  el('mxStepNo').textContent = mxQn.steps.length > 1 ? `Step ${mxStep + 1} of ${mxQn.steps.length}` : '';
}
function mxNew() {
  const s = mxSt(mxKind);
  mxQn = MX[mxKind](Math.min(s.lv, MX_LEVELS - 1));
  mxStep = 0; mxAllMiss = 0; mxShown = false; mxPrev = null;
  mxLvl(); mxMsg('');
  mxLoadStep();
}
function mxFinish() {
  const s = mxSt(mxKind);
  let up = false;
  if (!mxAllMiss && !mxShown) { s.run++; if (s.run >= 3 && s.lv < MX_LEVELS - 1) { s.lv++; s.run = 0; up = true; } }
  else { s.run = 0; if ((mxShown || mxAllMiss >= 2) && s.lv > 0) s.lv--; }
  store.set('mx:' + mxKind, s);
  if (up) { mxLvl(); buddy('party'); el('mxMsg').textContent += ` Level ${s.lv + 1}!`; }
  el('mxNext').textContent = el('mxNext').dataset.say = 'Next';
  el('mxNext').classList.remove('hidden');
}
function mxCheck() {
  const res = pad.step.check(pad.vals);
  const last = mxStep === mxQn.steps.length - 1;
  if (res.ok) {
    padMark([], true); pad.locked = true; padSelect(null);
    sfx.yay(); buddy('cheer'); petFun(3);
    addCoins(last ? (mxMiss ? 2 : 5) : (mxMiss ? 1 : 2), el('mxQ'));
    mxMsg(res.msg, 'good'); say(res.msg);
    el('mxShow').classList.add('hidden');
    if (last) mxFinish();
    else { mxPrev = { ...pad.vals }; el('mxNext').textContent = el('mxNext').dataset.say = 'Next step'; el('mxNext').classList.remove('hidden'); }
  } else {
    mxMiss++; mxAllMiss++;
    padMark(res.wrong); sfx.oops(); buddy('think');
    mxMsg(res.msg || 'Not quite.', 'bad'); say(res.msg);
    if (mxMiss >= 2) el('mxShow').classList.remove('hidden');
  }
}
enter.mx = kind => {
  mxKind = kind;
  const k = kindsOf(gameById('mx')).find(x => x.id === kind);
  el('mxKind').textContent = el('mxKind').dataset.say = k ? k.name : '';
  mxNew();
};
el('mxNext').onclick = () => {
  if (mxStep < mxQn.steps.length - 1) { mxStep++; mxLoadStep(); mxMsg(''); return; }   // on to the next step of this question
  mxNew();
};
el('mxShow').onclick = () => {
  padReveal(); mxShown = true;
  el('mxShow').classList.add('hidden');
  mxMsg("Here's how it goes. Have a look, then try the next one.");
  if (mxStep < mxQn.steps.length - 1) { mxPrev = { ...pad.vals }; el('mxNext').textContent = el('mxNext').dataset.say = 'Next step'; el('mxNext').classList.remove('hidden'); }
  else mxFinish();
};
el('mxSay').onclick = () => mxQn && say(mxQn.speech, voice, true);
el('mxLvl').onclick = e => {
  const d = e.target.closest('[data-lv]'); if (!d) return;
  store.set('mx:' + mxKind, { lv: +d.dataset.lv, run: 0 }); mxNew();
};
