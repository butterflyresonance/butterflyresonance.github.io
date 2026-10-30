/* ---------- first steps to chess: the pawn game, and one-piece star puzzles ---------- */
const PIECE_SVG = {
  pawn: '<circle cx="50" cy="30" r="13"/><path d="M34 82 C34 64 43 56 44 46 h12 c1 10 10 18 10 36 z"/><ellipse cx="50" cy="46" rx="14" ry="5"/>',
  rook: '<path d="M30 82 L34 46 H66 L70 82 Z"/><path d="M28 46 V22 h10 v8 h7 v-8 h10 v8 h7 v-8 h10 v24 Z"/>',
  bishop: '<path d="M36 82 C36 66 44 60 45 56 h10 c1 4 9 10 9 26 z"/><path d="M50 20 C65 31 67 45 57 56 H43 C33 45 35 31 50 20 Z"/><path d="M54 30 L46 42" fill="none"/><circle cx="50" cy="15" r="5"/>',
  queen: '<path d="M32 82 L39 50 H61 L68 82 Z"/><path d="M28 26 L37 50 H63 L72 26 L59 38 L50 20 L41 38 Z"/><circle cx="28" cy="24" r="5"/><circle cx="50" cy="16" r="5"/><circle cx="72" cy="24" r="5"/>',
  king: '<path d="M34 82 L40 50 H60 L66 82 Z"/><path d="M36 50 C29 36 42 26 50 35 C58 26 71 36 64 50 Z"/><path d="M50 6 v22 M42 14 h16" fill="none" stroke-width="6"/>',
  knight: '<path d="M30 82 C30 66 40 59 46 53 C40 52 30 57 24 51 C19 45 27 37 33 33 C37 22 48 14 58 16 C73 20 77 42 70 82 Z"/><circle cx="46" cy="30" r="3" fill="#4a3159" stroke="none"/><path d="M58 18 C62 30 64 44 62 56" fill="none"/>',
};
const pieceSvg = (k, col) => `<svg viewBox="0 0 100 100"><g fill="${col === 'w' ? '#fff' : '#b48cff'}" stroke="#4a3159" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"><rect x="24" y="80" width="52" height="9" rx="4"/>${PIECE_SVG[k]}</g></svg>`;
const CHESS_MODES = [['game', 'Play a game'], ['pawns', 'Pawn game'], ['rook', 'Rook'], ['bishop', 'Bishop'], ['queen', 'Queen'], ['king', 'King'], ['knight', 'Knight']];
const PIECE_TELL = {
  rook: 'The rook goes in straight lines. Up, down, and side to side, as far as it likes.',
  bishop: 'The bishop goes on the slants, corner to corner, as far as it likes.',
  queen: 'The queen can go straight, or on the slants, as far as she likes!',
  king: 'The king takes one step at a time, any way he likes.',
  knight: 'The knight jumps in an L. Two squares one way, then one to the side. It can jump over things!',
};
let chMode = store.get('chessMode') || 'pawns';
let ch = null;
const N6 = 6, onB = (r, c) => r >= 0 && c >= 0 && r < N6 && c < N6;

function chessChips() {
  el('chessModes').innerHTML = '';   // the piece is chosen before she gets here (#chess/rook)
}
function drawBoard(cellFn) {
  let h = '';
  for (let r = 0; r < N6; r++) for (let c = 0; c < N6; c++) {
    const x = cellFn(r, c);
    h += `<button class="sq ${(r + c) % 2 ? 'd' : 'l'}${x.cls ? ' ' + x.cls : ''}" data-r="${r}" data-c="${c}">${x.html || ''}${x.dot ? `<i class="dot${x.dot === 'take' ? ' take' : ''}"></i>` : ''}</button>`;
  }
  el('cboard').innerHTML = h;
}
const chMsg = (m, speak = true) => { el('chessMsg').textContent = m; if (speak) return say(m); };
enter.chess = kind => { if (CHESS_MODES.some(m => m[0] === kind)) { chMode = kind; store.set('chessMode', chMode); } chessChips(); chessStart(true); };
leave.chess = () => { if (ch) ch.gone = true; };
el('chessModes').onclick = e => { const c = e.target.closest('[data-m]'); if (!c) return; chMode = c.dataset.m; store.set('chessMode', chMode); chessChips(); chessStart(true); };
el('chessAgain').onclick = () => chessStart(false);
function chessStart(intro) {
  if (ch) ch.gone = true;
  // the whole game (chess-game.js) has its own 8×8 board and buttons
  const game = chMode === 'game';
  el('cboard').classList.toggle('eight', game);
  el('chessUndo').classList.toggle('hidden', !game);
  el('chessPromo').classList.add('hidden');
  el('chessAgain').textContent = el('chessAgain').dataset.say = game ? 'New game' : 'Start again';
  if (game) { gameStart(intro); return; }
  if (chMode === 'pawns') pawnStart(intro); else puzzleStart(intro);
}

