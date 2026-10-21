"""Synthetic nutrition-label photos with ground truth, for testing the reader.
Writes test/img/NN.jpg and test/truth.json."""
import json, os, random
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont

random.seed(7); np.random.seed(7)
HERE = os.path.dirname(os.path.abspath(__file__))
os.makedirs(os.path.join(HERE, 'img'), exist_ok=True)
FONTS = ['/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
         '/usr/share/fonts/truetype/dejavu/DejaVuSansCondensed.ttf',
         '/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf']
BOLD = {'/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf': '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
        '/usr/share/fonts/truetype/dejavu/DejaVuSansCondensed.ttf': '/usr/share/fonts/truetype/dejavu/DejaVuSansCondensed-Bold.ttf',
        '/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf': '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'}

def fmt(v):
    if v >= 100: return str(int(round(v)))
    if v >= 10: return f'{v:.1f}'.rstrip('0').rstrip('.') if random.random() < .5 else f'{v:.1f}'
    return f'{v:.1f}'

def au_label(food):
    s = food['serve']; per100 = food['p100']; k = s / 100
    unit = food.get('unit', 'g')
    kj = per100['kcal'] * 4.184
    withcal = random.random() < .5
    def e(v):
        return f'{int(round(v))}kJ ({int(round(v/4.184))}Cal)' if withcal else f'{int(round(v))}kJ'
    rows = [('Energy', e(kj * k), e(kj)),
            ('Protein', fmt(per100['protein'] * k) + 'g', fmt(per100['protein']) + 'g'),
            ('Fat, total', fmt(per100['fat'] * k) + 'g', fmt(per100['fat']) + 'g'),
            ('- saturated', fmt(per100['fat'] * .3 * k) + 'g', fmt(per100['fat'] * .3) + 'g'),
            ('Carbohydrate', fmt(per100['carbs'] * k) + 'g', fmt(per100['carbs']) + 'g'),
            ('- sugars', fmt(per100['carbs'] * .4 * k) + 'g', fmt(per100['carbs'] * .4) + 'g'),
            ('Dietary fibre', fmt(3.1 * k) + 'g', '3.1g'),
            ('Sodium', f'{int(round(210*k))}mg', '210mg')]
    head = ['NUTRITION INFORMATION',
            f'Servings per package: {random.choice([4, 8, 12, 15])}',
            f'Serving size: {s:g}{unit}']
    cols = ('', 'Avg Quantity\nper Serving', f'Avg Quantity\nper 100{unit}')
    return head, cols, rows

def us_label(food):
    s = food['serve']; per100 = food['p100']; k = s / 100
    head = ['Nutrition Facts', '8 servings per container',
            f'Serving size  2/3 cup ({s:g}g)', f'Calories  {int(round(per100["kcal"]*k))}']
    rows = [('Total Fat', f'{fmt(per100["fat"]*k)}g', '10%'),
            ('  Saturated Fat', f'{fmt(per100["fat"]*.3*k)}g', '5%'),
            ('Sodium', '160mg', '7%'),
            ('Total Carbohydrate', f'{fmt(per100["carbs"]*k)}g', '13%'),
            ('  Total Sugars', f'{fmt(per100["carbs"]*.4*k)}g', ''),
            ('Protein', f'{fmt(per100["protein"]*k)}g', '')]
    return head, ('', '', '% Daily Value*'), rows

