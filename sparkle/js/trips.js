/* ---------- day trips: spend coins to take the pet somewhere, and find six things there ----------
   Each place is a postcard; going stamps it, finding everything adds a star. */
const TRIPS = [
  { id: 'park', name: 'The park', cost: 25, hello: 'We’re at the park!', mess: 'muddy', items: [
    ['1F333', 'A big tree', 14, 34, 30], ['1F98B', 'A butterfly', 58, 16, 11], ['1F6DD', 'A slide', 84, 46, 24],
    ['1F43F', 'A chipmunk', 48, 66, 13], ['1F986', 'A duck', 74, 80, 14], ['1F337', 'A tulip', 30, 84, 11]] },
  { id: 'beach', name: 'The beach', cost: 40, hello: 'We’re at the beach!', mess: 'sandy', items: [
    ['1F334', 'A palm tree', 12, 40, 30], ['1F42C', 'A dolphin', 56, 36, 14], ['26F1', 'A beach umbrella', 84, 56, 24],
    ['1FAA3', 'A bucket', 26, 78, 12], ['1F41A', 'A shell', 46, 88, 10], ['1F980', 'A crab', 68, 82, 13]] },
  { id: 'farm', name: 'The farm', cost: 40, hello: 'We’re at the farm!', mess: 'muddy', items: [
    ['1F69C', 'A tractor', 16, 56, 22], ['1F40E', 'A horse', 48, 50, 18], ['1F404', 'A cow', 80, 58, 22],
    ['1F416', 'A pig', 34, 82, 14], ['1F414', 'A chicken', 60, 86, 11], ['1F411', 'A sheep', 88, 84, 14]] },
  { id: 'snow', name: 'The snow', cost: 60, hello: 'We’re in the snow! Brrr!', mess: 'wet', items: [
    ['2744', 'A snowflake', 48, 16, 10], ['1F332', 'A pine tree', 88, 36, 22], ['26C4', 'A snowman', 18, 56, 24],
    ['1F43B-200D-2744-FE0F', 'A polar bear', 78, 66, 20], ['1F6F7', 'A sled', 38, 84, 14], ['1F427', 'A penguin', 60, 82, 13]] },
  { id: 'fair', name: 'The fair', cost: 60, hello: 'We’re at the fair!', mess: 'sticky', items: [
    ['1F3A1', 'A Ferris wheel', 20, 38, 32], ['1F388', 'A balloon', 50, 18, 11], ['1F3AA', 'A circus tent', 86, 32, 20],
    ['1F3A0', 'A merry-go-round', 70, 64, 26], ['1F36D', 'A lollipop', 36, 82, 11], ['1F37F', 'Popcorn', 90, 86, 12]] },
  { id: 'sea', name: 'Under the sea', cost: 80, hello: 'We’re under the sea! Blub blub!', mess: 'wet', items: [
    ['1F420', 'A fish', 20, 28, 13], ['1F42C', 'A dolphin', 64, 24, 18], ['1FABC', 'A jellyfish', 88, 48, 13],
    ['1F422', 'A turtle', 36, 56, 16], ['1F419', 'An octopus', 70, 78, 18], ['1FAB8', 'Some coral', 14, 82, 18]] },
  { id: 'space', name: 'Outer space', cost: 120, hello: 'We’re in space! Wow!', mess: '', items: [
    ['1FA90', 'A planet', 18, 26, 22], ['2604', 'A comet', 46, 14, 12], ['1F319', 'The moon', 84, 16, 14],
    ['1F6F8', 'A flying saucer', 54, 40, 16], ['1F680', 'A rocket', 80, 62, 22], ['1F47D', 'An alien', 34, 80, 13]] },
];
const cards = Object.assign({}, store.get('postcards') || {});     // { park: { n: visits, star: found everything } }
let trip = null;

function postcard(t) {
  const c = cards[t.id];
  return `<button class="pc" data-trip="${t.id}" data-place="${t.id}" data-say="${t.name}">
    <span class="pcpics">${t.items.slice(0, 3).map(i => iconImg(i[0])).join('')}</span>
    ${c ? `<span class="stamp">${c.star ? '★ ' : ''}×${c.n}</span>` : ''}
    <span class="pcfoot"><span class="nm">${t.name}</span><span class="p">${iconImg('1FA99')}${t.cost}</span></span></button>`;
}
enter.trips = () => {
  petTick();
  const been = Object.keys(cards).length;
  el('tripsNote').textContent = been ? `Postcards: ${been} of ${TRIPS.length}` : `Where shall we go, ${pet.name}?`;
  el('tripsNote').dataset.say = el('tripsNote').textContent;
  el('tripList').innerHTML = TRIPS.map(postcard).join('');
  $$('#tripList .pc').forEach(b => b.classList.toggle('poor', coins < TRIPS.find(t => t.id === b.dataset.trip).cost));
  setTimeout(() => say('Where shall we go?'), 250);
};
el('tripBtn').onclick = () => go('trips');
el('tripsBack').onclick = () => go('pet');
el('tripList').onclick = async e => {
  const b = e.target.closest('[data-trip]'); if (!b) return;
  const t = TRIPS.find(x => x.id === b.dataset.trip);
  if (coins < t.cost) { sfx.oops(); await say(`${t.name}. You need ${t.cost} coins.`); return; }
  if (!await ask(`Go to ${t.name.toLowerCase()} with ${pet.name} for ${t.cost} coins?`)) return;
  addCoins(-t.cost);
  // the outing: lots of fun, and a little hungry and messy afterwards
  petTick();
  pet.fun = clamp(pet.fun + 35); pet.food = clamp(pet.food - 10); if (t.mess) pet.clean = clamp(pet.clean - 15);
  savePets();
  const first = !cards[t.id];
  cards[t.id] = { n: (cards[t.id] ? cards[t.id].n : 0) + 1, star: cards[t.id] ? cards[t.id].star : false };
  store.set('postcards', cards);
  trip = { t, found: new Set(), first };
  go('trip');
};

