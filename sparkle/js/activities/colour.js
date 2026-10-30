/* ---------- colouring ---------- */
const SIZE = 1200;                     // the drawing is SIZE x SIZE pixels, whatever the screen
const BRUSH = [14, 34, 70];
const COLOURS = [
  '#e63946', '#ff4fa3', '#ff9f1c', '#ffd23f', '#a7e04b', '#2ec27e', '#2ec4b6', '#4cc9f0', '#3a86ff', '#7c5cff', '#b15cff', '#8d5524',
  '#7a0f1e', '#ffc4d6', '#ffcf99', '#fff3a8', '#d7f7b5', '#0b6e4f', '#b8f2e6', '#cdeffd', '#14327a', '#d9ccff', '#2b2b33', '#ffffff',
];
const COIN_CAP = 15;                   // coins one picture can earn
const mine = p => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><style>*{fill:none;stroke:#000;stroke-width:12;stroke-linecap:round;stroke-linejoin:round}.f{fill:#000}.w{fill:#fff;stroke:none}</style>${p.svg}</svg>`;
let ALL = [];                          // every page: { id, name, cat, svg }
const CATS = ['My drawings', 'Animals', 'Birds', 'Sea and bugs', 'Fairy tales', 'Flowers and trees', 'Food', 'People', 'Faces and hearts', 'Toys and fun', 'Clothes', 'Home things', 'Places', 'Going places', 'Sky'];
let cat = store.get('cat');
if (!CATS.includes(cat)) cat = 'My drawings';          // a category from an older version
const pageUrl = p => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(p.svg);
// blank pages: she can start as many as she likes; each one keeps its drawing
const BLANK_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"></svg>';
let blanks = store.get('blanks') || [];
const blankPage = id => ({ id, name: 'My drawing', cat: 'My drawings', svg: BLANK_SVG, blank: true });
const pageById = id => id.startsWith('blank-') ? blankPage(id) : ALL.find(x => x.id === id);

const db = new Promise(resolve => {
  try {
    const r = indexedDB.open('sparkle', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('art');
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => resolve(null);
  } catch { resolve(null); }
});
async function artGet(id) {
  const d = await db; if (!d) return null;
  return new Promise(res => { try { const q = d.transaction('art').objectStore('art').get(id); q.onsuccess = () => res(q.result || null); q.onerror = () => res(null); } catch { res(null); } });
}
async function artPut(id, blob) {
  const d = await db; if (!d) return;
  return new Promise(res => { try { const t = d.transaction('art', 'readwrite'); blob ? t.objectStore('art').put(blob, id) : t.objectStore('art').delete(id); t.oncomplete = t.onerror = () => res(); } catch { res(); } });
}
const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });

let thumbUrls = [];
enter.colour = async () => {
  await saving;                        // a picture just left may still be saving
  el('cats').innerHTML = CATS.map(c => `<button class="chip${c === cat ? ' on' : ''}" data-c="${c}" data-say="${c}">${c}</button>`).join('');
  thumbUrls.forEach(u => URL.revokeObjectURL(u)); thumbUrls = [];
  let list = ALL.filter(p => p.cat === cat);
  if (cat === 'My drawings') {
    // a blank page left empty isn't kept
    const kept = [];
    for (const id of blanks) if (await artGet(id)) kept.push(id);
    blanks = kept; store.set('blanks', blanks);
    list = blanks.slice().reverse().map(blankPage).concat(list);
  }
  const grid = el('picGrid');
  grid.innerHTML = (cat === 'My drawings' ? `<button class="pic newpage" data-new="1" data-say="A blank page. Draw anything!" aria-label="New blank page"><span class="plus2">+</span><span class="np">Blank page</span></button>` : '') + list.map(p => `<button class="pic" data-id="${p.id}" data-say="${p.name}" aria-label="${p.name}"><img class="l" alt="" loading="lazy" src="${pageUrl(p)}"></button>`).join('');
  for (const p of list) {
    const saved = await artGet(p.id);
    if (!saved || screen !== 'colour') continue;
    const b = grid.querySelector(`[data-id="${p.id}"]`);
    if (!b) continue;
    const u = URL.createObjectURL(saved); thumbUrls.push(u);
    b.insertAdjacentHTML('afterbegin', `<img class="p" alt="" src="${u}">`);
  }
};
el('cats').onclick = e => { const c = e.target.closest('[data-c]'); if (!c) return; cat = c.dataset.c; store.set('cat', cat); enter.colour(); el('picGrid').parentElement.parentElement.scrollTop = 0; };
el('picGrid').onclick = e => {
  if (e.target.closest('[data-new]')) { const id = 'blank-' + Date.now().toString(36); blanks.push(id); store.set('blanks', blanks); go('paint/' + id); return; }
  const b = e.target.closest('[data-id]'); if (b) go('paint/' + b.dataset.id);
};

