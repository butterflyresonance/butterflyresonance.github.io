/* ---------- chess: a whole game, against an opponent that never looks ahead ----------
   The rules (legal moves, check, mate, stalemate, castling, en passant,
   promotion, draws) come from chess.js 1.4.0, the same copy the Chess app
   uses (vendor/chess.js, BSD licence). It's loaded only when this game opens.

   How the opponent picks a move:
     1. It looks for chances: one of her pieces it could take that is hanging
        (attacked, and either undefended or attacked by something cheaper),
        or one of its own pieces that is hanging and could be saved (moved to
        safety, defended, or its attacker taken).
     2. No chances: a random legal move.
     3. Chances: it picks the most valuable one (taking wins a tie), then rolls.
        With probability "brain" it acts on it; otherwise a random legal move.
   brain starts at 10%. Each win: +5%. Each loss: −5%. Never below 5% or
   above 75%. Draws change nothing. Shown to her as Level 1–15. */

let ChessLib = null;
const loadChess = async () => ChessLib || (ChessLib = (await import(new URL('vendor/chess.js', document.baseURI).href)).Chess);
const PIECE_NAMES = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };
const PVAL = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 };
const FILES8 = 'abcdefgh';
const sq8 = (r, c) => FILES8[c] + (8 - r);
const brain = () => Math.min(75, Math.max(5, store.get('chessBrain') ?? 10));          // whole percent
const brainLevel = () => (brain() - 5) / 5 + 1;

/* ---- who attacks a square: pure geometry over the board (from the Chess app's coach) ---- */
const on8 = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
const HOPS8 = { n: [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]], k: [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]] };
const RAYS8 = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]];
function cells8(g) { return g.board().flat().map(x => x && { type: x.type, color: x.color }); }   // index r*8+c, r 0 = rank 8
function attackersOf8(cells, i, side) {
  const out = [], r0 = i >> 3, c0 = i & 7;
  const pr = side === 'w' ? r0 + 1 : r0 - 1;                // a white pawn on the rank below attacks up onto i
  for (const dc of [-1, 1]) { const c = c0 + dc; if (on8(pr, c)) { const p = cells[pr * 8 + c]; if (p && p.color === side && p.type === 'p') out.push(pr * 8 + c); } }
  for (const t of ['n', 'k']) for (const [dr, dc] of HOPS8[t]) {
    const r = r0 + dr, c = c0 + dc; if (!on8(r, c)) continue;
    const p = cells[r * 8 + c]; if (p && p.color === side && p.type === t) out.push(r * 8 + c);
  }
  for (const [dr, dc] of RAYS8) {
    const diag = dr && dc;
    for (let r = r0 + dr, c = c0 + dc; on8(r, c); r += dr, c += dc) {
      const p = cells[r * 8 + c];
      if (p) { if (p.color === side && (p.type === 'q' || p.type === (diag ? 'b' : 'r'))) out.push(r * 8 + c); break; }
    }
  }
  return out;
}
// attacked, and either undefended or attacked by something worth less
function hanging8(cells, i) {
  const p = cells[i]; if (!p || p.type === 'k') return false;
  const them = p.color === 'w' ? 'b' : 'w', atk = attackersOf8(cells, i, them);
  if (!atk.length) return false;
  if (!attackersOf8(cells, i, p.color).length) return true;
  return Math.min(...atk.map(a => PVAL[cells[a].type])) < PVAL[p.type];
}
const idxOf = s => (8 - +s[1]) * 8 + FILES8.indexOf(s[0]);

