"""Synthetic training squares for book-diagram recognition.

Each sample is one board square cut from a 3x3 neighbourhood (so neighbouring
pieces bleed in at the edges, as they do when the grid is slightly off), drawn in
a random book style: plain or hatched or stippled dark squares, a random piece
set, then roughened like a phone photo of a printed page.

    python3 gen.py OUT.npz N [--sets a,b,c | --exclude a,b,c] [--seed S]
Labels: 0 empty, 1-6 white K Q R B N P, 7-12 black K Q R B N P.
"""
import io, os, sys, random, argparse
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps
import cairosvg

PIECE_DIR = os.path.join(os.path.dirname(__file__), '..', 'dl', 'lila', 'public', 'piece')
SKIP = {'disguised', 'mono'}          # identical shapes for both colours or all pieces: unlearnable
TYPES = 'KQRBNP'
S = 40                                # output square size (pixels)
R = 2                                 # render at R x S, then shrink: smoother edges
G = S * R

_glyphs = {}
def glyphs(name):
    """{(colour, type): grey RGBA image at G px} for one piece set."""
    if name in _glyphs: return _glyphs[name]
    out = {}
    for c in 'wb':
        for t in TYPES:
            base = os.path.join(PIECE_DIR, name, f'{c}{t}')
            if os.path.exists(base + '.svg'):
                png = cairosvg.svg2png(url=base + '.svg', output_width=G, output_height=G)
                im = Image.open(io.BytesIO(png)).convert('RGBA')
            elif os.path.exists(base + '.webp'):
                im = Image.open(base + '.webp').convert('RGBA').resize((G, G), Image.LANCZOS)
            else:
                return None
            # to grey, keeping alpha: book diagrams are black and white
            g = ImageOps.grayscale(im.convert('RGB'))
            out[(c, t)] = Image.merge('LA', (g, im.getchannel('A')))
    _glyphs[name] = out
    return out

def all_sets():
    return sorted(d for d in os.listdir(PIECE_DIR) if d not in SKIP and os.path.isdir(os.path.join(PIECE_DIR, d)))

