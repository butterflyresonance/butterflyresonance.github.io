/* ---------- what comes next: patterns, from ABAB up to little matrix puzzles ----------
   Six tiers. Three right first time in a row: up a tier. Two missed in a row: down one,
   so a hard patch never lasts. */
const P_CO = { pink: '#ff6fb8', purple: '#9b6bff', blue: '#4cb5ff', yellow: '#ffc93a', green: '#4cd18a', orange: '#ff8c42' };
const P_SH = ['circle', 'square', 'triangle', 'star', 'heart', 'diamond'];
const DICE = { 1: [[50, 50]], 2: [[30, 30], [70, 70]], 3: [[26, 26], [50, 50], [74, 74]], 4: [[30, 30], [70, 30], [30, 70], [70, 70]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]], 6: [[30, 24], [70, 24], [30, 50], [70, 50], [30, 76], [70, 76]] };
function shapeAt(sh, x, y, r, co, rot = 0, out = false) {
  const st = out ? `fill="#fff" stroke="${co}" stroke-width="${Math.max(3, r * .22)}"` : `fill="${co}" stroke="#4a3159" stroke-width="${Math.max(1.5, r * .08)}"`;
  const T = rot ? ` transform="rotate(${rot} ${x} ${y})"` : '';
  const pts = a => a.map(([px, py]) => `${(x + px * r).toFixed(1)},${(y + py * r).toFixed(1)}`).join(' ');
  if (sh === 'circle') return `<circle cx="${x}" cy="${y}" r="${r * .9}" ${st}/>`;
  if (sh === 'square') return `<rect x="${x - r * .8}" y="${y - r * .8}" width="${r * 1.6}" height="${r * 1.6}" rx="${r * .2}" ${st}${T}/>`;
  if (sh === 'triangle') return `<polygon points="${pts([[0, -.95], [.92, .7], [-.92, .7]])}" ${st} stroke-linejoin="round"${T}/>`;
  if (sh === 'diamond') return `<polygon points="${pts([[0, -1], [.75, 0], [0, 1], [-.75, 0]])}" ${st} stroke-linejoin="round"${T}/>`;
  if (sh === 'star') { const a = []; for (let i = 0; i < 10; i++) { const t = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? .45 : 1; a.push([rr * Math.cos(t), rr * Math.sin(t)]); } return `<polygon points="${pts(a)}" ${st} stroke-linejoin="round"${T}/>`; }
  if (sh === 'heart') return `<path d="M${x} ${y + r * .85} C${x - r * 1.3} ${y - r * .1} ${x - r * .7} ${y - r * 1.1} ${x} ${y - r * .45} C${x + r * .7} ${y - r * 1.1} ${x + r * 1.3} ${y - r * .1} ${x} ${y + r * .85} Z" ${st} stroke-linejoin="round"${T}/>`;
  if (sh === 'arrow') return `<polygon points="${pts([[0, -1], [.85, -.05], [.32, -.05], [.32, .95], [-.32, .95], [-.32, -.05], [-.85, -.05]])}" ${st} stroke-linejoin="round"${T}/>`;
  return '';
}
function pItem(s) {
  const n = s.n || 1, sz = s.sz || 1, out = s.fill === 'out';
  const body = n === 1 ? shapeAt(s.sh, 50, 50, 36 * sz, P_CO[s.co], s.rot || 0, out)
    : DICE[n].map(([x, y]) => shapeAt(s.sh, x, y, (n <= 2 ? 17 : n <= 4 ? 15 : 12.5) * sz, P_CO[s.co], s.rot || 0, out)).join('');
  return `<svg viewBox="0 0 100 100">${body}</svg>`;
}
const pKey = s => JSON.stringify([s.sh, s.co, s.n || 1, s.sz || 1, (s.rot || 0) % 360, s.fill || '']);
const pickN = (a, n) => shuffle(a).slice(0, n);
const COS = Object.keys(P_CO);

