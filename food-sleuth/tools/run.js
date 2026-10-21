// node test/run.js [psm] [raw]  -- reads test/img/*.jpg, compares to truth.json
const fs = require('fs'), path = require('path');
const jpeg = require('jpeg-js'), { PNG } = require('pngjs');
const { createWorker } = require('tesseract.js');
const R = require('../reader.js');
const psm = process.argv[2] || '6', raw = process.argv[3] === 'raw';
const only = process.argv[4];

function resize(src, w, h, W, H) {
  const out = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const sx = (x + .5) * w / W - .5, sy = (y + .5) * h / H - .5;
    const x0 = Math.max(0, Math.floor(sx)), y0 = Math.max(0, Math.floor(sy));
    const x1 = Math.min(w - 1, x0 + 1), y1 = Math.min(h - 1, y0 + 1), fx = sx - x0, fy = sy - y0;
    for (let c = 0; c < 4; c++) {
      const a = src[(y0 * w + x0) * 4 + c], b = src[(y0 * w + x1) * 4 + c], d = src[(y1 * w + x0) * 4 + c], e = src[(y1 * w + x1) * 4 + c];
      out[(y * W + x) * 4 + c] = (a * (1 - fx) + b * fx) * (1 - fy) + (d * (1 - fx) + e * fx) * fy;
    }
  }
  return out;
}

(async () => {
  const truth = JSON.parse(fs.readFileSync(path.join(__dirname, 'truth.json')));
  const worker = await createWorker('eng', 1, { langPath: path.join(__dirname, '../ocr'), cachePath: '/tmp/tcache' });
  await worker.setParameters({ tessedit_pageseg_mode: psm, preserve_interword_spaces: '1' });
  let score = 0, total = 0;
  for (const t of truth) {
    if (only && t.file !== only) continue;
    const img = jpeg.decode(fs.readFileSync(path.join(__dirname, 'img', t.file)), { useTArray: true });
    const W = 1600, H = Math.round(img.height * W / img.width);
    let px = resize(img.data, img.width, img.height, W, H);
    if (!raw) px = R.clean(px, W, H);
    const png = new PNG({ width: W, height: H }); png.data = Buffer.from(px.buffer);
    const buf = PNG.sync.write(png);
    if (only) fs.writeFileSync('/tmp/clean.png', buf);
    const { data } = await worker.recognize(buf);
    const res = R.parseLabel(data.text);
    const k = t.serve / 100;
    const want = t.kind === 'us' ? t.p100 : t.p100;
    const bad = [];
    for (const key of ['kcal', 'protein', 'fat', 'carbs']) {
      total++;
      const got = res.per100[key], w = want[key];
      // US labels are rounded per serve, so allow rounding slack
      const tol = t.kind === 'us' ? Math.max(1, .5 / k + .05 * w) : Math.max(.15, .02 * w) + (key === 'kcal' ? 2 : 0);
      if (got != null && Math.abs(got - w) <= tol) score++; else bad.push(`${key} ${got} vs ${w}`);
    }
    const serveOk = res.serve === t.serve;
    console.log(t.file, t.kind, serveOk ? '' : `SERVE ${res.serve}`, bad.join('; ') || 'ok', res.notes.length ? '| ' + res.notes.join(' / ') : '');
    if (only || bad.length) console.log('   ' + data.text.replace(/\n/g, '\n   '));
  }
  console.log(`\n${score}/${total} values right`);
  await worker.terminate();
})();