function botMove(g) {
  const me = g.turn(), legal = g.moves({ verbose: true });
  if (!legal.length) return null;
  const cells = cells8(g);
  const chances = [];
  // things to take: her hanging pieces it can capture now (with its cheapest piece)
  for (let i = 0; i < 64; i++) {
    const p = cells[i]; if (!p || p.color === me || !hanging8(cells, i)) continue;
    const takes = legal.filter(m => idxOf(m.to) === i).sort((a, b) => PVAL[a.piece] - PVAL[b.piece]);
    if (takes.length) chances.push({ value: PVAL[p.type], take: true, moves: [takes[0]] });
  }
  // things to save: its own hanging pieces, and the moves after which that piece is safe
  for (let i = 0; i < 64; i++) {
    const p = cells[i]; if (!p || p.color !== me || !hanging8(cells, i)) continue;
    const saves = legal.filter(m => {
      g.move(m);
      const after = cells8(g), at = idxOf(m.from) === i ? idxOf(m.to) : i;
      const safe = !hanging8(after, at) && !(at !== idxOf(m.to) && hanging8(after, idxOf(m.to)) && PVAL[m.piece] >= PVAL[p.type]);
      g.undo();
      return safe;
    });
    if (saves.length) chances.push({ value: PVAL[p.type], take: false, moves: saves });
  }
  if (chances.length) {
    chances.sort((a, b) => b.value - a.value || (b.take - a.take));
    if (Math.random() * 100 < brain()) return { move: pick(chances[0].moves), acted: chances[0].take ? 'take' : 'save' };
  }
  return { move: pick(legal), acted: null };
}

