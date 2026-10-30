/* ---------- letters ----------
   Four activities. Every spoken line finishes before the next thing starts
   (say() is waited for), and a round left half-way is abandoned (round token).
   - Find the letter: hear a letter's name, pick it.
   - First letter: see and hear a word, pick the letter it starts with.
   - Rhymes: hear a word, pick the picture that rhymes with it.
   - Same sound: hear a word, pick the picture that starts with the same sound.
     Grouped by sound, not spelling: cat, kite and key all start the same. */
const WORDS = [['A', 'apple', '1F34E'], ['B', 'ball', '26BD'], ['B', 'bird', '1F426'], ['C', 'cat', '1F431'], ['D', 'dog', '1F436'], ['E', 'egg', '1F95A'],
  ['F', 'fish', '1F41F'], ['G', 'grapes', '1F347'], ['H', 'hat', '1F3A9'], ['I', 'ice cream', '1F368'], ['J', 'jellyfish', '1FABC'], ['K', 'kite', '1FA81'],
  ['L', 'lion', '1F981'], ['M', 'moon', '1F319'], ['N', 'nest', '1FAB9'], ['O', 'octopus', '1F419'], ['P', 'pig', '1F437'], ['Q', 'queen', '1F478'],
  ['R', 'rabbit', '1F430'], ['S', 'sun', '2600'], ['T', 'tiger', '1F42F'], ['U', 'umbrella', '2602'], ['V', 'violin', '1F3BB'], ['W', 'watermelon', '1F349'],
  ['Y', 'yo-yo', '1FA80'], ['Z', 'zebra', '1F993'], ['O', 'orange', '1F34A'], ['G', 'guitar', '1F3B8'], ['R', 'rainbow', '1F308'], ['S', 'star', '2B50']];
