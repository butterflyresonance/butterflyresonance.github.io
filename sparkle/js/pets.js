/* ---------- the pets ----------
   She can have several. The one she's playing with is "pet"; the others nap,
   so their needs don't drop while she isn't with them.
   A pet: { id, kind, name, special, stage: 'egg'|'baby'|'child'|'adult', since (when this stage began),
            fed (meals this stage), treats ({ blossom, sparkle, ocean, sunny }: magic treats this stage),
            paths ([what the baby grew into, what the child grew into]), wear ({ head, face, neck }: shop ids),
            food, clean, fun, at (needs last brought up to date), warm (an egg: 0-100) } */
const PET_NAMES = { bunny: 'Bella', kitten: 'Mittens', puppy: 'Biscuit', dragon: 'Sparky', unicorn: 'Stardust', phoenix: 'Ember' };
const GROW_MS = 20 * 3600e3;          // about a day in each stage
const GROW_FEEDS = 3;                 // and a few meals
const TREAT_PATHS = ['blossom', 'sparkle', 'ocean', 'sunny'];
const TREAT_NEED = 4;                 // magic treats of one kind in a stage to grow that way
function newPet(kind, special) {
  return { id: Math.random().toString(36).slice(2, 9), kind, name: PET_NAMES[kind] || 'Pip', special: !!special, stage: 'egg', since: Date.now(),
    fed: 0, treats: {}, paths: [], wear: {}, food: 80, clean: 90, fun: 80, at: Date.now(), warm: 0 };
}
let pets = store.get('pets');
if (!Array.isArray(pets)) {
  // the first version had one pet; it becomes a baby that can grow
  const old = store.get('pet');
  pets = old && old.kind ? [Object.assign(newPet(old.kind, SPECIALS.includes(old.kind)), { name: old.name || PET_NAMES[old.kind], stage: 'baby', food: old.food ?? 80, clean: old.clean ?? 90, fun: old.fun ?? 80 })] : [];
}
let pet = pets.find(p => p.id === store.get('active')) || pets[0] || null;
const owned = new Set(store.get('owned') || []);
const room = Object.assign({ wall: 'w-pink' }, store.get('room') || {});
const book = new Set(store.get('book') || []);
function savePets() { store.set('pets', pets); store.set('active', pet ? pet.id : null); }
const savePet = savePets;
const formKey = p => `${p.kind}|${p.stage}|${(p.paths || []).join(',')}`;
function addBook(p) { if (p.stage !== 'egg') { book.add(formKey(p)); store.set('book', [...book]); } }
if (pet) { addBook(pet); savePets(); }

// needs go down slowly over real time, even with the app closed; never below 0, and it never dies
function petTick() {
  if (!pet || pet.stage === 'egg') return;
  const now = Date.now(), h = Math.max(0, (now - (pet.at || now)) / 3.6e6);
  pet.food = clamp(pet.food - 5 * h); pet.clean = clamp(pet.clean - 3 * h); pet.fun = clamp(pet.fun - 4 * h);
  pet.at = now; savePets();
}
function petFun(n) { if (!pet || pet.stage === 'egg') return; petTick(); pet.fun = clamp(pet.fun + n); savePets(); }
function switchPet(p) {
  petTick();                             // the one she leaves goes to sleep up to date
  pet = p; pet.at = Date.now();          // the one she picks wakes up as it was
  savePets();
}
const SHOP_BY_ID = {};
function wearUrls(p) {
  const w = {};
  for (const [slot, id] of Object.entries(p.wear || {})) if (id && SHOP_BY_ID[id]) w[slot] = iconUrl(SHOP_BY_ID[id].i);
  return w;
}
function petLook(extra = {}) {
  const low = Math.min(pet.food, pet.clean, pet.fun);
  const look = low < 25 ? { eyes: 'sad', mouth: 'sad' } : low > 65 ? { eyes: 'happy', mouth: 'grin' } : { eyes: 'open', mouth: 'smile' };
  look.dirt = pet.clean < 70 ? (70 - pet.clean) / 70 : 0;
  return Object.assign(look, extra);
}
// a picture of a pet (the current one unless another is given) as it is now: stage, growth, clothes
function petUrl(look = {}, kind, p = pet) {
  if (!p) return '';
  const full = Object.assign({ stage: p.stage === 'egg' ? 'baby' : p.stage, paths: p.paths, wear: wearUrls(p), dye: p.dye || null }, look);
  if (p.stage === 'egg' && !kind) return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(eggSVG(p.special, (p.warm || 0) / 100));
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(petSVG(kind || p.kind, full));
}
function needsOf() {
  const n = [];
  if (!pet || pet.stage === 'egg') return n;
  if (pet.food < 35) n.push(['1F34E', 'I’m hungry!']);
  if (pet.clean < 35) n.push(['1F9FC', 'I need a bath!']);
  if (pet.fun < 35) n.push(['1F388', 'I’m bored. Let’s play!']);
  return n;
}

