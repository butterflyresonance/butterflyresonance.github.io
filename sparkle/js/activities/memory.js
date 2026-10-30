/* ---------- memory ---------- */
const MEM_FACES = [['1F436', 'puppy'], ['1F431', 'kitty'], ['1F430', 'bunny'], ['1F98A', 'fox'], ['1F43B', 'bear'], ['1F43C', 'panda'], ['1F428', 'koala'],
  ['1F42F', 'tiger'], ['1F981', 'lion'], ['1F984', 'unicorn'], ['1F437', 'pig'], ['1F438', 'frog'], ['1F435', 'monkey'], ['1F414', 'chicken'],
  ['1F427', 'penguin'], ['1F419', 'octopus'], ['1F98B', 'butterfly'], ['1F41D', 'bee'], ['1F422', 'tortoise'], ['1F42C', 'dolphin']];
const MEM_SIZES = [{ n: 3, cols: 3, name: 'Easy' }, { n: 6, cols: 4, name: 'Medium' }, { n: 8, cols: 4, name: 'Hard' }, { n: 10, cols: 5, name: 'Super' }];
let memSize = store.get('memSize') ?? 1;
let mem = null;
function memStart() {
  const S = MEM_SIZES[memSize];
  const faces = shuffle(MEM_FACES).slice(0, S.n);
  mem = { cards: shuffle([...faces, ...faces]), up: [], got: 0, lock: false, tries: 0 };
  el('memSizes').innerHTML = MEM_SIZES.map((s, i) => `<button class="chip${i === memSize ? ' on' : ''}" data-i="${i}" data-say="${s.name}">${s.name}</button>`).join('');
  const b = el('memBoard');
  b.style.gridTemplateColumns = `repeat(${S.cols}, 1fr)`;
  b.style.maxWidth = `min(100%, ${S.cols * 120}px, calc((100vh - 230px) / ${Math.ceil(S.n * 2 / S.cols)} * ${S.cols}))`;
  b.innerHTML = mem.cards.map(([h, w], i) => `<button class="card" data-i="${i}" aria-label="card"><div class="in"><div class="b"></div><div class="f">${iconImg(h)}</div></div></button>`).join('');
  el('memMsg').textContent = ''; el('memAgain').classList.add('hidden');
}
enter.memory = () => { memStart(); setTimeout(() => say('Find the pairs!'), 300); };
el('memSizes').onclick = e => { const c = e.target.closest('[data-i]'); if (!c) return; memSize = +c.dataset.i; store.set('memSize', memSize); memStart(); };
el('memAgain').onclick = memStart;
el('memBoard').onclick = async e => {
  const c = e.target.closest('.card'); if (!c || !mem || mem.lock) return;
  const i = +c.dataset.i;
  if (c.classList.contains('up')) return;
  c.classList.add('up'); sfx.flip();
  say(mem.cards[i][1]);
  mem.up.push(i);
  if (mem.up.length < 2) return;
  const [a, b] = mem.up; mem.up = []; mem.tries++;
  const ca = el('memBoard').children[a], cb = el('memBoard').children[b];
  if (mem.cards[a][0] === mem.cards[b][0]) {
    await wait(350);
    ca.classList.add('got'); cb.classList.add('got');
    mem.got++; addCoins(1, cb); petFun(3); buddy('cheer');
    if (mem.got === mem.cards.length / 2) {
      await wait(400);
      sfx.yay(); addCoins(3, el('memMsg')); petFun(10); buddy('party');
      el('memMsg').textContent = 'You found them all!'; say('You found them all! Well done!');
      el('memAgain').classList.remove('hidden');
    }
  } else {
    mem.lock = true; buddy('think');
    await wait(1000);
    ca.classList.remove('up'); cb.classList.remove('up');
    mem.lock = false;
  }
};
