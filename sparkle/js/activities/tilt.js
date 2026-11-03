/* ---------- tilt maze: tip the phone and her pet rolls, like a wooden labyrinth with a marble ----------
   The phone's own tilt sensor (deviceorientation) gives the slope. Whatever angle she's holding the phone
   when she taps Go counts as flat, so she needn't lie it on a table. Holes, from level 3, send the pet back
   to the start. Without a tilt sensor (a computer), holding a finger or the mouse on the board pulls the pet
   towards it, and the arrow keys work too.
   Everything here is measured in maze cells: a cell is 1 wide, whatever the screen. */
const TILT_LEVELS = [            // [cells across, holes off the way, holes beside the way]
  [4, 0, 0], [5, 0, 0], [5, 2, 0], [6, 4, 0], [6, 4, 2], [7, 6, 4], [8, 8, 6], [9, 10, 10],
];
const TB = { r: .24, hw: .06, acc: 24, maxV: 8, drag: 1.2, dead: .035, bounce: .25 };   // ball radius, half a wall, pull at full tilt…
let tz = null, tzLv = store.get('tiltLv') ?? 0, tzRun = 0;
const tzImgs = {};
const tilt = { on: false, g: null, g0: null, last: 0, pointer: null, keys: { x: 0, y: 0 }, wake: null, turned: false };

/* ---------- the tilt sensor ---------- */
// gravity in the phone's own frame (x right, y up the screen, z out of the screen), from the sensor's angles
function gravityFrom(beta, gamma) {
  const b = beta * Math.PI / 180, g = gamma * Math.PI / 180;
  return [Math.cos(b) * Math.sin(g), -Math.sin(b), -Math.cos(b) * Math.cos(g)];
}
function onOrient(e) {
  if (e.beta == null || e.gamma == null) return;
  const v = gravityFrom(e.beta, e.gamma);
  tilt.g = tilt.g ? tilt.g.map((x, i) => x * .5 + v[i] * .5) : v;      // a little smoothing
  tilt.last = performance.now();
}
// the slope, on the screen as she sees it: [right, down], each from -1 to 1
function slope() {
  if (!tilt.g || !tilt.g0) return [0, 0];
  // turn the phone's frame so the way she held it at the start is flat (Rodrigues' rotation, g0 onto straight down)
  const [a, b, c] = tilt.g0, g = tilt.g;
  const k = [b * -1 - c * 0, c * 0 - a * -1, a * 0 - b * 0];            // g0 × (0, 0, -1)
  const s = Math.hypot(...k), co = -c;                                     // sin and cos of the angle between them
  let v = g;
  if (s > 1e-6) {
    const u = k.map(x => x / s), kv = u[0] * g[0] + u[1] * g[1] + u[2] * g[2];
    const cr = [u[1] * g[2] - u[2] * g[1], u[2] * g[0] - u[0] * g[2], u[0] * g[1] - u[1] * g[0]];
    v = g.map((x, i) => x * co + cr[i] * s + u[i] * kv * (1 - co));
  }
  // phone frame to screen: if the screen has turned sideways, so does the slope
  let dx = v[0], dy = -v[1];
  const ang = ((screen.orientation && screen.orientation.angle) ?? window.orientation ?? 0) * Math.PI / 180;
  return [dx * Math.cos(ang) + dy * Math.sin(ang), -dx * Math.sin(ang) + dy * Math.cos(ang)];
}
// iPhone and iPad ask permission first, and only from a tap; others just say yes
async function motionAllowed() {
  const D = window.DeviceOrientationEvent;
  if (!D) return false;
  if (typeof D.requestPermission === 'function') { try { return (await D.requestPermission()) === 'granted'; } catch { return false; } }
  return true;
}
async function stayAwake(on) {
  // no fingers on the screen for a while, so without this the phone dims and locks mid-maze
  try {
    if (on && !tilt.wake && navigator.wakeLock) { tilt.wake = await navigator.wakeLock.request('screen'); tilt.wake.addEventListener('release', () => { tilt.wake = null; }); }
    if (!on && tilt.wake) { await tilt.wake.release(); tilt.wake = null; }
  } catch {}
}

