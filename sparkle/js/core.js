const VERSION = '2026-10-30.2';
const el = id => document.getElementById(id);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem('sparkle:' + k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem('sparkle:' + k, JSON.stringify(v)); } catch {} },
};
const opts = Object.assign({ voice: true, sound: true }, store.get('opts') || {});
const saveOpts = () => store.set('opts', opts);

/* ---------- pictures from OpenMoji (icons.json, pages.json beside this page) ---------- */
let ICONS = {}, PAGES = [];
const iconUrls = new Map();
function iconUrl(hex) {
  if (!iconUrls.has(hex)) iconUrls.set(hex, ICONS[hex] ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(ICONS[hex]) : '');
  return iconUrls.get(hex);
}
const iconImg = (hex, cls = '') => `<img alt="" class="${cls}" src="${iconUrl(hex)}">`;
function fillIcons(root = document) { for (const i of $$('img[data-icon]', root)) i.src = iconUrl(i.dataset.icon); }

/* ---------- reading aloud: anything with data-say speaks when tapped ----------
   The voice is one the phone or computer already has. Which ones exist
   differs from device to device, so the best few English ones are offered in
   Settings (ranked below), and the grown-up's pick is remembered by name. */
const BAD_VOICES = /albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|eddy|flo\b|grandma|grandpa|reed|rocko|sandy|shelley|fred|junior|ralph|kathy|espeak/i;
function voiceScore(v) {
  const n = v.name, l = v.lang.replace('_', '-');
  let s = /^en-AU/i.test(l) ? 30 : /^en-(GB|NZ|IE)/i.test(l) ? 22 : /^en-US/i.test(l) ? 12 : 8;
  if (/natural|neural/i.test(n)) s += 60;            // Edge and Windows "Online (Natural)" voices: the best on most PCs
  else if (/premium/i.test(n)) s += 55;              // iPhone, iPad, Mac: downloaded in the device's settings
  else if (/enhanced/i.test(n)) s += 45;
  else if (/siri/i.test(n)) s += 40;
  else if (/google/i.test(n)) s += 30;               // Chrome's own voices
  if (v.default) s += 3;
  return s;
}
let voices = [];
function goodVoices() {
  if (!('speechSynthesis' in window)) return [];
  const seen = new Set();
  return speechSynthesis.getVoices()
    .filter(v => /^en([-_]|$)/i.test(v.lang) && !BAD_VOICES.test(v.name))
    .sort((a, b) => voiceScore(b) - voiceScore(a))
    // one of each: a phone with both "Karen" and "Karen (Premium)" offers only the better one
    .filter(v => { const k = voiceLabel(v).name + v.lang; if (seen.has(k)) return false; seen.add(k); return true; })
    .slice(0, 3);
}
const ACCENTS = { AU: 'Australian', GB: 'British', NZ: 'New Zealand', IE: 'Irish', US: 'American', CA: 'Canadian', IN: 'Indian', ZA: 'South African' };
function voiceLabel(v) {
  const name = v.name.replace(/^(Microsoft|Google|Apple)\s+/i, '').replace(/\s*\(.*$|\s+[-–]\s+.*$/, '').replace(/\s+(Online|Premium|Enhanced)\b.*$/i, '').trim() || v.name;
  const accent = ACCENTS[(v.lang.split(/[-_]/)[1] || '').toUpperCase()] || 'English';
  const kind = /natural|neural|premium|enhanced|siri/i.test(v.name) ? ', natural' : '';
  return { name, sub: accent + kind };
}
let voice = null;
function pickVoice() {
  voices = goodVoices();
  const all = 'speechSynthesis' in window ? speechSynthesis.getVoices() : [];
  voice = (opts.voiceName && all.find(x => x.name === opts.voiceName)) || voices[0] || null;
  if (el('settings') && el('settings').open && typeof drawVoices === 'function') drawVoices();
}
if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
function say(text, v = voice, force = false) {
  if ((!opts.voice && !force) || !('speechSynthesis' in window) || !text) return Promise.resolve();
  return new Promise(done => {
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      if (v) u.voice = v;
      u.lang = v ? v.lang : 'en-AU';
      u.rate = .9; u.pitch = 1;
      // finished, cut off, or (some phones never say) a generous guess at its length
      const t = setTimeout(done, 1500 + text.length * 110);
      u.onend = u.onerror = () => { clearTimeout(t); done(); };
      speechSynthesis.speak(u);
    } catch { done(); }
  });
}
document.addEventListener('click', e => { const s = e.target.closest('[data-say]'); if (s && s.dataset.say) say(s.dataset.say); }, true);