def dark_square(rng, style, size):
    """A dark square in one of the styles books use."""
    sq = Image.new('L', (size, size), style['paper'])
    d = ImageDraw.Draw(sq)
    k = style['kind']
    if k == 'grey':
        sq.paste(style['grey'], (0, 0, size, size))
    elif k == 'hatch':
        sp, w, ang = style['spacing'], style['width'], style['angle']
        for off in range(-2 * size, 2 * size, sp):
            if ang > 0: d.line([(off, size), (off + size, 0)], fill=style['ink'], width=w)
            else:       d.line([(off, 0), (off + size, size)], fill=style['ink'], width=w)
    elif k == 'dots':
        sp = style['spacing']
        for y in range(0, size, sp):
            for x in range((y // sp % 2) * sp // 2, size, sp):
                d.ellipse([x, y, x + style['width'], y + style['width']], fill=style['ink'])
    elif k == 'cross':
        sp, w = style['spacing'], style['width']
        for off in range(-2 * size, 2 * size, sp):
            d.line([(off, size), (off + size, 0)], fill=style['ink'], width=w)
            d.line([(off, 0), (off + size, size)], fill=style['ink'], width=w)
    # 'none': books that don't shade dark squares
    return sq

def board_style(rng):
    paper = rng.randint(215, 255)
    kind = rng.choices(['hatch', 'grey', 'dots', 'cross', 'none'], [45, 30, 8, 7, 10])[0]
    return {
        'paper': paper, 'kind': kind,
        'grey': rng.randint(110, 215),
        'ink': rng.randint(0, 90),
        'spacing': rng.randint(3, 8) * R,
        'width': rng.choice([1, 1, 2]) * R,
        'angle': rng.choice([1, -1]),
    }

def random_cell(rng, p_empty):
    if rng.random() < p_empty: return None
    c = rng.choice('wb')
    t = rng.choices(TYPES, [6, 6, 10, 10, 10, 22])[0]
    return (c, t)

def render_patch(rng, gl, style, centre, scale, dx, dy):
    """3x3 squares around the target, alternating colours, at G px each."""
    patch = Image.new('L', (3 * G, 3 * G), style['paper'])
    centre_dark = rng.random() < .5
    for r in range(3):
        for f in range(3):
            dark = centre_dark ^ ((r + f) % 2 == 1)
            if dark: patch.paste(dark_square(rng, style, G), (f * G, r * G))
            cell = centre if (r, f) == (1, 1) else random_cell(rng, .6)
            if cell is None: continue
            g = gl[cell]
            s = int(G * scale * rng.uniform(.97, 1.03))
            sw = int(s * rng.uniform(.9, 1.1))           # fonts differ in proportions too
            g = g.resize((sw, s), Image.LANCZOS)
            L, A = g.getchannel('L'), g.getchannel('A')
            k = rng.random()                            # and in line weight
            if k < .25: L = L.filter(ImageFilter.MinFilter(3))
            elif k < .4: L = L.filter(ImageFilter.MaxFilter(3))
            x = f * G + (G - sw) // 2 + int(dx * G)
            y = r * G + (G - s) // 2 + int(dy * G)
            patch.paste(L, (x, y), A)
    return patch

def roughen(rng, im):
    """Make a clean render look like a phone photo of a page."""
    if rng.random() < .7:   # small rotation / perspective from an imperfect crop
        im = im.rotate(rng.uniform(-3, 3), resample=Image.BILINEAR, fillcolor=int(np.mean(np.asarray(im))))
    if rng.random() < .8:
        im = im.filter(ImageFilter.GaussianBlur(rng.uniform(.2, 1.8)))
    a = np.asarray(im).astype(np.float32)
    # uneven light: a gradient across the square
    gx, gy = np.meshgrid(np.linspace(-1, 1, a.shape[1]), np.linspace(-1, 1, a.shape[0]))
    a *= 1 + rng.uniform(-.15, .15) * gx + rng.uniform(-.15, .15) * gy
    # contrast / brightness / gamma
    a = (a - 128) * rng.uniform(.55, 1.15) + 128 + rng.uniform(-35, 25)
    a = np.clip(a, 0, 255)
    a = 255 * (a / 255) ** rng.uniform(.7, 1.4)
    a += np.random.normal(0, rng.uniform(0, 9), a.shape)
    im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    if rng.random() < .6:
        buf = io.BytesIO(); im.save(buf, 'JPEG', quality=rng.randint(25, 90)); im = Image.open(buf).convert('L')
    return im

def sample(rng, sets):
    gl = None
    while gl is None:
        gl = glyphs(rng.choice(sets))
    style = board_style(rng)
    centre = random_cell(rng, .35)
    scale = rng.uniform(.72, 1.0)
    patch = render_patch(rng, gl, style, centre, scale, rng.uniform(-.04, .04), rng.uniform(-.04, .04))
    # where the grid really is vs where we cut: off by up to ~10% of a square, size off by ±8%
    cut = G * rng.uniform(.92, 1.08)
    cx = 1.5 * G + rng.uniform(-.1, .1) * G
    cy = 1.5 * G + rng.uniform(-.1, .1) * G
    box = (int(cx - cut / 2), int(cy - cut / 2), int(cx + cut / 2), int(cy + cut / 2))
    sq = patch.crop(box).resize((G, G), Image.BILINEAR)
    sq = roughen(rng, sq).resize((S, S), rng.choice([Image.BILINEAR, Image.BICUBIC, Image.LANCZOS, Image.BOX]))
    label = 0 if centre is None else (1 if centre[0] == 'w' else 7) + TYPES.index(centre[1])
    return np.asarray(sq, dtype=np.uint8), label

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('out'); ap.add_argument('n', type=int)
    ap.add_argument('--sets'); ap.add_argument('--exclude'); ap.add_argument('--seed', type=int, default=0)
    a = ap.parse_args()
    sets = all_sets()
    if a.sets: sets = [s for s in sets if s in a.sets.split(',')]
    if a.exclude: sets = [s for s in sets if s not in a.exclude.split(',')]
    rng = random.Random(a.seed); np.random.seed(a.seed)
    X = np.zeros((a.n, S, S), np.uint8); Y = np.zeros(a.n, np.uint8)
    for i in range(a.n):
        X[i], Y[i] = sample(rng, sets)
    np.savez_compressed(a.out, x=X, y=Y)
    print(f'{a.out}: {a.n} squares from {len(sets)} sets')

if __name__ == '__main__':
    main()