/* ---------- the maze ---------- */
function tzPath(walls, n) {
  // the way from the start (top left) to the treat (bottom right): a list of [row, col]
  const open = (r, c, a, b) => a > r ? !walls.down[r][c] : a < r ? !walls.down[a][b] : b > c ? !walls.right[r][c] : !walls.right[a][b];
  const prev = new Map([['0,0', null]]), q = [[0, 0]];
  while (q.length) {
    const [r, c] = q.shift();
    for (const [a, b] of [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]]) {
      if (a < 0 || b < 0 || a >= n || b >= n || prev.has(a + ',' + b) || !open(r, c, a, b)) continue;
      prev.set(a + ',' + b, [r, c]); q.push([a, b]);
    }
  }
  const path = []; let at = [n - 1, n - 1];
  while (at) { path.unshift(at); at = prev.get(at.join(',')); }
  return path;
}
function tzHoles(walls, n, off, beside) {
  const path = tzPath(walls, n), onPath = new Set(path.map(p => p.join(','))), holes = [];
  // off the way: in the middle of a cell she never needs to visit, dead ends first
  const exits = (r, c) => [r > 0 && !walls.down[r - 1][c], r < n - 1 && !walls.down[r][c], c > 0 && !walls.right[r][c - 1], c < n - 1 && !walls.right[r][c]].filter(Boolean).length;
  const spare = shuffle([...Array(n * n).keys()].map(i => [Math.floor(i / n), i % n]).filter(([r, c]) => !onPath.has(r + ',' + c)))
    .sort((p, q) => exits(...p) - exits(...q));
  for (const [r, c] of spare.slice(0, off)) holes.push({ x: c + .5, y: r + .5, r: .3 });
  // beside the way: on a side of a path cell the way doesn't use, so there's a narrower lane past it
  const cells = shuffle(path.slice(2, -2).map((p, i) => i + 2)).slice(0, beside);
  for (const i of cells) {
    const [r, c] = path[i], used = [path[i - 1], path[i + 1]].map(([a, b]) => a < r ? 'u' : a > r ? 'd' : b < c ? 'l' : 'r');
    const free = ['u', 'd', 'l', 'r'].filter(s => !used.includes(s));
    const straight = used.includes('u') && used.includes('d') || used.includes('l') && used.includes('r');
    let x = c + .5, y = r + .5, hr = .18;
    if (straight) { const s = pick(free); if (s === 'u') y = r + .25; if (s === 'd') y = r + .75; if (s === 'l') x = c + .25; if (s === 'r') x = c + .75; }
    else { x = c + (free.includes('l') ? .25 : .75); y = r + (free.includes('u') ? .25 : .75); hr = .2; }     // the outside corner of a turn
    holes.push({ x, y, r: hr });
  }
  return holes;
}
function tzSegments(walls, n) {
  const seg = [[0, 0, n, 0], [0, 0, 0, n], [n, 0, n, n], [0, n, n, n]];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (walls.right[r][c] && c < n - 1) seg.push([c + 1, r, c + 1, r + 1]);
    if (walls.down[r][c] && r < n - 1) seg.push([c, r + 1, c + 1, r + 1]);
  }
  return seg;
}
async function tiltNew(before = '', quiet = false) {
  const [n, off, beside] = TILT_LEVELS[tzLv];
  const walls = mazeGen(n);
  const treat = pick(['1F34E', '1F353', '1F36A', '1F9C1', '1F955', '1F368', '1F382']);
  tz = { n, walls, seg: tzSegments(walls, n), holes: tzHoles(walls, n, off, beside), x: .5, y: .5, vx: 0, vy: 0, falls: 0, start: 0,
    won: false, falling: 0, raf: 0, treat, treatName: { '1F34E': 'apple', '1F353': 'strawberry', '1F36A': 'cookie', '1F9C1': 'cupcake', '1F955': 'carrot', '1F368': 'ice cream', '1F382': 'cake' }[treat] };
  const load = async src => { try { const i = await loadImg(src); return typeof rasterise === 'function' ? rasterise(i) : i; } catch { return null; } };
  [tzImgs.treat, tzImgs.pet, tzImgs.sad] = await Promise.all([load(iconUrl(treat)), load(petUrl({ eyes: 'happy', mouth: 'grin' })), load(petUrl({ eyes: 'sad', mouth: 'sad' }))]);
  tiltLvl(); tiltLayout();
  if (quiet) return;
  const m = (before ? before + ' ' : '') + `Tilt to roll ${pet.name} to the ${tz.treatName}!` + (beside || off ? ' Don’t fall in the holes!' : '');
  tiltOver(m, 'Go!');
}
function tiltLvl() {
  el('tiltLvl').innerHTML = TILT_LEVELS.map((_, i) => `<span class="${i <= tzLv ? 'on' : ''}"></span>`).join('');
  el('tiltLvl').dataset.say = `Level ${tzLv + 1}`;
}
function tiltOver(msg, btn) {
  el('tiltMsg').textContent = msg; el('tiltMsg').dataset.say = msg;
  el('tiltGo').textContent = btn; el('tiltGo').dataset.say = '';
  el('tiltOver').classList.remove('hidden');
  say(msg);
}