const art = el('art'), lines = el('lines');
art.width = art.height = lines.width = lines.height = SIZE;
const ax = art.getContext('2d', { willReadFrequently: true });
const lx = lines.getContext('2d', { willReadFrequently: true });
const before = document.createElement('canvas'); before.width = before.height = SIZE;
const bx = before.getContext('2d', { willReadFrequently: true });
const scratch = document.createElement('canvas'); scratch.width = scratch.height = SIZE;
const sx = scratch.getContext('2d');

let pic = null;
let colour = store.get('colour') || COLOURS[1];
let size = store.get('size') ?? 1;
let tool = 'brush';
let inside = store.get('inside') !== false;
let undo = [];
let coloured = new Set();              // areas of this picture that have earned their coin

/* Every area of the drawing gets a number (label); a line is 0. Colouring
   that starts in an area stays inside it, through a mask made from its
   number, widened a little so the colour tucks under the edge of the line. */
let labels = null, regions = [], masks = new Map();
function findAreas() {
  const px = lx.getImageData(0, 0, SIZE, SIZE).data;
  const N = SIZE * SIZE, wall = new Uint8Array(N);
  for (let i = 0; i < N; i++) wall[i] = px[i * 4 + 3] > 90 ? 1 : 0;
  labels = new Int32Array(N); regions = [null]; masks = new Map();
  const stack = new Int32Array(N);
  let next = 1;
  for (let s = 0; s < N; s++) {
    if (wall[s] || labels[s]) continue;
    let sp = 0, minx = SIZE, miny = SIZE, maxx = 0, maxy = 0, count = 0;
    stack[sp++] = s; labels[s] = next;
    while (sp) {
      const i = stack[--sp], x = i % SIZE, y = (i / SIZE) | 0;
      count++; if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y;
      if (x > 0 && !wall[i - 1] && !labels[i - 1]) { labels[i - 1] = next; stack[sp++] = i - 1; }
      if (x < SIZE - 1 && !wall[i + 1] && !labels[i + 1]) { labels[i + 1] = next; stack[sp++] = i + 1; }
      if (y > 0 && !wall[i - SIZE] && !labels[i - SIZE]) { labels[i - SIZE] = next; stack[sp++] = i - SIZE; }
      if (y < SIZE - 1 && !wall[i + SIZE] && !labels[i + SIZE]) { labels[i + SIZE] = next; stack[sp++] = i + SIZE; }
    }
    regions.push({ x: minx, y: miny, w: maxx - minx + 1, h: maxy - miny + 1, count });
    next++;
  }
}
const GROW = 5;
function maskFor(label) {
  if (masks.has(label)) return masks.get(label);
  const r = regions[label];
  const x0 = Math.max(0, r.x - GROW), y0 = Math.max(0, r.y - GROW);
  const x1 = Math.min(SIZE, r.x + r.w + GROW), y1 = Math.min(SIZE, r.y + r.h + GROW);
  const w = x1 - x0, h = y1 - y0;
  let m = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) m[y * w + x] = labels[(y + y0) * SIZE + x + x0] === label ? 1 : 0;
  for (let pass = 0; pass < GROW; pass++) {
    const n = m.slice();
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (m[i]) continue;
      if ((x > 0 && m[i - 1]) || (x < w - 1 && m[i + 1]) || (y > 0 && m[i - w]) || (y < h - 1 && m[i + w])) n[i] = 1;
    }
    m = n;
  }
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const cx = c.getContext('2d'), id = cx.createImageData(w, h);
  for (let i = 0; i < w * h; i++) if (m[i]) id.data[i * 4 + 3] = 255;
  cx.putImageData(id, 0, 0);
  const out = { canvas: c, x: x0, y: y0, w, h };
  masks.set(label, out);
  return out;
}
function areaAt(x, y) {
  if (!labels) return 0;
  x = Math.round(x); y = Math.round(y);
  const at = (a, b) => (a >= 0 && b >= 0 && a < SIZE && b < SIZE) ? labels[b * SIZE + a] : 0;
  if (at(x, y)) return at(x, y);
  for (let r = 1; r <= 24; r++)
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      const l = at(x + dx, y + dy);
      if (l) return l;
    }
  return 0;
}
// a coin the first time each area gets colour, up to COIN_CAP for the picture
function colouredArea(label, from) {
  if (!label || coloured.has(label) || !pic) return;
  if (label < 1000 && regions[label] && regions[label].count < 400) return;      // specks between lines don't count
  coloured.add(label);
  store.set('col:' + pic.id, [...coloured]);
  if (coloured.size <= COIN_CAP) { addCoins(1, from); petFun(1); buddy('cheer'); }
}

