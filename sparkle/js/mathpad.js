/* ---------- the maths pad: answer boxes, and a keypad that sits at the bottom ----------
   Our own keypad rather than the phone's: it looks the same on every phone,
   never covers the sum, and lets each kind of question decide where the next
   digit goes (written sums fill from the right; short division from the left).

   A question step (made in activities/maths.js) is:
     { html,                        what to show, with the answer boxes in it
       first,                       the box the cursor starts in
       order,                       boxes in the order the → key visits them
       check(vals) -> { ok, wrong: [box ids], msg },
       answer() -> { box id: value } to fill in for "Show me" }

   Boxes in the html (make them with padCell / padNum below):
     cell     one digit. Typing fills it and moves along its row: data-dir
              "rtl" moves left (written sums), "ltr" moves right (division).
     num      a whole number typed left to right, up to data-max characters;
              data-dot allows a decimal point.
     scratch  added to either: working space (carries), never marked.
     fixed    shown but not typeable (a placeholder 0 in long multiplication). */

const padCell = (id, row, dir = 'rtl', cls = '') => `<button class="mf cell ${cls}" data-f="${id}" data-row="${row}" data-dir="${dir}"></button>`;
const padNum = (id, max = 4, cls = '', dot = false) => `<button class="mf num ${cls}" data-f="${id}" data-max="${max}"${dot ? ' data-dot="1"' : ''}></button>`;

const pad = { step: null, vals: {}, cur: null, locked: false, onCheck: null };

function padLoad(step, onCheck) {
  pad.step = step; pad.vals = {}; pad.locked = false; pad.onCheck = onCheck;
  el('mxQ').innerHTML = step.html;
  padSelect(step.first);
}
const padBox = id => el('mxQ').querySelector(`[data-f="${id}"]`);
function padSelect(id) {
  for (const b of $$('.mf.cur', el('mxQ'))) b.classList.remove('cur');
  pad.cur = id;
  const b = id && padBox(id);
  if (b) b.classList.add('cur');
  el('kDot').disabled = !(b && b.dataset.dot);
}
function padSet(id, v) {
  pad.vals[id] = v;
  const b = padBox(id);
  if (b) { b.textContent = v; b.classList.remove('wrong', 'right', 'shown'); }
}
// the box beside this one in its row, in the direction it fills (or the other way)
function padNeighbour(id, back = false) {
  const b = padBox(id); if (!b || !b.classList.contains('cell')) return null;
  const row = $$(`.mf.cell[data-row="${b.dataset.row}"]:not(.fixed)`, el('mxQ'));
  const i = row.indexOf(b), step = (b.dataset.dir === 'ltr' ? 1 : -1) * (back ? -1 : 1);
  const n = row[i + step];
  return n ? n.dataset.f : null;
}
function padKey(k) {
  if (pad.locked || !pad.step) return;
  if (k === 'check') { if (pad.onCheck) pad.onCheck(); return; }
  if (k === 'next') {
    const o = pad.step.order || [];
    padSelect(o[(o.indexOf(pad.cur) + 1) % o.length] || pad.step.first);
    return;
  }
  const id = pad.cur, b = id && padBox(id); if (!b) return;
  const v = pad.vals[id] || '';
  if (k === 'del') {
    if (b.classList.contains('num')) padSet(id, v.slice(0, -1));
    else if (v) padSet(id, '');
    else { const n = padNeighbour(id, true); if (n) { padSet(n, ''); padSelect(n); } }
    return;
  }
  if (k === '.' && (!b.dataset.dot || v.includes('.'))) return;
  if (b.classList.contains('num')) {
    if (v.length < +b.dataset.max) padSet(id, v + k);
  } else {
    if (k === '.') return;
    padSet(id, k);
    const n = padNeighbour(id); if (n) padSelect(n);
  }
  sfx.flip();
}
// marks after a check: wrong ones red, and (when right) all of them green
function padMark(wrong = [], ok = false) {
  for (const b of $$('.mf:not(.scratch):not(.fixed)', el('mxQ'))) {
    b.classList.remove('wrong', 'right');
    if (ok) b.classList.add('right');
    else if (wrong.includes(b.dataset.f)) { void b.offsetWidth; b.classList.add('wrong'); }
  }
}
function padReveal() {
  const a = pad.step.answer();
  for (const [id, v] of Object.entries(a)) { padSet(id, v); const b = padBox(id); if (b) b.classList.add('shown'); }
  pad.locked = true; padSelect(null);
}

el('mxQ').addEventListener('click', e => {
  const b = e.target.closest('.mf'); if (!b || b.classList.contains('fixed') || pad.locked) return;
  padSelect(b.dataset.f);
});
el('keypad').addEventListener('click', e => {
  const k = e.target.closest('[data-k]'); if (k && !k.disabled) padKey(k.dataset.k);
});
// a keyboard works too, on a computer
addEventListener('keydown', e => {
  if (screen !== 'mx' || e.ctrlKey || e.metaKey || e.altKey) return;
  const k = /^[0-9.]$/.test(e.key) ? e.key : e.key === 'Backspace' ? 'del' : e.key === 'Enter' ? 'check' : e.key === 'Tab' ? 'next'
    : e.key === 'ArrowLeft' || e.key === 'ArrowRight' ? e.key : null;
  if (!k) return;
  e.preventDefault();
  if (k === 'ArrowLeft' || k === 'ArrowRight') {
    const all = $$('.mf:not(.fixed)', el('mxQ')), i = all.findIndex(b => b.dataset.f === pad.cur);
    const n = all[i + (k === 'ArrowLeft' ? -1 : 1)]; if (n && !pad.locked) padSelect(n.dataset.f);
    return;
  }
  if (k === 'check' && !el('mxNext').classList.contains('hidden')) { el('mxNext').click(); return; }
  padKey(k);
});
