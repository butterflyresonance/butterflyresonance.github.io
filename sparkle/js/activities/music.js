/* ---------- music: listening games, singing, song tiles and instruments ---------- */
function audio() {
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
    if (ac.state === 'suspended') ac.resume();
    return ac;
  } catch { return null; }
}
// one note. kinds: 'bell' (the games), 'xylo' (a wooden bar), 'drum' (a steel tongue drum), 'tick'
function note(freq, dur = .45, vol = .22, kind = 'bell', when = 0) {
  if (!opts.sound) return;
  const a = audio(); if (!a) return;
  try {
    const t = a.currentTime + when, g = a.createGain();
    const parts = kind === 'xylo' ? [['sine', 1, 1, dur], ['sine', 3.98, .35, .08], ['sine', 10.1, .12, .03]]
      : kind === 'drum' ? [['sine', 1, 1, dur], ['sine', 2.01, .18, dur * .5], ['sine', 3.02, .06, .4]]
      : kind === 'tick' ? [['triangle', 1, 1, .05]]
      : [['triangle', 1, 1, dur], ['sine', 2, .25, dur]];
    g.gain.value = vol; g.connect(a.destination);
    for (const [type, mult, v, d] of parts) {
      const o = a.createOscillator(), og = a.createGain();
      o.type = type; o.frequency.setValueAtTime(freq * mult, t);
      if (kind === 'drum' && mult === 1) o.frequency.exponentialRampToValueAtTime(freq * .997, t + d);
      og.gain.setValueAtTime(0, t); og.gain.linearRampToValueAtTime(v, t + (kind === 'drum' ? .008 : .004)); og.gain.exponentialRampToValueAtTime(.0005, t + d);
      o.connect(og); og.connect(g); o.start(t); o.stop(t + d + .05);
    }
  } catch {}
}
const semis = (base, n) => base * Math.pow(2, n / 12);
const NOTE = n => 440 * Math.pow(2, (n - 69) / 12);                       // MIDI number to frequency
const NN = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const midi = s => { const m = s.match(/^([A-G])(#|b)?(\d)$/); return 12 * (+m[3] + 1) + NN[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); };

/* =========== the listening games =========== */
const PADS = [
  { i: '1F43B', name: 'bear', f: 261.63, c: '#c99a6e' }, { i: '1F438', name: 'frog', f: 329.63, c: '#7fd67a' },
  { i: '1F431', name: 'cat', f: 392.0, c: '#ffb36b' }, { i: '1F426', name: 'bird', f: 523.25, c: '#7fc8ff' },
];
const MUS_MODES = [['copy', 'Copy the tune'], ['pitch', 'Up or down'], ['same', 'Same or different'], ['mood', 'Happy or sad'], ['sing', 'Sing it']];
let musMode = store.get('musMode') || 'copy';
if (!MUS_MODES.some(m => m[0] === musMode)) musMode = 'copy';
let mus = { seq: [], at: 0, len: 2, misses: 0, busy: true, round: 0 };

/* each ear game: levels (easy to hard), make(level) a question, play(q) it, and the answer buttons.
   Three right first time in a row: a level harder. A miss: a level easier. */
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16];
const EAR = {
  pitch: {
    levels: [12, 9, 7, 5, 4, 3, 2, 1],                   // semitones apart
    intro: 'Listen to two notes. Does the second one go up, down, or stay the same?',
    ask: 'Up, down, or the same?',
    btns: [['down', '1F43B', 'Down'], ['same', '<svg viewBox="0 0 64 64"><path d="M14 24h36M14 40h36" stroke="#8f5cff" stroke-width="8" stroke-linecap="round"/></svg>', 'Same'], ['up', '1F426', 'Up']],
    make(lv) {
      const n = this.levels[lv], r = Math.random(), base = semis(220, 3 + Math.floor(Math.random() * 10));
      const a = r < .2 ? 'same' : r < .6 ? 'up' : 'down';
      return { a, f1: a === 'down' ? semis(base, n) : base, f2: a === 'up' ? semis(base, n) : base };
    },
    async play(q) { await dots([[q.f1], [q.f2]], 800); },
    right: q => `Yes! It went ${q.a === 'same' ? 'nowhere. They were the same' : q.a}!`,
    show(q) { const d = $$('#earShow .pn'); if (d[1]) d[1].style.setProperty('--y', q.a === 'up' ? '-1' : q.a === 'down' ? '1' : '0'); },
  },
  same: {
    // [notes in the tune, how far the changed note moves]
    levels: [[3, 7], [3, 4], [4, 4], [4, 2], [5, 2], [5, 1]],
    intro: 'Listen to two little tunes. Are they the same, or different?',
    ask: 'Same, or different?',
    btns: [['same', '<svg viewBox="0 0 64 64"><circle cx="20" cy="32" r="13" fill="#ff6fb8" stroke="#4a3159" stroke-width="3"/><circle cx="44" cy="32" r="13" fill="#ff6fb8" stroke="#4a3159" stroke-width="3"/></svg>', 'Same'], ['diff', '<svg viewBox="0 0 64 64"><circle cx="20" cy="32" r="13" fill="#ff6fb8" stroke="#4a3159" stroke-width="3"/><rect x="32" y="19" width="26" height="26" rx="5" fill="#9b6bff" stroke="#4a3159" stroke-width="3"/></svg>', 'Different']],
    make(lv) {
      const [len, step] = this.levels[lv], base = 60 + Math.floor(Math.random() * 3);
      const t1 = Array.from({ length: len }, () => base + pick(PENTA));
      const t2 = t1.slice(), a = Math.random() < .5 ? 'same' : 'diff';
      if (a === 'diff') { const i = 1 + Math.floor(Math.random() * (len - 1)); t2[i] += Math.random() < .5 || t2[i] - step < base ? step : -step; }
      return { a, t1, t2 };
    },
    async play(q) {
      el('earShow').innerHTML = `<div class="tune">${q.t1.map(() => '<i></i>').join('')}</div><div class="tune">${q.t2.map(() => '<i></i>').join('')}</div>`;
      const rows = $$('#earShow .tune');
      for (const [k, t] of [[0, q.t1], [1, q.t2]]) {
        for (let i = 0; i < t.length; i++) { const d = rows[k].children[i]; d.classList.add('on'); note(NOTE(t[i]), .45); await wait(430); d.classList.remove('on'); }
        if (!k) await wait(500);
      }
    },
    right: q => q.a === 'same' ? 'Yes! They were just the same!' : 'Yes! One note was different!',
    show() {},
  },
  mood: {
    // how it's played: chord and its notes together, just the chord, just the notes, a little tune
    levels: ['both', 'chord', 'arp', 'tune'],
    intro: 'Listen. Does the music sound happy, or sad?',
    ask: 'Happy, or sad?',
    btns: [['happy', '2600', 'Happy'], ['sad', '1F327', 'Sad']],
    make(lv) { return { a: Math.random() < .5 ? 'happy' : 'sad', how: this.levels[lv], root: 57 + Math.floor(Math.random() * 6) }; },
    async play(q) {
      el('earShow').innerHTML = '<span class="moodnote">♪</span>';
      const third = q.a === 'happy' ? 4 : 3, ch = [0, third, 7, 12].map(i => NOTE(q.root + i));
      const chord = () => ch.forEach((f, i) => note(f, 1.6, .12, 'bell', i * .012));
      if (q.how === 'both' || q.how === 'chord') { chord(); await wait(1500); }
      if (q.how === 'both' || q.how === 'arp') { for (const f of ch) { note(f, .6); await wait(330); } await wait(400); }
      if (q.how === 'tune') {
        const sc = q.a === 'happy' ? [0, 2, 4, 5, 7, 9, 11, 12] : [0, 2, 3, 5, 7, 8, 10, 12];
        for (const d of [0, 2, 4, 2, 0, 4, 7]) { note(NOTE(q.root + sc[d]), .5); await wait(360); }
        chord(); await wait(1300);
      }
    },
    right: q => q.a === 'happy' ? 'Yes! That was happy music!' : 'Yes! That was sad music.',
    show() {},
  },
};
const earSt = {};
for (const k of Object.keys(EAR)) earSt[k] = { lv: store.get('ear:' + k) ?? 0, run: 0, q: null, missed: false, busy: false };
async function dots(groups, ms) {
  el('earShow').innerHTML = groups.map((_, i) => `<span class="pn" style="--y:0">${i + 1}</span>`).join('');
  const d = $$('#earShow .pn');
  for (let i = 0; i < groups.length; i++) { d[i].classList.add('on'); groups[i].forEach(f => note(f, .7)); await wait(ms); d[i].classList.remove('on'); }
}
function earLvl() {
  const E = EAR[musMode], s = earSt[musMode];
  el('earLvl').innerHTML = E.levels.map((_, i) => `<span class="${i <= s.lv ? 'on' : ''}"></span>`).join('');
  el('earLvl').dataset.say = `Level ${s.lv + 1}`;
}

function musChips() {
  el('pads').classList.toggle('hidden', musMode !== 'copy');
  el('ear').classList.toggle('hidden', !EAR[musMode]);
  el('sing').classList.toggle('hidden', musMode !== 'sing');
}
function goBtn(label, again) {
  const g = el('musGo');
  g.textContent = label; g.dataset.say = again ? '' : label;
  if (again) g.dataset.again = '1'; else delete g.dataset.again;
  g.classList.remove('hidden');
}
enter.music = kind => {
  if (MUS_MODES.some(m => m[0] === kind)) { musMode = kind; store.set('musMode', musMode); }
  singStop();
  musChips();
  el('pads').innerHTML = PADS.map((p, i) => `<button class="pad" data-p="${i}" style="--c:${p.c}" aria-label="${p.name}">${iconImg(p.i)}</button>`).join('');
  mus.round++; mus.busy = true; mus.seq = []; mus.len = 2; mus.misses = 0;
  let intro;
  if (musMode === 'copy') intro = 'Listen to the animals sing, then copy them!';
  else if (EAR[musMode]) {
    const E = EAR[musMode];
    intro = E.intro; earSt[musMode].q = null;
    el('earBtns').innerHTML = E.btns.map(([a, i, n]) => `<button class="ud" data-a="${a}" data-say="${n}">${i.startsWith('<') ? i : iconImg(i)}<span>${n}</span></button>`).join('');
    el('earShow').innerHTML = ''; earLvl();
  } else { intro = 'Listen to the note, then sing it back. Can you make your pet float on the line?'; el('singPet').src = petUrl({ eyes: 'happy', mouth: 'open' }); el('singHint').textContent = ''; el('singFill').style.width = '0'; }
  el('musMsg').textContent = intro;
  goBtn(musMode === 'sing' ? 'Start' : 'Listen');
  setTimeout(() => say(intro), 250);
};
leave.music = () => { mus.round++; mus.busy = true; singStop(); };
el('musModes').onclick = e => { const c = e.target.closest('[data-m]'); if (!c) return; musMode = c.dataset.m; store.set('musMode', musMode); enter.music(); };
el('musGo').onclick = () => {
  if (musMode === 'sing') { el('musGo').classList.add('hidden'); singStart(); return; }
  if (el('musGo').dataset.again) { const s = earSt[musMode]; if (s && s.q && !s.busy) { s.busy = true; EAR[musMode].play(s.q).then(() => { s.busy = false; }); } return; }
  el('musGo').classList.add('hidden');
  if (musMode === 'copy') { mus.seq = Array.from({ length: mus.len }, () => Math.floor(Math.random() * 4)); playTune(); }
  else earNew();
};

// copy the tune: the animals sing, she taps them back; one longer each time
function lightPad(i, ms = 380) {
  const b = el('pads').children[i]; if (!b) return;
  b.classList.add('lit'); setTimeout(() => b.classList.remove('lit'), ms);
  note(PADS[i].f, .5);
}
async function playTune() {
  const round = mus.round;
  mus.busy = true; mus.at = 0;
  el('musMsg').textContent = 'Listen…';
  await wait(600);
  const gap = Math.max(420, 640 - mus.len * 25);
  for (const i of mus.seq) { if (round !== mus.round) return; lightPad(i, gap - 120); await wait(gap); }
  if (round !== mus.round) return;
  mus.busy = false;
  el('musMsg').textContent = 'Your turn!';
}
el('pads').addEventListener('pointerdown', async e => {
  const b = e.target.closest('.pad'); if (!b || mus.busy) return;
  const i = +b.dataset.p;
  lightPad(i, 250);
  if (i !== mus.seq[mus.at]) {
    mus.busy = true; mus.misses++;
    await wait(300); sfx.oops(); buddy('think');
    if (mus.misses >= 2) {
      mus.misses = 0; mus.len = Math.max(2, mus.len - 1);
      mus.seq = Array.from({ length: mus.len }, () => Math.floor(Math.random() * 4));
      el('musMsg').textContent = 'Let’s try a shorter one!'; await say('Let’s try a shorter one!');
    } else { el('musMsg').textContent = 'Oops! Listen again.'; await say('Oops! Listen again.'); }
    playTune(); return;
  }
  mus.at++;
  if (mus.at === mus.seq.length) {
    mus.busy = true; mus.misses = 0;
    await wait(350); sfx.yay(); buddy('cheer'); petFun(3);
    addCoins(Math.max(1, mus.len - 1), el('musMsg'));
    const m = mus.len >= 3 ? `Yes! ${mus.len} notes!` : 'Yes!';
    el('musMsg').textContent = m; await say(m + (mus.len < 12 ? ' Now one more.' : ''));
    if (mus.len < 12) { mus.len++; mus.seq.push(Math.floor(Math.random() * 4)); }
    playTune();
  }
});

// the listening questions
async function earNew() {
  const mode = musMode, E = EAR[mode], s = earSt[mode];
  s.busy = true; s.missed = false; s.q = E.make(s.lv);
  el('musMsg').textContent = 'Listen…';
  await say('Listen.');
  if (musMode !== mode || screen !== 'music') return;
  await E.play(s.q);
  if (musMode !== mode) return;
  el('musMsg').textContent = E.ask;
  goBtn('Hear it again', true);
  s.busy = false;
}
el('earBtns').onclick = async e => {
  const b = e.target.closest('.ud'), mode = musMode, E = EAR[mode], s = earSt[mode];
  if (!b || !E || s.busy || !s.q) return;
  if (b.dataset.a === s.q.a) {
    s.busy = true;
    E.show(s.q);
    b.classList.add('right'); setTimeout(() => b.classList.remove('right'), 900);
    sfx.yay(); buddy('cheer'); petFun(2);
    addCoins(s.missed ? 1 : 3, b);
    let m = E.right(s.q);
    if (!s.missed && ++s.run >= 3 && s.lv < E.levels.length - 1) { s.lv++; s.run = 0; store.set('ear:' + mode, s.lv); earLvl(); m += ' Now a bit trickier.'; }
    await say(m);
    if (screen === 'music' && musMode === mode) { el('musGo').classList.add('hidden'); earNew(); }
  } else {
    s.run = 0; sfx.oops(); buddy('think');
    b.classList.remove('wrong'); void b.offsetWidth; b.classList.add('wrong');
    if (!s.missed && s.lv > 0) { s.lv--; store.set('ear:' + mode, s.lv); earLvl(); }
    s.missed = true; s.busy = true;
    await say('Listen again.');
    await E.play(s.q); s.busy = false;
  }
};

/* =========== sing it back: the microphone hears her note, her pet floats to show how close =========== */
const SING_NOTES = [60, 62, 64, 65, 67, 69];          // C4 to A4: comfortable for a small voice
let sing = null;
/* Pitch from the microphone, using YIN (de Cheveigné & Kawahara, 2002): it compares the sound with itself
   shifted by each possible period, and takes the first period that matches well. That makes it far less likely
   than plain autocorrelation to jump to an octave or a fifth. Works from about 70 Hz (a man's low voice) to 1100 Hz. */
function detectPitch(buf, rate) {
  const n = buf.length >> 1, x = new Float32Array(n), sr = rate / 2;     // half the sample rate is plenty, and twice as fast
  let rms = 0;
  for (let i = 0; i < n; i++) { x[i] = (buf[2 * i] + buf[2 * i + 1]) / 2; rms += x[i] * x[i]; }
  rms = Math.sqrt(rms / n);
  if (rms < .004) return null;                                            // silence
  const maxT = Math.min(n >> 1, Math.floor(sr / 70)), minT = Math.max(2, Math.floor(sr / 1100)), W = n - maxT;
  const d = new Float32Array(maxT + 2);
  for (let t = 1; t <= maxT + 1; t++) { let s = 0; for (let i = 0; i < W; i++) { const v = x[i] - x[i + t]; s += v * v; } d[t] = s; }
  // cumulative mean normalised difference
  d[0] = 1; let run = 0;
  for (let t = 1; t <= maxT + 1; t++) { run += d[t]; d[t] = run ? d[t] * t / run : 1; }
  let tau = -1;
  for (let t = minT; t <= maxT; t++) if (d[t] < .15) { while (t + 1 <= maxT && d[t + 1] < d[t]) t++; tau = t; break; }
  if (tau < 0) {                                                           // nothing clear: take the best, if it's good enough
    let m = minT; for (let t = minT; t <= maxT; t++) if (d[t] < d[m]) m = t;
    if (d[m] > .3) return null;
    tau = m;
  }
  const a = d[tau - 1], b = d[tau], c = d[tau + 1], den = a - 2 * b + c;
  return sr / (tau + (den ? (a - c) / (2 * den) : 0));
}
const median = a => { const s = a.slice().sort((p, q) => p - q); return s[s.length >> 1]; };
async function singStart() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { el('musMsg').textContent = 'This phone can’t listen, sorry.'; return; }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    const a = audio(), src = a.createMediaStreamSource(stream), an = a.createAnalyser();
    an.fftSize = 2048; src.connect(an);
    sing = { stream, an, buf: new Float32Array(an.fftSize), good: 0, target: null, listening: false, raf: 0, tries: 0, start: 0 };
    singNext();
  } catch {
    el('musMsg').textContent = 'Your pet needs to hear you. Ask a grown-up to allow the microphone.';
    say(el('musMsg').textContent); goBtn('Start');
  }
}
function singStop() {
  if (!sing) return;
  cancelAnimationFrame(sing.raf);
  sing.stream.getTracks().forEach(t => t.stop());
  sing = null;
}
async function singNext() {
  if (!sing) return;
  sing.listening = false; sing.good = 0; sing.tries++;
  sing.target = pick(SING_NOTES.filter(m => m !== sing.target));
  el('singFill').style.width = '0'; el('singHint').textContent = '';
  el('singPet').style.setProperty('--y', 0);
  el('musMsg').textContent = 'Listen…';
  await say('Listen.');
  for (let i = 0; i < 2; i++) { if (!sing) return; note(NOTE(sing.target), .9, .26); await wait(1000); }
  if (!sing) return;
  el('musMsg').textContent = 'Now you sing it! Laaa…';
  await wait(250);
  if (!sing) return;
  sing.listening = true; sing.start = sing.last = performance.now(); sing.recent = []; sing.oct = null; sing.heard = 0;
  singLoop();
}
function singLoop() {
  if (!sing || !sing.listening) return;
  sing.an.getFloatTimeDomainData(sing.buf);
  const f = detectPitch(sing.buf, audio().sampleRate), now = performance.now(), dt = Math.min(.1, (now - sing.last) / 1000);
  sing.last = now;
  if (f) {
    sing.heard = now;
    const raw = 1200 * Math.log2(f / NOTE(sing.target));
    sing.recent.push(raw); if (sing.recent.length > 5) sing.recent.shift();
    const c = median(sing.recent);
    // which octave she's singing in: picked from her first steady notes, changed only if she clearly moves
    const k = Math.round(c / 1200);
    if (sing.oct == null || (k !== sing.oct && (sing.octVotes = (sing.octVotes || 0) + 1) > 12)) { sing.oct = k; sing.octVotes = 0; }
    else if (k === sing.oct) sing.octVotes = 0;
    const cents = c - 1200 * sing.oct;
    const y = clamp(cents / 400, -1, 1);
    el('singPet').style.setProperty('--y', (-y).toFixed(3));
    el('singPet').classList.remove('quiet');
    const close = Math.abs(cents) < 60;
    el('singMeter').classList.toggle('close', close);
    el('singHint').textContent = close ? '' : cents < 0 ? '↑' : '↓';
    if (close) sing.good += dt;
  } else if (now - (sing.heard || 0) > 350) {
    // can't hear her: say so, rather than leaving the pet stuck where it was
    sing.recent = [];
    el('singPet').classList.add('quiet'); el('singMeter').classList.remove('close');
    el('singHint').textContent = '🎤';
  }
  el('singFill').style.width = Math.min(100, sing.good / .9 * 100) + '%';
  if (sing.good >= .9) { singWin(); return; }
  if (now - sing.start > 12000) { singGiveUp(); return; }
  sing.raf = requestAnimationFrame(singLoop);
}
async function singWin() {
  sing.listening = false;
  el('singMeter').classList.remove('close');
  sfx.yay(); buddy('party'); petFun(5); addCoins(3, el('singMeter'));
  el('musMsg').textContent = 'You sang it! Beautiful!';
  await say('You sang it! Beautiful!');
  await wait(400); singNext();
}
async function singGiveUp() {
  sing.listening = false;
  el('musMsg').textContent = 'Let’s try another one!';
  await say('Good try! Let’s try another one.');
  singNext();
}