/* ---------- drawing: the board is drawn once, then just the pet each frame ---------- */
const tzBoard = document.createElement('canvas');
function tiltLayout() {
  if (!tz) return;
  const wrap = el('tiltWrap'), cv = el('tiltCanvas'), r = wrap.getBoundingClientRect();
  const s = Math.max(100, Math.floor(Math.min(r.width - 20, r.height - 16))), dpr = Math.min(2, devicePixelRatio || 1);
  cv.style.width = cv.style.height = s + 'px'; cv.width = cv.height = tzBoard.width = tzBoard.height = Math.round(s * dpr);
  Object.assign(tz, { px: s, dpr, pad: s * .04, cell: s * .92 / tz.n });
  const g = tzBoard.getContext('2d'), C = tz.cell, P = tz.pad;
  g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, s, s);
  g.fillStyle = '#fff4e6'; g.beginPath(); g.roundRect(0, 0, s, s, 22); g.fill();
  for (const h of tz.holes) {
    const x = P + h.x * C, y = P + h.y * C, hr = h.r * C, gr = g.createRadialGradient(x - hr * .25, y - hr * .25, hr * .1, x, y, hr);
    gr.addColorStop(0, '#1f1029'); gr.addColorStop(.8, '#3a2347'); gr.addColorStop(1, '#7a5a8c');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, hr, 0, 7); g.fill();
  }
  g.strokeStyle = '#8f5cff'; g.lineWidth = TB.hw * 2 * C; g.lineCap = 'round';
  g.beginPath(); for (const [a, b, c, d] of tz.seg) { g.moveTo(P + a * C, P + b * C); g.lineTo(P + c * C, P + d * C); } g.stroke();
  tiltDraw();
}
function tiltDraw() {
  const g = el('tiltCanvas').getContext('2d'), C = tz.cell, P = tz.pad;
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, tzBoard.width, tzBoard.height); g.drawImage(tzBoard, 0, 0);
  g.setTransform(tz.dpr, 0, 0, tz.dpr, 0, 0);
  const tc = P + (tz.n - .5) * C, ts = C * .66;
  if (!tz.won && tzImgs.treat) g.drawImage(tzImgs.treat, tc - ts / 2, tc - ts / 2, ts, ts);
  const k = tz.falling ? Math.max(0, 1 - (performance.now() - tz.falling) / 450) : 1;       // shrinking into a hole
  const x = P + tz.x * C, y = P + tz.y * C, ps = TB.r * 2.9 * C * k;
  if (k > 0) {
    g.fillStyle = 'rgba(74,49,89,.18)'; g.beginPath(); g.ellipse(x, y + TB.r * C * .8 * k, TB.r * C * .9 * k, TB.r * C * .35 * k, 0, 0, 7); g.fill();
    const im = tz.falling ? tzImgs.sad : tzImgs.pet;
    if (im) g.drawImage(im, x - ps / 2, y - ps * .58, ps, ps);
  }
  if (tilt.pointer && !tilt.on) { g.strokeStyle = 'rgba(255,79,163,.5)'; g.lineWidth = 3; g.beginPath(); g.arc(P + tilt.pointer[0] * C, P + tilt.pointer[1] * C, C * .2, 0, 7); g.stroke(); }
}

