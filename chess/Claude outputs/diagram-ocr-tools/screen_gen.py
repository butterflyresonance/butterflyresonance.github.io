"""Synthetic training squares for screenshots of chess apps (flat colours, crisp pieces).

    python3 screen_gen.py OUT.npz N [--glyphs duo_light,duo_dark,chesscom] [--textures custom] [--seed S]
Same output as gen.py (40x40 grey squares, labels 0 empty, 1-6 white KQRBNP,
7-12 black KQRBNP), drawn the way screenshots look:
  - own:      pieces cut from an app's starting position (screen_glyphs.py) on
              that app's own square colours, which is what people will photograph
  - cross:    those pieces on other flat colour pairs, light and dark themes
  - lichess:  the open lichess piece sets on flat colour pairs
  - texture:  (with --textures, 30% of samples) pieces and empty squares cut from a
              textured board (texture_glyphs.py), on that board's own squares
with what app boards add: a highlighted last move, coordinates in the corner of
edge squares, a slightly misplaced grid, and a little JPEG compression.
"""
import io, os, random, argparse
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import gen

TYPES = 'KQRBNP'
S, G = gen.S, gen.G
HERE = os.path.dirname(os.path.abspath(__file__))
_screen = {}
def screen_set(name):
    """{(colour, type): LA image at G px}, plus the app's (light, dark) square greys."""
    if name in _screen: return _screen[name]
    d = np.load(os.path.join(HERE, 'glyphs', name + '.npz'))
    out = {}
    for c in 'wb':
        for t in TYPES:
            p = t if c == 'w' else t.lower()
            g = Image.fromarray(np.clip(d['g_' + p], 0, 255).astype(np.uint8)).resize((G, G), Image.LANCZOS)
            a = Image.fromarray(np.clip(d['a_' + p] * 255, 0, 255).astype(np.uint8)).resize((G, G), Image.LANCZOS)
            out[(c, t)] = Image.merge('LA', (g, a))
    _screen[name] = (out, (float(d['light']), float(d['dark'])))
    return _screen[name]

_tex = {}
def texture_set(name):
    """A textured board (texture_glyphs.py): {(colour, type): (LA image, whole)} and its
    empty squares as tiles. whole: the piece was kept with its own (dark) square."""
    if name in _tex: return _tex[name]
    d = np.load(os.path.join(HERE, 'glyphs', name + '.npz'))
    out = {}
    for c in 'wb':
        for t in TYPES:
            p = t if c == 'w' else t.lower()
            g = Image.fromarray(np.clip(d['g_' + p], 0, 255).astype(np.uint8)).resize((G, G), Image.LANCZOS)
            a = Image.fromarray(np.clip(d['a_' + p] * 255, 0, 255).astype(np.uint8)).resize((G, G), Image.LANCZOS)
            out[(c, t)] = (Image.merge('LA', (g, a)), bool(d['a_' + p].min() > .99))
    tiles = {k: [Image.fromarray(np.clip(t, 0, 255).astype(np.uint8)).resize((G, G), Image.LANCZOS) for t in d['tiles_' + k]] for k in ('light', 'dark')}
    _tex[name] = (out, tiles)
    return _tex[name]

def render_texture_patch(rng, gl, tiles, centre):
    """3x3 textured squares; a piece kept with its square goes only on a dark square, as itself."""
    patch = Image.new('L', (3 * G, 3 * G))
    centre_dark = rng.random() < .5
    if centre is not None and gl[centre][1]: centre_dark = True
    for r in range(3):
        for f in range(3):
            isdark = centre_dark ^ ((r + f) % 2 == 1)
            t = rng.choice(tiles['dark' if isdark else 'light'])
            if rng.random() < .5: t = t.transpose(Image.FLIP_LEFT_RIGHT)
            if rng.random() < .5: t = t.transpose(Image.FLIP_TOP_BOTTOM)
            patch.paste(t, (f * G, r * G))
            cell = centre if (r, f) == (1, 1) else gen.random_cell(rng, .55)
            if cell is None: continue
            g, whole = gl[cell]
            if whole:
                if not isdark: continue
                patch.paste(g.getchannel('L'), (f * G, r * G))
            else:
                patch.paste(g.getchannel('L'), (f * G, r * G), g.getchannel('A'))
    return patch

def random_palette(rng):
    """A light and a dark square grey, from light and dark themes."""
    if rng.random() < .7:                       # light theme: light squares near white
        light = rng.uniform(190, 255); dark = light - rng.uniform(8, 120)
    else:                                       # dark theme: both squares dark
        dark = rng.uniform(10, 70); light = dark + rng.uniform(8, 45)
    return light, max(0, dark)

_font = {}
def font(px):
    if px not in _font: _font[px] = ImageFont.load_default(size=px)
    return _font[px]

