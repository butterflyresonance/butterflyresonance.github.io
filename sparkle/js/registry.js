/* ---------- the activities: every tile on the home screen, and the kinds inside it ----------
   This is the one list to change when adding, removing or re-aging an activity.

   A tile with one kind of game has   ages: [youngest, oldest]
   A tile with several kinds has      types: [{ id, name, ages, art }]
     - id is what comes after the slash in the address: #maths/plus
     - art() draws the little picture on its button in the chooser
   Ages are whole years and include both ends; 99 means "no upper limit".

   Which kinds are switched on: whatever a grown-up has set in Settings, and
   for anything they haven't touched, whether the child's age is inside its
   range. Only the grown-up's own choices are saved, so as the child has
   birthdays the suggestions move along by themselves, and a new activity
   added later is switched on or off to suit their age without anyone doing
   anything. With no birthday entered, everything meant for under-7s is on
   (that is everything Sparkle had before birthdays existed). */
const GAMES = [
  { id: 'colour', name: 'Colouring', icon: '1F3A8',
    ages: [3, 99] },
  { id: 'memory', name: 'Memory', svg: '<svg viewBox="0 0 84 84"><rect x="8" y="14" width="40" height="56" rx="9" fill="#ff8cc6" stroke="#4a3159" stroke-width="3" transform="rotate(-10 28 42)"/><path d="M24 40l3-7 3 7 7 3-7 3-3 7-3-7-7-3Z" fill="#fff" transform="rotate(-10 28 42)"/><rect x="36" y="14" width="40" height="56" rx="9" fill="#fff" stroke="#4a3159" stroke-width="3" transform="rotate(8 56 42)"/><path d="M56 52c-9-6-13-10-13-15a6 6 0 0 1 13-3 6 6 0 0 1 13 3c0 5-4 9-13 15Z" fill="#ff4fa3" transform="rotate(8 56 42)"/></svg>',
    ages: [3, 99] },
  { id: 'ttt', name: 'Tic-tac-toe', svg: '<svg viewBox="0 0 84 84"><rect x="4" y="4" width="76" height="76" rx="18" fill="#ffe6f3"/><path d="M30 6v72M54 6v72M6 30h72M6 54h72" stroke="#e7b9db" stroke-width="4"/><path d="M11 11l13 13M24 11 11 24" stroke="#ff4fa3" stroke-width="5" stroke-linecap="round"/><circle cx="42" cy="42" r="7" fill="none" stroke="#8f5cff" stroke-width="5"/><path d="M59 59l13 13M72 59 59 72" stroke="#ff4fa3" stroke-width="5" stroke-linecap="round"/></svg>',
    ages: [3, 99] },
  { id: 'jump', name: 'Jump', icon: '2B50',
    ages: [3, 99] },
  { id: 'letters', name: 'Letters', icon: '1F524',
    types: [
    { id: 'name', name: 'Find the letter', ages: [3, 6], art: () => '<b class="eg">A</b>' },
    { id: 'sound', name: 'First letter', ages: [4, 7], art: () => iconImg('1F34E') + '<b class="eg">a</b>' },
    { id: 'rhyme', name: 'Rhymes', ages: [4, 7], art: () => iconImg('1F431') + iconImg('1F3A9') },
    { id: 'same', name: 'Same sound', ages: [4, 7], art: () => iconImg('2600') + iconImg('1F9E6') },
  ] },
  { id: 'maths', name: 'Numbers', svg: '<svg viewBox="0 0 84 84"><rect x="4" y="12" width="76" height="60" rx="18" fill="#efe6ff"/><text x="42" y="56" text-anchor="middle" font-family="ui-rounded, Arial Rounded MT Bold, sans-serif" font-weight="800" font-size="30"><tspan fill="#ff4fa3">1</tspan><tspan fill="#8f5cff">+</tspan><tspan fill="#ff4fa3">2</tspan></text></svg>',
    types: [
    { id: 'count', name: 'Count', ages: [3, 6], art: () => iconImg('1F34E').repeat(3) },
    { id: 'plus', name: 'Plus', ages: [4, 7], art: () => iconImg('2B50') + '<b class="eg">+</b>' + iconImg('2B50') },
    { id: 'minus', name: 'Take away', ages: [4, 7], art: () => iconImg('1F9C1') + '<b class="eg">−</b>' + iconImg('1F9C1') },
    { id: 'nplus', name: 'Plus, just numbers', ages: [5, 8], art: () => '<b class="eg">1 + 2</b>' },
    { id: 'nminus', name: 'Take away, just numbers', ages: [5, 8], art: () => '<b class="eg">3 − 1</b>' },
  ] },
  { id: 'mx', name: 'Maths', svg: '<svg viewBox="0 0 84 84"><rect x="6" y="6" width="72" height="72" rx="16" fill="#e8f4ff"/><text x="42" y="36" text-anchor="middle" font-family="ui-rounded, Arial Rounded MT Bold, sans-serif" font-weight="800" font-size="22" fill="#8f5cff">3.5</text><text x="42" y="64" text-anchor="middle" font-family="ui-rounded, Arial Rounded MT Bold, sans-serif" font-weight="800" font-size="22" fill="#ff4fa3">× ½</text></svg>',
    types: [
    { id: 'dec-add', name: 'Adding decimals', ages: [9, 99], art: () => '<b class="eg">2.5 + 1.75</b>' },
    { id: 'dec-sub', name: 'Taking away decimals', ages: [9, 99], art: () => '<b class="eg">4.2 − 1.35</b>' },
    { id: 'mul', name: 'Long multiplication', ages: [8, 99], art: () => '<b class="eg">347 × 26</b>' },
    { id: 'div', name: 'Division with remainders', ages: [8, 99], art: () => '<b class="eg">347 ÷ 6</b>' },
    { id: 'missing', name: 'Missing number', ages: [7, 99], art: () => '<b class="eg">□ + 7 = 15</b>' },
    { id: 'frac-add', name: 'Adding fractions', ages: [9, 99], art: () => fr(1, 2) + '<b class="eg">+</b>' + fr(1, 3) },
    { id: 'frac-sub', name: 'Taking away fractions', ages: [9, 99], art: () => fr(3, 4) + '<b class="eg">−</b>' + fr(1, 6) },
    { id: 'frac-mul', name: 'Multiplying fractions', ages: [9, 99], art: () => fr(2, 3) + '<b class="eg">×</b>' + fr(3, 5) },
    { id: 'seq', name: 'Number sequences', ages: [7, 99], art: () => '<b class="eg">2, 5, 8, ?</b>' },
  ] },
  { id: 'pattern', name: 'What next?', svg: '<svg viewBox="0 0 84 84"><circle cx="14" cy="42" r="10" fill="#ff6fb8"/><rect x="28" y="32" width="20" height="20" rx="4" fill="#9b6bff"/><circle cx="62" cy="42" r="10" fill="#ff6fb8"/><rect x="58" y="58" width="22" height="22" rx="7" fill="none" stroke="#9b6bff" stroke-width="3" stroke-dasharray="5 4"/><text x="69" y="75" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="16" fill="#9b6bff">?</text></svg>',
    ages: [3, 9] },
  { id: 'music', name: 'Music', icon: '1F3B9',
    types: [
    { id: 'copy', name: 'Copy the tune', ages: [3, 99], art: () => iconImg('1F438') + iconImg('1F426') },
    { id: 'pitch', name: 'Up or down', ages: [3, 99], art: () => iconImg('1F43B') + '<b class="eg">↑</b>' + iconImg('1F426') },
    { id: 'same', name: 'Same or different', ages: [3, 99], art: () => '<b class="eg">= ≠</b>' },
    { id: 'mood', name: 'Happy or sad', ages: [3, 9], art: () => iconImg('2600') + iconImg('1F327') },
    { id: 'sing', name: 'Sing it', ages: [3, 99], art: () => `<img alt="" src="${petUrl({ eyes: 'happy', mouth: 'open' })}">` },
  ] },
  { id: 'tiles', name: 'Song tiles', svg: '<svg viewBox="0 0 84 84"><rect x="6" y="6" width="72" height="72" rx="14" fill="#efe6ff"/><path d="M24 6v72M42 6v72M60 6v72" stroke="#d9c6ff" stroke-width="2"/><rect x="8" y="14" width="14" height="22" rx="4" fill="#ff4fa3"/><rect x="44" y="30" width="14" height="22" rx="4" fill="#8f5cff"/><rect x="26" y="50" width="14" height="22" rx="4" fill="#ff8cc6"/><rect x="62" y="8" width="14" height="16" rx="4" fill="#b99bff"/></svg>',
    ages: [4, 99] },
  { id: 'play', name: 'Xylophone', svg: '<svg viewBox="0 0 84 84"><g stroke="#4a3159" stroke-width="2.5"><rect x="6" y="14" width="10" height="60" rx="4" fill="#ff6b6b"/><rect x="18" y="18" width="10" height="52" rx="4" fill="#ff9f3a"/><rect x="30" y="22" width="10" height="44" rx="4" fill="#ffd23f"/><rect x="42" y="26" width="10" height="36" rx="4" fill="#5fd38b"/><rect x="54" y="30" width="10" height="28" rx="4" fill="#4cb5ff"/><rect x="66" y="34" width="10" height="20" rx="4" fill="#9b6bff"/></g><path d="M58 70l18-16" stroke="#8d5524" stroke-width="4" stroke-linecap="round"/><circle cx="76" cy="54" r="5" fill="#ff4fa3"/></svg>',
    ages: [3, 99] },
  { id: 'maze', name: 'Maze', svg: '<svg viewBox="0 0 84 84"><rect x="6" y="6" width="72" height="72" rx="14" fill="#fff4fb"/><path d="M8 8h68v68H8zM26 8v40M26 62v14M44 26v50M44 26h16M62 8v12M62 44v18M44 44h18" fill="none" stroke="#8f5cff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="17" cy="17" r="6" fill="#ff4fa3"/><path d="M68 64l2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3 4-1z" fill="#ffc93a"/></svg>',
    ages: [3, 9] },
  { id: 'chess', name: 'Chess', svg: '<svg viewBox="0 0 84 84"><rect x="6" y="6" width="72" height="72" rx="14" fill="#ffe3f1"/><path d="M6 24h18V6M42 6v18h18v18h18M6 60h18V42h18v18h18v18M24 78V60M60 24h18" fill="none"/><rect x="24" y="6" width="18" height="18" fill="#ffc6e2"/><rect x="60" y="6" width="18" height="18" rx="0" fill="#ffc6e2"/><rect x="6" y="24" width="18" height="18" fill="#ffc6e2"/><rect x="42" y="24" width="18" height="18" fill="#ffc6e2"/><rect x="24" y="42" width="18" height="18" fill="#ffc6e2"/><rect x="60" y="42" width="18" height="18" fill="#ffc6e2"/><rect x="6" y="60" width="18" height="18" fill="#ffc6e2"/><rect x="42" y="60" width="18" height="18" fill="#ffc6e2"/><path d="M42 20a8 8 0 0 1 5 14l4 14h5v8H28v-8h5l4-14a8 8 0 0 1 5-14z" fill="#fff" stroke="#4a3159" stroke-width="3" stroke-linejoin="round"/></svg>',
    types: [
    { id: 'game', name: 'Play a game', ages: [7, 99], art: () => pieceSvg('king', 'w') + pieceSvg('queen', 'b') },
    { id: 'pawns', name: 'Pawn game', ages: [4, 9], art: () => pieceSvg('pawn', 'w') + pieceSvg('pawn', 'b') },
    { id: 'rook', name: 'Rook', ages: [4, 9], art: () => pieceSvg('rook', 'w') },
    { id: 'bishop', name: 'Bishop', ages: [4, 9], art: () => pieceSvg('bishop', 'w') },
    { id: 'queen', name: 'Queen', ages: [4, 9], art: () => pieceSvg('queen', 'w') },
    { id: 'king', name: 'King', ages: [4, 9], art: () => pieceSvg('king', 'w') },
    { id: 'knight', name: 'Knight', ages: [4, 9], art: () => pieceSvg('knight', 'w') },
  ] },
  { id: 'shelter', name: 'Shelter', icons: ['1F415', '1F49D'],
    ages: [3, 99] },
];