/* the pawn game: pawns only, on a small board. First to the far side wins */
function pawnStart(intro) {
  const b = Array.from({ length: N6 }, () => Array(N6).fill(null));
  for (let c = 0; c < N6; c++) { b[1][c] = 'b'; b[N6 - 2][c] = 'w'; }
  ch = { mode: 'pawns', b, sel: null, turn: 'w', over: false, last: null };
  pawnDraw();
  if (intro) chMsg('Pawns walk forward, one square. On their first go, they can walk two. They take by stepping on the slant. Get a pawn to the other side to win!');
  else chMsg('Your turn!');
}
function pawnMoves(b, col) {
  const out = [], dir = col === 'w' ? -1 : 1, home = col === 'w' ? N6 - 2 : 1, them = col === 'w' ? 'b' : 'w';
  for (let r = 0; r < N6; r++) for (let c = 0; c < N6; c++) {
    if (b[r][c] !== col) continue;
    if (onB(r + dir, c) && !b[r + dir][c]) {
      out.push({ f: [r, c], t: [r + dir, c] });
      if (r === home && !b[r + 2 * dir][c]) out.push({ f: [r, c], t: [r + 2 * dir, c] });
    }
    for (const dc of [-1, 1]) if (onB(r + dir, c + dc) && b[r + dir][c + dc] === them) out.push({ f: [r, c], t: [r + dir, c + dc], take: true });
  }
  return out;
}
function pawnDraw() {
  const opts = ch.sel ? pawnMoves(ch.b, 'w').filter(m => m.f[0] === ch.sel[0] && m.f[1] === ch.sel[1]) : [];
  drawBoard((r, c) => {
    const p = ch.b[r][c], o = opts.find(m => m.t[0] === r && m.t[1] === c);
    const sel = ch.sel && ch.sel[0] === r && ch.sel[1] === c, last = ch.last && ch.last[0] === r && ch.last[1] === c;
    return { html: p ? pieceSvg('pawn', p) : '', dot: o ? (o.take ? 'take' : 'go') : '', cls: (sel ? 'sel' : '') + (last ? ' last' : '') };
  });
}
function pawnApply(m) {
  const col = ch.b[m.f[0]][m.f[1]];
  ch.b[m.t[0]][m.t[1]] = col; ch.b[m.f[0]][m.f[1]] = null; ch.last = m.t;
  m.take ? sfx.munch() : sfx.pop();
}
function pawnWinner(justMoved) {
  const other = justMoved === 'w' ? 'b' : 'w';
  if (ch.b[justMoved === 'w' ? 0 : N6 - 1].includes(justMoved)) return [justMoved, 'reached the other side'];
  if (!ch.b.flat().includes(other)) return [justMoved, 'took every pawn'];
  if (!pawnMoves(ch.b, other).length) return [justMoved, other === 'w' ? 'You can’t move' : 'I can’t move'];
  return null;
}
async function pawnEnd(w) {
  ch.over = true; pawnDraw();
  if (w[0] === 'w') { sfx.yay(); buddy('party'); petFun(15); addCoins(8, el('chessMsg')); await chMsg(w[1] === 'You can’t move' ? 'You win!' : `You ${w[1]}! You win!`); }
  else { sfx.oops(); buddy('think'); petFun(8); await chMsg(w[1] === 'You can’t move' ? 'You can’t move, so I win this time!' : `I ${w[1]}. I win this time! Try again?`); }
}
// a friendly opponent: likes to win and to take, sometimes careful, often not
function pawnAI() {
  const ms = pawnMoves(ch.b, 'b');
  if (Math.random() < .3) return pick(ms);
  const attacked = (r, c) => [-1, 1].some(dc => onB(r + 1, c + dc) && ch.b[r + 1][c + dc] === 'w');
  let best = null, bs = -1e9;
  for (const m of ms) {
    let s = Math.random() * 12;
    if (m.t[0] === N6 - 1) s += 100;
    if (m.take) s += 10;
    if (attacked(m.t[0], m.t[1])) s -= 8;
    if (s > bs) { bs = s; best = m; }
  }
  return best;
}
async function pawnTap(r, c) {
  if (ch.over || ch.turn !== 'w') return;
  if (ch.b[r][c] === 'w') { ch.sel = [r, c]; sfx.flip(); pawnDraw(); return; }
  if (!ch.sel) return;
  const m = pawnMoves(ch.b, 'w').find(m => m.f[0] === ch.sel[0] && m.f[1] === ch.sel[1] && m.t[0] === r && m.t[1] === c);
  if (!m) { ch.sel = null; pawnDraw(); return; }
  ch.sel = null; pawnApply(m); pawnDraw();
  let w = pawnWinner('w'); if (w) return pawnEnd(w);
  ch.turn = 'b'; chMsg('My turn…', false);
  const me = ch; await wait(700 + Math.random() * 500); if (me.gone) return;
  pawnApply(pawnAI()); pawnDraw();
  w = pawnWinner('b'); if (w) return pawnEnd(w);
  ch.turn = 'w'; chMsg('Your turn!', false);
}