/* =========== song tiles: tiles fall in four lanes; tap each one as it reaches the line and it plays the tune =========== */
// old songs, free for anyone: [note, beats]
const SONGS = [
  { name: 'Twinkle Twinkle', bpm: 1, n: 'C4 C4 G4 G4 A4 A4 G4:2 F4 F4 E4 E4 D4 D4 C4:2 G4 G4 F4 F4 E4 E4 D4:2 G4 G4 F4 F4 E4 E4 D4:2 C4 C4 G4 G4 A4 A4 G4:2 F4 F4 E4 E4 D4 D4 C4:2' },
  { name: 'Mary Had a Little Lamb', n: 'E4 D4 C4 D4 E4 E4 E4:2 D4 D4 D4:2 E4 G4 G4:2 E4 D4 C4 D4 E4 E4 E4 E4 D4 D4 E4 D4 C4:4' },
  { name: 'Hot Cross Buns', n: 'E4 D4 C4:2 E4 D4 C4:2 C4:.5 C4:.5 C4:.5 C4:.5 D4:.5 D4:.5 D4:.5 D4:.5 E4 D4 C4:2' },
  { name: 'Row Your Boat', n: 'C4:1.5 C4:1.5 C4 D4:.5 E4:1.5 E4 D4:.5 E4 F4:.5 G4:3 C5:.5 C5:.5 C5:.5 G4:.5 G4:.5 G4:.5 E4:.5 E4:.5 E4:.5 C4:.5 C4:.5 C4:.5 G4 F4:.5 E4 D4:.5 C4:3' },
  { name: 'Frère Jacques', n: 'C4 D4 E4 C4 C4 D4 E4 C4 E4 F4 G4:2 E4 F4 G4:2 G4:.5 A4:.5 G4:.5 F4:.5 E4 C4 G4:.5 A4:.5 G4:.5 F4:.5 E4 C4 C4 G3 C4:2 C4 G3 C4:2' },
  { name: 'London Bridge', n: 'G4:1.5 A4:.5 G4 F4 E4 F4 G4:2 D4 E4 F4:2 E4 F4 G4:2 G4:1.5 A4:.5 G4 F4 E4 F4 G4:2 D4:2 G4:2 E4 C4:3' },
  { name: 'Old MacDonald', n: 'G4 G4 G4 D4 E4 E4 D4:2 B4 B4 A4 A4 G4:3 D4 G4 G4 G4 D4 E4 E4 D4:2 B4 B4 A4 A4 G4:3' },
  { name: 'Ode to Joy', n: 'E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 E4:1.5 D4:.5 D4:2 E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 D4:1.5 C4:.5 C4:2' },
];
const TILE_SPEEDS = [['Slow', 70], ['Medium', 92], ['Fast', 116]];
const LANE_C = ['#ff4fa3', '#8f5cff', '#ff8cc6', '#4cb5ff'];
const TILE_WIN = .4;     // seconds early or late a tap still counts: the band between the two pink lines
let tlSong = store.get('tileSong') || 0, tlBpm = store.get('tileBpm') || 70;
let tl = null;
function songNotes(s) {
  const raw = s.n.split(' ').map(x => { const [nn, b] = x.split(':'); return { m: midi(nn), beats: b ? +b : 1 }; });
  const lanes = laneFit(raw.map(r => r.m));
  let t = 0;
  return raw.map((r, i) => { const o = { m: r.m, beats: r.beats, at: t, lane: lanes[i] }; t += r.beats; return o; });
}
/* Lanes follow the tune: a higher note is to the right of the one before, a lower one to the left, the same note
   in the same lane. With only four lanes that can't always work, so this finds the lanes that break it least
   (trying every lane for every note, Viterbi-style), and otherwise keeps low notes leftish and high notes rightish. */