const RHYMES = [
  [['cat', '1F431'], ['hat', '1F3A9'], ['bat', '1F987']], [['bee', '1F41D'], ['tree', '1F333'], ['key', '1F511']],
  [['frog', '1F438'], ['dog', '1F436'], ['log', '1FAB5']], [['star', '2B50'], ['car', '1F697'], ['jar', '1FAD9']],
  [['moon', '1F319'], ['spoon', '1F944']], [['cake', '1F370'], ['snake', '1F40D']], [['bear', '1F43B'], ['pear', '1F350'], ['chair', '1FA91']],
  [['mouse', '1F42D'], ['house', '1F3E0']], [['goat', '1F410'], ['boat', '26F5'], ['coat', '1F9E5']], [['fox', '1F98A'], ['box', '1F4E6']],
  [['rose', '1F339'], ['nose', '1F443']], [['bell', '1F514'], ['shell', '1F41A']], [['duck', '1F986'], ['truck', '1F69A']],
  [['train', '1F686'], ['rain', '1F327']], [['clock', '1F570'], ['sock', '1F9E6']], [['ball', '26BD'], ['wall', '1F9F1']],
];
const SOUNDS = [
  [['ball', '26BD'], ['bee', '1F41D'], ['bear', '1F43B'], ['banana', '1F34C'], ['boat', '26F5'], ['bus', '1F68C'], ['bell', '1F514']],
  [['cat', '1F431'], ['cake', '1F370'], ['car', '1F697'], ['cow', '1F42E'], ['kite', '1FA81'], ['key', '1F511'], ['carrot', '1F955']],
  [['dog', '1F436'], ['duck', '1F986'], ['dolphin', '1F42C'], ['drum', '1F941']],
  [['fish', '1F41F'], ['frog', '1F438'], ['fox', '1F98A'], ['flower', '1F33C']],
  [['goat', '1F410'], ['grapes', '1F347'], ['guitar', '1F3B8']],
  [['hat', '1F3A9'], ['horse', '1F434'], ['house', '1F3E0'], ['heart', '2764']],
  [['moon', '1F319'], ['mouse', '1F42D'], ['monkey', '1F435'], ['mushroom', '1F344']],
  [['pig', '1F437'], ['pear', '1F350'], ['pizza', '1F355'], ['penguin', '1F427']],
  [['sun', '2600'], ['snake', '1F40D'], ['sock', '1F9E6'], ['seal', '1F9AD']],
  [['tiger', '1F42F'], ['tomato', '1F345'], ['turtle', '1F422'], ['tent', '26FA']],
  [['rabbit', '1F430'], ['rainbow', '1F308'], ['ring', '1F48D'], ['rose', '1F339']],
  [['lion', '1F981'], ['lemon', '1F34B'], ['leaf', '1F341'], ['ladybird', '1F41E']],
  [['whale', '1F433'], ['watermelon', '1F349'], ['worm', '1FAB1']],
  [['nose', '1F443'], ['nest', '1FAB9']],
];
const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const LET_MODES = [['name', 'Find the letter'], ['sound', 'First letter'], ['rhyme', 'Rhymes'], ['same', 'Same sound']];
let letMode = store.get('letMode') || 'name', lower = !!store.get('lower');
if (!LET_MODES.some(m => m[0] === letMode)) letMode = 'name';
let letQ = null, letBusy = false, letRound = 0;
const show = L => lower ? L.toLowerCase() : L;
const SPEAKER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9Z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>';
const listOf = names => names.length === 3 ? `${names[0]}, ${names[1]}, or ${names[2]}` : names.join(' or ');
function letNew() {
  letBusy = false;
  const round = ++letRound;
  let opts, prompt, speech;
  if (letMode === 'name' || letMode === 'sound') {
    let target;
    if (letMode === 'sound') {
      const w = pick(WORDS.filter(x => !letQ || x[1] !== letQ.word));
      target = w[0];
      prompt = `<button class="pic2" data-say="${w[1]}">${iconImg(w[2])}</button><button class="speak" id="letSay">${SPEAKER}Hear it</button>`;
      speech = `${w[1]}. What letter does ${w[1]} start with?`;
      letQ = { kind: 'letter', target, word: w[1], speech, right: `Yes! ${w[1]} starts with ${target}!` };
    } else {
      target = pick(ABC.filter(x => !letQ || x !== letQ.target));
      prompt = `<button class="speak" id="letSay">${SPEAKER}Find the letter</button>`;
      speech = `Find the letter ${target}.`;
      letQ = { kind: 'letter', target, speech, right: `Yes! That's ${target}!` };
    }
    opts = shuffle([target, ...shuffle(ABC.filter(x => x !== target)).slice(0, 2)]).map(L => `<button class="opt" data-l="${L}">${show(L)}</button>`).join('');
  } else {
    // pictures to choose from: one that rhymes (or starts the same), two that don't
    const groups = letMode === 'rhyme' ? RHYMES : SOUNDS;
    const g = pick(groups.filter(x => !letQ || !x.some(w => w[0] === letQ.word)));
    const [word, match] = shuffle(g).slice(0, 2);
    const others = shuffle(groups.filter(x => x !== g)).slice(0, 2).map(x => pick(x));
    // no picture may share the target's sound/rhyme by accident (cat in both b-less groups etc.)
    const choices = shuffle([match, ...others]);
    const ask = letMode === 'rhyme' ? `Which one rhymes with ${word[0]}?` : `Which one starts the same as ${word[0]}?`;
    prompt = `<button class="pic2" data-say="${word[0]}">${iconImg(word[1])}</button><button class="speak" id="letSay">${SPEAKER}Hear it</button>`;
    speech = `${word[0]}. ${ask} ${listOf(choices.map(c => c[0]))}?`;
    letQ = { kind: 'pic', target: match[0], word: word[0], speech, ask,
      right: letMode === 'rhyme' ? `Yes! ${word[0]} and ${match[0]} rhyme!` : `Yes! ${word[0]} and ${match[0]} start the same!` };
    opts = choices.map(c => `<button class="opt pic" data-l="${c[0]}" aria-label="${c[0]}">${iconImg(c[1])}</button>`).join('');
  }
  el('letPrompt').innerHTML = prompt;
  el('letOpts').innerHTML = opts;
  el('letSay').onclick = () => say(letQ.speech);
  setTimeout(() => { if (round === letRound && screen === 'letters') say(speech); }, 250);
}
function letChips() {
  // which kind is chosen before she gets here (#letters/rhyme); in here, only big or small letters
  el('letModes').innerHTML = (letMode === 'name' || letMode === 'sound' ? `<button class="chip${lower ? ' on' : ''}" data-m="case" data-say="${lower ? 'small letters' : 'big letters'}">${lower ? 'abc' : 'ABC'}</button>` : '');
}
enter.letters = kind => { if (LET_MODES.some(m => m[0] === kind)) { letMode = kind; store.set('letMode', letMode); } letChips(); letQ = null; letNew(); };
leave.letters = () => { letRound++; };
el('letModes').onclick = e => {
  const c = e.target.closest('[data-m]'); if (!c) return;
  if (c.dataset.m === 'case') { lower = !lower; store.set('lower', lower); }
  else { letMode = c.dataset.m; store.set('letMode', letMode); }
  letChips(); letQ = null; letNew();
};
el('letOpts').onclick = async e => {
  const b = e.target.closest('.opt'); if (!b || letBusy || !letQ) return;
  const pickd = b.dataset.l, round = letRound;
  if (pickd === letQ.target) {
    letBusy = true;
    b.classList.add('right'); sfx.yay(); addCoins(letQ.missed ? 2 : 4, b); petFun(3); buddy('cheer');
    await say(letQ.right);                       // the whole sentence, then a short pause, then the next one
    await wait(500);
    if (round === letRound && screen === 'letters') letNew();
  } else {
    letQ.missed = true;
    b.classList.remove('wrong'); void b.offsetWidth; b.classList.add('wrong'); sfx.oops(); buddy('think');
    say(letQ.kind === 'letter'
      ? `That's ${pickd}. ${letQ.word ? `Which letter does ${letQ.word} start with?` : `Find ${letQ.target}.`}`
      : `That's ${pickd}. ${letQ.ask}`);
  }
};
