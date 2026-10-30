/* ---------- jump: her pet runs, she taps to jump, stars are coins ---------- */
const J = { run: false, raf: 0 };
const jc = el('jumpCanvas'), jx = jc.getContext('2d');
let jimgs = null;
async function jumpImages() {
  const im = async u => { try { return await loadImg(u); } catch { return null; } };
  return {
    run: [await im(petUrl({ eyes: 'happy', mouth: 'grin', step: 0 })), await im(petUrl({ eyes: 'happy', mouth: 'grin', step: 1 }))],
    air: await im(petUrl({ eyes: 'open', mouth: 'open' })),
    sad: await im(petUrl({ eyes: 'sad', mouth: 'sad' })),
    obs: [await im(iconUrl('1F335')), await im(iconUrl('1F344')), await im(iconUrl('1FAA8'))],
    star: await im(iconUrl('2B50')), cloud: await im(iconUrl('2601')), flower: await im(iconUrl('1F33C')), tulip: await im(iconUrl('1F337')),
  };
}
function jumpSize() {
  const r = el('jumpWrap').getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
  jc.width = Math.round(r.width * dpr); jc.height = Math.round(r.height * dpr);
  J.w = r.width; J.h = r.height; J.dpr = dpr;
  J.ground = J.h * .8; J.pet = Math.min(110, J.h * .22);
}
function jumpReset() {
  jumpSize();
  Object.assign(J, { y: 0, vy: 0, t: 0, buffer: -1, speed: J.w * .45, obs: [], stars: [], clouds: [], deco: [], next: 1.2, nextStar: .8, got: 0, dist: 0, last: 0, over: false });
  for (let i = 0; i < 4; i++) J.clouds.push({ x: Math.random() * J.w, y: 20 + Math.random() * J.h * .3, s: 50 + Math.random() * 40 });
  for (let i = 0; i < 6; i++) J.deco.push({ x: Math.random() * J.w, k: Math.random() < .5 ? 'flower' : 'tulip' });
  el('jumpStars').textContent = '0';
}
function jumpTap(e) {
  if (e) e.preventDefault();
  if (!J.run) return;
  if (J.y === 0) jumpUp();
  else J.buffer = J.t;               // tapped just before landing: it jumps as soon as it lands
}
const GRAV = 1500;                   // lower than it was: a longer, floatier jump, easier to time
function jumpUp() { J.vy = -Math.sqrt(2 * GRAV * J.pet * 2); J.buffer = -1; sfx.jump(); }
el('jumpWrap').addEventListener('pointerdown', e => { if (e.target.closest('.overlay button')) return; jumpTap(e); });
function jumpLoop(ts) {
  if (!J.run) return;
  const dt = Math.min(.04, (ts - (J.last || ts)) / 1000); J.last = ts;
  J.t += dt; J.dist += J.speed * dt;
  J.speed = Math.min(J.w * .95, J.speed + J.w * .008 * dt);
  // the pet: gravity and the ground
  const wasUp = J.y < 0;
  J.vy += GRAV * dt; J.y = Math.min(0, J.y + J.vy * dt); if (J.y === 0) J.vy = 0;
  if (wasUp && J.y === 0 && J.buffer >= 0 && J.t - J.buffer < .25) jumpUp();
  // new things to jump over, and stars to catch
  J.next -= dt; J.nextStar -= dt;
  if (J.next <= 0) { J.obs.push({ x: J.w + 40, k: Math.floor(Math.random() * 3), s: J.pet * (.55 + Math.random() * .15) }); J.next = 1.15 + Math.random() * 1.3 - Math.min(.35, J.t / 150); }
  if (J.nextStar <= 0) { J.stars.push({ x: J.w + 40, y: J.ground - J.pet * (.6 + Math.random() * 1.6) }); J.nextStar = .7 + Math.random() * 1.2; }
  for (const o of J.obs) o.x -= J.speed * dt;
  for (const s of J.stars) s.x -= J.speed * dt;
  for (const c of J.clouds) { c.x -= J.speed * .15 * dt; if (c.x < -100) { c.x = J.w + 50; c.y = 20 + Math.random() * J.h * .3; } }
  for (const d of J.deco) { d.x -= J.speed * dt; if (d.x < -40) d.x = J.w + Math.random() * J.w * .5; }
  J.obs = J.obs.filter(o => o.x > -80); J.stars = J.stars.filter(s => s.x > -60 && !s.got);
  // the pet's box, a forgiving one
  const px = J.w * .18, py = J.ground + J.y - J.pet, ps = J.pet;
  const hit = (x, y, w, h) => px + ps * .3 < x + w && px + ps * .7 > x && py + ps * .35 < y + h && py + ps * .92 > y;
  for (const s of J.stars) {
    if (!s.got && hit(s.x - 22, s.y - 22, 44, 44)) { s.got = true; J.got++; el('jumpStars').textContent = J.got; sfx.coin(); }
  }
  for (const o of J.obs) {
    if (hit(o.x + o.s * .3, J.ground - o.s * .62, o.s * .4, o.s * .62)) { jumpOver(); break; }
  }
  jumpDraw();
  if (J.run) J.raf = requestAnimationFrame(jumpLoop);
}
function jumpDraw() {
  const g = jx, d = J.dpr;
  g.setTransform(d, 0, 0, d, 0, 0);
  g.clearRect(0, 0, J.w, J.h);
  for (const c of J.clouds) if (jimgs.cloud) g.drawImage(jimgs.cloud, c.x, c.y, c.s * 1.4, c.s * 1.4);
  g.fillStyle = '#c9f0c4'; g.fillRect(0, J.ground, J.w, J.h - J.ground);
  g.fillStyle = '#a6e3a1'; g.fillRect(0, J.ground, J.w, 6);
  for (const dd of J.deco) if (jimgs[dd.k]) g.drawImage(jimgs[dd.k], dd.x, J.ground + 10, 30, 30);
  for (const s of J.stars) if (!s.got && jimgs.star) g.drawImage(jimgs.star, s.x - 24, s.y - 24, 48, 48);
  for (const o of J.obs) if (jimgs.obs[o.k]) g.drawImage(jimgs.obs[o.k], o.x, J.ground - o.s, o.s, o.s);
  const im = J.over ? jimgs.sad : J.y < 0 ? jimgs.air : jimgs.run[Math.floor(J.t * 8) % 2];
  if (im) g.drawImage(im, J.w * .18, J.ground + J.y - J.pet * 1.04, J.pet, J.pet);
}
async function jumpStart() {
  if (!jimgs) jimgs = await jumpImages();
  jumpReset();
  el('jumpOver').classList.add('hidden');
  J.run = true; J.last = 0;
  J.raf = requestAnimationFrame(jumpLoop);
}
function jumpOver() {
  J.run = false; J.over = true; cancelAnimationFrame(J.raf);
  jumpDraw(); sfx.oops();
  const pay = Math.ceil(J.got / 2);          // two stars make a coin
  if (pay) addCoins(pay, el('jumpStars'));
  if (J.t > 5) petFun(Math.min(20, 5 + Math.round(J.t / 3)));
  const m = J.got ? `Oops! You caught ${J.got} star${J.got === 1 ? '' : 's'}! That’s ${pay} coin${pay === 1 ? '' : 's'}!` : 'Oops! Try again!';
  el('jumpMsg').textContent = m; el('jumpMsg').dataset.say = m; say(m);
  el('jumpGo').textContent = 'Again'; el('jumpGo').dataset.say = 'Again';
  el('jumpOver').classList.remove('hidden');
}
el('jumpGo').onclick = jumpStart;
enter.jump = async () => {
  jimgs = null; jimgs = await jumpImages();       // her pet, as it looks now
  jumpReset(); jumpDraw();
  el('jumpMsg').textContent = 'Tap to jump! Catch the stars!'; el('jumpGo').textContent = 'Go!';
  el('jumpOver').classList.remove('hidden');
  setTimeout(() => say('Tap to jump! Catch the stars!'), 300);
};
leave.jump = () => { J.run = false; cancelAnimationFrame(J.raf); };
new ResizeObserver(() => { if (screen === 'jump' && !J.run && jimgs) { jumpSize(); jumpDraw(); } }).observe(el('jumpWrap'));