function tripSay(text, ms = 2200) {
  const b = el('tripBubble');
  b.textContent = text; b.classList.remove('hidden');
  clearTimeout(tripSay.t); tripSay.t = setTimeout(() => b.classList.add('hidden'), ms + text.length * 40);
  return say(text);
}
function tripLayout() {
  const sc = el('scene'), r = sc.getBoundingClientRect();
  const u = Math.min(r.width * 1.3, r.height * .75) / 100;
  sc.style.setProperty('--u', u + 'px');
}
function tripFound() {
  el('tripFound').innerHTML = trip.t.items.map(i => `<span class="${trip.found.has(i[0]) ? 'on' : ''}">${iconImg(i[0])}</span>`).join('');
}
function movePet(x) {
  const p = el('tripPet');
  p.style.left = clamp(x, 14, 86) + '%';
  p.classList.remove('walk'); void p.offsetWidth; p.classList.add('walk');
}
enter.trip = () => {
  if (!trip) { go('trips'); return; }
  const t = trip.t, sc = el('scene');
  sc.dataset.place = t.id;
  el('tripName').textContent = t.name; el('tripName').dataset.say = t.name;
  $$('.thing2', sc).forEach(x => x.remove());
  for (const [hex, name, x, y, size] of t.items) {
    const b = document.createElement('button');
    b.className = 'thing2'; b.dataset.hex = hex; b.setAttribute('aria-label', name);
    b.style.cssText = `left:${x}%;top:${y}%;--s:${size}`;
    b.innerHTML = iconImg(hex);
    sc.appendChild(b);
  }
  el('tripPet').src = petUrl({ eyes: 'happy', mouth: 'grin' });
  el('tripPet').style.left = '50%';
  el('tripBubble').classList.add('hidden');
  tripFound();
  requestAnimationFrame(tripLayout);
  setTimeout(async () => {
    sfx.yay();
    await tripSay(t.hello, 2600);
    if (screen === 'trip') tripSay(trip.first ? 'A new postcard! Can you find six things?' : 'Can you find six things?', 2600);
  }, 400);
};
addEventListener('resize', () => { if (screen === 'trip') tripLayout(); });
el('scene').onclick = async e => {
  const b = e.target.closest('.thing2'); if (!b || !trip) return;
  const item = trip.t.items.find(i => i[0] === b.dataset.hex), [hex, name, x] = item;
  sfx.pop();
  b.classList.remove('boop'); void b.offsetWidth; b.classList.add('boop');
  movePet(x);
  const r = el('scene').getBoundingClientRect(), br = b.getBoundingClientRect();
  const f = document.createElement('img');
  f.className = 'float'; f.src = iconUrl(pick(['2728', '1F496'])); f.alt = '';
  Object.assign(f.style, { left: br.left - r.left + br.width / 2 - 20 + 'px', top: br.top - r.top - 10 + 'px', width: '40px', height: '40px' });
  el('scene').appendChild(f); setTimeout(() => f.remove(), 1300);
  const isNew = !trip.found.has(hex);
  trip.found.add(hex); tripFound();
  if (isNew && trip.found.size === trip.t.items.length) {
    cards[trip.t.id].star = true; store.set('postcards', cards);
    petFun(15);
    el('tripPet').src = petUrl({ eyes: 'happy', mouth: 'grin' });
    await tripSay(`${name}!`, 1200);
    if (screen !== 'trip') return;
    sfx.yay();
    for (let i = 0; i < 5; i++) {
      const s = document.createElement('img');
      s.className = 'float'; s.src = iconUrl(pick(['2728', '2B50', '1F496'])); s.alt = '';
      Object.assign(s.style, { left: 10 + Math.random() * 80 + '%', top: 30 + Math.random() * 40 + '%', width: '56px', height: '56px' });
      el('scene').appendChild(s); setTimeout(() => s.remove(), 1300);
    }
    tripSay('You found everything! What a fun day!', 3500);
  } else tripSay(`${name}!`, 1400);
};
el('tripHome').onclick = () => { trip = null; go('pet'); };
leave.trip = () => { trip = null; };