// one puzzle per call: { kind: 'row'|'grid', items: [spec | null], answer, vary: [attributes that change] }
const P_GEN = {
  1: [
    () => { const [a, b] = pickN(COS, 2), sh = pick(P_SH); return row(i => ({ sh, co: i % 2 ? b : a }), 5, ['co']); },
    () => { const [a, b] = pickN(P_SH, 2), co = pick(COS); return row(i => ({ sh: i % 2 ? b : a, co }), 5, ['sh']); },
    () => { const sh = pick(P_SH), co = pick(COS); return row(i => ({ sh, co, sz: i % 2 ? .5 : 1 }), 5, ['sz']); },
  ],
  2: [
    () => cycle(pick(['AAB', 'ABB', 'ABC']), 'co'),
    () => cycle(pick(['AAB', 'ABB', 'ABC']), 'sh'),
    () => { const [a, b] = pickN(COS, 2), [c, d] = pickN(P_SH, 2); return row(i => (i % 2 ? { sh: d, co: b } : { sh: c, co: a }), 6, ['sh', 'co']); },
  ],
  3: [
    () => { const s = 1 + Math.floor(Math.random() * 2), sh = pick(P_SH), co = pick(COS); return row(i => ({ sh, co, n: s + i }), 4, ['n']); },
    () => { const s = 5 + Math.floor(Math.random() * 2), sh = pick(P_SH), co = pick(COS); return row(i => ({ sh, co, n: s - i }), 4, ['n']); },
    () => { const s = pick([0, 90, 180, 270]), co = pick(COS), dir = pick([90, 270]); return row(i => ({ sh: 'arrow', co, rot: (s + i * dir) % 360 }), 4 + Math.floor(Math.random() * 2), ['rot']); },
    () => { const sh = pick(P_SH), co = pick(COS); return row(i => ({ sh, co, sz: [.4, .6, .8, 1][i] }), 3, ['sz']); },
  ],
  4: [
    () => { const [a, b] = pickN(COS, 2), S = pickN(P_SH, 3); return row(i => ({ sh: S[i % 3], co: i % 2 ? b : a }), 6, ['sh', 'co']); },
    () => { const [a, b] = pickN(COS, 2), sh = pick(P_SH); return row(i => ({ sh, co: i % 2 ? b : a, n: 1 + i }), 4, ['co', 'n']); },
    () => { const C = pickN(COS, 3), s = pick([0, 90, 180, 270]); return row(i => ({ sh: 'arrow', co: C[i % 3], rot: (s + i * 90) % 360 }), 5, ['co', 'rot']); },
    () => { const C = pickN(COS, 4), sh = pick(P_SH); return row(i => ({ sh, co: C[i % 4] }), 6 + Math.floor(Math.random() * 2), ['co']); },
    () => cycle('AABB', pick(['co', 'sh'])),
  ],
  5: [
    () => { const S = pickN(P_SH, 3), co = pick(COS); return grid((r, c) => ({ sh: S[(r + c) % 3], co }), ['sh']); },
    () => { const S = pickN(P_SH, 3), co = pick(COS); return grid((r, c) => ({ sh: S[r], co, n: c + 1 }), ['sh', 'n']); },
    () => { const S = pickN(P_SH, 3), C = pickN(COS, 3); return grid((r, c) => ({ sh: S[c], co: C[r] }), ['sh', 'co']); },
  ],
  6: [
    () => { const S = pickN(P_SH, 3), C = pickN(COS, 3); return grid((r, c) => ({ sh: S[(r + c) % 3], co: C[(r + 2 * c) % 3] }), ['sh', 'co']); },
    () => { const S = pickN(P_SH, 3), C = pickN(COS, 3); return grid((r, c) => ({ sh: S[(r + c) % 3], co: C[r], n: c + 1 }), ['sh', 'co', 'n']); },
    () => { const C = pickN(COS, 3), s = pick([0, 90, 180, 270]); return grid((r, c) => ({ sh: 'arrow', co: C[r], rot: (s + 90 * c) % 360, n: r + 1 }), ['co', 'rot', 'n']); },
  ],
};
function row(f, shown, vary) { const items = Array.from({ length: shown + 1 }, (_, i) => f(i)); const answer = items[shown]; items[shown] = null; return { kind: 'row', items, answer, vary }; }
function cycle(pat, attr) {
  const vals = attr === 'co' ? pickN(COS, 3) : pickN(P_SH, 3), fixed = attr === 'co' ? { sh: pick(P_SH) } : { co: pick(COS) };
  const shown = pat.length * 2 + Math.floor(Math.random() * pat.length);
  return row(i => Object.assign({}, fixed, { [attr]: vals[pat.charCodeAt(i % pat.length) - 65] }), Math.min(shown, 8), [attr]);
}
function grid(f, vary) { const items = []; for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) items.push(f(r, c)); const answer = items[8]; items[8] = null; return { kind: 'grid', items, answer, vary }; }
// wrong answers: the right one with one thing changed, mostly the things this puzzle is about
function wrongs(q, k) {
  const a = q.answer, used = { co: [...new Set(q.items.filter(Boolean).map(s => s.co))], sh: [...new Set(q.items.filter(Boolean).map(s => s.sh))] };
  const muts = [];
  const add = s => { if (pKey(s) !== pKey(a) && !muts.some(m => pKey(m) === pKey(s))) muts.push(s); };
  for (let tries = 0; tries < 60 && muts.length < k; tries++) {
    const attr = Math.random() < .8 ? pick(q.vary) : pick(['co', 'sh', 'n']);
    const s = Object.assign({}, a);
    if (attr === 'co') s.co = pick(used.co.length > 1 && Math.random() < .7 ? used.co : COS);
    if (attr === 'sh') { if (a.sh === 'arrow') { s.rot = ((a.rot || 0) + pick([90, 180, 270])) % 360; } else s.sh = pick(used.sh.length > 1 && Math.random() < .7 ? used.sh : P_SH); }
    if (attr === 'n') s.n = clamp((a.n || 1) + pick([-1, 1, 2]), 1, 6);
    if (attr === 'rot') s.rot = ((a.rot || 0) + pick([90, 180, 270])) % 360;
    if (attr === 'sz') s.sz = pick([.4, .5, .6, .8, 1].filter(v => v !== (a.sz || 1)));
    add(s);
  }
  return muts.slice(0, k);
}
let pat = { lv: store.get('patLv') || 1, run: 0, missRun: 0, q: null, missed: false, busy: false };
function patLvl() {
  el('patLvl').innerHTML = [1, 2, 3, 4, 5, 6].map(i => `<span class="${i <= pat.lv ? 'on' : ''}"></span>`).join('');
  el('patLvl').dataset.say = `Level ${pat.lv}`;
}
function patNew() {
  pat.q = pick(P_GEN[pat.lv])(); pat.missed = false; pat.busy = false;
  const q = pat.q;
  el('patQ').className = 'patq ' + q.kind;
  el('patQ').innerHTML = q.items.map(s => s ? `<span class="pt">${pItem(s)}</span>` : `<span class="pt gap">?</span>`).join('');
  const opts = shuffle([q.answer, ...wrongs(q, pat.lv >= 5 ? 3 : 2)]);
  el('patOpts').className = 'opts' + (opts.length === 4 ? ' four' : '');
  el('patOpts').innerHTML = opts.map(s => `<button class="opt pic" data-k='${pKey(s)}'>${pItem(s)}</button>`).join('');
  patLvl();
  setTimeout(() => { if (screen === 'pattern') say(q.kind === 'grid' ? 'Which one fills the gap?' : 'What comes next?'); }, 250);
}
enter.pattern = () => patNew();
el('patOpts').onclick = async e => {
  const b = e.target.closest('.opt'); if (!b || pat.busy || b.disabled) return;
  if (b.dataset.k === pKey(pat.q.answer)) {
    pat.busy = true;
    b.classList.add('right'); sfx.yay(); buddy('cheer'); petFun(3);
    const g = $$('.gap', el('patQ'))[0]; if (g) { g.classList.remove('gap'); g.classList.add('pop'); g.innerHTML = pItem(pat.q.answer); }
    addCoins(pat.missed ? 1 : 2 + Math.ceil(pat.lv / 2), b);
    let msg = pick(['Yes!', 'You got it!', 'Clever!', 'That’s right!']);
    if (!pat.missed) { pat.missRun = 0; if (++pat.run >= 3 && pat.lv < 6) { pat.lv++; pat.run = 0; store.set('patLv', pat.lv); msg += ' Ooh, now some trickier ones!'; } }
    await say(msg); await wait(400);
    if (screen === 'pattern') patNew();
  } else {
    b.disabled = true; b.classList.add('out'); sfx.oops(); buddy('think');
    if (!pat.missed) {
      pat.missed = true; pat.run = 0;
      if (pat.lv > 1) { pat.lv--; store.set('patLv', pat.lv); patLvl(); }     // down a level at once; three right takes her back up
    }
    say('Not that one. Look again!');
  }
};
