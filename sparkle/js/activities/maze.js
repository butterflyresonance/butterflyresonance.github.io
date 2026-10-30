/* ---------- mazes: drag the pet to its treat ----------
   Made for small, wobbly fingers: the pet follows the finger but can't go through
   a wall. Pushed into one, it slides along it, staying as close to the finger as it
   can, so she can keep dragging even when her finger wanders off the path. */
const MAZE_SIZES = [['Little', 4], ['Medium', 6], ['Big', 8]];
let mzSize = store.get('mazeSize') || 4;
let mz = null;
const mzImgs = {};
function mazeGen(n) {
  // recursive backtracker: right[r][c] / down[r][c] say whether that wall is there
  const right = Array.from({ length: n }, () => Array(n).fill(true)), down = Array.from({ length: n }, () => Array(n).fill(true));
  const seen = Array.from({ length: n }, () => Array(n).fill(false)), st = [[0, 0]];
  seen[0][0] = true;
  while (st.length) {
    const [r, c] = st.at(-1);
    const nb = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].filter(([a, b]) => a >= 0 && b >= 0 && a < n && b < n && !seen[a][b]);
    if (!nb.length) { st.pop(); continue; }
    const [a, b] = pick(nb);
    if (a > r) down[r][c] = false; else if (a < r) down[a][b] = false; else if (b > c) right[r][c] = false; else right[a][b] = false;
    seen[a][b] = true; st.push([a, b]);
  }
  return { right, down };
}
function mazeLayout() {
  const wrap = el('mazeWrap'), cv = el('mazeCanvas'), r = wrap.getBoundingClientRect();
  const s = Math.floor(Math.min(r.width - 20, r.height - 16)), dpr = Math.min(2, devicePixelRatio || 1);
  cv.style.width = cv.style.height = s + 'px'; cv.width = cv.height = s * dpr;
  if (!mz) return;
  const old = mz.cell;
  mz.px = s; mz.dpr = dpr; mz.pad = s * .04; mz.cell = (s - 2 * mz.pad) / mz.n;
  mz.r = mz.cell * .3; mz.w = Math.max(5, mz.cell * .12);
  if (old) { mz.x = mz.pad + (mz.x - mz.pad0) / old * mz.cell; mz.y = mz.pad + (mz.y - mz.pad0) / old * mz.cell; mz.trail = mz.trail.map(([x, y]) => [mz.pad + (x - mz.pad0) / old * mz.cell, mz.pad + (y - mz.pad0) / old * mz.cell]); }
  mz.pad0 = mz.pad;
  // every wall as a line segment (in CSS pixels)
  const { right, down } = mz.walls, n = mz.n, P = mz.pad, C = mz.cell, seg = [];
  seg.push([P, P, P + n * C, P], [P, P, P, P + n * C], [P + n * C, P, P + n * C, P + n * C], [P, P + n * C, P + n * C, P + n * C]);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (right[r][c] && c < n - 1) seg.push([P + (c + 1) * C, P + r * C, P + (c + 1) * C, P + (r + 1) * C]);
    if (down[r][c] && r < n - 1) seg.push([P + c * C, P + (r + 1) * C, P + (c + 1) * C, P + (r + 1) * C]);
  }
  mz.seg = seg;
  if (!old) { mz.x = P + C / 2; mz.y = P + C / 2; mz.trail = [[mz.x, mz.y]]; }
  mazeDraw();
}
function segDist(px, py, [x1, y1, x2, y2]) {
  const dx = x2 - x1, dy = y2 - y1, t = clamp(((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy || 1), 0, 1);
  return Math.hypot(px - x1 - t * dx, py - y1 - t * dy);
}
const mzFree = (x, y) => mz.seg.every(s => segDist(x, y, s) >= mz.r + mz.w / 2);
// move towards the finger in small steps; blocked, try sliding along the wall (just across, or just up and down)
function mazeFollow(tx, ty) {
  for (let i = 0; i < 80; i++) {
    const dx = tx - mz.x, dy = ty - mz.y, d = Math.hypot(dx, dy);
    if (d < .5) break;
    const step = Math.min(d, mz.cell * .12), sx = dx / d * step, sy = dy / d * step;
    if (mzFree(mz.x + sx, mz.y + sy)) { mz.x += sx; mz.y += sy; }
    else if (Math.abs(sx) > .05 && mzFree(mz.x + sx, mz.y)) mz.x += sx;
    else if (Math.abs(sy) > .05 && mzFree(mz.x, mz.y + sy)) mz.y += sy;
    else break;
  }
  const last = mz.trail.at(-1);
  if (Math.hypot(mz.x - last[0], mz.y - last[1]) > mz.cell * .18) mz.trail.push([mz.x, mz.y]);
}
function mazeDraw() {
  const g = el('mazeCanvas').getContext('2d'), s = mz.px;
  g.setTransform(mz.dpr, 0, 0, mz.dpr, 0, 0);
  g.clearRect(0, 0, s, s);
  g.fillStyle = '#fffafd'; g.beginPath(); g.roundRect(0, 0, s, s, 22); g.fill();
  g.fillStyle = '#ffd6ec';
  for (const [x, y] of mz.trail) { g.beginPath(); g.arc(x, y, mz.cell * .07, 0, 7); g.fill(); }
  g.strokeStyle = '#8f5cff'; g.lineWidth = mz.w; g.lineCap = 'round';
  g.beginPath(); for (const [a, b, c, d] of mz.seg) { g.moveTo(a, b); g.lineTo(c, d); } g.stroke();
  const tc = mz.pad + (mz.n - .5) * mz.cell, ts = mz.cell * .72;
  if (!mz.won && mzImgs.treat) g.drawImage(mzImgs.treat, tc - ts / 2, tc - ts / 2, ts, ts);
  const ps = mz.r * 2.9;
  if (mzImgs.pet) g.drawImage(mzImgs.pet, mz.x - ps / 2, mz.y - ps * .58, ps, ps);
}
async function mazeNew() {
  el('mazeDone').classList.add('hidden');
  mz = { n: mzSize, walls: mazeGen(mzSize), won: false, drag: null, cell: 0 };
  const treat = pick(['1F34E', '1F353', '1F36A', '1F9C1', '1F955', '1F368', '1F382']);
  mz.treatName = { '1F34E': 'apple', '1F353': 'strawberry', '1F36A': 'cookie', '1F9C1': 'cupcake', '1F955': 'carrot', '1F368': 'ice cream', '1F382': 'cake' }[treat];
  const load = src => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
  [mzImgs.treat, mzImgs.pet] = await Promise.all([load(iconUrl(treat)), load(petUrl({ eyes: 'happy', mouth: 'grin' }))]);
  mazeLayout();
  say(`Help ${pet.name} find the ${mz.treatName}!`);
}
function mazeChips() {
  el('mazeSizes').innerHTML = MAZE_SIZES.map(([nm, n]) => `<button class="chip${n === mzSize ? ' on' : ''}" data-n="${n}" data-say="${nm}">${nm}</button>`).join('');
}
enter.maze = () => { mazeChips(); mz = null; requestAnimationFrame(mazeNew); };
el('mazeSizes').onclick = e => { const c = e.target.closest('[data-n]'); if (!c) return; mzSize = +c.dataset.n; store.set('mazeSize', mzSize); mazeChips(); mazeNew(); };
el('mazeAgain').onclick = mazeNew;
new ResizeObserver(() => { if (screen === 'maze' && mz) mazeLayout(); }).observe(el('mazeWrap'));
const mzPoint = e => { const r = el('mazeCanvas').getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
el('mazeCanvas').addEventListener('pointerdown', e => {
  if (!mz || mz.won || !mz.seg) return;
  e.preventDefault(); el('mazeCanvas').setPointerCapture(e.pointerId); mz.drag = e.pointerId;
  mazeFollow(...mzPoint(e)); mazeDraw();
});
el('mazeCanvas').addEventListener('pointermove', e => {
  if (!mz || mz.drag !== e.pointerId || mz.won) return;
  const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
  for (const ev of (evs.length ? evs : [e])) mazeFollow(...mzPoint(ev));
  mazeDraw();
  const tc = mz.pad + (mz.n - .5) * mz.cell;
  if (Math.hypot(mz.x - tc, mz.y - tc) < mz.cell * .4) mazeWin();
});
const mzUp = e => { if (mz && mz.drag === e.pointerId) mz.drag = null; };
el('mazeCanvas').addEventListener('pointerup', mzUp);
el('mazeCanvas').addEventListener('pointercancel', mzUp);
async function mazeWin() {
  mz.won = true; mz.drag = null;
  for (let i = 0; i < 3; i++) { sfx.munch(); await wait(220); }
  mazeDraw(); sfx.yay(); buddy('party'); petFun(10);
  addCoins(mzSize === 4 ? 3 : mzSize === 6 ? 5 : 8, el('mazeCanvas'));
  const m = `Yum! ${pet.name} found the ${mz.treatName}!`;
  el('mazeMsg').textContent = m; el('mazeDone').classList.remove('hidden');
  say(m);
}