function laneFit(ms) {
  const lo = Math.min(...ms), hi = Math.max(...ms), home = m => hi === lo ? 1.5 : (m - lo) / (hi - lo) * 3;
  const step = (a, b, la, lb) => {
    const d = b - a, dl = lb - la;
    if (d === 0) return dl ? 10 : 0;                        // same note: same lane
    if (dl === 0) return 6;                                 // a different note in the same lane
    if (Math.sign(d) !== Math.sign(dl)) return 9;           // going the wrong way
    return Math.abs(Math.abs(dl) - (Math.abs(d) > 4 ? 2 : 1)) * .6;   // small steps move one lane, leaps two
  };
  let cost = [0, 1, 2, 3].map(l => Math.abs(l - home(ms[0])) * .3), back = [];
  for (let i = 1; i < ms.length; i++) {
    const nc = [], bk = [];
    for (let l = 0; l < 4; l++) {
      let best = 1e9, bl = 0;
      for (let k = 0; k < 4; k++) { const c = cost[k] + step(ms[i - 1], ms[i], k, l); if (c < best) { best = c; bl = k; } }
      nc.push(best + Math.abs(l - home(ms[i])) * .3); bk.push(bl);
    }
    cost = nc; back.push(bk);
  }
  const out = [cost.indexOf(Math.min(...cost))];
  for (let i = back.length - 1; i >= 0; i--) out.unshift(back[i][out[0]]);
  return out;
}
function tilesChips() {
  el('tileSongs').innerHTML = SONGS.map((s, i) => `<button class="chip${i === tlSong ? ' on' : ''}" data-s="${i}" data-say="${s.name}">${s.name}</button>`).join('');
  el('tileSpeeds').innerHTML = TILE_SPEEDS.map(([n, b]) => `<button class="chip${b === tlBpm ? ' on' : ''}" data-b="${b}" data-say="${n}">${n}</button>`).join('');
}
function tilesLayout() {
  const w = el('tilesWrap'), cv = el('tilesCanvas'), r = w.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
  cv.style.width = r.width + 'px'; cv.style.height = r.height + 'px'; cv.width = r.width * dpr; cv.height = r.height * dpr;
  if (tl) { tl.w = r.width; tl.h = r.height; tl.dpr = dpr; tl.line = r.height * .76; }
}
enter.tiles = () => {
  tilesChips(); tl = null; tilesLayout(); tilesIdle();
  el('tilesMsg').textContent = `${SONGS[tlSong].name}. Tap each tile when it reaches the line!`;
  el('tilesOver').classList.remove('hidden');
  setTimeout(() => say('Tap each tile when it reaches the line!'), 250);
};
leave.tiles = () => { if (tl) { cancelAnimationFrame(tl.raf); tl = null; } };
function tilesIdle() {
  const cv = el('tilesCanvas'), g = cv.getContext('2d'), r = el('tilesWrap').getBoundingClientRect(), dpr = cv.width / (r.width || 1);
  g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, r.width, r.height);
  for (let l = 0; l < 4; l++) { g.fillStyle = l % 2 ? '#fbf5ff' : '#fff'; g.fillRect(l * r.width / 4, 0, r.width / 4, r.height); }
}
el('tileSongs').onclick = e => { const c = e.target.closest('[data-s]'); if (!c || (tl && tl.run)) return; tlSong = +c.dataset.s; store.set('tileSong', tlSong); tilesChips(); el('tilesMsg').textContent = `${SONGS[tlSong].name}. Tap each tile when it reaches the line!`; el('tilesGo').textContent = 'Play'; el('tilesGo').dataset.say = 'Play'; };
el('tileSpeeds').onclick = e => { const c = e.target.closest('[data-b]'); if (!c) return; tlBpm = +c.dataset.b; store.set('tileBpm', tlBpm); tilesChips(); };
el('tilesGo').onclick = () => {
  // stop any talking first: on some phones the voice holds the sound, and the first notes go silent
  try { speechSynthesis.cancel(); } catch {}
  audio();
  const notes = songNotes(SONGS[tlSong]);
  tl = { notes, beat: 60 / tlBpm, run: true, hits: 0, t0: 0, raf: 0, flash: [0, 0, 0, 0], lastTick: -1 };
  tilesLayout();
  tl.ahead = 2.6;                                   // seconds a tile takes to fall to the line
  tl.t0 = performance.now() / 1000 + tl.ahead;      // the first note reaches the line this long after starting
  el('tilesOver').classList.add('hidden');
  tl.raf = requestAnimationFrame(tilesLoop);
};
function tilesLoop() {
  if (!tl || !tl.run) return;
  const now = performance.now() / 1000 - tl.t0, g = el('tilesCanvas').getContext('2d'), { w, h, line, beat, ahead } = tl;
  // a soft tick on each beat helps her feel the time
  const bi = Math.floor(now / beat);
  if (bi > tl.lastTick && bi >= -2) { tl.lastTick = bi; note(bi % 4 === 0 ? 880 : 660, .05, .05, 'tick'); }
  g.setTransform(tl.dpr, 0, 0, tl.dpr, 0, 0); g.clearRect(0, 0, w, h);
  const lw = w / 4, speed = line / ahead;
  for (let l = 0; l < 4; l++) {
    g.fillStyle = l % 2 ? '#fbf5ff' : '#fff'; g.fillRect(l * lw, 0, lw, h);
    if (tl.flash[l] > 0) { g.fillStyle = `rgba(255,79,163,${tl.flash[l] * .25})`; g.fillRect(l * lw, 0, lw, h); tl.flash[l] -= .06; }
  }
  const zt = line - TILE_WIN * speed, zb = line + TILE_WIN * speed;
  g.fillStyle = 'rgba(255,140,198,.16)'; g.fillRect(0, zt, w, zb - zt);
  g.fillStyle = '#ff8cc6'; g.fillRect(0, zt - 2, w, 4); g.fillRect(0, zb - 2, w, 4);
  let left = 0;
  for (const n of tl.notes) {
    const tt = n.at * beat, y = line - (tt - now) * speed, len = Math.max(.6, n.beats * .8) * beat * speed;
    if (!n.done && tt - now < -TILE_WIN) { n.done = 'miss'; }
    if (!n.done) left++;
    if (y < -10 || y - len > h) continue;
    const live = !n.done && Math.abs(tt - now) <= TILE_WIN;
    g.fillStyle = n.done === 'hit' ? 'rgba(143,92,255,.18)' : n.done === 'miss' ? '#e8dff0' : LANE_C[n.lane];
    g.beginPath(); g.roundRect(n.lane * lw + 6, y - len, lw - 12, len, 14); g.fill();
    if (live) { g.lineWidth = 5; g.strokeStyle = '#ffe066'; g.stroke(); }
  }
  if (!left && now > tl.notes.at(-1).at * beat + 1) { tilesEnd(); return; }
  tl.raf = requestAnimationFrame(tilesLoop);
}
el('tilesCanvas').addEventListener('pointerdown', e => {
  if (!tl || !tl.run) return;
  e.preventDefault();
  const r = el('tilesCanvas').getBoundingClientRect(), lane = clamp(Math.floor((e.clientX - r.left) / (r.width / 4)), 0, 3);
  const now = performance.now() / 1000 - tl.t0;
  tl.flash[lane] = 1;
  // the nearest waiting tile in that lane, if it's close to the line (generous for small fingers)
  let best = null, bd = 1e9;
  // the oldest waiting tile in that lane that's in the zone (so a late tap takes the late tile, not the next one)
  for (const n of tl.notes) if (!n.done && n.lane === lane) { const d = Math.abs(n.at * tl.beat - now); if (d <= TILE_WIN) { bd = d; best = n; break; } }
  if (best && bd <= TILE_WIN) { best.done = 'hit'; tl.hits++; note(NOTE(best.m), Math.min(1.2, best.beats * tl.beat + .2), .26); }
  else note(NOTE(60 + [0, 4, 7, 12][lane]), .15, .06);
});
async function tilesEnd() {
  tl.run = false;
  const total = tl.notes.length, hits = tl.hits, coinsWon = Math.max(1, Math.round(hits / 5));
  addCoins(coinsWon, el('tilesWrap')); petFun(10);
  const m = hits === total ? `Every note! You played ${SONGS[tlSong].name}!` : `You played ${hits} of ${total} notes!`;
  hits > total * .6 ? (sfx.yay(), buddy('party')) : buddy('cheer');
  el('tilesMsg').textContent = m; el('tilesGo').textContent = 'Again'; el('tilesGo').dataset.say = 'Again';
  el('tilesOver').classList.remove('hidden');
  say(m);
}
addEventListener('resize', () => { if (screen === 'tiles') { tilesLayout(); if (!tl || !tl.run) tilesIdle(); } });

