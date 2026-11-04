"""Piece images cut from a screenshot of the starting position, for screen_gen.py.

    python3 screen_glyphs.py SHOT.jpg NAME x0 y0 x1 y1 [--flip]
x0 y0 x1 y1: the board's corners in the screenshot (a8 at top left unless --flip).
Writes glyphs/NAME.npz: for each of the 12 pieces, a grey image and its alpha,
cut out of its square by removing the square's own flat colour; plus the two
square colours (light, dark) as grey levels.

Each piece is cut from every square it stands on, and the cleanest copy kept
(the one whose background is most uniform). Background is found by flooding in
from the square's edge over pixels close to the square's colour, so a piece's
light fill (which can be close to a light square's colour) stays solid.
"""
import os, sys, argparse
import numpy as np
from PIL import Image
from scipy import ndimage

START = ['rnbqkbnr', 'pppppppp', '........', '........', '........', '........', 'PPPPPPPP', 'RNBQKBNR']

def cut(sq, tol):
    """sq: HxWx3 float. Returns (grey, alpha, bg grey, bg spread)."""
    h, w, _ = sq.shape
    edge = np.concatenate([sq[:3].reshape(-1, 3), sq[-3:].reshape(-1, 3), sq[:, :3].reshape(-1, 3), sq[:, -3:].reshape(-1, 3)])
    bg = np.median(edge, axis=0)
    diff = np.abs(sq - bg).max(axis=2)
    near = diff < tol
    lab, _ = ndimage.label(near)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bgmask = np.isin(lab, list(border))
    alpha = (~bgmask).astype(np.float32)
    # soft edge: a pixel next to the background is only as opaque as it differs from it
    edge_px = ndimage.binary_dilation(bgmask) & ~bgmask
    alpha[edge_px] = np.clip(diff[edge_px] / (3 * tol), .2, 1)
    grey = sq @ np.array([.299, .587, .114])
    return grey.astype(np.float32), alpha, float(bg @ np.array([.299, .587, .114])), float(np.abs(edge - bg).mean())

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('shot'); ap.add_argument('name'); ap.add_argument('box', type=float, nargs=4)
    ap.add_argument('--tol', type=float, default=10); ap.add_argument('--flip', action='store_true')
    a = ap.parse_args()
    im = np.asarray(Image.open(a.shot).convert('RGB')).astype(np.float32)
    x0, y0, x1, y1 = a.box
    s = (x1 - x0) / 8
    best = {}
    light = []; dark = []
    for r in range(8):
        for f in range(8):
            p = START[7 - r][7 - f] if a.flip else START[r][f]
            sq = im[int(round(y0 + r * s)):int(round(y0 + (r + 1) * s)), int(round(x0 + f * s)):int(round(x0 + (f + 1) * s))]
            g, al, bg, spread = cut(sq, a.tol)
            (light if (r + f) % 2 == 0 else dark).append(bg)
            if p == '.': continue
            if p not in best or spread < best[p][3]: best[p] = (g, al, bg, spread)
    out = {'light': np.median(light), 'dark': np.median(dark)}
    for p, (g, al, bg, sp) in best.items():
        out['g_' + p] = g; out['a_' + p] = al
    os.makedirs(os.path.join(os.path.dirname(__file__), 'glyphs'), exist_ok=True)
    np.savez(os.path.join(os.path.dirname(__file__), 'glyphs', a.name + '.npz'), **out)
    print(f'{a.name}: squares {out["light"]:.0f}/{out["dark"]:.0f}, pieces {"".join(sorted(best))}')

if __name__ == '__main__':
    main()
