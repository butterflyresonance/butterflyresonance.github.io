/* ================= coach test suite =================
   The bugs this thing has shipped were not wrong answers to hard questions.
   They were rows that contradicted themselves — a verdict reading "nothing
   answers it" above a sentence saying the move costs you six — and claims about
   pieces that were not on the squares named. None of that needs a chess oracle
   to catch. It needs invariants, checked over enough positions that the odd
   ones turn up on their own.

   So this suite does not assert "position X should report Y". It generates
   positions by random legal play, adds the hand-built tactical ones, and asks
   of every finding: is what you just said true, is the move you named legal,
   and does anything you left out exist. Where a ground truth is needed it comes
   from a recursive capture search over chess.js's LEGAL moves — deliberately
   not from the coach's own exchange evaluator, which is a static attack table
   and does not know about pins. Grading your own homework is how two of those
   bugs survived.

   Run:  node suite.mjs [games]      (default 40; a few minutes)

   The coach is read out of ../index.html at run time, so this always tests the
   code that ships rather than a copy of it that has quietly drifted. */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Chess } from 'chess.js';

const here = dirname(fileURLToPath(import.meta.url));
const APP = join(here, '..', 'index.html');
const GEN = join(here, '.coach.generated.mjs');

const html = readFileSync(APP, 'utf8');
const start = html.indexOf('/* ================= tactics coach =================');
const end = html.indexOf('\nfunction draw() {', start);
if (start < 0 || end < 0) {
  console.error('could not find the coach block in ' + APP);
  process.exit(2);
}
writeFileSync(GEN,
  "import { Chess } from 'chess.js';\nconst FILES = 'abcdefgh';\n\n" +
  html.slice(start, end) +
  "\nexport { analyze, toCells, attackersOf, see, seeRaw, findPins, sqName, sqIndex };\n");

const { analyze } = await import('./.coach.generated.mjs?v=' + Date.now());

const CVT = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
// \b matters: without it this happily matches "king on h2" inside "taking on h2"
const SQ = /\b(pawn|knight|bishop|rook|queen|king) on ([a-h][1-8])\b/g;
const NAMES = { pawn: 'p', knight: 'n', bishop: 'b', rook: 'r', queen: 'q', king: 'k' };

/* ---------- corpus ---------- */

