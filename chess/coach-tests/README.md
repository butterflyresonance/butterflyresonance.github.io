# Coach tests

Property tests for the tactics coach in `../index.html`.

```
npm install
node suite.mjs          # 40 random games, a few minutes
node suite.mjs 3        # quick, ~30s
```

The coach source is pulled out of `../index.html` at run time and written to
`.coach.generated.mjs`, so this always tests the code that ships. Editing the
generated file does nothing; edit `index.html`.

## What it checks

It does not assert "position X should report Y" — that only ever confirms what
the author already believed. It generates positions by random legal play, adds a
set of hand-built tactical ones, and checks properties of every finding:

- **No contradictions.** A verdict of *nothing answers it* must survive an
  independent look. A stated loss must be a real one.
- **Everything named must exist.** Every move named is legal in the position it
  is claimed for; every "queen on d7" has a queen on d7, in either the position
  before the move or the one after.
- **Labels match reality.** Mate claims are mate, checks give check, captures
  capture, "undefended" pieces have no defenders.
- **Completeness.** Every legal capture appears under captures, every legal
  check under checks. Nothing legal is silently missing.
- **Nothing half-rendered.** No `undefined`, `NaN`, `[object Object]` or stray
  punctuation reaches the panel.
- **It never throws, and is deterministic**, on any position — including ones
  with en passant, promotions, double check, stalemate and bare kings.

## The oracle

Ground truth for material comes from a recursive capture search over chess.js's
*legal* moves, not from the coach's own exchange evaluator. That matters: the
coach's evaluator is a static attack table, so it can count a defender that has
no legal way to recapture. Using it to check itself is how two shipped bugs
survived.

The search is slow and dumb on purpose. Its only job is to disagree.

## Known limitations, measured

Static exchange evaluation works off attack tables rather than legal moves, so
it can count a defender that could not actually recapture. Two classes of that,
both measured across ~936 random-play positions (far more chaotic than real
games, so treat these as upper bounds):

**Pins — fixed.** A piece pinned against its own king cannot leave the line, so
it does not defend anything off it. `capturersOf` now drops pinned attackers
unless the square is on their own pin line, recomputed at every ply because a
pin can appear or vanish mid-exchange. Was 3 violations; now 0. Verified against
`2q1k1r1/p1p3bp/4pp2/1P1pP1P1/rn1P3P/BP6/2P1Q1KP/RN4NR w`, where after
`exf6 Bxf6` the g5 pawn is pinned by the rook on g8 and White has no recapture —
previously reported as "nothing recaptures, wins 1".

**Check — open.** 6 violations remain, all the same shape: a recapture that is
illegal because the side to move is in check. In the position above, `gxf6 Bxf6`
opens the g-file and gives discovered check, so `exf6` is not available and the
pawn is simply lost. Closing this means generating legal moves at each ply of
the exchange, which is what a static evaluator exists to avoid — the oracle in
this file does exactly that and takes about 280ms per position for it. Left
open deliberately; roughly 0.6% of findings on chaotic positions, lower in real
games.
