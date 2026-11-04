"""Whole synthetic screenshots of app boards in random positions, for testing.

    python3 screen_boards.py OUTDIR N NAME [--seed S]
NAME is a glyph set from screen_glyphs.py (flat squares) or texture_glyphs.py
(textured squares). Writes OUTDIR/NNN.jpg and labels.json like synth_board.py,
so evalboard.py can read them. Each board has a highlighted last move and is
saved as a JPEG, as a shared screenshot would be. On a textured board, a piece
kept with its own dark square (see texture_glyphs.py) is only placed on a dark square.
"""
import os, json, random, argparse
import numpy as np
from PIL import Image, ImageDraw
import synth_board, screen_gen
from screen_gen import G, TYPES

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('out'); ap.add_argument('n', type=int); ap.add_argument('name'); ap.add_argument('--seed', type=int, default=0)
    a = ap.parse_args()
    rng = random.Random(a.seed); np.random.seed(a.seed)
    os.makedirs(a.out, exist_ok=True)
    tex = os.path.exists(os.path.join(screen_gen.HERE, 'glyphs', a.name + '.npz')) and 'tiles_light' in np.load(os.path.join(screen_gen.HERE, 'glyphs', a.name + '.npz'))
    labels = []
    for i in range(a.n):
        cells = synth_board.random_position(rng)
        if tex:
            gl, tiles = screen_gen.texture_set(a.name)
            # pieces kept with a dark square: move them to a free dark square
            for (r, f), cell in list(cells.items()):
                if gl[cell][1] and (r + f) % 2 == 0:
                    free = [(rr, ff) for rr in range(8) for ff in range(8) if (rr + ff) % 2 == 1 and (rr, ff) not in cells]
                    del cells[(r, f)]; cells[rng.choice(free)] = cell
        board = Image.new('L', (8 * G, 8 * G))
        d = ImageDraw.Draw(board)
        if not tex:
            gl, (light, dark) = screen_gen.screen_set(a.name)
        hl = rng.sample([(r, f) for r in range(8) for f in range(8)], 2)
        shift = rng.uniform(-40, 20)
        for r in range(8):
            for f in range(8):
                isdark = (r + f) % 2 == 1
                if tex:
                    board.paste(rng.choice(tiles['dark' if isdark else 'light']), (f * G, r * G))
                else:
                    v = dark if isdark else light
                    if (r, f) in hl: v = np.clip(v + shift, 0, 255)
                    d.rectangle([f * G, r * G, (f + 1) * G - 1, (r + 1) * G - 1], fill=int(v))
                cell = cells.get((r, f))
                if not cell: continue
                g = gl[cell][0] if tex else gl[cell]
                if tex and gl[cell][1]: board.paste(g.getchannel('L'), (f * G, r * G))
                else: board.paste(g.getchannel('L'), (f * G, r * G), g.getchannel('A'))
        # the board on a screen-coloured margin, as a screenshot has
        m = G // 2
        shot = Image.new('L', (8 * G + 2 * m, 8 * G + 3 * m), rng.randint(0, 255))
        shot.paste(board, (m, m))
        fn = f'{i:03d}.jpg'
        shot.convert('RGB').save(os.path.join(a.out, fn), quality=rng.randint(60, 92))
        labels.append({'file': fn, 'placement': synth_board.placement(cells),
                       'corners': [[m, m], [m + 8 * G, m], [m + 8 * G, m + 8 * G], [m, m + 8 * G]]})
    json.dump(labels, open(os.path.join(a.out, 'labels.json'), 'w'))
    print(f'{a.n} {a.name} boards in {a.out}')

if __name__ == '__main__':
    main()