/* The page is drawn white-filled (so shapes hide what's behind them), then the
   white is made see-through: what's left is the lines, over the colouring. */
function drawLines(img) {
  lx.clearRect(0, 0, SIZE, SIZE);
  lx.fillStyle = '#fff'; lx.fillRect(0, 0, SIZE, SIZE);
  const pad = pic.id.startsWith('om-') ? SIZE * .02 : 0;
  lx.drawImage(img, pad, pad, SIZE - 2 * pad, SIZE - 2 * pad);
  const d = lx.getImageData(0, 0, SIZE, SIZE), p = d.data;
  for (let i = 0; i < p.length; i += 4) {
    const lum = (p[i] * 3 + p[i + 1] * 6 + p[i + 2]) / 10;
    p[i] = 38; p[i + 1] = 38; p[i + 2] = 46; p[i + 3] = 255 - lum;
  }
  lx.putImageData(d, 0, 0);
}

enter.paint = async id => {
  const p = id && pageById(id);
  if (!p) { go('colour'); return; }
  pic = p; undo = []; labels = null;
  coloured = new Set(store.get('col:' + p.id) || []);
  drawButtons();
  fitSheet();
  ax.clearRect(0, 0, SIZE, SIZE); lx.clearRect(0, 0, SIZE, SIZE);
  const [img, saved] = await Promise.all([loadImg(pageUrl(p)), artGet(p.id)]);
  if (pic !== p) return;
  drawLines(img);
  if (saved) { try { const s = await loadImg(URL.createObjectURL(saved)); ax.drawImage(s, 0, 0, SIZE, SIZE); } catch {} }
  findAreas();
  say(p.blank ? 'A blank page. Draw anything you like!' : p.name);
};
leave.paint = () => { const p = pic; saveNow().then(() => { if (pic === p) pic = null; }); };
el('paintBack').onclick = () => go('colour');

