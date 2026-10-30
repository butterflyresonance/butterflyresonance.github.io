/* ---------- numbers: count, add, take away, with cute things ---------- */
const THINGS = [['1F34E', 'apple', 'apples'], ['1F353', 'strawberry', 'strawberries'], ['2B50', 'star', 'stars'], ['1F986', 'duck', 'ducks'],
  ['1F98B', 'butterfly', 'butterflies'], ['1F9C1', 'cupcake', 'cupcakes'], ['1F388', 'balloon', 'balloons'], ['1F33C', 'flower', 'flowers'],
  ['1F41F', 'fish', 'fish'], ['1F41E', 'ladybird', 'ladybirds'], ['1F430', 'bunny', 'bunnies'], ['1F36A', 'cookie', 'cookies']];
const NUM_MODES = [['count', 'Count'], ['plus', 'Plus'], ['minus', 'Take away'], ['nplus', '1 + 2'], ['nminus', '3 − 1']];
const numOnly = () => numMode === 'nplus' || numMode === 'nminus';
let numMode = store.get('numMode') || 'count', numMax = store.get('numMax') || 5;
let numQ = null, numBusy = false, numRound = 0;
const thing = (t, n) => n === 1 ? t[1] : t[2];
function group(t, n, gone = 0) {
  // in rows of up to 5, so they're easy to count
  let h = '';
  for (let i = 0; i < n; i++) h += `<span class="thing${i >= n - gone ? ' gone' : ''}">${iconImg(t[0])}</span>`;
  return `<div class="grp">${h}</div>`;
}
function numNew() {
  numBusy = false;
  const round = ++numRound, t = pick(THINGS), max = numOnly() ? numMax : Math.min(numMax, 10);   // pictures stop at 10; just numbers go to 20
  let a, b = 0, ans, view, speech, right;
  if (numMode === 'count') {
    ans = a = 1 + Math.floor(Math.random() * max);
    view = group(t, a);
    speech = `How many ${t[2]}?`;
    right = `Yes! ${a} ${thing(t, a)}!`;
  } else if (numOnly()) {
    // just the numbers; a wrong answer brings the pictures in to help
    if (numMode === 'nplus') { a = 1 + Math.floor(Math.random() * (max - 1)); b = 1 + Math.floor(Math.random() * (max - a)); ans = a + b; }
    else { a = 2 + Math.floor(Math.random() * (max - 1)); b = 1 + Math.floor(Math.random() * (a - 1)); ans = a - b; }
    const op = numMode === 'nplus' ? 'plus' : 'take away';
    view = `<div class="bigsum">${a} ${numMode === 'nplus' ? '+' : '−'} ${b}</div>`;
    speech = `What is ${a} ${op} ${b}?`;
    right = `Yes! ${a} ${op} ${b} is ${ans}!`;
  } else if (numMode === 'plus') {
    a = 1 + Math.floor(Math.random() * (max - 1)); b = 1 + Math.floor(Math.random() * (max - a)); ans = a + b;
    view = `${group(t, a)}<span class="op">+</span>${group(t, b)}`;
    speech = `${a} ${thing(t, a)}, and ${b} more. How many ${t[2]} altogether?`;
    right = `Yes! ${a} plus ${b} is ${ans}!`;
  } else {
    a = 2 + Math.floor(Math.random() * (max - 1)); b = 1 + Math.floor(Math.random() * (a - 1)); ans = a - b;
    view = `${group(t, a, b)}`;
    speech = `${a} ${thing(t, a)}. Take away ${b}. How many are left?`;
    right = `Yes! ${a} take away ${b} is ${ans}!`;
  }
  // the answer and two near it, all from 0 to 10
  const near = shuffle([ans - 2, ans - 1, ans + 1, ans + 2].filter(n => n >= (numMode === 'count' ? 1 : 0) && n <= Math.max(max, 10) && n !== ans)).slice(0, 2);
  numQ = { ans, speech, right, t, a, b, help: false };
  // bigger pictures when there are fewer of them
  const total = numMode === 'plus' ? a + b : numOnly() ? 1 : a;
  el('numView').style.setProperty('--thing', total <= 3 ? 'min(22vw, 96px)' : total <= 5 ? 'min(15vw, 72px)' : total <= 8 ? 'min(12vw, 60px)' : 'min(10.5vw, 52px)');
  el('numView').innerHTML = view;
  el('numSum').textContent = numMode === 'plus' ? `${a} + ${b} = ?` : numMode === 'minus' ? `${a} − ${b} = ?` : '';
  el('numView').classList.toggle('only', numOnly());
  el('numOpts').innerHTML = shuffle([ans, ...near]).map(n => `<button class="opt" data-n="${n}">${n}</button>`).join('');
  setTimeout(() => { if (round === numRound && screen === 'maths') say(speech); }, 250);
}
function numChips() {
  // which kind is chosen before she gets here (#maths/plus); only the size of the numbers is changed in here
  el('numModes').innerHTML = `<button class="chip on" data-m="max" data-say="Up to ${numOnly() ? numMax : Math.min(numMax, 10)}">Up to ${numOnly() ? numMax : Math.min(numMax, 10)}</button>`;
}
enter.maths = kind => { if (NUM_MODES.some(m => m[0] === kind)) { numMode = kind; store.set('numMode', numMode); } numChips(); numNew(); };
leave.maths = () => { numRound++; };
el('numModes').onclick = e => {
  const c = e.target.closest('[data-m]'); if (!c) return;
  if (c.dataset.m === 'max') { numMax = numOnly() ? (numMax === 5 ? 10 : numMax === 10 ? 20 : 5) : (Math.min(numMax, 10) === 5 ? 10 : 5); store.set('numMax', numMax); }
  else { numMode = c.dataset.m; store.set('numMode', numMode); }
  numChips(); numNew();
};
el('numSay').onclick = () => numQ && say(numQ.speech);
el('numView').onclick = e => { const s = e.target.closest('.thing'); if (s) { sfx.pop(); s.classList.remove('boop'); void s.offsetWidth; s.classList.add('boop'); } };
el('numOpts').onclick = async e => {
  const b = e.target.closest('.opt'); if (!b || numBusy || !numQ) return;
  const n = +b.dataset.n, round = numRound;
  if (n === numQ.ans) {
    numBusy = true;
    b.classList.add('right'); sfx.yay(); addCoins(numQ.missed ? 2 : 4, b); petFun(3); buddy('cheer');
    await say(numQ.right);
    await wait(500);
    if (round === numRound && screen === 'maths') numNew();
  } else {
    numQ.missed = true;
    b.classList.remove('wrong'); void b.offsetWidth; b.classList.add('wrong'); sfx.oops(); buddy('think');
    if (numOnly() && !numQ.help) {
      // show it with pictures, under the sum
      numQ.help = true;
      const { t, a, b } = numQ;
      el('numView').insertAdjacentHTML('beforeend', `<div class="helpgrp">${numMode === 'nplus' ? `${group(t, a)}<span class="op">+</span>${group(t, b)}` : group(t, a, b)}</div>`);
      el('numView').style.setProperty('--thing', (numMode === 'nplus' ? a + b : a) <= 10 ? 'min(9vw, 44px)' : 'min(6.5vw, 32px)');
    }
    say(`That's ${n}. Let's count them.`);
  }
};