// a tile's kinds; a tile with just one kind has one, with no id
const kindsOf = g => g.types || [{ id: '', name: g.name, ages: g.ages }];
const gameById = id => GAMES.find(g => g.id === id);

function birthday() { const b = store.get('birthday'); return b && /^\d{4}-\d{2}-\d{2}$/.test(b) ? b : null; }
function ageNow() {
  const b = birthday(); if (!b) return null;
  const [y, m, d] = b.split('-').map(Number), now = new Date();
  let a = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) a--;
  return Math.max(0, a);
}
const kindKey = (g, k) => k.id ? `${g.id}/${k.id}` : g.id;
const chosenKinds = () => store.get('kinds') || {};          // { 'maths/plus': true, 'maze': false } — a grown-up's choices only
function suggested(k) {
  const a = ageNow(), [lo, hi] = k.ages;
  return a === null ? lo < 7 : a >= lo && a <= hi;
}
function kindOn(g, k) {
  const c = chosenKinds()[kindKey(g, k)];
  return typeof c === 'boolean' ? c : suggested(k);
}
function setKind(g, k, on) {
  const c = chosenKinds(), key = kindKey(g, k);
  if (on === suggested(k)) delete c[key]; else c[key] = on;   // back in line with the suggestion: forget it, so it follows her age again
  store.set('kinds', c);
}
const kindsOn = g => kindsOf(g).filter(k => kindOn(g, k));
const gamesOn = () => GAMES.filter(g => kindsOn(g).length);