let stroke = null;
function toDrawing(e) {
  const r = art.getBoundingClientRect();
  return { x: (e.clientX - r.left) * SIZE / r.width, y: (e.clientY - r.top) * SIZE / r.height };
}
function grow(box, x, y, pad) {
  box.x0 = Math.min(box.x0, x - pad); box.y0 = Math.min(box.y0, y - pad);
  box.x1 = Math.max(box.x1, x + pad); box.y1 = Math.max(box.y1, y + pad);
}
function paintSegment(a, b) {
  const w = tool === 'eraser' ? BRUSH[size] * 1.3 : BRUSH[size], pad = w / 2 + 2;
  const x0 = Math.floor(Math.max(0, Math.min(a.x, b.x) - pad)), y0 = Math.floor(Math.max(0, Math.min(a.y, b.y) - pad));
  const x1 = Math.ceil(Math.min(SIZE, Math.max(a.x, b.x) + pad)), y1 = Math.ceil(Math.min(SIZE, Math.max(a.y, b.y) + pad));
  if (x1 <= x0 || y1 <= y0) return;
  sx.clearRect(x0, y0, x1 - x0, y1 - y0);
  sx.strokeStyle = tool === 'eraser' ? '#000' : colour;
  sx.lineWidth = w; sx.lineCap = sx.lineJoin = 'round';
  sx.beginPath(); sx.moveTo(a.x, a.y); sx.lineTo(b.x + 0.01, b.y); sx.stroke();
  const m = stroke.mask;
  if (m) {
    sx.save();
    sx.beginPath(); sx.rect(x0, y0, x1 - x0, y1 - y0); sx.clip();
    sx.globalCompositeOperation = 'destination-in';
    sx.drawImage(m.canvas, m.x, m.y);
    sx.restore();
  }
  ax.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
  ax.drawImage(scratch, x0, y0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0);
  ax.globalCompositeOperation = 'source-over';
  grow(stroke.box, (a.x + b.x) / 2, (a.y + b.y) / 2, Math.hypot(a.x - b.x, a.y - b.y) / 2 + pad);
}
function remember(box) {
  const x = Math.max(0, Math.floor(box.x0)), y = Math.max(0, Math.floor(box.y0));
  const w = Math.min(SIZE, Math.ceil(box.x1)) - x, h = Math.min(SIZE, Math.ceil(box.y1)) - y;
  if (w <= 0 || h <= 0) return;
  undo.push({ x, y, w, h, data: bx.getImageData(x, y, w, h) });
  if (undo.length > 40) undo.shift();
  drawButtons();
}
function fillArea(p, e) {
  const label = areaAt(p.x, p.y);
  if (!label) return;
  const m = maskFor(label);
  bx.clearRect(0, 0, SIZE, SIZE); bx.drawImage(art, 0, 0);
  sx.clearRect(m.x, m.y, m.w, m.h);
  sx.drawImage(m.canvas, m.x, m.y);
  sx.globalCompositeOperation = 'source-in';
  sx.fillStyle = colour; sx.fillRect(m.x, m.y, m.w, m.h);
  sx.globalCompositeOperation = 'source-over';
  if (pic.blank) ax.globalCompositeOperation = 'destination-over';      // on a blank page, fill is the background, behind her drawing
  ax.drawImage(scratch, m.x, m.y, m.w, m.h, m.x, m.y, m.w, m.h);
  ax.globalCompositeOperation = 'source-over';
  remember({ x0: m.x, y0: m.y, x1: m.x + m.w, y1: m.y + m.h });
  sfx.pop();
  colouredArea(label, e && e.target);
  saveSoon();
}
art.addEventListener('pointerdown', e => {
  if (!pic || !labels || stroke) return;          // one finger at a time: a resting palm doesn't paint
  e.preventDefault();
  const p = toDrawing(e);
  if (tool === 'fill') { fillArea(p, e); return; }
  art.setPointerCapture(e.pointerId);
  bx.clearRect(0, 0, SIZE, SIZE); bx.drawImage(art, 0, 0);
  const label = areaAt(p.x, p.y);
  stroke = { id: e.pointerId, last: p, label, mask: inside && label ? maskFor(label) : null, box: { x0: p.x, y0: p.y, x1: p.x, y1: p.y }, len: 0 };
  paintSegment(p, p);
});
art.addEventListener('pointermove', e => {
  if (!stroke || e.pointerId !== stroke.id) return;
  const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
  for (const ev of (evs.length ? evs : [e])) { const p = toDrawing(ev); stroke.len += Math.hypot(p.x - stroke.last.x, p.y - stroke.last.y); paintSegment(stroke.last, p); stroke.last = p; }
});
function endStroke(e) {
  if (!stroke || e.pointerId !== stroke.id) return;
  remember(stroke.box);
  if (tool !== 'eraser' && stroke.len > 30) {
    if (pic.blank) { pic.strokes = (pic.strokes || 0) + 1; if (pic.strokes % 4 === 0) colouredArea(1000 + pic.strokes, art); }
    else colouredArea(stroke.label, art);
  }
  stroke = null;
  saveSoon();
}
art.addEventListener('pointerup', endStroke);
art.addEventListener('pointercancel', endStroke);
art.addEventListener('contextmenu', e => e.preventDefault());