/* ---- the game on the screen ---- */
let gm = null;            // { g, sel, promo: {from,to} | null, over, busy }
const gameSave = () => { if (gm && gm.g) store.set('chessGame', gm.over ? null : gm.g.pgn()); };
async function gameStart(resume) {
  const Chess = await loadChess();
  const g = new Chess();
  const saved = resume && store.get('chessGame');
  if (saved) try { g.loadPgn(saved); } catch { g.reset(); }
  gm = { g, sel: null, promo: null, over: false, busy: false };
  ch = { mode: 'game', gone: false };
  gameSave(); gameDraw();
  if (g.turn() === 'b') return gameBot();
  chMsg(saved && g.history().length ? `Your turn. Level ${brainLevel()}.`
    : `A whole game! You're white, so you go first. Tap a piece to see where it can go. Level ${brainLevel()}.`, !saved);
}
function gameDraw() {
  const g = gm.g, board = g.board(), last = g.history({ verbose: true }).at(-1);
  const moves = gm.sel ? g.moves({ square: gm.sel, verbose: true }) : [];
  const checkSq = g.inCheck() ? board.flat().find(x => x && x.type === 'k' && x.color === g.turn()).square : null;
  let h = '';
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const s = sq8(r, c), p = board[r][c], m = moves.find(x => x.to === s);
    const cls = [(r + c) % 2 ? 'd' : 'l', gm.sel === s ? 'sel' : '', last && (last.from === s || last.to === s) ? 'last' : '', checkSq === s ? 'check' : ''].join(' ');
    h += `<button class="sq ${cls}" data-s="${s}">${p ? pieceSvg(PIECE_NAMES[p.type], p.color) : ''}${m ? `<i class="dot${m.captured ? ' take' : ''}"></i>` : ''}`
      + `${c === 0 ? `<span class="crd r">${8 - r}</span>` : ''}${r === 7 ? `<span class="crd f">${FILES8[c]}</span>` : ''}</button>`;
  }
  el('cboard').innerHTML = h;
  el('chessUndo').disabled = gm.over || gm.busy || g.history().length < 2;
  el('chessPromo').classList.toggle('hidden', !gm.promo);
}
function gameTap(s) {
  if (!gm || gm.over || gm.busy || gm.promo || gm.g.turn() !== 'w') return;
  const g = gm.g, p = g.get(s);
  if (gm.sel) {
    const m = g.moves({ square: gm.sel, verbose: true }).filter(x => x.to === s);
    if (m.length) {
      if (m.some(x => x.promotion)) { gm.promo = { from: gm.sel, to: s }; gameDraw(); chMsg('Your pawn reached the end! What should it become?'); return; }
      return gamePlay({ from: gm.sel, to: s });
    }
  }
  gm.sel = p && p.color === 'w' && gm.sel !== s ? s : null;
  if (gm.sel && !g.moves({ square: s }).length) chMsg(`That ${PIECE_NAMES[p.type]} can't move right now.`, false);
  gameDraw();
}
function gamePlay(mv) {
  const m = gm.g.move(mv);
  gm.sel = null; gm.promo = null;
  m.captured ? sfx.munch() : sfx.pop();
  gameSave(); gameDraw();
  if (gameEnd()) return;
  if (m.captured) chMsg(`You took my ${PIECE_NAMES[m.captured]}!`, false);
  gameBot();
}
async function gameBot() {
  gm.busy = true; gameDraw();
  const me = gm;
  await wait(550 + Math.random() * 400);
  if (me !== gm || ch.gone) return;
  const r = botMove(gm.g);
  const m = gm.g.move(r.move.promotion ? { ...r.move, promotion: 'q' } : r.move);   // it always makes a queen
  gm.busy = false;
  m.captured ? sfx.munch() : sfx.flip();
  gameSave(); gameDraw();
  if (gameEnd()) return;
  const name = PIECE_NAMES[m.piece];
  if (gm.g.inCheck()) chMsg('Check! Your king is under attack. Keep him safe.');
  else if (m.captured) chMsg(`My ${name} took your ${PIECE_NAMES[m.captured]}. Your turn.`, false);
  else if (r.acted === 'save') chMsg(`I moved my ${name} to safety. Your turn.`, false);
  else chMsg('Your turn.', false);
}
function gameEnd() {
  const g = gm.g;
  if (!g.isGameOver()) return false;
  gm.over = true; gameDraw(); gameSave();
  if (g.isCheckmate()) {
    const won = g.turn() === 'b';
    const b0 = brain();
    store.set('chessBrain', Math.min(75, Math.max(5, b0 + (won ? 5 : -5))));
    if (won) {
      sfx.yay(); buddy('party'); petFun(10); addCoins(20, el('cboard'));
      chMsg(b0 >= 75 ? `Checkmate! You won! I'm at my strongest, Level ${brainLevel()}, and you still beat me!` : `Checkmate! You won! I'll try harder next time: Level ${brainLevel()}.`);
    } else {
      sfx.oops(); buddy('think'); addCoins(3, el('cboard'));
      chMsg(`Checkmate. I won this time! ${b0 > 5 ? `I'll go a bit easier: Level ${brainLevel()}.` : ''} Want another game?`);
    }
  } else {
    addCoins(5, el('cboard'));
    const why = g.isStalemate() ? 'Stalemate: the side to move has no legal moves but isn’t in check, so nobody wins.'
      : g.isInsufficientMaterial() ? 'There aren’t enough pieces left for anyone to checkmate.'
      : g.isThreefoldRepetition() ? 'The same position came up three times.'
      : 'Fifty moves each without a capture or a pawn move.';
    chMsg(`It's a draw. ${why}`);
  }
  el('chessAgain').textContent = el('chessAgain').dataset.say = 'New game';
  return true;
}
el('chessUndo').onclick = () => {
  if (!gm || gm.over || gm.busy || gm.g.turn() !== 'w' || gm.g.history().length < 2) return;
  gm.g.undo(); gm.g.undo(); gm.sel = null; gm.promo = null;
  gameSave(); gameDraw(); chMsg('Taken back. Have another go.', false);
};
el('chessPromo').onclick = e => {
  const b = e.target.closest('[data-p]'); if (!b || !gm || !gm.promo) return;
  gamePlay({ ...gm.promo, promotion: b.dataset.p });
};
el('chessPromo').innerHTML = ['q', 'r', 'b', 'n'].map(t => `<button data-p="${t}" aria-label="${PIECE_NAMES[t]}" data-say="${PIECE_NAMES[t]}">${pieceSvg(PIECE_NAMES[t], 'w')}</button>`).join('');