/* ---------- rolling ---------- */
let tzBonk = 0;
function tiltStep(dt) {
  // the slope: the sensor, or else a finger / the mouse pulling, or the arrow keys
  let [ax, ay] = tilt.on ? slope() : [0, 0];
  if (!tilt.on && tilt.pointer) { const dx = tilt.pointer[0] - tz.x, dy = tilt.pointer[1] - tz.y, d = Math.hypot(dx, dy) || 1, m = Math.min(1, d / 2) * .45; ax = dx / d * m; ay = dy / d * m; }
  if (tilt.keys.x || tilt.keys.y) { ax = tilt.keys.x * .4; ay = tilt.keys.y * .4; }
  const m = Math.hypot(ax, ay);
  if (m < TB.dead) { ax = 0; ay = 0; }                     // a tiny wobble doesn't start it rolling
  tz.vx += ax * TB.acc * dt; tz.vy += ay * TB.acc * dt;
  const f = Math.exp(-TB.drag * dt); tz.vx *= f; tz.vy *= f;
  const sp = Math.hypot(tz.vx, tz.vy);
  if (sp > TB.maxV) { tz.vx *= TB.maxV / sp; tz.vy *= TB.maxV / sp; }
  // move in small steps, so it can't jump through a wall
  const steps = Math.max(1, Math.ceil(Math.hypot(tz.vx, tz.vy) * dt / (TB.r * .4)));
  for (let i = 0; i < steps; i++) {
    tz.x += tz.vx * dt / steps; tz.y += tz.vy * dt / steps;
    for (const sg of tz.seg) {
      const [x1, y1, x2, y2] = sg, dx = x2 - x1, dy = y2 - y1, t = clamp(((tz.x - x1) * dx + (tz.y - y1) * dy) / (dx * dx + dy * dy || 1), 0, 1);
      const qx = x1 + t * dx, qy = y1 + t * dy, ox = tz.x - qx, oy = tz.y - qy, d = Math.hypot(ox, oy), min = TB.r + TB.hw;
      if (d >= min || d === 0) continue;
      const nx = ox / d, ny = oy / d;
      tz.x = qx + nx * min; tz.y = qy + ny * min;
      const vn = tz.vx * nx + tz.vy * ny;
      if (vn < 0) {
        tz.vx -= (1 + TB.bounce) * vn * nx; tz.vy -= (1 + TB.bounce) * vn * ny;
        const now = performance.now();
        if (-vn > 1.5 && now - tzBonk > 120) { tzBonk = now; tone([180 + Math.random() * 40], .05, 'sine', 0, Math.min(.12, -vn * .02)); }
      }
    }
  }
  // a hole: the middle of the pet over it, and in it goes
  for (const h of tz.holes) if (Math.hypot(tz.x - h.x, tz.y - h.y) < h.r) { tiltFall(h); return; }
  if (Math.hypot(tz.x - (tz.n - .5), tz.y - (tz.n - .5)) < .35) tiltWin();
}
function tiltLoop(ts) {
  if (!tz || !tz.run) return;
  const dt = Math.min(.033, (ts - (tz.last || ts)) / 1000); tz.last = ts;
  if (!tz.falling) tiltStep(dt);
  tiltDraw();
  if (tz.run) tz.raf = requestAnimationFrame(tiltLoop);
}
async function tiltFall(h) {
  tz.falling = performance.now(); tz.x = h.x; tz.y = h.y; tz.vx = tz.vy = 0; tz.falls++;
  tone([520, 390, 260], .16, 'triangle', .1, .1); buddy('think');
  await wait(800);
  if (!tz || !tz.run) return;
  if (tz.falls >= 6 && tzLv > 0) {                      // too hard for now: an easier one
    tz.run = false; tzLv--; tzRun = 0; store.set('tiltLv', tzLv);
    tiltNew('Oops! Let’s try an easier one.'); return;
  }
  tz.x = .5; tz.y = .5; tz.falling = 0;
  sfx.pop();
}
function tiltWin() {
  tz.won = true; tz.run = false; cancelAnimationFrame(tz.raf); stayAwake(false); tiltDraw();
  sfx.munch(); setTimeout(sfx.munch, 220); setTimeout(() => { sfx.yay(); buddy('party'); }, 450);
  petFun(10);
  // coins: about one for every four seconds it takes, as in the other games. Bigger mazes and more holes take longer
  const [n, off, beside] = TILT_LEVELS[tzLv];
  addCoins(Math.round(n * n / 4 + (off + beside) / 2), el('tiltCanvas'));
  let up = '';
  if (tz.falls <= 1) { if (++tzRun >= 2 && tzLv < TILT_LEVELS.length - 1) { tzLv++; tzRun = 0; up = 'Now a harder one!'; } }
  else { tzRun = 0; if (tz.falls >= 4 && tzLv > 0) tzLv--; }
  store.set('tiltLv', tzLv);
  setTimeout(() => {
    if (screen !== 'tilt') return;
    const m = `Yum! ${pet.name} found the ${tz.treatName}!` + (up ? ' ' + up : '');
    tz.done = true; tiltLvl();
    tiltOver(m, 'Another one');
  }, 900);
}

