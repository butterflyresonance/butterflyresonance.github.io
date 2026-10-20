"""Read synthetic photos with a trained model, the same way the page does.

    python3 evalboard.py weights.npz PHOTODIR [--jitter 0.01]
Uses the true corners from labels.json (optionally nudged by up to `jitter` of
the board size) so this measures the reading, not the corner guess.
Also: python3 evalboard.py weights.npz --export diagram-model.bin
"""
import sys, json, os, argparse
import numpy as np
from PIL import Image

SQ = 40
NAMES = '.KQRBNPkqrbnp'

def load(wf):
    d = np.load(wf)
    return [(d[f'c{i}w'], d[f'c{i}b']) for i in range(4)], (d['fcw'], d['fcb'])

def conv(x, w, b):                      # x: C,H,W ; same padding
    C, H, W = x.shape
    xp = np.pad(x, ((0, 0), (1, 1), (1, 1)))
    cols = np.stack([xp[:, ky:ky + H, kx:kx + W] for ky in range(3) for kx in range(3)], axis=1)  # C,9,H,W
    out = np.tensordot(w.reshape(w.shape[0], C, 9), cols, axes=([1, 2], [0, 1])) + b[:, None, None]
    return np.maximum(out, 0)

def classify(net, px):
    convs, (fw, fb) = net
    x = px.astype(np.float32) / 255
    x = (x - x.mean()) / (x.std() + .05)
    x = x[None]
    for i, (w, b) in enumerate(convs):
        x = conv(x, w, b)
        if i < 3:
            C, H, W = x.shape
            x = x.reshape(C, H // 2, 2, W // 2, 2).max(axis=(2, 4))
    z = fw @ x.mean(axis=(1, 2)) + fb
    z = np.exp(z - z.max()); return z / z.sum()

def homography(q):
    (x0, y0), (x1, y1), (x2, y2), (x3, y3) = q
    dx1, dx2, dy1, dy2 = x1 - x2, x3 - x2, y1 - y2, y3 - y2
    sx, sy = x0 - x1 + x2 - x3, y0 - y1 + y2 - y3
    den = dx1 * dy2 - dx2 * dy1
    g = (sx * dy2 - dx2 * sy) / den; h = (dx1 * sy - sx * dy1) / den
    return [x1 - x0 + g * x1, x3 - x0 + h * x3, x0, y1 - y0 + g * y1, y3 - y0 + h * y3, y0, g, h]

def warp(grey, q):
    H = homography(q); N = 8 * SQ
    u, v = np.meshgrid((np.arange(N) + .5) / N, (np.arange(N) + .5) / N)
    d = H[6] * u + H[7] * v + 1
    x = (H[0] * u + H[1] * v + H[2]) / d - .5; y = (H[3] * u + H[4] * v + H[5]) / d - .5
    h, w = grey.shape
    xi = np.clip(np.floor(x).astype(int), 0, w - 2); yi = np.clip(np.floor(y).astype(int), 0, h - 2)
    fx = np.clip(x - xi, 0, 1); fy = np.clip(y - yi, 0, 1)
    g = grey.astype(np.float32)
    return (g[yi, xi] * (1 - fx) * (1 - fy) + g[yi, xi + 1] * fx * (1 - fy) + g[yi + 1, xi] * (1 - fx) * fy + g[yi + 1, xi + 1] * fx * fy)

def placement_rows(pl):
    rows = []
    for r in pl.split('/'):
        row = ''
        for ch in r: row += '.' * int(ch) if ch.isdigit() else ch
        rows.append(row)
    return rows

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('weights'); ap.add_argument('dir', nargs='?'); ap.add_argument('--jitter', type=float, default=0)
    ap.add_argument('--export'); ap.add_argument('--seed', type=int, default=0)
    a = ap.parse_args()
    if a.export:
        d = np.load(a.weights)
        parts = [d[f'c{i}{k}'].ravel() for i in range(4) for k in 'wb'] + [d['fcw'].ravel(), d['fcb'].ravel()]
        np.concatenate(parts).astype('<f4').tofile(a.export)
        print('wrote', a.export, os.path.getsize(a.export), 'bytes'); return
    net = load(a.weights); rng = np.random.default_rng(a.seed)
    labels = json.load(open(os.path.join(a.dir, 'labels.json')))
    sq_ok = sq_n = boards_ok = 0; errs = {}
    for L in labels:
        im = Image.open(os.path.join(a.dir, L['file'])).convert('L')
        k = min(1, 1600 / max(im.size))
        if k < 1: im = im.resize((round(im.width * k), round(im.height * k)), Image.BILINEAR)
        q = [(x * k, y * k) for x, y in L['corners']]
        if a.jitter:
            side = np.hypot(q[1][0] - q[0][0], q[1][1] - q[0][1])
            q = [(x + rng.uniform(-1, 1) * a.jitter * side, y + rng.uniform(-1, 1) * a.jitter * side) for x, y in q]
        board = warp(np.asarray(im), q)
        truth = placement_rows(L['placement']); ok = True
        for r in range(8):
            for f in range(8):
                p = classify(net, board[r * SQ:(r + 1) * SQ, f * SQ:(f + 1) * SQ])
                got = NAMES[int(p.argmax())]; want = truth[r][f]
                sq_n += 1
                if got == want: sq_ok += 1
                else: ok = False; errs[f'{want}->{got}'] = errs.get(f'{want}->{got}', 0) + 1
        boards_ok += ok
    top = ', '.join(f'{k} {v}' for k, v in sorted(errs.items(), key=lambda kv: -kv[1])[:6])
    print(f'squares {sq_ok / sq_n * 100:.2f}% | boards all right {boards_ok}/{len(labels)} | errors: {top}')

if __name__ == '__main__':
    main()