/* =========== free play: a xylophone and a steel tongue drum, sounding the moment she touches them =========== */
const INSTRUMENTS = [['xylo', 'Xylophone'], ['drum', 'Tongue drum']];
let inst = store.get('inst') || 'xylo';
const XYLO = [['C5', '#ff6b6b'], ['D5', '#ff9f3a'], ['E5', '#ffd23f'], ['F5', '#5fd38b'], ['G5', '#2ec4b6'], ['A5', '#4cb5ff'], ['B5', '#9b6bff'], ['C6', '#ff6fb8']];
const DRUM = ['C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5'];     // only notes that sound nice together, so nothing is wrong
function instDraw() {
  el('instChips').innerHTML = INSTRUMENTS.map(([id, n]) => `<button class="chip${id === inst ? ' on' : ''}" data-i="${id}" data-say="${n}">${n}</button>`).join('');
  $$('#s-play .bar h2')[0].textContent = inst === 'xylo' ? 'Xylophone' : 'Tongue drum';
  if (inst === 'xylo') {
    el('instWrap').className = 'xylo';
    el('instWrap').innerHTML = XYLO.map(([n, c], i) => `<button class="bar2" data-n="${n}" style="--c:${c};--h:${100 - i * 6}%" aria-label="${n}"><i></i><i></i></button>`).join('');
  } else {
    el('instWrap').className = 'drum';
    // tongues round a circle, the low ones bigger, like a real tongue drum
    const t = DRUM.map((n, i) => {
      const a = (i * 2 * Math.PI / 8) - Math.PI / 2 + (i % 2 ? Math.PI / 8 * 0 : 0), r = 112, x = 160 + r * Math.cos(a), y = 160 + r * Math.sin(a), s = 46 - i * 2.4;
      return `<ellipse class="tongue" data-n="${n}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(s * .62).toFixed(1)}" ry="${s.toFixed(1)}" transform="rotate(${(a * 180 / Math.PI + 90).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
    }).join('');
    el('instWrap').innerHTML = `<svg viewBox="0 0 320 320"><circle cx="160" cy="160" r="156" class="shell"/><circle cx="160" cy="160" r="54" class="mid"/>${t}<circle cx="160" cy="160" r="22" class="hub"/></svg>`;
  }
}
enter.play = () => { audio(); instDraw(); };
el('instChips').onclick = e => { const c = e.target.closest('[data-i]'); if (!c) return; inst = c.dataset.i; store.set('inst', inst); instDraw(); };
const instDown = new Map();
function instHit(target) {
  const k = target && target.closest('[data-n]'); if (!k) return null;
  note(NOTE(midi(k.dataset.n)), inst === 'xylo' ? .9 : 2.4, inst === 'xylo' ? .32 : .3, inst);
  k.classList.remove('hit'); void k.getBoundingClientRect(); k.classList.add('hit');
  return k;
}
el('instWrap').addEventListener('pointerdown', e => {
  e.preventDefault();
  try { el('instWrap').releasePointerCapture(e.pointerId); } catch {}
  instDown.set(e.pointerId, instHit(e.target));
});
// sliding a finger along plays each bar it passes, like running a beater along a xylophone
el('instWrap').addEventListener('pointermove', e => {
  if (!instDown.has(e.pointerId)) return;
  const k = document.elementFromPoint(e.clientX, e.clientY), key = k && k.closest('[data-n]');
  if (key && key !== instDown.get(e.pointerId)) instDown.set(e.pointerId, instHit(key));
});
for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) el('instWrap').addEventListener(ev, e => instDown.delete(e.pointerId));