/* ---------- little sounds, made on the spot ---------- */
let ac = null;
function tone(freqs, dur = .1, type = 'sine', gap = .08, vol = .12) {
  if (!opts.sound) return;
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === 'suspended') ac.resume();
    freqs.forEach((f, i) => {
      const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + i * gap;
      o.type = type; o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(.001, t + dur);
      o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + dur + .03);
    });
  } catch {}
}
const sfx = {
  coin: () => tone([988, 1319], .14, 'square', .07, .05),
  pop: () => tone([620], .07, 'sine', 0, .14),
  flip: () => tone([520], .05, 'triangle', 0, .1),
  yay: () => tone([523, 659, 784, 1047], .2, 'triangle', .1, .12),
  oops: () => tone([330, 247], .2, 'sine', .14, .12),
  jump: () => tone([400, 640], .1, 'sine', .05, .1),
  munch: () => tone([300, 260, 300], .06, 'square', .09, .04),
  scrub: () => tone([900 + Math.random() * 400], .04, 'sine', 0, .03),
};

/* ---------- coins ---------- */
let coins = store.get('coins') ?? 10;
function drawCoins() { for (const c of $$('[data-coins]')) c.innerHTML = `${iconImg('1FA99')}<span>${coins}</span>`; }
function addCoins(n, from) {
  if (!n) return;
  coins = Math.max(0, coins + n); store.set('coins', coins);
  drawCoins();
  if (n > 0) {
    sfx.coin();
    const box = $$('[data-coins]').find(c => c.offsetParent);
    if (box) {
      box.classList.remove('bump'); void box.offsetWidth; box.classList.add('bump');
      const r = (from || box).getBoundingClientRect(), p = document.createElement('div');
      p.className = 'plus'; p.textContent = '+' + n;
      p.style.left = (r.left + r.width / 2 - 14) + 'px'; p.style.top = (r.top - 10) + 'px';
      document.body.appendChild(p); setTimeout(() => p.remove(), 1000);
    }
  }
}

/* ---------- screens: the address (#pet, #colour …) says which, so the phone's Back works ---------- */
const SCREENS = { '': 's-home', hello: 's-hello', pick: 's-pick', mx: 's-mx', choose: 's-choose', pet: 's-pet', colour: 's-colour', paint: 'paint', memory: 's-memory', ttt: 's-ttt', jump: 's-jump', letters: 's-letters', maths: 's-maths', shop: 's-shop', pets: 's-pets', trips: 's-trips', trip: 's-trip', shelter: 's-shelter', music: 's-music', pattern: 's-pattern', maze: 's-maze', chess: 's-chess', tiles: 's-tiles', play: 's-play' };
let screen = null;
const leave = {}, enter = {};
function route() {
  const [name, arg] = location.hash.slice(1).split('/');
  let s = name in SCREENS ? name : '';
  // the very first time: a grown-up's question (the birthday), then she chooses her pet
  if (!pet && !store.get('helloDone') && s !== 'hello') { location.replace('#hello'); return; }
  if (!pet && store.get('helloDone') && s !== 'choose') { location.replace('#choose'); return; }
  if (!gameRoute(s, arg)) return;
  if (screen && leave[screen]) leave[screen]();
  if (window.speechSynthesis && screen !== null) try { speechSynthesis.cancel(); } catch {}
  for (const id of Object.values(SCREENS)) el(id).classList.toggle('hidden', id !== SCREENS[s]);
  screen = s;
  drawCoins();
  if (enter[s]) enter[s](arg);
  if (typeof buddy === 'function') buddy('idle');
}
addEventListener('hashchange', route);
const go = h => { location.hash = h; };
for (const b of $$('[data-home]')) {
  b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11 12 4l9 7"/><path d="M5.5 9.5V20h13V9.5"/></svg>';
  b.dataset.say = 'Home';
  b.onclick = () => go('');
}

function ask(text) {
  const d = el('ask');
  el('askText').textContent = text;
  say(text);
  return new Promise(res => {
    el('askYes').onclick = () => { d.close(); res(true); };
    el('askNo').onclick = () => { d.close(); res(false); };
    d.oncancel = () => res(false);
    d.showModal();
  });
}