def render_patch(rng, gl, light, dark, centre, scale):
    """3x3 flat squares around the target at G px each, pieces centred on them."""
    patch = Image.new('L', (3 * G, 3 * G), int(light))
    d = ImageDraw.Draw(patch)
    centre_dark = rng.random() < .5
    hl = rng.random() < .15                      # the last move: a tint on the square
    hl_shift = rng.uniform(-45, 25)
    for r in range(3):
        for f in range(3):
            isdark = centre_dark ^ ((r + f) % 2 == 1)
            v = dark if isdark else light
            if (r, f) == (1, 1) and hl or (r, f) != (1, 1) and rng.random() < .04:
                v = np.clip(v + hl_shift, 0, 255)
            d.rectangle([f * G, r * G, (f + 1) * G - 1, (r + 1) * G - 1], fill=int(v))
            if rng.random() < .12:               # a coordinate in the square's corner
                txt = rng.choice('abcdefgh12345678')
                fs = int(G * rng.uniform(.14, .24))
                pos = rng.choice([(f * G + 3, r * G + 1), ((f + 1) * G - fs, (r + 1) * G - fs - 4)])
                d.text(pos, txt, fill=int(light if isdark else dark), font=font(fs))
            cell = centre if (r, f) == (1, 1) else gen.random_cell(rng, .55)
            if cell is None: continue
            g = gl[cell]
            s = int(G * scale * rng.uniform(.98, 1.02))
            g = g.resize((s, s), Image.LANCZOS)
            x = f * G + (G - s) // 2; y = r * G + (G - s) // 2
            patch.paste(g.getchannel('L'), (x, y), g.getchannel('A'))
    return patch

def finish(rng, im):
    """What happens to a screenshot on its way to the reader: resizing, JPEG, a little blur."""
    if rng.random() < .3:
        im = im.filter(ImageFilter.GaussianBlur(rng.uniform(.2, .9)))
    a = np.asarray(im).astype(np.float32)
    if rng.random() < .4:                        # a phone photo of a screen rather than a screenshot
        a = (a - 128) * rng.uniform(.8, 1.05) + 128 + rng.uniform(-15, 15)
        a += np.random.normal(0, rng.uniform(0, 5), a.shape)
    im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    if rng.random() < .6:
        buf = io.BytesIO(); im.save(buf, 'JPEG', quality=rng.randint(45, 95)); im = Image.open(buf).convert('L')
    return im

def sample(rng, names, lichess_sets, textures=()):
    if textures and rng.random() < .3:
        gl, tiles = texture_set(rng.choice(textures))
        centre = gen.random_cell(rng, .35)
        patch = render_texture_patch(rng, gl, tiles, centre)
        return cut_and_finish(rng, patch, centre)
    mode = rng.choices(['own', 'cross', 'lichess'], [45, 25, 30])[0]
    if mode == 'lichess':
        gl = None
        while gl is None: gl = gen.glyphs(rng.choice(lichess_sets))
        light, dark = random_palette(rng); scale = rng.uniform(.75, 1.0)
    else:
        gl, (light, dark) = screen_set(rng.choice(names))
        if mode == 'cross': light, dark = random_palette(rng)
        scale = rng.uniform(.93, 1.04)
    centre = gen.random_cell(rng, .35)
    patch = render_patch(rng, gl, light, dark, centre, scale)
    return cut_and_finish(rng, patch, centre)

def cut_and_finish(rng, patch, centre):
    """The centre square, cut where the reader would cut it, finished like a screenshot."""
    # corners set by hand on a screenshot: off by up to ~5% of a square, size off by up to ±4%
    cut = G * rng.uniform(.96, 1.04)
    cx = 1.5 * G + rng.uniform(-.05, .05) * G
    cy = 1.5 * G + rng.uniform(-.05, .05) * G
    sq = patch.crop((int(cx - cut / 2), int(cy - cut / 2), int(cx + cut / 2), int(cy + cut / 2))).resize((G, G), Image.BILINEAR)
    sq = finish(rng, sq).resize((S, S), rng.choice([Image.BILINEAR, Image.BICUBIC, Image.LANCZOS, Image.BOX]))
    label = 0 if centre is None else (1 if centre[0] == 'w' else 7) + TYPES.index(centre[1])
    return np.asarray(sq, dtype=np.uint8), label

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('out'); ap.add_argument('n', type=int)
    ap.add_argument('--glyphs', default='duo_light,duo_dark,chesscom'); ap.add_argument('--textures', default='')
    ap.add_argument('--seed', type=int, default=0)
    a = ap.parse_args()
    rng = random.Random(a.seed); np.random.seed(a.seed)
    names = a.glyphs.split(','); sets = gen.all_sets(); textures = [t for t in a.textures.split(',') if t]
    X = np.zeros((a.n, S, S), np.uint8); Y = np.zeros(a.n, np.uint8)
    for i in range(a.n):
        X[i], Y[i] = sample(rng, names, sets, textures)
    np.savez_compressed(a.out, x=X, y=Y)
    print(f'{a.out}: {a.n} screen squares ({",".join(names)} + {len(sets)} lichess sets)')

if __name__ == '__main__':
    main()