/* ---------- growing up ---------- */
const growReady = p => (p.stage === 'baby' || p.stage === 'child') && Date.now() - p.since >= GROW_MS && p.fed >= GROW_FEEDS;
function growNote(p) {
  if (p.stage === 'egg') return 'Tap the egg to keep it warm!';
  if (p.stage === 'adult') return 'All grown up!';
  const left = GROW_MS - (Date.now() - p.since), meals = GROW_FEEDS - p.fed;
  const next = p.stage === 'baby' ? 'big' : 'grown-up';
  if (left > 0) {
    const h = Math.ceil(left / 3.6e6);
    return `Grows ${next} ${h > 12 ? 'tomorrow' : `in ${h} hour${h === 1 ? '' : 's'}`}${meals > 0 ? `, after ${meals} more meal${meals === 1 ? '' : 's'}` : ''}.`;
  }
  return meals > 0 ? `Ready to grow after ${meals} more meal${meals === 1 ? '' : 's'}!` : 'Ready to grow!';
}
function treatNote(p) {
  const t = topTreat(p); if (!t) return '';
  const left = TREAT_NEED - t.n, nm = t.f.name.toLowerCase();
  return left > 0 ? ` ${left} more ${nm}${left === 1 ? '' : 's'} to grow the ${t.f.path === 'blossom' ? 'flower' : t.f.path === 'sparkle' ? 'sparkly' : t.f.path === 'ocean' ? 'sea' : 'sunny'} way.`
    : ` Enough ${nm}s! It will grow the ${t.f.path === 'blossom' ? 'flower' : t.f.path === 'sparkle' ? 'sparkly' : t.f.path === 'ocean' ? 'sea' : 'sunny'} way.`;
}
// the growing clock, and the potion that takes an hour off it
const POTION = { cost: 30, ms: 3600e3 };
const POTION_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M25 6h14v5h-2v11c8 3 13 10 13 18 0 11-8 19-18 19S14 51 14 40c0-8 5-15 13-18V11h-2z" fill="#fff"/><path d="M15.6 37c5-3.5 10 1.5 16-1.5s10-3 16.8 0C49 48 42 57 32 57S15 48 15.6 37z" fill="#ff6fb8"/><path d="M25 6h14v5h-2v11c8 3 13 10 13 18 0 11-8 19-18 19S14 51 14 40c0-8 5-15 13-18V11h-2z" fill="none" stroke="#4a3159" stroke-width="3.5" stroke-linejoin="round"/><rect x="23" y="2.5" width="18" height="7" rx="3.5" fill="#b99bff" stroke="#4a3159" stroke-width="3"/><circle cx="26" cy="44" r="2.6" fill="#fff"/><circle cx="35" cy="49" r="1.8" fill="#fff"/><circle cx="39" cy="42" r="1.4" fill="#fff"/><path d="M52 8l1.6 4.2 4.2 1.6-4.2 1.6L52 19.6l-1.6-4.2-4.2-1.6 4.2-1.6z" fill="#ffc93a" stroke="#4a3159" stroke-width="1.6" stroke-linejoin="round"/></svg>';
const potionUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(POTION_SVG);
const growLeft = p => Math.max(0, GROW_MS - (Date.now() - p.since));
function clock(ms) {
  const t = Math.ceil(ms / 1000), h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = t % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
function drawGrow() {
  const g = el('grow');
  g.dataset.say = growNote(pet) + (pet.stage === 'baby' || pet.stage === 'child' ? treatNote(pet) : '');
  if (pet.stage === 'egg' || pet.stage === 'adult') { g.className = 'growbox plain'; g.textContent = growNote(pet); return; }
  const left = growLeft(pet), meals = Math.min(pet.fed || 0, GROW_FEEDS);
  g.className = 'growbox';
  g.innerHTML = `<div class="gt"><div class="gl"><span>${pet.stage === 'baby' ? 'Growing big' : 'Growing up'}</span><b id="growClock">${left ? clock(left) : 'Ready!'}</b></div>`
    + `<div class="gbar"><i id="growBar" style="width:${(100 * (1 - left / GROW_MS)).toFixed(1)}%"></i></div></div>`
    + treatPip(pet) + `<div class="meals">${Array.from({ length: GROW_FEEDS }, (_, i) => `<span class="${i < meals ? 'on' : ''}">${iconImg('1F34E')}</span>`).join('')}</div>`
    + (left ? `<button class="potion${coins < POTION.cost ? ' poor' : ''}" id="potionBtn" aria-label="Growing potion"><img alt="" src="${potionUrl}"><span class="p">${iconImg('1FA99')}${POTION.cost}</span></button>` : '');
}
// the magic treat it has eaten most of this stage, and how many more it needs
function topTreat(p) {
  let best = null, n = 0;
  for (const f of TREATS) { const c = (p.treats || {})[f.path] || 0; if (c > n) { n = c; best = f; } }
  return best ? { f: best, n } : null;
}
function treatPip(p) {
  const t = topTreat(p); if (!t) return '';
  return `<span class="tpip${t.n >= TREAT_NEED ? ' full' : ''}">${iconImg(t.f.i)}${Math.min(t.n, TREAT_NEED)}/${TREAT_NEED}</span>`;
}
// once a second while she watches: the clock counts down, and when it runs out it's ready
function tickGrow() {
  if (!pet || !(pet.stage === 'baby' || pet.stage === 'child')) return;
  const left = growLeft(pet), c = el('growClock');
  if (!c) return;
  if (!left) { drawGrow(); if (growReady(pet) && !busy) celebrateGrowth(); return; }
  c.textContent = clock(left); el('growBar').style.width = (100 * (1 - left / GROW_MS)).toFixed(1) + '%';
}

// what it ate the most of while in this stage decides what it grows into
function growUp(p) {
  const t = p.treats || {};
  let path = 'plain', most = TREAT_NEED - 1;
  for (const k of TREAT_PATHS) if ((t[k] || 0) > most) { most = t[k]; path = k; }
  p.paths = [...(p.paths || []), path];
  p.stage = p.stage === 'baby' ? 'child' : 'adult';
  p.since = Date.now(); p.fed = 0; p.treats = {};
  addBook(p); savePets();
}

/* ---------- home ---------- */
enter[''] = () => {
  petTick();
  if (pet && pet.stage === 'egg') {
    el('petCard').innerHTML = `<img alt="" src="${petUrl()}"><div><div class="t">Your egg</div><div class="sub">Tap to hatch it!</div></div>`;
    el('petCard').dataset.say = 'Your egg is waiting to hatch!';
  } else {
    const needs = needsOf();
    el('petCard').innerHTML = `<img alt="" src="${petUrl(petLook())}"><div><div class="t">${pet.name}</div><div class="sub">${formName(pet.kind, pet.stage, pet.paths)}</div><div class="needs">${needs.map(([i]) => iconImg(i)).join('')}</div></div>`;
    el('petCard').dataset.say = needs.length ? `${pet.name} says: ${needs.map(n => n[1]).join(' ')}` : growReady(pet) ? `${pet.name} is ready to grow!` : `${pet.name} is happy!`;
  }
  el('tiles').innerHTML = gamesOn().map(g => `<button class="tile" data-go="${g.id}" data-say="${g.name}"><span class="ic">${g.svg || (g.icons ? `<span class="duo">${iconImg(g.icons[0])}${iconImg(g.icons[1], 'badge')}</span>` : iconImg(g.icon))}</span><span class="t">${g.name}</span></button>`).join('');
  const j = $$('#tiles [data-go="jump"] .ic')[0];          // the jump tile shows her own pet
  if (j && pet.stage !== 'egg') j.innerHTML = `<img alt="" src="${petUrl({ eyes: 'happy', mouth: 'grin', step: 0 })}">`;
};
el('petCard').onclick = () => go('pet');
el('tiles').onclick = e => { const t = e.target.closest('[data-go]'); if (t) openGame(t.dataset.go); };

/* ---------- the first pet: she picks one of the starters, and gets its egg ---------- */
let chosen = null;
enter.choose = () => {
  chosen = null;
  el('chooseGo').classList.add('hidden');
  el('chooseGrid').innerHTML = STARTERS.map(k =>
    `<button data-k="${k}" data-say="${PET_KINDS[k].name}"><img alt="" src="${'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(petSVG(k, { eyes: 'happy', mouth: 'grin' }))}"><div class="t">${PET_KINDS[k].name}</div></button>`).join('');
  setTimeout(() => say('Choose your pet!'), 300);
};
el('chooseGrid').onclick = e => {
  const b = e.target.closest('[data-k]'); if (!b) return;
  chosen = b.dataset.k;
  $$('#chooseGrid button').forEach(x => x.classList.toggle('on', x === b));
  el('chooseGo').classList.remove('hidden');
};
el('chooseGo').onclick = () => {
  if (!chosen) return;
  const p = newPet(chosen, false);
  pets.push(p); pet = p; savePets();
  go('pet');
};

/* ---------- looking after it ---------- */
const FOODS = [
  { i: '1F34E', name: 'Apple', cost: 3, food: 15 }, { i: '1F34C', name: 'Banana', cost: 3, food: 15 },
  { i: '1F955', name: 'Carrot', cost: 3, food: 15 }, { i: '1F353', name: 'Strawberry', cost: 5, food: 20 },
  { i: '1F95B', name: 'Milk', cost: 5, food: 20 }, { i: '1F349', name: 'Watermelon', cost: 6, food: 25 },
  { i: '1F41F', name: 'Fish', cost: 8, food: 30 }, { i: '1F95E', name: 'Pancakes', cost: 9, food: 35 },
  { i: '1F355', name: 'Pizza', cost: 12, food: 45 }, { i: '1F36A', name: 'Cookie', cost: 8, food: 15, fun: 10 },
  { i: '1F9C1', name: 'Cupcake', cost: 10, food: 20, fun: 15 }, { i: '1F368', name: 'Ice cream', cost: 12, food: 20, fun: 20 },
  { i: '1F382', name: 'Birthday cake', cost: 25, food: 50, fun: 30 },
];
// magic treats: what it eats most of while it's a baby or a child decides what it grows into
const TREATS = [
  { i: '1F338', name: 'Magic flower', path: 'blossom', cost: 15, food: 10, tell: 'A magic flower! Four of them, and your pet grows into a flower pet.' },
  { i: '2B50', name: 'Magic star', path: 'sparkle', cost: 15, food: 10, tell: 'A magic star! Four of them, and your pet grows into a floating star sprite.' },
  { i: '1F41A', name: 'Magic shell', path: 'ocean', cost: 15, food: 10, tell: 'A magic shell! Four of them, and your pet grows a mermaid tail.' },
  { i: '2600', name: 'Magic sun', path: 'sunny', cost: 15, food: 10, tell: 'A magic sun! Four of them, and your pet grows a sunny lion mane.' },
];
let petMode = '';        // '' | 'feed' | 'wash'
let busy = false, cuddles = [];
function drawRoom() {
  const r = el('room');
  r.dataset.wall = room.wall || 'w-pink';
  for (const slot of ['rug', 'bed', 'plant', 'toy', 'pic']) {
    const d = el('deco-' + slot), id = room[slot], it = id && SHOP_BY_ID[id];
    if (slot === 'rug') { d.dataset.rug = id || ''; continue; }
    d.innerHTML = it ? iconImg(it.i) : '';
  }
}
function drawPet(extra) {
  drawRoom();
  const egg = pet.stage === 'egg';
  el('petImg').src = egg ? petUrl() : petUrl(petLook(extra));
  el('petName').textContent = egg ? 'Your egg' : pet.name; el('petName').dataset.say = egg ? 'Your egg' : `${pet.name}, the ${formName(pet.kind, pet.stage, pet.paths)}`;
  el('stats').classList.toggle('hidden', egg);
  el('stats').innerHTML = egg ? '' : [['1F34E', pet.food, 'Food'], ['1F9FC', pet.clean, 'Clean'], ['1F388', pet.fun, 'Fun']].map(([i, v, n]) =>
    `<div class="stat" data-say="${n}">${iconImg(i)}<div class="meter${v < 30 ? ' low' : ''}"><i style="width:${Math.max(4, v)}%"></i></div></div>`).join('');
  drawGrow();
  el('feedBtn').classList.toggle('hidden', egg); el('washBtn').classList.toggle('hidden', egg); el('tripBtn').classList.toggle('hidden', egg);
  el('feedBtn').classList.toggle('on', petMode === 'feed');
  el('washBtn').classList.toggle('on', petMode === 'wash');
  el('petBox').classList.toggle('wash', petMode === 'wash');
}
function speakPet(text, ms = 2200) {
  const b = el('bubble');
  b.textContent = text; b.classList.remove('hidden');
  clearTimeout(speakPet.t); speakPet.t = setTimeout(() => b.classList.add('hidden'), ms + text.length * 40);
  return say(text);
}
function floatIcon(hex, x, y, size = 46) {
  const f = document.createElement('img');
  f.className = 'float'; f.src = iconUrl(hex); f.alt = '';
  Object.assign(f.style, { left: x - size / 2 + 'px', top: y - size / 2 + 'px', width: size + 'px', height: size + 'px' });
  el('petBox').appendChild(f); setTimeout(() => f.remove(), 1300);
}
function hop() { const b = el('petBox'); b.classList.remove('jump'); void b.offsetWidth; b.classList.add('jump'); }
let petTimer = null;
enter.pet = async () => {
  petTick(); petMode = ''; el('tray').classList.add('hidden');
  drawPet();
  if (pet.stage === 'egg') { setTimeout(() => speakPet(pet.warm ? 'Keep me warm!' : 'Tap the egg to keep it warm!'), 350); return; }
  if (growReady(pet)) { await wait(500); await celebrateGrowth(); }
  else {
    const needs = needsOf();
    setTimeout(() => speakPet(needs.length ? needs[0][1] : pick([`Hi! I missed you!`, `Yay, you're here!`, `Hello!`])), 350);
  }
  petTimer = setInterval(() => { petTick(); if (!busy && petMode !== 'wash') drawPet(); }, 30000);
};
let growTimer = setInterval(() => { if (screen === 'pet') tickGrow(); }, 1000);
leave.pet = () => { clearInterval(petTimer); petMode = ''; };

el('grow').onclick = async e => {
  if (!e.target.closest('#potionBtn') || busy) return;
  if (coins < POTION.cost) { sfx.oops(); speakPet('Not enough coins. Play a game to earn more!', 3200); return; }
  if (!await ask(`Give ${pet.name} a growing potion for ${POTION.cost} coins? It makes the wait one hour shorter.`)) return;
  busy = true;
  addCoins(-POTION.cost);
  const from = el('potionBtn').getBoundingClientRect(), to = el('petBox').getBoundingClientRect();
  const fly = document.createElement('img');
  fly.className = 'flyfood'; fly.src = potionUrl; fly.style.left = from.left + 'px'; fly.style.top = from.top + 'px';
  document.body.appendChild(fly);
  await wait(20);
  fly.style.transform = `translate(${to.left + to.width / 2 - from.left - 32}px, ${to.top + to.height * .5 - from.top - 32}px) scale(.7) rotate(-30deg)`;
  await wait(600); fly.remove();
  pet.since -= POTION.ms; savePets();
  sfx.yay(); hop(); drawPet({ eyes: 'happy', mouth: 'grin' });
  floatIcon('2728', to.width * .25, to.height * .3, 60); floatIcon('2728', to.width * .75, to.height * .35, 52);
  busy = false;
  if (growReady(pet)) { await speakPet('Whoosh! Something is happening!'); await celebrateGrowth(); return; }
  const meals = GROW_FEEDS - (pet.fed || 0);
  speakPet(growLeft(pet) ? 'Whoosh! One hour closer!' : `Whoosh! Now I just need ${meals} more meal${meals === 1 ? '' : 's'}!`, 3000);
};

async function celebrateGrowth() {
  if (celebrateGrowth.on || !growReady(pet)) return;     // only once, even if the clock and the screen both notice
  celebrateGrowth.on = true; busy = true;
  petMode = ''; el('tray').classList.add('hidden');
  const r = el('petBox').getBoundingClientRect();
  speakPet('Something is happening!');
  for (let i = 0; i < 6; i++) { el('petImg').style.opacity = i % 2 ? 1 : .35; await wait(250); }
  el('petImg').style.opacity = 1;
  growUp(pet);
  drawPet({ eyes: 'happy', mouth: 'grin' }); hop(); sfx.yay();
  floatIcon('2728', r.width * .25, r.height * .3, 64); floatIcon('2728', r.width * .75, r.height * .35, 56); floatIcon('1F496', r.width * .5, r.height * .2, 52);
  await speakPet(`${pet.name} grew into a ${formName(pet.kind, pet.stage, pet.paths)}!`, 4000);
  busy = false;
  celebrateGrowth.on = false;
}

// the egg: tapping and rubbing keeps it warm; warm enough, it hatches
async function warmEgg(e) {
  if (busy) return;
  const r = el('petBox').getBoundingClientRect();
  pet.warm = clamp((pet.warm || 0) + 8); savePets();
  floatIcon(pick(['1F496', '2728']), e.clientX - r.left, e.clientY - r.top, 40);
  sfx.pop();
  el('petImg').src = petUrl();
  el('petImg').classList.remove('wob'); void el('petImg').offsetWidth; el('petImg').classList.add('wob');
  if (pet.warm >= 100) {
    busy = true;
    speakPet('It’s hatching!');
    for (let i = 0; i < 4; i++) { el('petImg').classList.remove('wob'); void el('petImg').offsetWidth; el('petImg').classList.add('wob'); sfx.flip(); await wait(380); }
    pet.stage = 'baby'; pet.since = Date.now(); pet.at = Date.now(); pet.fed = 0; pet.treats = {}; pet.paths = [];
    addBook(pet); savePets();
    sfx.yay(); hop();
    drawPet({ eyes: 'happy', mouth: 'grin' });
    floatIcon('2728', r.width * .3, r.height * .3, 64); floatIcon('2728', r.width * .7, r.height * .35, 56);
    await speakPet(`Hello! I’m ${pet.name}, a baby ${PET_KINDS[pet.kind].name.toLowerCase()}!`, 3500);
    busy = false;
  } else if (pet.warm < 12) speakPet('Keep me warm!');
}

el('feedBtn').onclick = () => {
  petMode = petMode === 'feed' ? '' : 'feed';
  const t = el('tray');
  t.classList.toggle('hidden', petMode !== 'feed');
  if (petMode === 'feed') {
    const growing = pet.stage === 'baby' || pet.stage === 'child';
    t.innerHTML = (growing ? TREATS.map((f, i) => `<button class="food magic${coins < f.cost ? ' poor' : ''}" data-t="${i}" data-say="${f.name}">${iconImg(f.i, 'f')}<span class="p">${iconImg('1FA99')}${f.cost}</span></button>`).join('') : '')
      + FOODS.map((f, i) => `<button class="food${coins < f.cost ? ' poor' : ''}" data-i="${i}" data-say="${f.name}">${iconImg(f.i, 'f')}<span class="p">${iconImg('1FA99')}${f.cost}</span></button>`).join('');
  }
  drawPet();
};
el('tray').onclick = async e => {
  const b = e.target.closest('[data-i],[data-t]'); if (!b || busy) return;
  const magic = b.dataset.t != null, f = magic ? TREATS[+b.dataset.t] : FOODS[+b.dataset.i];
  petTick();
  if (!magic && pet.food >= 96 && !f.fun) { speakPet('I’m full!'); return; }
  if (coins < f.cost) { sfx.oops(); speakPet('Not enough coins. Play a game to earn more!', 3200); return; }
  busy = true;
  addCoins(-f.cost);
  const from = b.querySelector('img.f').getBoundingClientRect(), to = el('petBox').getBoundingClientRect();
  const fly = document.createElement('img');
  fly.className = 'flyfood'; fly.src = iconUrl(f.i); fly.style.left = from.left + 'px'; fly.style.top = from.top + 'px';
  document.body.appendChild(fly);
  await wait(20);
  fly.style.transform = `translate(${to.left + to.width / 2 - from.left - 32}px, ${to.top + to.height * .52 - from.top - 32}px) scale(.6)`;
  drawPet({ eyes: 'happy', mouth: 'open' });
  await wait(600); fly.remove();
  for (let i = 0; i < 3; i++) { drawPet({ eyes: 'happy', mouth: i % 2 ? 'open' : 'chew' }); sfx.munch(); await wait(260); }
  pet.food = clamp(pet.food + f.food); if (f.fun) pet.fun = clamp(pet.fun + f.fun);
  pet.fed = (pet.fed || 0) + 1;
  if (magic) { pet.treats = pet.treats || {}; pet.treats[f.path] = (pet.treats[f.path] || 0) + 1; }
  savePets();
  hop(); drawPet({ eyes: 'happy', mouth: 'grin' });
  floatIcon(magic ? '2728' : '1F496', to.width * .7, to.height * .25);
  busy = false;
  $$('.food', el('tray')).forEach(x => x.classList.toggle('poor', coins < (x.dataset.t != null ? TREATS[+x.dataset.t] : FOODS[+x.dataset.i]).cost));
  if (growReady(pet)) { el('tray').classList.add('hidden'); petMode = ''; await speakPet(magic ? 'Yum! I feel tingly!' : 'Yum!'); await celebrateGrowth(); return; }
  speakPet(magic ? 'Yum! I feel tingly!' : pick(['Yum!', 'Yummy!', 'Thank you!', `I love ${f.name.toLowerCase()}!`]));
};

el('washBtn').onclick = () => {
  petMode = petMode === 'wash' ? '' : 'wash';
  el('tray').classList.add('hidden');
  drawPet();
  if (petMode === 'wash') speakPet(pet.clean > 95 ? 'I’m already clean!' : 'Rub me to wash me!', 2600);
};
el('shopBtn').onclick = () => go('shop');
el('petsBtn').onclick = () => go('pets');

let rub = null;
el('petBox').addEventListener('pointerdown', e => {
  if (busy) return;
  if (pet.stage === 'egg') { warmEgg(e); return; }
  const r = el('petBox').getBoundingClientRect();
  if (petMode === 'wash') { el('petBox').setPointerCapture(e.pointerId); rub = { x: e.clientX, y: e.clientY, n: 0 }; return; }
  petTick();
  const now = Date.now();
  cuddles = cuddles.filter(t => now - t < 60000);
  if (cuddles.length < 6) { cuddles.push(now); pet.fun = clamp(pet.fun + 3); savePets(); }
  floatIcon(pick(['1F496', '1F49C', '2764']), e.clientX - r.left, e.clientY - r.top);
  sfx.pop(); hop();
  drawPet({ eyes: 'happy', mouth: 'grin' });
  const needs = needsOf();
  speakPet(needs.length ? needs[0][1] : pick(['Hehe!', 'I love you!', 'You’re my best friend!', 'That tickles!', 'Yay!']));
  setTimeout(() => { if (!busy && petMode !== 'wash') drawPet(); }, 1600);
});
el('petBox').addEventListener('pointermove', e => {
  if (!rub || petMode !== 'wash') return;
  const d = Math.hypot(e.clientX - rub.x, e.clientY - rub.y);
  if (d < 14) return;
  rub.x = e.clientX; rub.y = e.clientY; rub.n++;
  const r = el('petBox').getBoundingClientRect();
  const f = document.createElement('div');
  f.className = 'foam';
  const s = 26 + Math.random() * 30;
  Object.assign(f.style, { left: e.clientX - r.left - s / 2 + 'px', top: e.clientY - r.top - s / 2 + 'px', width: s + 'px', height: s + 'px' });
  el('petBox').appendChild(f); setTimeout(() => f.remove(), 1000);
  if (rub.n % 3 === 0) sfx.scrub();
  petTick();
  const was = pet.clean;
  pet.clean = clamp(pet.clean + 1.6); savePets();
  if (rub.n % 6 === 0) drawPet({ eyes: 'happy', mouth: 'smile' });
  if (was < 100 && pet.clean >= 100) {
    rub = null; petMode = ''; drawPet({ eyes: 'happy', mouth: 'grin' }); hop(); sfx.yay();
    floatIcon('2728', r.width * .3, r.height * .3, 60); floatIcon('2728', r.width * .7, r.height * .4, 50);
    speakPet('Squeaky clean! Thank you!');
  }
});
const endRub = () => { if (rub) { rub = null; drawPet(); } };
el('petBox').addEventListener('pointerup', endRub);
el('petBox').addEventListener('pointercancel', endRub);

/* ---------- the shop: clothes, things for the room, and (once a pet is grown up) eggs ---------- */
const SHOP = {
  Clothes: [
    { id: 'bow', slot: 'head', i: '1F380', name: 'Bow', cost: 40 }, { id: 'flower', slot: 'head', i: '1F33A', name: 'Flower', cost: 30 },
    { id: 'cap', slot: 'head', i: '1F9E2', name: 'Cap', cost: 60 }, { id: 'sunhat', slot: 'head', i: '1F452', name: 'Sun hat', cost: 75 },
    { id: 'tophat', slot: 'head', i: '1F3A9', name: 'Top hat', cost: 100 }, { id: 'gradcap', slot: 'head', i: '1F393', name: 'Clever hat', cost: 125 },
    { id: 'crown', slot: 'head', i: '1F451', name: 'Crown', cost: 200 },
    { id: 'glasses', slot: 'face', i: '1F453', name: 'Glasses', cost: 50 }, { id: 'shades', slot: 'face', i: '1F576', name: 'Sunglasses', cost: 60 },
    { id: 'scarf', slot: 'neck', i: '1F9E3', name: 'Scarf', cost: 50 }, { id: 'medal', slot: 'neck', i: '1F3C5', name: 'Medal', cost: 75 },
    { id: 'jewel', slot: 'neck', i: '1F48E', name: 'Jewel', cost: 150 },
    { id: 'kheart', slot: 'neck', i: '1F49D', name: 'Heart', cost: 0, gift: 1 }, { id: 'krose', slot: 'head', i: '1F339', name: 'Rose', cost: 0, gift: 3 },
  ],
  Room: [
    { id: 'w-pink', slot: 'wall', sw: 'w-pink', name: 'Pink stripes', cost: 0 }, { id: 'w-dots', slot: 'wall', sw: 'w-dots', name: 'Lilac spots', cost: 40 },
    { id: 'w-mint', slot: 'wall', sw: 'w-mint', name: 'Minty', cost: 40 }, { id: 'w-sky', slot: 'wall', sw: 'w-sky', name: 'Blue sky', cost: 60 },
    { id: 'w-night', slot: 'wall', sw: 'w-night', name: 'Starry night', cost: 80 },
    { id: 'r-pink', slot: 'rug', sw: 'r-pink', name: 'Pink rug', cost: 30 }, { id: 'r-purple', slot: 'rug', sw: 'r-purple', name: 'Purple rug', cost: 30 },
    { id: 'r-rainbow', slot: 'rug', sw: 'r-rainbow', name: 'Rainbow rug', cost: 60 },
    { id: 'bed', slot: 'bed', i: '1F6CF', name: 'Bed', cost: 75 }, { id: 'couch', slot: 'bed', i: '1F6CB', name: 'Couch', cost: 60 },
    { id: 'plant', slot: 'plant', i: '1FAB4', name: 'Pot plant', cost: 30 }, { id: 'sunflower', slot: 'plant', i: '1F33B', name: 'Sunflower', cost: 40 },
    { id: 'teddy', slot: 'toy', i: '1F9F8', name: 'Teddy', cost: 50 }, { id: 'ball', slot: 'toy', i: '26BD', name: 'Ball', cost: 25 },
    { id: 'balloon', slot: 'toy', i: '1F388', name: 'Balloon', cost: 20 }, { id: 'kite', slot: 'toy', i: '1FA81', name: 'Kite', cost: 40 },
    { id: 'piano', slot: 'toy', i: '1F3B9', name: 'Piano', cost: 90 }, { id: 'castle', slot: 'toy', i: '1F3F0', name: 'Castle', cost: 120 },
    { id: 'picture', slot: 'pic', i: '1F5BC', name: 'Picture', cost: 40 }, { id: 'rainbow', slot: 'pic', i: '1F308', name: 'Rainbow', cost: 50 },
    { id: 'star', slot: 'pic', i: '2B50', name: 'Star', cost: 30 },
    { id: 'ktrophy', slot: 'toy', i: '1F3C6', name: 'Trophy', cost: 0, gift: 6 },
  ],
  Colours: [
    { id: 'd-none', dye: null, name: 'Natural', cost: 0 },
    { id: 'd-pink', dye: '#ff9fd0', name: 'Pink', cost: 40 }, { id: 'd-lilac', dye: '#c3a2ff', name: 'Lilac', cost: 40 },
    { id: 'd-mint', dye: '#93edc8', name: 'Mint', cost: 40 }, { id: 'd-sky', dye: '#9fd6ff', name: 'Sky blue', cost: 40 },
    { id: 'd-lemon', dye: '#fff07a', name: 'Lemon', cost: 40 }, { id: 'd-peach', dye: '#ffbe94', name: 'Peach', cost: 40 },
    { id: 'd-gold', dye: '#ffc93a', name: 'Gold', cost: 60 }, { id: 'd-snow', dye: '#ffffff', name: 'Snowy', cost: 60 },
  ],
  Eggs: [
    { id: 'cot', name: 'Cot', i: '1F6CF', cost: 100, once: true, tell: 'A cot for a new baby. You need one before you can get an egg.' },
    { id: 'egg', name: 'Egg', egg: false, cost: 150, tell: 'An egg. It hatches into a bunny, a kitten or a puppy.' },
    { id: 'segg', name: 'Sparkle egg', egg: true, cost: 500, tell: 'A sparkle egg! It hatches into a special pet: a dragon, a unicorn or a phoenix.' },
  ],
};
for (const list of Object.values(SHOP)) for (const it of list) SHOP_BY_ID[it.id] = it;
owned.add('w-pink');
let shopTab = 'Clothes';
const eggIcon = special => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(eggSVG(special, 0));
function shopPic(it) {
  if (it.sw) return `<span class="swatch" data-w="${it.sw}"></span>`;
  if ('dye' in it) return `<img alt="" src="${pet && pet.stage !== 'egg' ? petUrl({ eyes: 'happy', mouth: 'grin', dye: it.dye, wear: {} }) : ''}">`;
  if (it.egg != null) return `<img alt="" src="${eggIcon(it.egg)}">`;
  return iconImg(it.i);
}
function itemOn(it) {
  if ('dye' in it) return pet && (pet.dye || null) === it.dye;
  if (it.slot && ['head', 'face', 'neck'].includes(it.slot)) return pet && pet.wear && pet.wear[it.slot] === it.id;
  if (it.slot) return room[it.slot] === it.id;
  return false;
}
function drawShop() {
  el('shopTabs').innerHTML = Object.keys(SHOP).map(t => `<button class="chip${t === shopTab ? ' on' : ''}" data-tab="${t}" data-say="${t}">${t}</button>`).join('');
  el('shopPet').src = pet.stage === 'egg' ? petUrl() : petUrl({ eyes: 'happy', mouth: 'grin' });
  const grown = pets.some(p => p.stage === 'adult');
  el('shopNote').textContent = shopTab === 'Eggs' && !grown ? 'Grow a pet all the way up, and then you can get a new egg!'
    : shopTab === 'Colours' ? (pet.stage === 'egg' ? 'Hatch your egg first!' : `Change ${pet.name}’s colour. You can change it again any time.`) : '';
  el('shopNote').dataset.say = el('shopNote').textContent;
  el('shopGrid').innerHTML = SHOP[shopTab].map(it => {
    const have = owned.has(it.id), on = itemOn(it);
    const locked = shopTab === 'Eggs' && (!grown || (!it.once && !owned.has('cot')));
    if ('dye' in it) {
      const lab = on ? 'Now' : it.cost ? `${iconImg('1FA99')}${it.cost}` : 'Free';
      return `<button class="item${on ? ' on' : ''}${!on && coins < it.cost ? ' poor' : ''}" data-id="${it.id}" data-say="${it.name}">${shopPic(it)}<span class="nm">${it.name}</span><span class="p">${lab}</span></button>`;
    }
    if (it.gift && !have) return `<button class="item gift locked" data-id="${it.id}" data-say="${it.name}. A present from the animal shelter, for helping ${it.gift} animal${it.gift === 1 ? '' : 's'}.">${shopPic(it)}<span class="nm">${it.name}</span><span class="p g">${iconImg('1F49D')}Help ${it.gift}</span></button>`;
    const tag = it.once && have ? 'Got it' : have && it.slot ? (on ? 'Wearing' : 'Use') : `${iconImg('1FA99')}${it.cost}`;
    const label = it.slot && ['head', 'face', 'neck'].includes(it.slot) && have ? (on ? 'Wearing' : 'Wear') : tag;
    return `<button class="item${on ? ' on' : ''}${locked || (it.once && have) ? ' locked' : ''}${!have && coins < it.cost ? ' poor' : ''}" data-id="${it.id}" data-say="${it.name}">${shopPic(it)}<span class="nm">${it.name}</span><span class="p">${label}</span></button>`;
  }).join('');
}
enter.shop = () => { petTick(); drawShop(); setTimeout(() => say('The shop!'), 250); };
el('shopTabs').onclick = e => { const c = e.target.closest('[data-tab]'); if (!c) return; shopTab = c.dataset.tab; drawShop(); };
el('shopGrid').onclick = async e => {
  const b = e.target.closest('[data-id]'); if (!b) return;
  const it = SHOP_BY_ID[b.dataset.id];
  if (shopTab === 'Eggs') {
    if (!pets.some(p => p.stage === 'adult')) { await say('Grow a pet all the way up first!'); return; }
    if (it.once && owned.has(it.id)) { say('You have a cot!'); return; }
    if (!it.once && !owned.has('cot')) { say('You need a cot first!'); return; }
    if (it.tell) await say(it.tell);
    if (coins < it.cost) { sfx.oops(); say(`You need ${it.cost} coins.`); return; }
    if (!await ask(`Buy the ${it.name.toLowerCase()} for ${it.cost} coins?`)) return;
    addCoins(-it.cost, b);
    if (it.once) { owned.add(it.id); store.set('owned', [...owned]); sfx.yay(); drawShop(); return; }
    // a new egg: a starter, or (sparkle) a special one, new kinds first
    const have = new Set(pets.map(p => p.kind));
    const from = it.egg ? SPECIALS : STARTERS;
    const kind = pick(from.filter(k => !have.has(k)).length ? from.filter(k => !have.has(k)) : from);
    const p = newPet(kind, it.egg);
    pets.push(p); switchPet(p);
    sfx.yay(); go('pet');
    return;
  }
  if ('dye' in it) {
    if (pet.stage === 'egg') { say('Hatch your egg first!'); return; }
    if ((pet.dye || null) === it.dye) { say(`${pet.name} is ${it.dye ? it.name.toLowerCase() : 'their natural colour'} now.`); return; }
    if (it.cost) {
      if (coins < it.cost) { sfx.oops(); say(`${it.name}. You need ${it.cost} coins.`); return; }
      if (!await ask(`Colour ${pet.name} ${it.name.toLowerCase()} for ${it.cost} coins?`)) return;
      addCoins(-it.cost, b);
    }
    pet.dye = it.dye; savePets(); sfx.yay(); drawShop();
    el('shopPet').classList.remove('hopit'); void el('shopPet').offsetWidth; el('shopPet').classList.add('hopit');
    return;
  }
  if (it.gift && !owned.has(it.id)) { say(`A present from the animal shelter. Help ${it.gift} animal${it.gift === 1 ? '' : 's'} find a home to get it!`); return; }
  const isWear = ['head', 'face', 'neck'].includes(it.slot);
  if (!owned.has(it.id)) {
    if (coins < it.cost) { sfx.oops(); say(`${it.name}. You need ${it.cost} coins.`); return; }
    if (!await ask(`Buy the ${it.name.toLowerCase()} for ${it.cost} coins?`)) return;
    addCoins(-it.cost, b); owned.add(it.id); store.set('owned', [...owned]); sfx.yay();
  }
  // put it on (or take it off); one thing in each place
  if (isWear) {
    if (pet.stage === 'egg') { say('Eggs can’t wear clothes!'); drawShop(); return; }
    pet.wear = pet.wear || {};
    pet.wear[it.slot] = pet.wear[it.slot] === it.id ? null : it.id; savePets();
  } else {
    room[it.slot] = room[it.slot] === it.id && it.slot !== 'wall' ? null : it.id; store.set('room', room);
  }
  sfx.pop(); drawShop();
  el('shopPet').classList.remove('hopit'); void el('shopPet').offsetWidth; el('shopPet').classList.add('hopit');
};

/* ---------- all her pets, and the book of every kind of pet she's grown ---------- */
const ALL_FORMS = kind => {
  const f = [`${kind}|baby|`];
  for (const a of ['plain', ...TREAT_PATHS]) { f.push(`${kind}|child|${a}`); for (const b of ['plain', ...TREAT_PATHS]) f.push(`${kind}|adult|${a},${b}`); }
  return f;
};
enter.pets = () => {
  petTick();
  el('petList').innerHTML = pets.map(p => `<button class="mypet${p === pet ? ' on' : ''}" data-id="${p.id}" data-say="${p.stage === 'egg' ? 'An egg' : p.name}">
      <img alt="" src="${p.stage === 'egg' ? petUrl({}, null, p) : petUrl({ eyes: p === pet ? 'happy' : 'sleep', mouth: 'smile' }, null, p)}">
      <span class="nm">${p.stage === 'egg' ? 'Egg' : p.name}</span><span class="sub">${p.stage === 'egg' ? 'Waiting to hatch' : p === pet ? 'Playing' : 'Napping'}</span></button>`).join('');
  const kinds = [...STARTERS, ...SPECIALS];
  el('petBook').innerHTML = kinds.map(k => {
    const all = ALL_FORMS(k), found = all.filter(f => book.has(f));
    if (!found.length && SPECIALS.includes(k)) return `<div class="bookrow"><div class="bk">??? <span>A special pet. Hatch a sparkle egg to find it!</span></div></div>`;
    return `<div class="bookrow"><div class="bk">${PET_KINDS[k].name} <span>${found.length} of ${all.length} found</span></div><div class="bookpics">${found.map(f => {
      const [, stage, ps] = f.split('|'), paths = ps ? ps.split(',') : [];
      return `<span class="bp" data-say="${formName(k, stage, paths)}"><img alt="" src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(petSVG(k, { stage, paths, eyes: 'happy', mouth: 'grin' }))}"></span>`;
    }).join('')}</div></div>`;
  }).join('');
};
el('petList').onclick = e => {
  const b = e.target.closest('[data-id]'); if (!b) return;
  const p = pets.find(x => x.id === b.dataset.id); if (!p) return;
  if (p !== pet) { switchPet(p); sfx.pop(); }
  go('pet');
};

/* ---------- the pet joins the games: it sits in the bar and reacts ---------- */
function buddy(mood = 'idle') {
  const show = pet && pet.stage !== 'egg';
  const look = mood === 'think' ? { eyes: 'think', mouth: 'flat' } : mood === 'idle' ? { eyes: 'open', mouth: 'smile' } : { eyes: 'happy', mouth: 'grin' };
  const u = show ? petUrl(look) : '';
  for (const b of $$('.buddy')) {
    b.classList.toggle('hidden', !show);
    if (!show) continue;
    b.src = u;
    b.classList.remove('cheer', 'think', 'party'); void b.offsetWidth;
    if (mood !== 'idle') b.classList.add(mood);
  }
  clearTimeout(buddy.t);
  if (mood !== 'idle') buddy.t = setTimeout(() => buddy('idle'), mood === 'party' ? 3000 : 1800);
}
