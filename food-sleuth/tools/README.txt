Testing the label reader (not needed by the app).

synth.py  makes 23 fake nutrition-panel photos (AU and US styles) with known
          answers: test images go in tools/img, answers in tools/truth.json.
run.js    reads each one with the same clean-up and parser as the app and
          reports which numbers came out right. Last result: 87/92.

  python3 synth.py
  npm i tesseract.js@7.0.0 jpeg-js pngjs
  node run.js 6        (6 = Tesseract page mode; 6 tested best)