def draw(kind, food):
    head, cols, rows = (au_label if kind == 'au' else us_label)(food)
    fp = random.choice(FONTS); fs = random.randint(24, 34)
    f = ImageFont.truetype(fp, fs); fb = ImageFont.truetype(BOLD[fp], fs)
    W = int(fs * 27); H = int(fs * 1.6 * (len(head) + len(rows) + 4))
    im = Image.new('L', (W, H), 255); d = ImageDraw.Draw(im)
    y = fs; m = fs
    d.rectangle([m // 2, m // 2, W - m // 2, H - m // 2], outline=0, width=3)
    for i, h in enumerate(head):
        d.text((m, y), h, font=fb if i == 0 else f, fill=0); y += int(fs * 1.5)
    d.line([m, y, W - m, y], fill=0, width=3); y += fs // 2
    cx = [m, int(W * .36), int(W * .67)]
    if any(cols):
        for i, c in enumerate(cols):
            d.multiline_text((cx[i], y), c, font=f, fill=0, spacing=2)
        y += int(fs * 2.6)
    d.line([m, y, W - m, y], fill=0, width=2); y += fs // 3
    for r in rows:
        for i, c in enumerate(r):
            d.text((cx[i], y), c, font=fb if i == 0 and kind == 'us' and not c.startswith(' ') else f, fill=0)
        y += int(fs * 1.5)
        d.line([m, y - fs // 5, W - m, y - fs // 5], fill=120, width=1)
    return np.array(im)

def photo(a):
    h, w = a.shape
    pad = 120
    bg = np.full((h + 2 * pad, w + 2 * pad), random.randint(150, 220), np.uint8)
    bg[pad:pad + h, pad:pad + w] = a
    a = bg; h, w = a.shape
    j = lambda: random.uniform(-.04, .04) * w
    src = np.float32([[0, 0], [w, 0], [w, h], [0, h]])
    dst = np.float32([[j(), j()], [w + j(), j()], [w + j(), h + j()], [j(), h + j()]])
    M = cv2.getPerspectiveTransform(src, dst)
    a = cv2.warpPerspective(a, M, (w, h), borderValue=180)
    yy, xx = np.mgrid[0:h, 0:w]
    light = 1 - .35 * ((xx / w) * random.uniform(.3, 1) + (yy / h) * random.uniform(0, .6))
    a = (a.astype(np.float32) * light)
    a = cv2.GaussianBlur(a, (0, 0), random.uniform(.6, 1.6))
    a = a + np.random.normal(0, 6, a.shape)
    a = np.clip(a, 0, 255).astype(np.uint8)
    col = cv2.cvtColor(a, cv2.COLOR_GRAY2BGR)
    col = (col * np.array([random.uniform(.85, 1), random.uniform(.9, 1), 1])).astype(np.uint8)
    return col

FOODS = [
    dict(name='Rolled oats', serve=40, p100=dict(kcal=375, protein=12.4, fat=8.6, carbs=56.5)),
    dict(name='Greek yoghurt', serve=170, p100=dict(kcal=97, protein=9.0, fat=5.0, carbs=3.9)),
    dict(name='Almond milk', serve=250, unit='mL', p100=dict(kcal=21, protein=0.6, fat=1.3, carbs=1.4)),
    dict(name='Whey', serve=30, p100=dict(kcal=390, protein=78.0, fat=6.2, carbs=6.5)),
    dict(name='Muesli bar', serve=35, p100=dict(kcal=430, protein=7.1, fat=16.0, carbs=62.0)),
    dict(name='Peanut butter', serve=20, p100=dict(kcal=620, protein=25.0, fat=50.0, carbs=12.0)),
    dict(name='Frozen berries', serve=125, p100=dict(kcal=45, protein=0.9, fat=0.3, carbs=8.7)),
    dict(name='Wholemeal bread', serve=76, p100=dict(kcal=247, protein=10.1, fat=2.9, carbs=40.5)),
]
truth = []
n = 0
for food in FOODS:
    for kind in ('au', 'au', 'us'):
        if kind == 'us' and food.get('unit') == 'mL': continue
        n += 1
        img = photo(draw(kind, food))
        p = os.path.join(HERE, 'img', f'{n:02d}.jpg')
        cv2.imwrite(p, img, [cv2.IMWRITE_JPEG_QUALITY, 80])
        truth.append(dict(file=f'{n:02d}.jpg', kind=kind, **food))
json.dump(truth, open(os.path.join(HERE, 'truth.json'), 'w'), indent=1)
print(n, 'images')