/* piece puzzles: one piece, some stars; land on every star. A star is in the way, like a piece would be */
function pieceMoves(kind, [r, c], stars) {
  const out = [], has = (a, b) => stars.some(s => s[0] === a && s[1] === b);
  const slide = dirs => { for (const [dr, dc] of dirs) for (let k = 1; onB(r + dr * k, c + dc * k); k++) { out.push([r + dr * k, c + dc * k]); if (has(r + dr * k, c + dc * k)) break; } };
  const step = ds => { for (const [dr, dc] of ds) if (onB(r + dr, c + dc)) out.push([r + dr, c + dc]); };
  const ORTH = [[1, 0], [-1, 0], [0, 1], [0, -1]], DIAG = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  if (kind === 'rook') slide(ORTH);
  if (kind === 'bishop') slide(DIAG);
  if (kind === 'queen') slide([...ORTH, ...DIAG]);
  if (kind === 'king') step([...ORTH, ...DIAG]);
  if (kind === 'knight') step([[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]]);
  return out;
}
// made by walking the piece about and dropping a star wherever it lands, then checking it still works with all the stars out
function makePuzzle(kind, n) {
  for (let tries = 0; tries < 400; tries++) {
    const start = [Math.floor(Math.random() * N6), Math.floor(Math.random() * N6)];
    const path = [];
    let cur = start;
    for (let k = 0; k < n; k++) {
      const opts = pieceMoves(kind, cur, []).filter(([a, b]) => !(a === start[0] && b === start[1]) && !path.some(p => p[0] === a && p[1] === b));
      if (!opts.length) break;
      cur = pick(opts); path.push(cur);
    }
    if (path.length < n) continue;
    // replay with every star on the board
    let ok = true, at = start, left = path.slice();
    for (const t of path) {
      if (!pieceMoves(kind, at, left).some(m => m[0] === t[0] && m[1] === t[1])) { ok = false; break; }
      left = left.filter(s => s !== t); at = t;
    }
    if (ok) return { start, stars: path };
  }
  return null;
}
function puzzleStart(intro) {
  const kind = chMode, n = store.get('pz:' + kind) || 3;
  const pz = makePuzzle(kind, n) || makePuzzle(kind, 3);
  ch = { mode: 'puzzle', kind, at: pz.start, stars: pz.stars.slice(), n: pz.stars.length, moves: 0, over: false };
  puzzleDraw();
  chMsg(intro ? `${PIECE_TELL[kind]} Collect all the stars!` : 'Collect all the stars!');
}
function puzzleDraw() {
  const opts = ch.over ? [] : pieceMoves(ch.kind, ch.at, ch.stars);
  drawBoard((r, c) => {
    const here = ch.at[0] === r && ch.at[1] === c, star = ch.stars.some(s => s[0] === r && s[1] === c), can = opts.some(m => m[0] === r && m[1] === c);
    return { html: here ? pieceSvg(ch.kind, 'w') : star ? iconImg('2B50', 'star') : '', dot: can && !star ? 'go' : '', cls: (can && star ? 'reach' : '') + (here ? ' sel' : '') };
  });
}
async function puzzleTap(r, c) {
  if (ch.over) return;
  if (!pieceMoves(ch.kind, ch.at, ch.stars).some(m => m[0] === r && m[1] === c)) {
    if (!(ch.at[0] === r && ch.at[1] === c)) { sfx.oops(); say(ch.kind === 'knight' ? 'The knight can’t go there. Look for the dots!' : `The ${ch.kind} can’t go there. Look for the dots!`); }
    return;
  }
  ch.at = [r, c]; ch.moves++;
  const before = ch.stars.length;
  ch.stars = ch.stars.filter(s => !(s[0] === r && s[1] === c));
  if (ch.stars.length < before) { sfx.coin(); buddy('cheer'); } else sfx.pop();
  if (!ch.stars.length) {
    ch.over = true; puzzleDraw();
    const me = ch;
    sfx.yay(); buddy('party'); petFun(8); addCoins(ch.n, el('chessMsg'));
    store.set('pz:' + ch.kind, Math.min(7, ch.n + 1));
    await chMsg(`All the stars, in ${ch.moves} moves! Well done!`);
    await wait(600); if (me === ch && !me.gone && screen === 'chess') puzzleStart(false);
    return;
  }
  puzzleDraw();
  chMsg(`${ch.stars.length} star${ch.stars.length === 1 ? '' : 's'} to go`, false);
}
el('cboard').onclick = e => {
  const s = e.target.closest('.sq'); if (!s || !ch) return;
  if (ch.mode === 'game') { gameTap(s.dataset.s); return; }
  const r = +s.dataset.r, c = +s.dataset.c;
  if (ch.mode === 'pawns') pawnTap(r, c); else puzzleTap(r, c);
};