// tapping a tile: straight in if only one kind is on, otherwise the chooser
function openGame(id) {
  const g = gameById(id); if (!g) return go(id);
  const on = kindsOn(g);
  if (!g.types) return go(g.id);
  if (on.length === 1) return go(`${g.id}/${on[0].id}`);
  go(`pick/${g.id}`);
}

/* ---------- the chooser: which kind of this game? ---------- */
enter.pick = id => {
  const g = gameById(id);
  if (!g || !g.types || kindsOn(g).length < 2) { location.replace('#'); return; }
  el('pickTitle').textContent = el('pickTitle').dataset.say = g.name;
  el('pickGrid').innerHTML = kindsOn(g).map(k =>
    `<button class="tile kind" data-k="${k.id}" data-say="${k.name}"><span class="ic">${k.art ? k.art() : ''}</span><span class="t">${k.name}</span></button>`).join('');
  setTimeout(() => { if (screen === 'pick') say(`${g.name}. Which one?`); }, 250);
};
el('pickGrid').onclick = e => {
  const b = e.target.closest('[data-k]'); if (!b) return;
  const id = location.hash.slice(1).split('/')[1];
  go(`${id}/${b.dataset.k}`);
};

/* In a game with a chooser, the button in the corner goes back to the
   chooser instead of all the way home (an installed app on an iPhone has no
   Back button). And an address without a kind, or with one that's switched
   off, is sent to the right place. Returns false if it sent her elsewhere. */
const HOME_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11 12 4l9 7"/><path d="M5.5 9.5V20h13V9.5"/></svg>';
const BACK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>';
function gameRoute(name, arg) {
  const g = gameById(name);
  if (!g || !g.types) return true;
  const on = kindsOn(g);
  if (!on.some(k => k.id === arg)) {
    if (!on.length) location.replace('#');
    else if (on.length === 1) location.replace(`#${g.id}/${on[0].id}`);
    else location.replace(`#pick/${g.id}`);
    return false;
  }
  const back = on.length > 1;
  for (const b of $$('[data-home]', el(SCREENS[name]))) {
    b.innerHTML = back ? BACK_SVG : HOME_SVG;
    b.dataset.say = back ? 'Back' : 'Home';
    b.setAttribute('aria-label', back ? 'Back' : 'Home');
    b.onclick = () => go(back ? `pick/${g.id}` : '');
  }
  return true;
}
