/* ---------- settings, for grown-ups ---------- */
function drawSettings() {
  el('optVoice').textContent = opts.voice ? 'On' : 'Off';
  el('optSound').textContent = opts.sound ? 'On' : 'Off';
  el('optName').value = pet ? pet.name : '';
  el('optCoins').textContent = coins;
  el('optGrow').disabled = !pet || pet.stage === 'adult';
  el('ver').textContent = 'Version ' + VERSION + '.';
  el('optBday').value = birthday() || '';
  el('optBday').max = today();
  drawVoices(); drawKinds();
}
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
function setBirthday(v) {
  if (v && /^\d{4}-\d{2}-\d{2}$/.test(v) && v <= today()) store.set('birthday', v);
  else if (!v) store.set('birthday', null);
}

/* the voice: the best two or three this device has, each with a Try button */
function drawVoices() {
  const box = el('optVoices');
  if (!opts.voice) { box.innerHTML = ''; return; }
  if (!voices.length) { box.innerHTML = '<p class="setnote">This device has no voices to choose from.</p>'; return; }
  const seen = {};
  box.innerHTML = `<div class="voices">${voices.map((v, i) => {
    const l = voiceLabel(v), key = l.name + l.sub; seen[key] = (seen[key] || 0) + 1;
    const name = seen[key] > 1 ? `${l.name} ${seen[key]}` : l.name;
    return `<div class="voice"><button class="pickv${voice === v ? ' on' : ''}" data-v="${i}">${name}<small>${l.sub}</small></button><button class="try" data-try="${i}">Try</button></div>`;
  }).join('')}<p class="setnote">More voices: on an iPhone or iPad, download one in the device's Settings → Accessibility → Spoken Content (or Read &amp; Speak) → Voices → English, then reopen Sparkle. Voices marked “natural” sound the least robotic.</p></div>`;
}
el('optVoices').onclick = e => {
  const p = e.target.closest('[data-v]'), t = e.target.closest('[data-try]');
  if (p) { voice = voices[+p.dataset.v]; opts.voiceName = voice.name; saveOpts(); drawVoices(); say('Hello! Shall we play?'); }
  if (t) say('Hello! Shall we play?', voices[+t.dataset.try], true);
};

/* the games: every kind, on or off. Untouched ones follow the child's age. */
function drawKinds() {
  const a = ageNow();
  el('optAge').textContent = a === null ? '' : `(age ${a})`;
  el('kindsNote').textContent = a === null
    ? 'No birthday entered, so everything for younger children is on. Enter a birthday and the games will follow their age as they grow. Anything you switch yourself stays the way you set it.'
    : `Switched on to suit age ${a}, and they'll keep changing as they grow. Anything you switch yourself stays the way you set it.`;
  const row = (g, k, label) => {
    const on = kindOn(g, k), mine = typeof chosenKinds()[kindKey(g, k)] === 'boolean';
    return `<div class="krow"><span>${label}${mine ? '<small>your choice</small>' : ''}</span><button class="${on ? '' : 'off'}" data-g="${g.id}" data-k="${k.id}">${on ? 'On' : 'Off'}</button></div>`;
  };
  // games with several kinds get a heading and a row each; the rest are one row apiece, together at the end
  el('optKinds').innerHTML = GAMES.filter(g => g.types).map(g => `<div class="kgroup"><b>${g.name}</b>${g.types.map(k => row(g, k, k.name)).join('')}</div>`).join('')
    + `<div class="kgroup"><b>Other games</b>${GAMES.filter(g => !g.types).map(g => row(g, kindsOf(g)[0], g.name)).join('')}</div>`;
}
el('optKinds').onclick = e => {
  const b = e.target.closest('[data-g]'); if (!b) return;
  const g = gameById(b.dataset.g), k = kindsOf(g).find(x => x.id === b.dataset.k);
  setKind(g, k, !kindOn(g, k)); drawKinds();
};
el('optKindsReset').onclick = () => { store.set('kinds', {}); drawKinds(); };
el('optBday').onchange = () => { setBirthday(el('optBday').value); drawKinds(); };

/* the very first time: the birthday, asked of a grown-up, before she chooses her pet */
enter.hello = () => { el('helloBday').max = today(); };
el('helloGo').onclick = () => { setBirthday(el('helloBday').value); store.set('helloDone', true); go('choose'); };
el('helloSkip').onclick = () => { store.set('helloDone', true); go('choose'); };
el('setBtn').onclick = () => { drawSettings(); el('settings').showModal(); };
el('optVoice').onclick = () => { opts.voice = !opts.voice; saveOpts(); el('optVoice').textContent = opts.voice ? 'On' : 'Off'; drawVoices(); };
el('optSound').onclick = () => { opts.sound = !opts.sound; saveOpts(); drawSettings(); };
el('optName').onchange = () => { const v = el('optName').value.trim(); if (v && pet) { pet.name = v; savePets(); } };
// skips the wait (and the meals) for the next stage: an egg is ready to hatch, a baby or child is ready to grow
el('optGrow').onclick = () => {
  if (!pet) return;
  if (pet.stage === 'egg') pet.warm = 96;
  else { pet.since = Date.now() - GROW_MS - 1000; pet.fed = Math.max(pet.fed || 0, GROW_FEEDS); }
  savePets(); el('settings').close(); go('pet'); if (screen === 'pet') enter.pet();
};
el('optCoinsPlus').onclick = () => { addCoins(50); drawSettings(); };
el('optCoinsMinus').onclick = () => { addCoins(-50); drawSettings(); };
el('setClose').onclick = () => { el('optName').onchange(); el('settings').close(); if (screen === '') enter['']() ; };
el('shopBack').onclick = () => go('pet');
el('petsBack').onclick = () => go('pet');
