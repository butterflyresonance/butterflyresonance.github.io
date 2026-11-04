"""Pieces and empty squares cut from a screenshot of the starting position on a
textured board (marble, wood), for screen_gen.py's texture mode.

    python3 texture_glyphs.py SHOT.jpg NAME x0 y0 x1 y1 [--outline 55]
x0 y0 x1 y1: the board's corners (a8 at top left).
Writes glyphs/NAME.npz like screen_glyphs.py, plus every empty square of
ranks 3 to 6 as background tiles (tiles_light, tiles_dark).

A textured square has no single colour to remove, so this needs pieces drawn
with a dark outline: the background is everything reachable from the square's
edge without crossing a pixel darker than --outline. Only light squares give a
clean cut (dark marble has streaks as dark as the outline), so a piece that
stands only on dark squares in the starting position is kept whole, with its
square (alpha all 1, area -1), and screen_gen.py puts it only on dark squares.
"""
import os, argparse
import numpy as np
from PIL import Image
from scipy import ndimage

START = ['rnbqkbnr', 'pppppppp', '........', '........', '........', '........', 'PPPPPPPP', 'RNBQKBNR']
LUMA = np.array([.299, .587, .114])

def cut(sq, outline):
    grey = sq @ LUMA
    open_ = grey >= outline
    lab, _ = ndimage.label(open_)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(border))
    alpha = ndimage.binary_opening(~bg, iterations=1).astype(np.float32)
    alpha = ndimage.gaussian_filter(alpha, .7)
    return grey.astype(np.float32), np.clip(alpha * 1.2, 0, 1), float(alpha.mean())

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('shot'); ap.add_argument('name'); ap.add_argument('box', type=float, nargs=4)
    ap.add_argument('--outline', type=float, default=55)
    a = ap.parse_args()
    im = np.asarray(Image.open(a.shot).convert('RGB')).astype(np.float32)
    x0, y0, x1, y1 = a.box
    s = (x1 - x0) / 8
    out = {}; tl, td = [], []
    area = {}
    for r in range(8):
        for f in range(8):
            p = START[r][f]
            sq = im[int(round(y0 + r * s)):int(round(y0 + (r + 1) * s)), int(round(x0 + f * s)):int(round(x0 + (f + 1) * s))]
            sq = sq[:int(s), :int(s)]
            if p == '.':
                (tl if (r + f) % 2 == 0 else td).append(sq @ LUMA)
                continue
            g, al, cover = cut(sq, a.outline)
            light = (r + f) % 2 == 0
            # a light square's marble has no streaks as dark as the outline, so its cut is clean:
            # use one of those; a piece that only stands on dark squares is kept whole, square and all
            # (a cut covering under a quarter of the square leaked through a gap in the outline)
            if light and cover >= .25 and (p not in area or area[p] < 0):
                area[p] = cover; out['g_' + p] = g; out['a_' + p] = al
            elif not light and (p not in area):
                area[p] = -1; out['g_' + p] = g; out['a_' + p] = np.ones_like(al)
    out['tiles_light'] = np.stack(tl).astype(np.float32); out['tiles_dark'] = np.stack(td).astype(np.float32)
    out['light'] = float(np.median([t.mean() for t in tl])); out['dark'] = float(np.median([t.mean() for t in td]))
    os.makedirs(os.path.join(os.path.dirname(__file__), 'glyphs'), exist_ok=True)
    np.savez(os.path.join(os.path.dirname(__file__), 'glyphs', a.name + '.npz'), **out)
    print(f'{a.name}: squares {out["light"]:.0f}/{out["dark"]:.0f}, cover ' + ' '.join(f'{p}{area[p]:.2f}' for p in sorted(area)))

if __name__ == '__main__':
    main()