let saveTimer = null;
function saveSoon() { clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 700); }
let saving = Promise.resolve();
function saveNow() { saving = saving.then(saveIt); return saving; }
async function saveIt() {
  clearTimeout(saveTimer); saveTimer = null;
  if (!pic || !labels) return;
  const id = pic.id;
  const px = ax.getImageData(0, 0, SIZE, SIZE).data;
  let any = false;
  for (let i = 3; i < px.length; i += 64) if (px[i]) { any = true; break; }
  if (!any) { await artPut(id, null); return; }
  const b = await new Promise(r => art.toBlob(r, 'image/png'));
  if (b) await artPut(id, b);
}
document.addEventListener('visibilitychange', () => { if (document.hidden) saveNow(); });

function drawButtons() {
  el('undoBtn').disabled = !undo.length;
  el('insideBtn').classList.toggle('on', inside);
  el('insideBtn').setAttribute('aria-pressed', inside);
  $$('.tool').forEach(b => b.classList.toggle('on', b.dataset.tool ? b.dataset.tool === tool : (tool === 'brush' && +b.dataset.size === size)));
  $$('.sw').forEach(b => b.classList.toggle('on', b.dataset.c === colour && tool !== 'eraser'));
}
const COLOUR_NAMES = ['red', 'pink', 'orange', 'yellow', 'lime green', 'green', 'teal', 'sky blue', 'blue', 'purple', 'violet', 'brown',
  'dark red', 'light pink', 'peach', 'light yellow', 'light green', 'dark green', 'mint', 'light blue', 'navy blue', 'lilac', 'black', 'white'];
el('palette').innerHTML = COLOURS.map((c, i) => `<button class="sw${['#ffffff', '#fff3a8', '#ffc4d6', '#cdeffd', '#d7f7b5', '#b8f2e6'].includes(c) ? ' light' : ''}" data-c="${c}" data-say="${COLOUR_NAMES[i]}" style="background:${c}" aria-label="${COLOUR_NAMES[i]}"></button>`).join('');
el('palette').onclick = e => {
  const b = e.target.closest('.sw'); if (!b) return;
  colour = b.dataset.c; store.set('colour', colour);
  if (tool === 'eraser') tool = 'brush';
  drawButtons();
};
el('tools').onclick = e => {
  const b = e.target.closest('.tool'); if (!b) return;
  if (b.dataset.tool) tool = b.dataset.tool;
  else { tool = 'brush'; size = +b.dataset.size; store.set('size', size); }
  drawButtons();
};
el('undoBtn').onclick = () => { const u = undo.pop(); if (!u) return; ax.putImageData(u.data, u.x, u.y); drawButtons(); saveSoon(); };
el('insideBtn').onclick = () => { inside = !inside; store.set('inside', inside); drawButtons(); say(inside ? 'Colour stays inside the lines' : 'Colour anywhere'); };
el('clearBtn').onclick = async () => {
  if (!await ask('Start this picture again?')) return;
  bx.clearRect(0, 0, SIZE, SIZE); bx.drawImage(art, 0, 0);
  remember({ x0: 0, y0: 0, x1: SIZE, y1: SIZE });
  ax.clearRect(0, 0, SIZE, SIZE);
  saveSoon();
};
el('shareBtn').onclick = async () => {
  if (!pic) return;
  const c = document.createElement('canvas'); c.width = c.height = SIZE;
  const x = c.getContext('2d');
  x.fillStyle = '#fff'; x.fillRect(0, 0, SIZE, SIZE);
  x.drawImage(art, 0, 0); x.drawImage(lines, 0, 0);
  const blob = await new Promise(r => c.toBlob(r, 'image/png'));
  const file = new File([blob], `${pic.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`, { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] }) && matchMedia('(pointer: coarse)').matches) {
    try { await navigator.share({ files: [file] }); return; } catch (err) { if (err && err.name === 'AbortError') return; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = file.name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
};
function fitSheet() {
  const r = el('stage').getBoundingClientRect();
  const s = Math.max(120, Math.floor(Math.min(r.width - 20, r.height - 8)));
  el('sheet').style.width = el('sheet').style.height = s + 'px';
}
new ResizeObserver(fitSheet).observe(el('stage'));
