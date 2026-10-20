"""Whole synthetic 'phone photos' of book diagrams, for testing the full pipeline.

    python3 synth_board.py OUTDIR N [--sets leipzig,alpha] [--seed S]
Writes OUTDIR/NNN.jpg and OUTDIR/labels.json: [{file, placement, corners}] where
corners are the board's inner corners (a8, h8, h1, a1 as drawn) in photo pixels.
"""
import os, sys, json, random, argparse
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import gen

def random_position(rng):
    cells = {}
    sqs = [(r, f) for r in range(8) for f in range(8)]
    rng.shuffle(sqs)
    cells[sqs.pop()] = ('w', 'K'); cells[sqs.pop()] = ('b', 'K')
    for _ in range(rng.randint(6, 26)):
        r, f = sqs.pop()
        c = rng.choice('wb'); t = rng.choices('QRBNP', [2, 5, 5, 5, 16])[0]
        if t == 'P' and r in (0, 7): t = 'N'
        cells[(r, f)] = (c, t)
    return cells

def placement(cells):
    rows = []
    for r in range(8):
        row, gap = '', 0
        for f in range(8):
            p = cells.get((r, f))
            if not p: gap += 1; continue
            if gap: row += str(gap); gap = 0
            row += p[1] if p[0] == 'w' else p[1].lower()
        rows.append(row + (str(gap) if gap else ''))
    return '/'.join(rows)

def persp_coeffs(src, dst):
    """PIL wants output->input: solve for coefficients mapping dst points to src points."""
    A, b = [], []
    for (x, y), (u, v) in zip(dst, src):
        A.append([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.append(u)
        A.append([0, 0, 0, x, y, 1, -v * x, -v * y]); b.append(v)
    return np.linalg.solve(np.array(A, float), np.array(b, float)).tolist()

def make(rng, sets):
    gl = None
    while gl is None: gl = gen.glyphs(rng.choice(sets))
    style = gen.board_style(rng)
    sqz = gen.G
    B = 8 * sqz
    board = Image.new('L', (B, B), style['paper'])
    cells = random_position(rng)
    scale = rng.uniform(.78, .95)
    for r in range(8):
        for f in range(8):
            if (r + f) % 2 == 1: board.paste(gen.dark_square(rng, style, sqz), (f * sqz, r * sqz))
            p = cells.get((r, f))
            if p:
                g = gl[p]; s = int(sqz * scale); g = g.resize((s, s), Image.LANCZOS)
                board.paste(g.getchannel('L'), (f * sqz + (sqz - s) // 2, r * sqz + (sqz - s) // 2), g.getchannel('A'))
    # a frame round the board, then the page around it, with a few lines of 'text'
    bw = rng.randint(2, 8)
    page_w = int(B * rng.uniform(1.25, 1.6)); page_h = int(B * rng.uniform(1.3, 1.8))
    page = Image.new('L', (page_w, page_h), style['paper'])
    ox = (page_w - B) // 2 + rng.randint(-B // 10, B // 10); oy = (page_h - B) // 2 + rng.randint(-B // 10, B // 10)
    d = ImageDraw.Draw(page)
    d.rectangle([ox - bw, oy - bw, ox + B + bw - 1, oy + B + bw - 1], fill=rng.randint(0, 60))
    page.paste(board, (ox, oy))
    for k in range(rng.randint(0, 6)):           # caption / body text as dark dashes
        y = rng.choice([rng.randint(5, max(6, oy - 30)), rng.randint(min(oy + B + 20, page_h - 10), page_h - 6)])
        x = rng.randint(5, page_w // 3)
        while x < page_w - 30:
            w = rng.randint(10, 50); d.rectangle([x, y, x + w, y + rng.randint(6, 12)], fill=rng.randint(20, 90)); x += w + rng.randint(8, 16)
    inner = [(ox, oy), (ox + B, oy), (ox + B, oy + B), (ox, oy + B)]
    # perspective: move the page corners a little, as a hand-held photo would
    W, H = page_w, page_h
    j = lambda: rng.uniform(-.07, .07)
    dst = [(W * j(), H * j()), (W * (1 + j()), H * j()), (W * (1 + j()), H * (1 + j())), (W * j(), H * (1 + j()))]
    minx = min(p[0] for p in dst); miny = min(p[1] for p in dst)
    pad = 0.08
    dst = [(x - minx + W * pad, y - miny + H * pad) for x, y in dst]
    OW = int(max(p[0] for p in dst) + W * pad); OH = int(max(p[1] for p in dst) + H * pad)
    src = [(0, 0), (W, 0), (W, H), (0, H)]
    co = persp_coeffs(src, dst)
    bg = rng.randint(40, 200)
    photo = page.transform((OW, OH), Image.PERSPECTIVE, co, Image.BICUBIC, fillcolor=bg)
    # where the inner corners went: forward map with the inverse (src->dst) homography
    inv = persp_coeffs(dst, src)
    def fwd(x, y):
        a, b_, c, d_, e, f_, g_, h = inv
        den = g_ * x + h * y + 1
        return ((a * x + b_ * y + c) / den, (d_ * x + e * y + f_) / den)
    corners = [fwd(*p) for p in inner]
    # phone-photo roughness, at a typical phone resolution
    target = rng.randint(900, 1600)
    k = target / max(OW, OH)
    photo = photo.resize((int(OW * k), int(OH * k)), Image.BILINEAR)
    corners = [(x * k, y * k) for x, y in corners]
    photo = photo.filter(ImageFilter.GaussianBlur(rng.uniform(.3, 1.6)))
    a = np.asarray(photo).astype(np.float32)
    gx, gy = np.meshgrid(np.linspace(-1, 1, a.shape[1]), np.linspace(-1, 1, a.shape[0]))
    a *= 1 + rng.uniform(-.25, .25) * gx + rng.uniform(-.25, .25) * gy
    a = (a - 128) * rng.uniform(.6, 1.1) + 128 + rng.uniform(-30, 20)
    a += np.random.normal(0, rng.uniform(1, 7), a.shape)
    photo = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).convert('RGB')
    return photo, placement(cells), corners

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('out'); ap.add_argument('n', type=int)
    ap.add_argument('--sets'); ap.add_argument('--seed', type=int, default=0)
    a = ap.parse_args()
    sets = gen.all_sets()
    if a.sets: sets = [s for s in sets if s in a.sets.split(',')]
    rng = random.Random(a.seed); np.random.seed(a.seed)
    os.makedirs(a.out, exist_ok=True)
    labels = []
    for i in range(a.n):
        photo, pl, corners = make(rng, sets)
        fn = f'{i:03d}.jpg'
        photo.save(os.path.join(a.out, fn), quality=rng.randint(60, 92))
        labels.append({'file': fn, 'placement': pl, 'corners': [[round(x, 1), round(y, 1)] for x, y in corners]})
    json.dump(labels, open(os.path.join(a.out, 'labels.json'), 'w'))
    print(f'{a.n} photos in {a.out}')

if __name__ == '__main__':
    main()