/* ---------- starting, and the buttons ---------- */
el('tiltGo').onclick = async () => {
  if (!tz) return;
  // asking permission has to be the very first thing the tap does, or an iPhone refuses
  const allowed = await motionAllowed();
  if (tz.done) await tiltNew('', true);                  // "Another one": a new maze, straight in
  if (allowed) {
    removeEventListener('deviceorientation', onOrient);
    addEventListener('deviceorientation', onOrient);
    const t0 = performance.now();
    while (!tilt.g && performance.now() - t0 < 900) await wait(50);
  }
  tilt.on = !!tilt.g;
  tilt.g0 = tilt.g ? tilt.g.slice() : null;             // however she's holding it now is "flat"
  try { await screen.orientation.lock('portrait'); } catch {}      // an installed app on Android; elsewhere it just says no
  tilt.angle0 = (screen.orientation && screen.orientation.angle) ?? window.orientation ?? 0; tilt.turned = false;
  el('tiltOver').classList.add('hidden');
  if (!tilt.on) {
    const D = window.DeviceOrientationEvent;
    say(D && typeof D.requestPermission === 'function' && !allowed
      ? 'Sparkle wasn’t allowed to feel the tilt. You can drag with your finger instead.'
      : 'Hold your finger where you want to roll.');
  }
  stayAwake(true);
  tz.run = true; tz.last = 0; tz.falling = 0;
  tz.raf = requestAnimationFrame(tiltLoop);
};
// sideways on an iPhone: it still works (the slope turns with the screen), but a tip for next time
addEventListener('orientationchange', () => {
  if (screen === 'tilt' && tz && tz.run && !tilt.turned) {
    tilt.turned = true;
    say('Tip for a grown-up: turn on the rotation lock, so the screen stays still while you tilt.');
  }
});
const tzPt = e => { const r = el('tiltCanvas').getBoundingClientRect(); return [(e.clientX - r.left - tz.pad) / tz.cell, (e.clientY - r.top - tz.pad) / tz.cell]; };
el('tiltCanvas').addEventListener('pointerdown', e => { if (!tz || !tz.run || tilt.on) return; e.preventDefault(); el('tiltCanvas').setPointerCapture(e.pointerId); tilt.pointer = tzPt(e); });
el('tiltCanvas').addEventListener('pointermove', e => { if (tilt.pointer) tilt.pointer = tzPt(e); });
for (const ev of ['pointerup', 'pointercancel']) el('tiltCanvas').addEventListener(ev, () => { tilt.pointer = null; });
const TZ_KEYS = { ArrowLeft: ['x', -1], ArrowRight: ['x', 1], ArrowUp: ['y', -1], ArrowDown: ['y', 1] };
addEventListener('keydown', e => { const k = TZ_KEYS[e.key]; if (screen === 'tilt' && k) { tilt.keys[k[0]] = k[1]; e.preventDefault(); } });
addEventListener('keyup', e => { const k = TZ_KEYS[e.key]; if (k && tilt.keys[k[0]] === k[1]) tilt.keys[k[0]] = 0; });

function tiltStop() {
  if (tz) { tz.run = false; cancelAnimationFrame(tz.raf); }
  stayAwake(false);
  try { screen.orientation.unlock(); } catch {}
}
enter.tilt = () => { tz = null; tzRun = 0; requestAnimationFrame(() => tiltNew()); };
leave.tilt = () => { tiltStop(); removeEventListener('deviceorientation', onOrient); tilt.g = null; };
// switching apps mid-maze: stop, and carry on (holding it afresh) with a tap
document.addEventListener('visibilitychange', () => {
  if (document.hidden && screen === 'tilt' && tz && tz.run) { tiltStop(); tiltOver('Ready to keep going?', 'Go!'); }
});
new ResizeObserver(() => { if (screen === 'tilt' && tz && tz.px) tiltLayout(); }).observe(el('tiltWrap'));
