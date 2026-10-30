/* ---------- the animal shelter: give coins to help animals find homes ---------- */
const FRIENDS = [
  ['1F415', 'Rosie', 'puppy', 'some food and a cosy blanket'], ['1F408', 'Tiger', 'kitten', 'a warm bed and some toys'],
  ['1F439', 'Nibbles', 'hamster', 'seeds and a little wheel'], ['1F407', 'Clover', 'bunny', 'carrots and a hutch'],
  ['1F428', 'Gumnut', 'koala', 'gum leaves and a check-up at the vet', true], ['1F426', 'Pip', 'bird', 'seeds and a safe cage'],
  ['1F422', 'Shelly', 'tortoise', 'lettuce and a sunny spot'], ['1F998', 'Joey', 'kangaroo', 'a warm pouch and a check-up at the vet', true],
  ['1F99C', 'Polly', 'parrot', 'fruit and a big perch'], ['1F410', 'Daisy', 'goat', 'hay and a field to play in'],
  ['1F994', 'Prickles', 'hedgehog', 'snacks and a leafy bed'], ['1F40E', 'Star', 'pony', 'hay and a brush'],
  ['1F986', 'Waddles', 'duck', 'a pond and some peas'], ['1F416', 'Peanut', 'piglet', 'a mud bath and some apples'],
];
const shelter = Object.assign({ i: 0, got: 0, helped: [] }, store.get('shelter') || {});
const saveShelter = () => store.set('shelter', shelter);
const friendGoal = () => shelter.helped.length ? 100 : 50;
const GIFTS = () => Object.values(SHOP).flat().filter(it => it.gift).sort((a, b) => a.gift - b.gift);
function giftsCheck() {   // presents she has earned land in the shop
  const got = [];
  for (const it of GIFTS()) if (shelter.helped.length >= it.gift && !owned.has(it.id)) { owned.add(it.id); got.push(it); }
  if (got.length) store.set('owned', [...owned]);
  return got;
}
giftsCheck();
function drawShelter(done, got = []) {
  const [hex, name, kind, need, wild] = FRIENDS[shelter.i % FRIENDS.length], goal = friendGoal();
  const f = el('friend');
  if (done) {
    f.innerHTML = `<div class="fpic happy">${iconImg(hex)}</div><div class="ft">${name} the ${kind}</div>
      <div class="fneed">${wild ? 'is all better, and went home to the bush!' : 'found a new home!'}</div>
      ${got.map(it => `<div class="present" data-say="A present for your pet: the ${it.name.toLowerCase()}! It’s in the shop.">${iconImg(it.i)}<span>A present for your pet! Find the ${it.name.toLowerCase()} in the shop.</span></div>`).join('')}
      <p class="center"><button class="big" id="nextFriend" data-say="Meet the next friend">Meet the next friend</button></p>`;
  } else {
    f.innerHTML = `<div class="fpic">${iconImg(hex)}</div><div class="ft" data-say="${name} the ${kind}">${name} the ${kind}</div>
      <div class="fneed" data-say="${name} needs ${need}.">needs ${need}.</div>
      <div class="hearts" data-say="${shelter.got} of ${goal} coins"><div class="hbar"><i style="width:${100 * shelter.got / goal}%"></i></div><span>${iconImg('1F49D')}${shelter.got} / ${goal}</span></div>
      <div class="give">${[5, 10, 20, 50].map(n => `<button class="food${coins < n ? ' poor' : ''}" data-give="${n}">${iconImg('1FA99', 'f')}<span class="p">Give ${n}</span></button>`).join('')}</div>`;
  }
  const counts = {};
  for (const i of shelter.helped) counts[i] = (counts[i] || 0) + 1;
  el('helped').innerHTML = Object.keys(counts).length
    ? Object.entries(counts).map(([i, n]) => { const [h, nm, k] = FRIENDS[i]; return `<span class="hf" data-say="${nm} the ${k}">${iconImg(h)}<span>${nm}${n > 1 ? ` ×${n}` : ''}</span></span>`; }).join('')
    : '<p class="note2">Nobody yet. Every coin helps!</p>';
  const next = GIFTS().find(it => !owned.has(it.id));
  const more = next ? next.gift - shelter.helped.length : 0;
  el('giftNote').textContent = next ? `Help ${more} more friend${more === 1 ? '' : 's'} to get a present for your pet!` : `You’ve helped ${shelter.helped.length} friends. Thank you!`;
  el('giftNote').dataset.say = el('giftNote').textContent;
}
enter.shelter = () => {
  drawShelter(false);
  const [, name, , need] = FRIENDS[shelter.i % FRIENDS.length];
  setTimeout(() => say(`This is ${name}. ${name} needs ${need}. Can you help?`), 300);
};
el('friend').onclick = async e => {
  if (e.target.closest('#nextFriend')) { shelter.i = (shelter.i + 1) % FRIENDS.length; shelter.got = 0; saveShelter(); enter.shelter(); return; }
  const b = e.target.closest('[data-give]'); if (!b) return;
  const n = +b.dataset.give, goal = friendGoal(), give = Math.min(n, goal - shelter.got);
  const [, name, kind, , wild] = FRIENDS[shelter.i % FRIENDS.length];
  if (coins < give) { sfx.oops(); say(`You need ${give} coins.`); return; }
  if (n >= 20 && !await ask(`Give ${give} coins to help ${name}?`)) return;
  addCoins(-give);
  shelter.got += give; saveShelter();
  buddy('cheer'); sfx.coin();
  const pic = $$('.fpic', el('friend'))[0], r = pic.getBoundingClientRect();
  for (let i = 0; i < 3; i++) {
    const h = document.createElement('img');
    h.className = 'float fixed'; h.src = iconUrl(pick(['1F496', '1F49C', '2764'])); h.alt = '';
    Object.assign(h.style, { left: r.left + r.width * (.2 + .3 * i) - 20 + 'px', top: r.top + r.height * .3 + 'px', width: '40px', height: '40px', animationDelay: i * .12 + 's' });
    document.body.appendChild(h); setTimeout(() => h.remove(), 1600);
  }
  if (shelter.got >= goal) {
    shelter.helped.push(shelter.i % FRIENDS.length); shelter.got = goal; saveShelter();
    const got = giftsCheck();
    drawShelter(true, got); buddy('party'); sfx.yay();
    await say(`Hooray! ${name} the ${kind} ${wild ? 'is all better, and went home to the bush' : 'found a new home'}! Thank you for helping!`
      + got.map(it => ` You got a present for your pet: the ${it.name.toLowerCase()}! It’s in the shop.`).join(''));
  } else {
    drawShelter(false);
    const pic2 = $$('.fpic', el('friend'))[0]; pic2.classList.add('boop');
    say(pick(['Thank you!', `${name} says thank you!`, 'That helps a lot!']));
  }
};