function mulberry(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Random legal play, sampled. Random games are not good chess, which is the
   point: they wander into lopsided material, exposed kings, promotions and
   stalemates far faster than real games do, and those are where the edges are. */
function corpus(games = 60, maxPlies = 70, seed = 7) {
  const rng = mulberry(seed);
  const out = [];
  for (let g = 0; g < games; g++) {
    const c = new Chess();
    for (let ply = 0; ply < maxPlies; ply++) {
      const ms = c.moves();
      if (!ms.length || c.isGameOver()) break;
      c.move(ms[Math.floor(rng() * ms.length)]);
      if (ply > 2 && ply % 3 === 0) {
        const hist = c.history({ verbose: true });
        out.push({ fen: c.fen(), prevFen: hist.at(-1).before, lastSan: hist.at(-1).san });
      }
    }
  }
  return out;
}

const CURATED = [
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  'r1bqkbnr/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 1',
  '6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1',
  'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/8/PPPP1PPP/RNBQK1NR b KQkq - 0 1',
  'r7/8/8/k7/8/8/8/R5K1 w - - 0 1',
  '4k3/8/8/8/3q4/8/2N5/4K3 w - - 0 1',
  'rnbqkb1r/ppp2ppp/3p1n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 1',
  '4k3/8/8/4N3/8/8/8/4R1K1 w - - 0 1',
  '1b1r1n2/6pk/7p/8/8/8/6PP/1R3RK1 b - - 0 1',
  'r2q1rk1/pp2bppp/2n1bn2/2pp4/3P4/2NBPN2/PPQ2PPP/R1B2RK1 w - - 0 1',
  'r4rk1/pppqb1pp/2npbn1p/1B2p3/3PP3/P1N1BN1P/1PP1QPP1/R4RK1 b - - 0 1',
  // en passant available
  'rnbqkbnr/ppp1p1pp/8/3pPp2/8/8/PPPP1PPP/RNBQKBNR w KQkq f6 0 3',
  // promotion on the move
  '8/P6k/8/8/8/8/6p1/K7 w - - 0 1',
  // king in check
  'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 0 1',
  // stalemate-adjacent, almost no material
  '7k/5Q2/6K1/8/8/8/8/8 b - - 0 1',
  // only kings
  '4k3/8/8/8/8/8/8/4K3 w - - 0 1'
];

/* ---------- an oracle that is not the coach's own ----------
   Plain material, two ply: they capture, we recapture, best for each. Slow and
   dumb on purpose. Its only job is to disagree with the coach when the coach is
   lying, and it cannot do that if it shares the coach's arithmetic. */
function material(c, side) {
  let m = 0;
  for (const row of c.board()) for (const cell of row) {
    if (!cell) continue;
    m += (cell.color === side ? 1 : -1) * CVT[cell.type];
  }
  return m;
}

/* A full capture sequence on one square, minimaxed over chess.js's LEGAL moves.
   The earlier version of this stopped after one recapture, which made it
   confidently wrong about any square with three attackers on it — it let White
   "win back" a piece with a queen that would then simply be taken, and reported
   a sound sacrifice as a phantom loss. Depth is what makes it an oracle rather
   than a second opinion; searching legal moves rather than an attack table is
   what makes it independent of the coach's own evaluator, since this one knows
   about pins, checks and legality and that one does not. */
function swap(c, sq, me, depth = 0) {
  const stand = material(c, me);
  if (depth > 8) return stand;
  const mover = c.turn();
  let best = stand;                       // whoever is to move may decline
  for (const m of c.moves({ verbose: true })) {
    if (m.to !== sq || !m.captured) continue;
    c.move(m);
    const val = swap(c, sq, me, depth + 1);
    c.undo();
    best = mover === me ? Math.max(best, val) : Math.min(best, val);
  }
  return best;
}

function theyWinMaterial(c, side) {
  const base = material(c, side);
  const squares = new Set();
  for (const m of c.moves({ verbose: true })) if (m.captured) squares.add(m.to);
  let worst = base;
  for (const sq of squares) worst = Math.min(worst, swap(c, sq, side));
  return base - worst;
}

/* ---------- the invariants ---------- */

function checkPosition(entry, report) {
  const { fen, prevFen, lastSan } = entry;
  const base = new Chess(fen, { skipValidation: true });
  const me = base.turn();
  const bad = m => report(m, fen);

  let r1;
  const t0 = performance.now();
  try {
    r1 = analyze(fen, me, { prevFen, lastSan });
    if (entry.deep) {
      const r2 = analyze(fen, me, { prevFen, lastSan });
      if (JSON.stringify(r2.groups) !== JSON.stringify(r1.groups)) bad('NON-DETERMINISTIC');
    }
  } catch (e) {
    return bad('THREW: ' + e.message);
  }
  const ms = performance.now() - t0;
  if (ms > 1500) bad(`SLOW: ${ms.toFixed(0)}ms`);

  // a curated FEN can be illegal enough that chess.js offers a king capture
  const legal = base.moves({ verbose: true }).filter(m => m.captured !== 'k');
  const bySan = new Map(legal.map(m => [m.san, m]));

  /* Findings about their moves are stated in the position with the turn
     flipped — checking them against our move list is how the harness manages
     to report a perfectly good enemy capture as an illegal move. */
  const fp = fen.split(' '); fp[1] = fp[1] === 'w' ? 'b' : 'w'; fp[3] = '-';
  const flip = new Chess(fp.join(' '), { skipValidation: true });
  const prev = prevFen ? new Chess(prevFen, { skipValidation: true }) : null;
  const flipSan = new Map(flip.moves({ verbose: true }).filter(m => m.captured !== 'k').map(m => [m.san, m]));
  const them = me === 'w' ? 'b' : 'w';

  let oracled = 0;
  for (const f of r1.findings) {
    const theirs = f.side === 'them' && !!f.move;
    const board = theirs ? flip : base;
    const sans = theirs ? flipSan : bySan;
    const owner = theirs ? them : me;
    const blob = [f.head, f.text, f.verdict ? f.verdict.label : ''].filter(Boolean).join(' ');

    // 1. nothing half-rendered ever reaches the panel
    for (const junk of ['undefined', 'NaN', 'null', '[object', ' .', ' ,', '  ']) {
      if (blob.includes(junk)) bad(`JUNK "${junk}" in: ${f.head}`);
    }
    if (!f.head || !f.head.trim()) bad('EMPTY HEAD in ' + f.key);
    if (f.key !== 'changed' && (!f.verdict || !f.verdict.label)) bad('NO VERDICT: ' + f.head);

    // 2. a move it names must be legal
    if (f.move && !sans.has(f.move)) bad(`ILLEGAL MOVE ${f.move} in: ${f.head}`);

    // the position the finding is describing
    const view = board;
    let undo = false, beforeSnapshot = null;
    if (f.move && sans.has(f.move)) {
      beforeSnapshot = {};
      for (const row of view.board()) for (const cell of row) if (cell) beforeSnapshot[cell.square] = cell;
      view.move(f.move);
      undo = true;
    }

    // 3. a reply it names must be legal in that position
    if (f.verdict && f.verdict.san) {
      const replies = new Set(view.moves());
      if (!replies.has(f.verdict.san)) {
        bad(`ILLEGAL REPLY ${f.verdict.san} after ${f.move || '(no move)'} in: ${f.head}`);
      }
    }

    // 4. every piece it names must be on the square it names
    /* Text mixes tenses on purpose — "takes your knight on e4" names the piece
       as it was, "the pawn hits the bishop on c4" names things as they will be.
       So a named piece has to be there in one of the two positions, not both. */
    for (const [, piece, sq] of blob.matchAll(SQ)) {
      const now = view.get(sq);
      const was = undo ? beforeSnapshot[sq] : null;
      // the "what changed" rows describe the position before their last move
      const then = f.key === 'changed' && prev ? prev.get(sq) : null;
      const ok = (now && now.type === NAMES[piece])
              || (was && was.type === NAMES[piece])
              || (then && then.type === NAMES[piece]);
      if (!ok) bad(`WRONG PIECE: says ${piece} on ${sq}, found ${now ? now.type : 'nothing'} — ${f.head}`);
    }

    // 5. "mate" means mate, and nothing else claims to be
    if (f.motif === 'mate' && !view.isCheckmate()) bad(`NOT MATE: ${f.head}`);
    if (f.motif !== 'mate' && f.move && view.isCheckmate()) bad(`MATE NOT LABELLED: ${f.head}`);

    // 6. checks check, captures capture
    if (f.key === 'checks' && f.move && !view.inCheck()) bad(`NOT A CHECK: ${f.head}`);
    if (f.key === 'captures' && f.move && !sans.get(f.move).captured) bad(`NOT A CAPTURE: ${f.head}`);

    /* 7 and 8: the ones that matter. "Nothing answers it" has to survive an
       independent look, and a stated loss has to be a real one. Judged from
       the moving side, which for a threat is theirs. Capped per position —
       the oracle is slow, and coverage across positions is worth more than
       exhaustiveness within one. */
    if (f.move && f.verdict && oracled < 8 && sans.has(f.move) && !theirs) {
      const kind = f.verdict.kind;
      if (kind === 'works' && f.motif !== 'mate') {
        oracled++;
        const lost = theyWinMaterial(view, owner);
        if (lost > 0) bad(`CONTRADICTION: "${f.verdict.label}" but ${lost} is lost after ${f.move} — ${f.head}`);
      } else if (kind === 'loses' && f.verdict.net > 0) {
        oracled++;
        const lost = theyWinMaterial(view, owner);
        if (lost <= 0) bad(`PHANTOM LOSS: claims ${f.verdict.net} after ${f.move}, oracle says none — ${f.head}`);
      }
    }

    // 9. "undefended" must mean undefended
    if (f.motif === 'loose' || f.motif === 'watch' || f.motif === 'idle') {
      const sq = f.squares[0];
      const p = base.get(sq);
      if (!p) bad(`LOOSE ON EMPTY SQUARE ${sq}`);
      else if (base.attackers(sq, p.color).length) bad(`NOT UNDEFENDED: ${sq} has defenders — ${f.head}`);
    }

    if (undo) view.undo();
    if (board.fen() !== (theirs ? fp.join(' ') : fen)) { bad('HARNESS LEFT THE BOARD DIRTY: ' + f.head); return; }
  }

  // 10. completeness — nothing legal may be missing from its section
  const listed = k => new Set((r1.groups.find(g => g.key === k) || { items: [] }).items.map(i => i.move));
  const caps = listed('captures'), checks = listed('checks');
  for (const m of legal) {
    base.move(m.san);
    const gives = base.inCheck();
    base.undo();
    if (m.captured && !caps.has(m.san) && !checks.has(m.san)) bad(`MISSING CAPTURE ${m.san}`);
    if (gives && !checks.has(m.san)) bad(`MISSING CHECK ${m.san}`);
  }
}

/* ---------- run ---------- */

const positions = [
  ...CURATED.map(fen => ({ fen })),
  ...corpus(Number(process.argv[2]) || 60)
];

const failures = new Map();
let checked = 0;
const t0 = performance.now();

for (const [i, entry] of positions.entries()) {
  checked++;
  entry.deep = i % 20 === 0;
  checkPosition(entry, (msg, fen) => {
    const kind = msg.split(':')[0];
    if (!failures.has(kind)) failures.set(kind, []);
    failures.get(kind).push({ msg, fen });
  });
}

const secs = ((performance.now() - t0) / 1000).toFixed(1);
console.log(`\n${checked} positions checked in ${secs}s\n`);

if (!failures.size) {
  console.log('all invariants hold');
} else {
  let total = 0;
  for (const [kind, list] of [...failures].sort((a, b) => b[1].length - a[1].length)) {
    total += list.length;
    console.log(`${String(list.length).padStart(5)}  ${kind}`);
    for (const f of list.slice(0, 2)) console.log(`         ${f.msg}\n         ${f.fen}`);
  }
  console.log(`\n${total} violations across ${failures.size} kinds`);
  process.exitCode = 1;
}
