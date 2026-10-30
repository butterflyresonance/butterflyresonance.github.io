/* ---------- tic-tac-toe, against a computer that often gets it wrong ---------- */
const LINES3 = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
const MARK = {
  X: '<svg viewBox="0 0 100 100"><path d="M22 22 78 78M78 22 22 78" stroke="#ff4fa3" stroke-width="16" stroke-linecap="round"/></svg>',
  O: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="30" fill="none" stroke="#8f5cff" stroke-width="15"/></svg>',
};
let ttt = null, tttFirst = 'X';
const winner = b => { for (const l of LINES3) if (b[l[0]] && b[l[0]] === b[l[1]] && b[l[0]] === b[l[2]]) return l; return null; };
function tttStart() {
  ttt = { b: Array(9).fill(''), over: false, busy: false };
  el('tttBoard').innerHTML = ttt.b.map((_, i) => `<button class="cell" data-i="${i}" aria-label="square ${i + 1}"></button>`).join('');
  el('tttAgain').classList.add('hidden');
  if (tttFirst === 'O') { el('tttMsg').textContent = 'My turn first!'; say('My turn first!'); ttt.busy = true; setTimeout(aiMove, 900); }
  else { el('tttMsg').textContent = 'You are X. Your turn!'; say('You are X. Your turn!'); }
  tttFirst = tttFirst === 'X' ? 'O' : 'X';      // take turns going first
}
function put(i, m) {
  ttt.b[i] = m;
  const c = el('tttBoard').children[i];
  c.innerHTML = MARK[m]; c.classList.add('pop'); sfx.pop();
}
// about half the time it plays well (win, block, centre, corner); otherwise anywhere
function aiChoice() {
  const b = ttt.b, free = b.map((v, i) => v ? -1 : i).filter(i => i >= 0);
  if (Math.random() < .45) {
    for (const m of ['O', 'X']) for (const l of LINES3) {
      const v = l.map(i => b[i]);
      if (v.filter(x => x === m).length === 2 && v.includes('')) return l[v.indexOf('')];
    }
    if (!b[4]) return 4;
    const corners = [0, 2, 6, 8].filter(i => !b[i]);
    if (corners.length) return pick(corners);
  }
  return pick(free);
}
function tttEnd() {
  const w = winner(ttt.b);
  if (w) {
    ttt.over = true;
    w.forEach(i => el('tttBoard').children[i].classList.add('win'));
    if (ttt.b[w[0]] === 'X') { buddy('party'); sfx.yay(); addCoins(3, el('tttMsg')); petFun(15); el('tttMsg').textContent = 'You win!'; say('You win! Hooray!'); }
    else { buddy('think'); sfx.oops(); petFun(10); el('tttMsg').textContent = 'I win this time!'; say('I win this time! Try again?'); }
  } else if (ttt.b.every(Boolean)) {
    ttt.over = true; addCoins(1, el('tttMsg')); petFun(10); buddy('cheer');
    el('tttMsg').textContent = 'A draw!'; say('It’s a draw!');
  }
  if (ttt.over) el('tttAgain').classList.remove('hidden');
  return ttt.over;
}
function aiMove() {
  if (!ttt || ttt.over) return;
  put(aiChoice(), 'O');
  ttt.busy = false;
  if (!tttEnd()) { el('tttMsg').textContent = 'Your turn!'; }
}
enter.ttt = () => tttStart();
el('tttAgain').onclick = tttStart;
el('tttBoard').onclick = e => {
  const c = e.target.closest('.cell'); if (!c || !ttt || ttt.over || ttt.busy) return;
  const i = +c.dataset.i; if (ttt.b[i]) return;
  put(i, 'X');
  if (tttEnd()) return;
  ttt.busy = true; el('tttMsg').textContent = 'My turn…';
  setTimeout(aiMove, 700 + Math.random() * 500);
};
