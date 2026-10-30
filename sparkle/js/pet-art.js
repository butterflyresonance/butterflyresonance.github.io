/* The pets, drawn here (original art). petSVG(kind, look) returns an SVG string.
   look: {
     eyes: 'open'|'happy'|'sad'|'sleep', mouth: 'smile'|'grin'|'sad'|'open'|'chew',
     dirt: 0..1, step: 0|1 (running: which foot is up), blush: bool,
     stage: 'baby'|'child'|'adult',
     paths: [childPath, adultPath]  each 'plain'|'blossom'|'sparkle'|'ocean'|'sunny'
     wear: { head, face, neck }      data: URLs of pictures to wear (from the shop)
     dye: '#rrggbb'                  a colour from the shop, or nothing
   }
   The child stage is the base drawing; a baby is small with a big head, a
   grown-up is taller. What it ate while growing adds features and tints. */
const PET_KINDS = {
  bunny:   { name: 'Bunny',   body: '#f6eefe', belly: '#ffffff', ear: '#ffc2dc', accent: '#e7d6fb' },
  kitten:  { name: 'Kitten',  body: '#ffd1a8', belly: '#fff3e6', ear: '#ffb0c4', accent: '#f6a96c' },
  puppy:   { name: 'Puppy',   body: '#f2d7b6', belly: '#fff6ea', ear: '#a9744f', accent: '#c99a6e' },
  dragon:  { name: 'Dragon',  body: '#c6b3ff', belly: '#fff0a8', ear: '#ff9ccb', accent: '#a58bff', special: true },
  unicorn: { name: 'Unicorn', body: '#fdf8ff', belly: '#ffffff', ear: '#ffc2e6', accent: '#f1e2ff', special: true },
  phoenix: { name: 'Phoenix', body: '#ffb46e', belly: '#ffe596', ear: '#ff6b5b', accent: '#ffd25e', special: true },
};
const STARTERS = ['bunny', 'kitten', 'puppy'];
const SPECIALS = ['dragon', 'unicorn', 'phoenix'];
const PATHS = {
  plain:   { tint: null },
  blossom: { tint: '#ffb3d9', name: 'Petal' },
  sparkle: { tint: '#d4b8ff', name: 'Twinkle' },
  ocean:   { tint: '#b4f1ff', name: 'Splash' },
  sunny:   { tint: '#ffe27a', name: 'Sunny' },
};
// a grown-up's name: [child path][grown-up path]
const ADULT_NAMES = {
  plain:   { plain: 'Big', blossom: 'Garden', sparkle: 'Starry', ocean: 'Sea', sunny: 'Golden' },
  blossom: { plain: 'Petal', blossom: 'Flower Queen', sparkle: 'Fairy', ocean: 'Lily', sunny: 'Sunflower' },
  sparkle: { plain: 'Twinkle', blossom: 'Fairy', sparkle: 'Galaxy', ocean: 'Moonlight', sunny: 'Comet' },
  ocean:   { plain: 'Splash', blossom: 'Lily', sparkle: 'Mermaid', ocean: 'Ocean', sunny: 'Coral' },
  sunny:   { plain: 'Sunny', blossom: 'Sunflower', sparkle: 'Comet', ocean: 'Coral', sunny: 'Sunburst' },
};
function formName(kind, stage, paths = []) {
  const k = PET_KINDS[kind] ? PET_KINDS[kind].name : 'Pet';
  if (stage === 'baby') return 'Baby ' + k.toLowerCase();
  if (stage === 'child') { const p = PATHS[paths[0] || 'plain']; return p.name ? `${p.name} ${k}` : k; }
  return `${ADULT_NAMES[paths[0] || 'plain'][paths[1] || 'plain']} ${k}`;
}
const PET_LINE = '#4a3159';
function mix(a, b, t) {
  const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const x = p(a), y = p(b);
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
const star5 = (x, y, r, fill) => {
  let d = '';
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; d += (i ? 'L' : 'M') + (x + rr * Math.cos(a)).toFixed(1) + ' ' + (y + rr * Math.sin(a)).toFixed(1); }
  return `<path d="${d}Z" fill="${fill}" stroke="${PET_LINE}" stroke-width="4" stroke-linejoin="round"/>`;
};
const flower = (x, y, r, petal, mid = '#ffe066') => {
  let s = '';
  for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5 - Math.PI / 2; s += `<circle cx="${(x + r * .62 * Math.cos(a)).toFixed(1)}" cy="${(y + r * .62 * Math.sin(a)).toFixed(1)}" r="${(r * .48).toFixed(1)}" fill="${petal}" stroke="${PET_LINE}" stroke-width="4"/>`; }
  return s + `<circle cx="${x}" cy="${y}" r="${(r * .36).toFixed(1)}" fill="${mid}" stroke="${PET_LINE}" stroke-width="4"/>`;
};

function petSVG(kind, look = {}) {
  const base = PET_KINDS[kind] || PET_KINDS.bunny;
  const stage = look.stage || 'child', paths = look.paths || [];
  const p1 = stage === 'baby' ? 'plain' : (paths[0] || 'plain'), p2 = stage === 'adult' ? (paths[1] || 'plain') : 'plain';
  // colours: tinted towards what it ate while growing
  const k = Object.assign({}, base);
  // mixing opposite colours gives mud (orange + aqua, purple + yellow): then the belly takes the colour instead
  const clash = p => (p === 'ocean' || p === 'sparkle') && ['kitten', 'puppy', 'phoenix'].includes(kind) || p === 'sunny' && kind === 'dragon';
  for (const [p, t] of [[p1, .22], [p2, .18]]) if (PATHS[p].tint) {
    if (clash(p)) k.belly = mix(k.belly, PATHS[p].tint, .55);
    else { k.body = mix(k.body, PATHS[p].tint, t); k.accent = mix(k.accent, PATHS[p].tint, t); }
  }
  // a colour from the shop's dyes: the fur (or feathers, or scales) takes it on
  if (look.dye) { k.body = mix(k.body, look.dye, .62); k.accent = mix(k.accent, look.dye, .5); }
  const L = `stroke="${PET_LINE}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"`;
  const eyes = look.eyes || 'open', mouth = look.mouth || 'smile', step = look.step;
  let back = '', backH = '', head = '', aura = '', bodyExtra = '', headExtra = '';

  // ---- behind: ears, tails, wings
  if (kind === 'bunny') {
    backH += `<path d="M150 120 C118 40 128 -8 160 -6 C190 -4 198 54 184 112 Z" fill="${k.body}" ${L}/>
      <path d="M156 102 C138 52 144 22 160 22 C176 24 178 62 170 100 Z" fill="${k.ear}"/>
      <path d="M250 120 C282 40 272 -8 240 -6 C210 -4 202 54 216 112 Z" fill="${k.body}" ${L}/>
      <path d="M244 102 C262 52 256 22 240 22 C224 24 222 62 230 100 Z" fill="${k.ear}"/>`;
    back += `<circle cx="300" cy="320" r="26" fill="#fff" ${L}/>`;
  } else if (kind === 'kitten') {
    back += `<path d="M300 330 C360 330 372 260 344 236 C334 228 322 238 330 250 C346 274 330 306 296 306 Z" fill="${k.body}" ${L}/>`;
    head += `<path d="M112 120 L104 40 L178 84 Z" fill="${k.body}" ${L}/><path d="M124 104 L120 62 L158 86 Z" fill="${k.ear}"/>
      <path d="M288 120 L296 40 L222 84 Z" fill="${k.body}" ${L}/><path d="M276 104 L280 62 L242 86 Z" fill="${k.ear}"/>`;
  } else if (kind === 'puppy') {
    back += `<path d="M300 318 C340 300 352 262 336 250 C326 246 318 262 312 274 C306 288 296 296 288 300 Z" fill="${k.body}" ${L}/>`;
  } else if (kind === 'dragon') {
    back += `<path d="M120 250 C60 220 40 170 64 150 C80 186 100 200 128 206 Z" fill="${k.ear}" ${L}/>
      <path d="M280 250 C340 220 360 170 336 150 C320 186 300 200 272 206 Z" fill="${k.ear}" ${L}/>
      <path d="M290 320 C350 320 380 290 386 250 L360 262 C350 286 320 298 292 298 Z" fill="${k.body}" ${L}/>
      <path d="M380 254 L396 236 L392 266 Z" fill="${k.ear}" ${L}/>`;
    head += `<path d="M150 82 L142 34 L176 72 Z" fill="#fff6d6" ${L}/><path d="M250 82 L258 34 L224 72 Z" fill="#fff6d6" ${L}/>
      <path d="M186 64 L200 40 L214 64 Z" fill="${k.ear}" ${L}/>`;
  } else if (kind === 'unicorn') {
    // a rainbow tail
    back += `<path d="M292 300 C350 300 372 250 352 214 C380 240 384 300 340 336 C326 346 306 344 292 330 Z" fill="#c9a8ff" ${L}/>
      <path d="M300 312 C340 306 356 276 350 244" fill="none" stroke="#ff9ccb" stroke-width="12" stroke-linecap="round"/>
      <path d="M306 326 C346 322 368 290 364 258" fill="none" stroke="#9fe3ff" stroke-width="10" stroke-linecap="round"/>`;
    head += `<path d="M128 104 L120 50 L166 84 Z" fill="${k.body}" ${L}/><path d="M138 94 L134 66 L156 84 Z" fill="${k.ear}"/>
      <path d="M272 104 L280 50 L234 84 Z" fill="${k.body}" ${L}/><path d="M262 94 L266 66 L244 84 Z" fill="${k.ear}"/>`;
  } else if (kind === 'phoenix') {
    // flame wings and tail feathers
    back += `<path d="M118 236 C66 226 40 180 52 140 C68 168 84 170 92 160 C92 190 108 206 128 210 Z" fill="#ff6b5b" ${L}/>
      <path d="M282 236 C334 226 360 180 348 140 C332 168 316 170 308 160 C308 190 292 206 272 210 Z" fill="#ff6b5b" ${L}/>
      <path d="M286 330 C340 340 380 310 392 268 C370 284 352 284 344 276 C354 300 330 316 296 312 Z" fill="#ffd25e" ${L}/>
      <path d="M292 314 C330 314 358 290 362 254 C346 270 330 272 320 266 C326 288 310 300 290 300 Z" fill="#ff8a4c" ${L}/>`;
  }

  // ---- what it ate while growing decides its body: the stage's path is the body plan,
  //      and (for a grown-up) what it ate as a child shows as markings
  const plan = stage === 'baby' ? 'plain' : stage === 'adult' ? p2 : p1;
  const big = stage === 'adult', pure = big && p1 === p2 && plan !== 'plain';
  const fl = step === 0 ? -14 : 0, fr = step === 1 ? -14 : 0;
  const S4 = `stroke="${PET_LINE}" stroke-width="4"`;
  const tone = (c, t) => mix(c, k.body, 1 - t);   // mostly the path's colour, a little of the animal's
  const kindBack = back;
  const keepWings = (kind === 'dragon' || kind === 'phoenix') && plan !== 'sparkle' && plan !== 'ocean';
  back = plan === 'plain' ? kindBack : keepWings ? kindBack.split('<path d="M290')[0].split('<path d="M286')[0] : '';
  let body = '';
  if (plan === 'plain') {
    const foot = kind === 'phoenix' ? '#ff8a4c' : kind === 'unicorn' ? '#d9c6ff' : k.body;
    body = `<ellipse cx="200" cy="292" rx="102" ry="82" fill="${k.body}" ${L}/>
      <ellipse cx="200" cy="304" rx="58" ry="52" fill="${k.belly}"/>
      <ellipse cx="152" cy="${370 + fl}" rx="38" ry="22" fill="${foot}" ${L}/>
      <ellipse cx="248" cy="${370 + fr}" rx="38" ry="22" fill="${foot}" ${L}/>`;
    if (kind !== 'phoenix') body += `<ellipse cx="112" cy="${290 + (step === 1 ? -10 : 0)}" rx="22" ry="30" fill="${k.body}" ${L} transform="rotate(20 112 290)"/>
      <ellipse cx="288" cy="${290 + (step === 0 ? -10 : 0)}" rx="22" ry="30" fill="${k.body}" ${L} transform="rotate(-20 288 290)"/>`;
  } else if (plan === 'blossom') {
    // a flower for a body: a skirt of petals, a stem and leaves to stand on, leaves for arms; the face sits in a ring of petals
    const pa = tone('#ff9fd0', .78), pb = tone('#ffd0e8', .72);
    if (big) back += `<path d="M262 360 C330 380 372 330 352 290 C340 268 312 276 318 296 C324 316 300 330 270 326" fill="none" stroke="#6cc070" stroke-width="12" stroke-linecap="round"/>${flower(356, 284, 24, pa)}`;
    body += `<path d="M200 330 L200 ${big ? 400 : 392}" stroke="#6cc070" stroke-width="16" stroke-linecap="round"/>
      <path d="M200 ${380 + fl / 2} C160 350 110 360 92 392 C140 402 180 398 200 386 Z" fill="#9be08e" ${L}/><path d="M200 ${380 + fr / 2} C240 350 290 360 308 392 C260 402 220 398 200 386 Z" fill="#9be08e" ${L}/>`;
    const n = big ? 8 : 6, rx = big ? 50 : 44;
    for (let layer = big ? 1 : 0; layer >= 0; layer--) for (let i = 0; i < n; i++) {
      const a = Math.PI * (.06 + i * .88 / (n - 1)), R = layer ? 122 : 108, x = 200 - R * Math.cos(a), y = 300 + (layer ? 78 : 62) * Math.sin(a) - 10;
      body += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${layer ? rx + 6 : rx}" ry="${layer ? 66 : 60}" fill="${(i + layer) % 2 ? pa : pb}" ${L} transform="rotate(${(90 - a * 180 / Math.PI).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
    }
    body += `<ellipse cx="200" cy="266" rx="74" ry="56" fill="${k.belly}" ${L}/>
      <path d="M126 252 C96 236 86 208 102 194 C112 212 128 222 142 226 Z" fill="#9be08e" ${L}/><path d="M274 252 C304 236 314 208 298 194 C288 212 272 222 258 226 Z" fill="#9be08e" ${L}/>`;
    const ring = big ? 14 : 11;
    for (let i = 0; i < ring; i++) {
      const a = i * Math.PI * 2 / ring, R = big ? 122 : 108, x = 200 + R * Math.cos(a), y = 170 + R * Math.sin(a);
      backH += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${big ? 34 : 28}" ry="${big ? 52 : 40}" fill="${i % 2 ? pa : pb}" ${S4} transform="rotate(${(a * 180 / Math.PI + 90).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
    }
  } else if (plan === 'sparkle') {
    // a floating star-sprite: no feet, the body trails off like a comet; wings; star antennae
    const wing = `fill="#efe4ff" opacity=".88" ${L}`;
    aura += `<ellipse cx="200" cy="400" rx="${big ? 110 : 88}" ry="15" fill="#c9a8ff" opacity=".4"/><circle cx="200" cy="220" r="${big ? 230 : 200}" fill="#fff6b0" opacity=".28"/>`;
    back += `<path d="M110 240 C30 170 20 260 70 300 C96 318 130 300 140 280 Z" ${wing}/><path d="M290 240 C370 170 380 260 330 300 C304 318 270 300 260 280 Z" ${wing}/>`;
    if (big) back += `<path d="M120 200 C40 110 0 150 30 200 C50 232 100 236 130 222 Z" ${wing}/><path d="M280 200 C360 110 400 150 370 200 C350 232 300 236 270 222 Z" ${wing}/>`;
    body += big
      ? `<path d="M116 256 C116 204 284 204 284 256 C284 316 254 336 232 350 C266 352 300 330 330 336 C372 344 384 388 352 400 C368 376 352 360 326 364 C280 372 240 398 204 380 C152 372 116 316 116 256 Z" fill="${k.body}" ${L}/>`
      : `<path d="M120 260 C120 210 280 210 280 260 C280 312 250 330 228 344 C252 352 268 368 300 372 C250 392 210 380 196 352 C150 340 120 310 120 260 Z" fill="${k.body}" ${L}/>`;
    body += `<ellipse cx="200" cy="272" rx="50" ry="40" fill="${k.belly}" opacity=".85"/>` + star5(172, 300, 10, '#fff6b0') + star5(240, 316, 8, '#fff') + star5(258, 262, 6, '#fff6b0');
    backH += `<path d="M178 80 C170 40 152 8 130 -14" fill="none" stroke="${PET_LINE}" stroke-width="7" stroke-linecap="round"/><path d="M222 80 C230 40 248 8 270 -14" fill="none" stroke="${PET_LINE}" stroke-width="7" stroke-linecap="round"/>`
      + star5(128, -18, big ? 34 : 28, '#ffe066') + star5(272, -18, big ? 34 : 28, '#ffe066');
    if (big) headExtra += `<path d="M206 76 A20 20 0 1 0 206 112 A15 15 0 1 1 206 76 Z" fill="#ffe066" stroke="${PET_LINE}" stroke-width="4"/>`;
  } else if (plan === 'ocean') {
    // a mer-pet: a fish tail instead of legs, fins for arms, a fin crest on its head
    const fin = tone('#7fd6e8', .82), tail = tone('#b8eef7', .7);
    body += big
      ? `<path d="M106 250 C106 196 294 196 294 250 C300 300 280 330 264 350 C320 352 372 320 392 280 C410 330 390 396 340 400 C360 376 340 360 318 368 C270 398 180 404 144 368 C108 336 104 292 106 250 Z" fill="${tail}" ${L}/>
         <path d="M340 400 C376 410 410 390 418 360 C398 370 380 368 372 356 Z" fill="${fin}" ${L}/>`
      : `<path d="M110 250 C110 200 290 200 290 250 C296 300 270 330 250 350 C290 340 320 312 340 290 C356 330 340 390 300 392 C320 368 300 352 280 360 C240 388 180 392 150 360 C110 330 108 290 110 250 Z" fill="${tail}" ${L}/>
         <path d="M300 392 C330 400 360 384 370 366 C350 372 336 370 330 360 Z" fill="${fin}" ${L}/>`;
    body += `<ellipse cx="200" cy="262" rx="54" ry="40" fill="${k.belly}"/><path d="M150 304 Q166 294 182 304 M182 304 Q198 294 214 304 M214 304 Q230 294 246 304 M166 334 Q182 324 198 334 M198 334 Q214 324 230 334" fill="none" stroke="${mix(fin, PET_LINE, .3)}" stroke-width="4" stroke-linecap="round"/>
      <path d="M114 262 C${big ? '64 262 40 310 52 330' : '80 270 62 300 72 316'} C${big ? '84 312' : '92 304'} 108 300 124 296 Z" fill="${fin}" ${L}/><path d="M286 262 C${big ? '336 262 360 310 348 330' : '320 270 338 300 328 316'} C${big ? '316 312' : '308 304'} 292 300 276 296 Z" fill="${fin}" ${L}/>`;
    const crest = big ? 'M120 110 C110 40 150 -30 200 -46 C250 -30 290 40 280 110 Z' : 'M140 100 C136 50 164 0 200 -14 C236 0 264 50 260 100 Z';
    backH += `<path d="${crest}" fill="${fin}" ${L}/><path d="M200 ${big ? -40 : -8} L200 90 M160 ${big ? 0 : 30} L176 96 M240 ${big ? 0 : 30} L224 96" stroke="${mix(fin, PET_LINE, .3)}" stroke-width="5" stroke-linecap="round"/>`;
    if (big) backH += `<path d="M96 170 C50 150 44 112 66 96 C76 126 92 136 106 140 Z" fill="${fin}" ${L}/><path d="M304 170 C350 150 356 112 334 96 C324 126 308 136 294 140 Z" fill="${fin}" ${L}/>`;
    aura += [[60, 60, 12], [84, 20, 7], [350, 200, 10], [368, 160, 6], [40, 340, 9]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#e6fbff" stroke="#6cc8da" stroke-width="3"/>`).join('');
  } else if (plan === 'sunny') {
    // a sun-lion: four sturdy paws, a mane of rays round its face, a flame for a tail
    const m1 = '#ffc44d', m2 = '#ff9f3a', fur = tone('#ffe08a', .62);
    back += big
      ? `<path d="M300 300 C360 300 384 236 360 200 C390 206 412 240 402 280 C424 262 428 236 422 220 C452 262 424 340 340 340 Z" fill="#ff7a2e" ${L}/><path d="M318 312 C360 304 376 268 366 240 C384 256 390 290 360 316 Z" fill="#ffd25e"/>`
      : `<path d="M300 300 C350 300 370 250 350 220 C372 226 392 250 384 280 C400 270 404 250 400 240 C420 270 400 330 340 336 Z" fill="#ff8a3a" ${L}/>`;
    body += `<ellipse cx="200" cy="294" rx="${big ? 128 : 116}" ry="${big ? 86 : 78}" fill="${fur}" ${L}/><ellipse cx="200" cy="312" rx="62" ry="44" fill="${k.belly}"/>`
      + [[108, fl], [158, fr], [242, fl], [292, fr]].map(([x, up]) => `<rect x="${x - 25}" y="${330 + up}" width="50" height="${big ? 62 : 56}" rx="23" fill="${fur}" ${L}/><path d="M${x - 10} ${378 + up} L${x - 10} ${366 + up} M${x + 10} ${378 + up} L${x + 10} ${366 + up}" stroke="${PET_LINE}" stroke-width="4" stroke-linecap="round"/>`).join('');
    const rays = big ? 18 : 16, R = big ? 162 : 146;
    for (let layer = big ? 1 : 0; layer >= 0; layer--) for (let i = 0; i < rays; i++) {
      const a = (i + layer * .5) * Math.PI * 2 / rays, RR = R - layer * 0 + (layer ? 18 : 0), w = .22;
      const pt = (r, da) => `${(200 + r * Math.cos(a + da)).toFixed(1)} ${(170 + r * Math.sin(a + da)).toFixed(1)}`;
      backH += `<path d="M${pt(94, -w)} Q${pt(RR - 10, -.1)} ${pt(RR, 0)} Q${pt(RR - 10, .1)} ${pt(94, w)} Z" fill="${(i + layer) % 2 ? m1 : m2}" stroke="${PET_LINE}" stroke-width="5" stroke-linejoin="round"/>`;
    }
    if (big) headExtra += `<circle cx="200" cy="96" r="13" fill="#ffd25e" stroke="${PET_LINE}" stroke-width="4"/>`;
  }
  // markings: what a grown-up ate as a child
  if (big && p1 !== 'plain' && p1 !== p2) {
    if (p1 === 'blossom') body += [[150, 286], [252, 300], [196, 336], [236, 258]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="11" ry="7" fill="#ff8cc6" ${S4} transform="rotate(30 ${x} ${y})"/>`).join('') + flower(268, 92, 18, '#ff8cc6');
    if (p1 === 'sparkle') body += star5(150, 290, 9, '#fff3a8') + star5(250, 320, 8, '#fff3a8') + star5(206, 344, 6, '#fff'), headExtra += star5(270, 206, 12, '#ffe066');
    if (p1 === 'ocean') body += `<path d="M150 276 Q164 266 178 276 M222 276 Q236 266 250 276 M186 340 Q200 330 214 340" fill="none" stroke="#5ab8cc" stroke-width="4" stroke-linecap="round"/>`, headExtra += `<circle cx="122" cy="140" r="7" fill="#e6fbff" stroke="#6cc8da" stroke-width="3"/><circle cx="110" cy="118" r="4" fill="#e6fbff" stroke="#6cc8da" stroke-width="3"/>`;
    if (p1 === 'sunny') body += `<path d="M140 270 l14 10 l-14 10 M246 270 l14 10 l-14 10" fill="none" stroke="#ff9f3a" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`, headExtra += `<circle cx="200" cy="96" r="10" fill="#ffd25e" stroke="${PET_LINE}" stroke-width="4"/>`;
  }
  // the same treat all the way: a little extra magic around it
  if (pure && plan === 'blossom') aura += [[50, 60], [350, 40], [380, 230], [24, 250]].map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="12" ry="8" fill="#ffb3d9" ${S4} transform="rotate(${i * 50} ${x} ${y})"/>`).join('');
  if (pure && plan === 'sparkle') aura += star5(40, 60, 16, '#ffe066') + star5(370, 70, 12, '#fff3a8') + star5(390, 330, 10, '#ffe066') + star5(10, 300, 9, '#fff3a8');
  if (pure && plan === 'ocean') aura += `<path d="M-20 392 Q40 372 100 392 T220 392 T340 392 T460 392" fill="none" stroke="#8fe3f0" stroke-width="8" stroke-linecap="round" opacity=".7"/>`;
  if (pure && plan === 'sunny') aura += `<circle cx="200" cy="170" r="200" fill="#ffd25e" opacity=".22"/>`;
  body += bodyExtra;

  // ---- head
  let headTop = '';
  if (kind === 'unicorn') headTop = `<path d="M184 70 L200 -6 L216 70 Z" fill="#ffe27a" ${L}/><path d="M190 52 L211 46 M193 34 L207 30" stroke="#e0a800" stroke-width="5" stroke-linecap="round"/>
      <path d="M150 74 C150 44 196 36 214 60 C236 40 270 60 262 90 C286 96 292 124 280 140 C262 120 246 108 226 104 C210 96 170 92 150 74 Z" fill="#ff9ccb" ${L}/>
      <path d="M214 62 C232 52 254 64 254 86" fill="none" stroke="#9fe3ff" stroke-width="9" stroke-linecap="round"/><path d="M168 70 C178 56 198 56 210 66" fill="none" stroke="#c9a8ff" stroke-width="9" stroke-linecap="round"/>`;
  if (kind === 'phoenix') headTop = `<path d="M176 74 C160 40 172 14 184 6 C184 30 196 44 204 60 Z" fill="#ff6b5b" ${L}/>
      <path d="M196 68 C190 30 204 6 220 -4 C216 24 222 44 226 64 Z" fill="#ffd25e" ${L}/>
      <path d="M218 72 C222 46 238 30 254 26 C246 44 244 60 238 78 Z" fill="#ff8a4c" ${L}/>`;
  head = `<circle cx="200" cy="170" r="108" fill="${k.body}" ${L}/>` + head + headTop;
  if (kind === 'puppy') head += `<path d="M104 120 C70 130 66 220 96 236 C120 246 130 200 128 160 Z" fill="${k.ear}" ${L}/>
      <path d="M296 120 C330 130 334 220 304 236 C280 246 270 200 272 160 Z" fill="${k.ear}" ${L}/>
      <ellipse cx="232" cy="136" rx="34" ry="28" fill="${k.accent}" opacity=".55"/>`;
  if (kind === 'kitten') head += `<path d="M186 70 L190 98 M200 66 L200 96 M214 70 L210 98" stroke="${k.accent}" stroke-width="8" stroke-linecap="round"/>`;
  if (kind === 'dragon') head += `<ellipse cx="200" cy="214" rx="56" ry="34" fill="${k.belly}" opacity=".9"/>`;
  if (kind === 'phoenix') head += `<ellipse cx="200" cy="216" rx="52" ry="30" fill="${k.belly}" opacity=".9"/>`;
  head += headExtra;

  // ---- face
  let face = '';
  const ey = 168;
  if (eyes === 'open') face += `<ellipse cx="160" cy="${ey}" rx="17" ry="21" fill="${PET_LINE}"/><ellipse cx="240" cy="${ey}" rx="17" ry="21" fill="${PET_LINE}"/>
      <circle cx="166" cy="${ey - 8}" r="6" fill="#fff"/><circle cx="246" cy="${ey - 8}" r="6" fill="#fff"/><circle cx="155" cy="${ey + 8}" r="3" fill="#fff"/><circle cx="235" cy="${ey + 8}" r="3" fill="#fff"/>`;
  if (eyes === 'happy') face += `<path d="M142 ${ey + 6} Q160 ${ey - 18} 178 ${ey + 6} M222 ${ey + 6} Q240 ${ey - 18} 258 ${ey + 6}" fill="none" stroke="${PET_LINE}" stroke-width="8" stroke-linecap="round"/>`;
  if (eyes === 'sleep') face += `<path d="M142 ${ey} Q160 ${ey + 14} 178 ${ey} M222 ${ey} Q240 ${ey + 14} 258 ${ey}" fill="none" stroke="${PET_LINE}" stroke-width="8" stroke-linecap="round"/>`;
  if (eyes === 'sad') face += `<ellipse cx="160" cy="${ey + 4}" rx="14" ry="16" fill="${PET_LINE}"/><ellipse cx="240" cy="${ey + 4}" rx="14" ry="16" fill="${PET_LINE}"/>
      <circle cx="165" cy="${ey - 2}" r="4.5" fill="#fff"/><circle cx="245" cy="${ey - 2}" r="4.5" fill="#fff"/>
      <path d="M140 ${ey - 22} L174 ${ey - 34} M260 ${ey - 22} L226 ${ey - 34}" stroke="${PET_LINE}" stroke-width="7" stroke-linecap="round"/>
      <path d="M150 ${ey + 26} C146 ${ey + 38} 152 ${ey + 46} 158 ${ey + 40} C162 ${ey + 34} 156 ${ey + 30} 150 ${ey + 26} Z" fill="#7fd0ff"/>`;
  if (eyes === 'think') face += `<ellipse cx="160" cy="${ey}" rx="15" ry="19" fill="${PET_LINE}"/><ellipse cx="240" cy="${ey}" rx="15" ry="19" fill="${PET_LINE}"/>
      <circle cx="164" cy="${ey - 10}" r="5" fill="#fff"/><circle cx="244" cy="${ey - 10}" r="5" fill="#fff"/>
      <path d="M142 ${ey - 32} Q160 ${ey - 40} 176 ${ey - 32}" fill="none" stroke="${PET_LINE}" stroke-width="6" stroke-linecap="round"/>`;
  face += `<ellipse cx="132" cy="206" rx="20" ry="12" fill="#ff8fbf" opacity="${look.blush === false ? 0 : .55}"/><ellipse cx="268" cy="206" rx="20" ry="12" fill="#ff8fbf" opacity="${look.blush === false ? 0 : .55}"/>`;
  if (kind === 'phoenix') {
    // a beak instead of a nose and mouth
    const open = mouth === 'open' || mouth === 'grin' || mouth === 'chew';
    face += open
      ? `<path d="M184 198 L216 198 L200 214 Z" fill="#ffb400" stroke="${PET_LINE}" stroke-width="5" stroke-linejoin="round"/><path d="M188 218 L212 218 L200 230 Z" fill="#ff8a00" stroke="${PET_LINE}" stroke-width="5" stroke-linejoin="round"/>`
      : `<path d="M184 198 L216 198 L200 222 Z" fill="#ffb400" stroke="${PET_LINE}" stroke-width="5" stroke-linejoin="round"/>`;
    if (mouth === 'sad') face += `<path d="M178 238 Q200 228 222 238" fill="none" stroke="${PET_LINE}" stroke-width="5" stroke-linecap="round"/>`;
  } else {
    face += kind === 'dragon'
      ? `<circle cx="188" cy="200" r="4" fill="${PET_LINE}"/><circle cx="212" cy="200" r="4" fill="${PET_LINE}"/>`
      : `<path d="M190 196 L210 196 L200 207 Z" fill="${kind === 'puppy' ? PET_LINE : '#ff6fa8'}" stroke="${PET_LINE}" stroke-width="4" stroke-linejoin="round"/>`;
    if (mouth === 'smile') face += `<path d="M178 216 Q189 230 200 216 Q211 230 222 216" fill="none" stroke="${PET_LINE}" stroke-width="6" stroke-linecap="round"/>`;
    if (mouth === 'grin') face += `<path d="M174 214 Q200 252 226 214 Z" fill="#ff6f91" stroke="${PET_LINE}" stroke-width="6" stroke-linejoin="round"/>`;
    if (mouth === 'sad') face += `<path d="M180 230 Q200 214 220 230" fill="none" stroke="${PET_LINE}" stroke-width="6" stroke-linecap="round"/>`;
    if (mouth === 'open') face += `<ellipse cx="200" cy="226" rx="17" ry="19" fill="#ff6f91" stroke="${PET_LINE}" stroke-width="6"/>`;
    if (mouth === 'chew') face += `<path d="M182 222 Q200 236 218 222" fill="none" stroke="${PET_LINE}" stroke-width="6" stroke-linecap="round"/><ellipse cx="236" cy="214" rx="12" ry="9" fill="#ff8fbf" opacity=".8"/>`;
    if (mouth === 'flat') face += `<path d="M186 222 L214 222" fill="none" stroke="${PET_LINE}" stroke-width="6" stroke-linecap="round"/>`;
  }
  // ---- dirt
  let dirt = '';
  const d = Math.max(0, Math.min(1, look.dirt || 0));
  if (d > .05) {
    const spots = [[150, 300, 18], [250, 270, 14], [230, 330, 16], [128, 130, 13], [262, 118, 11], [180, 250, 9], [300, 300, 12], [100, 280, 10]];
    dirt = spots.slice(0, Math.ceil(d * spots.length)).map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * .75}" fill="#9a6b45" opacity="${.35 + d * .4}"/>`).join('');
  }
  // ---- clothes from the shop (pictures), placed on the head, face and neck
  const w = look.wear || {};
  const wearNeck = w.neck ? `<image href="${w.neck}" x="125" y="232" width="150" height="150"/>` : '';
  const wearHead = w.head ? `<image href="${w.head}" x="130" y="-14" width="140" height="140"/>` : '';
  const wearFace = w.face ? `<image href="${w.face}" x="118" y="96" width="164" height="164"/>` : '';

  // ---- the stage: a baby is small with a big head; a grown-up is taller
  let bodyT = '', headT = '', allT = '';
  if (stage === 'baby') { bodyT = 'translate(200 392) scale(.78) translate(-200 -392)'; headT = 'translate(0 46) translate(200 170) scale(1.02) translate(-200 -170)'; allT = 'translate(200 392) scale(.86) translate(-200 -392)'; }
  if (stage === 'adult') { bodyT = plan === 'plain' ? 'translate(200 392) scale(1.1 1.2) translate(-200 -392)' : 'translate(200 392) scale(1 1.08) translate(-200 -392)'; headT = 'translate(0 -30) translate(200 170) scale(.94) translate(-200 -170)'; allT = 'translate(200 392) scale(1.04) translate(-200 -392)'; }
  const svg = `<g transform="${allT}">${aura}<g transform="${bodyT}">${back}</g><g transform="${headT}">${backH}</g>`
    + `<g transform="${bodyT}">${body}${dirtBody(dirt)}${wearNeck}</g><g transform="${headT}">${head}${face}${dirtHead(dirt)}${wearFace}${wearHead}</g></g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-40 -70 480 480">${svg}</svg>`;
}
const dirtBody = d => d.replace(/<ellipse cx="(128|262)" cy="(130|118)"[^>]*\/>/g, '');
const dirtHead = d => (d.match(/<ellipse cx="(128|262)" cy="(130|118)"[^>]*\/>/g) || []).join('');

/* eggs: a pastel speckled one, or a rainbow sparkle egg; cracks show when it's nearly ready */
function eggSVG(special, warm = 0, wobble = false) {
  const body = special
    ? `<defs><linearGradient id="eg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffb3d9"/><stop offset=".5" stroke-color="#c9a8ff" stop-color="#c9a8ff"/><stop offset="1" stop-color="#9fe3ff"/></linearGradient></defs>
       <path d="M200 40 C290 40 330 190 330 260 C330 340 270 390 200 390 C130 390 70 340 70 260 C70 190 110 40 200 40 Z" fill="url(#eg)" stroke="${PET_LINE}" stroke-width="8"/>
       ${star5(160, 150, 22, '#fff6b0')}${star5(250, 230, 16, '#ffffff')}${star5(170, 300, 14, '#fff6b0')}${star5(262, 330, 10, '#ffffff')}`
    : `<path d="M200 40 C290 40 330 190 330 260 C330 340 270 390 200 390 C130 390 70 340 70 260 C70 190 110 40 200 40 Z" fill="#fff4e0" stroke="${PET_LINE}" stroke-width="8"/>
       ${[[160, 150, 16, '#ffb3d9'], [246, 196, 12, '#b99bff'], [150, 270, 13, '#9fe3ff'], [250, 300, 17, '#ffd25e'], [206, 110, 9, '#a6e3a1'], [200, 350, 10, '#ffb3d9']].map(([x, y, r, c]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`).join('')}`;
  const crack = warm > .55 ? `<path d="M150 200 L176 222 L196 196 L220 226 L244 202" fill="none" stroke="${PET_LINE}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>` : '';
  const crack2 = warm > .85 ? `<path d="M120 260 L144 276 L160 256 M268 250 L286 272" fill="none" stroke="${PET_LINE}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-40 -70 480 480"><g ${wobble ? 'transform="rotate(-6 200 390)"' : ''}>${body}${crack}${crack2}</g></svg>`;
}

// Original line drawings for colouring. Every shape is closed so each part is
// its own area to colour. Lines only (no fills) except eyes and noses.
// viewBox 0 0 1000 1000; the app adds the stroke style.
const PICTURES = [
{ id: 'cat', name: 'Cat', svg: `
  <circle cx="500" cy="360" r="170"/>
  <path d="M380 480 C300 560 290 820 340 880 L660 880 C710 820 700 560 620 480"/>
  <path d="M362 252 L352 118 L455 196"/>
  <path d="M638 252 L648 118 L545 196"/>
  <path d="M380 220 L376 165 L420 198"/>
  <path d="M620 220 L624 165 L580 198"/>
  <circle class="f" cx="440" cy="345" r="24"/><circle class="w" cx="448" cy="337" r="7"/>
  <circle class="f" cx="560" cy="345" r="24"/><circle class="w" cx="568" cy="337" r="7"/>
  <path class="f" d="M484 400 L516 400 L500 420 Z"/>
  <path d="M500 420 Q484 452 458 440 M500 420 Q516 452 542 440"/>
  <path d="M430 405 L330 385 M430 420 L335 430 M570 405 L670 385 M570 420 L665 430"/>
  <path d="M686 830 C820 840 870 700 800 615 C782 595 752 610 768 636 C820 712 772 800 690 795"/>
  <path d="M395 880 Q430 835 465 880 M535 880 Q570 835 605 880"/>
  <ellipse cx="500" cy="720" rx="95" ry="115"/>
  <path d="M120 900 L880 900"/>
`},
{ id: 'fish', name: 'Fish', svg: `
  <path d="M200 500 C260 330 520 280 680 420 C720 455 720 545 680 580 C520 720 260 670 200 500 Z"/>
  <path d="M690 430 L860 320 C830 420 830 580 860 680 L690 570"/>
  <path d="M400 345 C430 250 540 250 580 340"/>
  <path d="M420 640 C450 720 520 720 540 660"/>
  <circle cx="300" cy="470" r="44"/><circle class="f" cx="306" cy="472" r="22"/><circle class="w" cx="312" cy="464" r="7"/>
  <path d="M250 545 Q275 565 300 550"/>
  <path d="M430 430 Q470 470 430 520 M500 410 Q545 465 500 540 M570 420 Q615 470 570 560"/>
  <circle cx="150" cy="330" r="30"/><circle cx="110" cy="220" r="22"/><circle cx="170" cy="140" r="16"/>
  <path d="M60 880 C160 820 260 940 360 880 C460 820 560 940 660 880 C760 820 860 940 940 880"/>
`},
{ id: 'butterfly', name: 'Butterfly', svg: `
  <path d="M470 330 C470 300 530 300 530 330 L530 720 C530 760 470 760 470 720 Z"/>
  <circle cx="500" cy="280" r="45"/>
  <circle class="f" cx="484" cy="275" r="8"/><circle class="f" cx="516" cy="275" r="8"/>
  <path d="M484 300 Q500 314 516 300"/>
  <path d="M485 240 C460 170 420 130 380 120 M515 240 C540 170 580 130 620 120"/>
  <circle cx="372" cy="118" r="20"/><circle cx="628" cy="118" r="20"/>
  <path d="M470 380 C380 220 140 180 130 330 C120 450 300 520 470 520"/>
  <path d="M530 380 C620 220 860 180 870 330 C880 450 700 520 530 520"/>
  <path d="M470 540 C320 540 190 620 230 740 C270 850 420 800 470 680"/>
  <path d="M530 540 C680 540 810 620 770 740 C730 850 580 800 530 680"/>
  <circle cx="270" cy="330" r="55"/><circle cx="730" cy="330" r="55"/>
  <circle cx="380" cy="430" r="28"/><circle cx="620" cy="430" r="28"/>
  <circle cx="320" cy="680" r="40"/><circle cx="680" cy="680" r="40"/>
`},
{ id: 'flower', name: 'Flower', svg: `
  <circle cx="500" cy="300" r="70"/>
  <circle cx="500" cy="165" r="65"/><circle cx="617" cy="232" r="65"/><circle cx="617" cy="368" r="65"/>
  <circle cx="500" cy="435" r="65"/><circle cx="383" cy="368" r="65"/><circle cx="383" cy="232" r="65"/>
  <path d="M485 500 L485 720 M515 500 L515 720"/>
  <path d="M485 640 C420 560 330 570 300 600 C360 660 440 670 485 640"/>
  <path d="M515 590 C580 510 670 520 700 550 C640 610 560 620 515 590"/>
  <path d="M330 720 L670 720 L670 770 L330 770 Z"/>
  <path d="M350 770 L390 900 L610 900 L650 770"/>
  <circle class="f" cx="478" cy="292" r="9"/><circle class="f" cx="522" cy="292" r="9"/>
  <path d="M475 318 Q500 340 525 318"/>
`},
{ id: 'bunny', name: 'Bunny', svg: `
  <circle cx="500" cy="420" r="140"/>
  <path d="M440 293 C380 160 395 60 440 60 C485 60 500 160 480 285"/>
  <path d="M560 293 C620 160 605 60 560 60 C515 60 500 160 520 285"/>
  <path d="M445 260 C420 180 425 110 442 105 C458 110 468 180 462 255 M555 260 C580 180 575 110 558 105 C542 110 532 180 538 255"/>
  <path d="M413 530 C330 600 320 820 380 870 L620 870 C680 820 670 600 587 530"/>
  <ellipse cx="500" cy="720" rx="90" ry="105"/>
  <circle cx="690" cy="800" r="45"/>
  <ellipse cx="430" cy="885" rx="65" ry="28"/><ellipse cx="570" cy="885" rx="65" ry="28"/>
  <circle class="f" cx="450" cy="400" r="22"/><circle class="w" cx="457" cy="393" r="7"/>
  <circle class="f" cx="550" cy="400" r="22"/><circle class="w" cx="557" cy="393" r="7"/>
  <path class="f" d="M486 450 L514 450 L500 466 Z"/>
  <path d="M500 466 Q486 494 466 484 M500 466 Q514 494 534 484"/>
  <path d="M440 460 L360 445 M440 475 L365 490 M560 460 L640 445 M560 475 L635 490"/>
  <circle cx="420" cy="470" r="20"/><circle cx="580" cy="470" r="20"/>
`},
{ id: 'car', name: 'Car', svg: `
  <path d="M150 650 L150 560 C150 532 175 520 205 520 L300 520 L382 402 C392 388 410 380 430 380 L620 380 C648 380 668 392 688 412 L790 520 L830 520 C858 520 870 540 870 568 L870 650 L805 650 A85 85 0 0 0 635 650 L385 650 A85 85 0 0 0 215 650 Z"/>
  <path d="M325 515 L398 412 L490 412 L490 515 Z"/>
  <path d="M520 412 L618 412 C638 412 652 420 664 434 L735 515 L520 515 Z"/>
  <circle cx="300" cy="660" r="72"/><circle cx="300" cy="660" r="30"/>
  <circle cx="720" cy="660" r="72"/><circle cx="720" cy="660" r="30"/>
  <circle cx="838" cy="572" r="20"/>
  <path d="M150 590 L190 590"/>
  <path d="M520 560 L560 560"/>
  <path d="M60 740 L940 740"/>
  <path d="M120 300 C120 260 175 250 195 280 C215 245 280 255 280 300 C305 300 312 335 285 342 L135 342 C105 342 100 305 120 300 Z"/>
  <circle cx="820" cy="200" r="65"/>
`},
{ id: 'house', name: 'House', svg: `
  <path d="M250 480 L750 480 L750 880 L250 880 Z"/>
  <path d="M200 500 L500 220 L800 500 Z"/>
  <path d="M620 330 L620 230 L690 230 L690 395"/>
  <path d="M440 880 L440 700 C440 650 560 650 560 700 L560 880"/>
  <circle class="f" cx="540" cy="780" r="10"/>
  <path d="M300 560 L400 560 L400 660 L300 660 Z M350 560 L350 660 M300 610 L400 610"/>
  <path d="M600 560 L700 560 L700 660 L600 660 Z M650 560 L650 660 M600 610 L700 610"/>
  <circle cx="500" cy="390" r="45"/>
  <circle cx="160" cy="160" r="70"/>
  <path d="M160 50 L160 70 M160 250 L160 270 M50 160 L70 160 M250 160 L270 160 M82 82 L96 96 M224 224 L238 238 M82 238 L96 224 M224 96 L238 82"/>
  <path d="M600 140 C600 100 660 90 680 120 C700 80 770 90 770 140 C800 140 810 180 780 190 L610 190 C580 190 575 145 600 140 Z"/>
  <path d="M60 880 L940 880"/>
  <path d="M90 880 L90 800 C90 760 150 760 150 800 L150 880 M850 880 L850 790 C850 750 910 750 910 790 L910 880"/>
`},
{ id: 'rocket', name: 'Rocket', svg: `
  <path d="M420 300 C420 200 460 130 500 90 C540 130 580 200 580 300 Z"/>
  <path d="M420 300 L580 300 L580 680 L420 680 Z"/>
  <circle cx="500" cy="420" r="55"/>
  <circle cx="500" cy="420" r="35"/>
  <path d="M420 560 L330 680 L330 740 L420 680 M580 560 L670 680 L670 740 L580 680"/>
  <path d="M440 680 L560 680 L540 730 L460 730 Z"/>
  <path d="M460 730 C440 800 480 860 500 900 C520 860 560 800 540 730"/>
  <path d="M480 740 C470 790 495 820 500 840 C505 820 530 790 520 740"/>
  <path d="M500 600 L500 680"/>
  <path d="M180 200 L195 240 L235 245 L205 270 L215 310 L180 290 L145 310 L155 270 L125 245 L165 240 Z"/>
  <path d="M800 380 L812 410 L842 414 L820 433 L827 464 L800 448 L773 464 L780 433 L758 414 L788 410 Z"/>
  <circle cx="220" cy="560" r="30"/><circle cx="780" cy="170" r="22"/>
  <path d="M760 760 C700 760 690 840 760 850 C720 820 730 770 760 760 Z"/>
`},
{ id: 'dino', name: 'Dinosaur', svg: `
  <path d="M90 650 C200 560 280 480 400 470 C520 460 590 470 630 430 C660 400 650 300 665 250 C680 180 770 170 800 215 C830 260 805 305 755 305 C715 305 708 360 708 420 C708 490 725 570 690 640 C650 730 530 760 420 752 C300 744 210 700 90 650 Z"/>
  <path d="M380 748 L380 860 L450 860 L450 754 M570 742 L570 860 L640 860 L640 712"/>
  <path d="M700 520 Q740 528 745 556"/>
  <circle class="f" cx="750" cy="235" r="16"/><circle class="w" cx="755" cy="230" r="5"/>
  <path d="M768 278 Q788 284 798 268"/>
  <path d="M330 505 L350 455 L385 476 M430 466 L455 418 L490 462 M540 458 L575 412 L600 450"/>
  <circle cx="430" cy="610" r="42"/><circle cx="560" cy="650" r="30"/><circle cx="330" cy="640" r="26"/><circle cx="600" cy="550" r="22"/>
  <path d="M60 860 L940 860"/>
  <path d="M120 860 C110 780 170 760 200 790 C230 740 300 760 290 820 C320 820 330 850 320 860"/>
`},
{ id: 'owl', name: 'Owl', svg: `
  <path d="M300 300 C300 200 380 160 500 160 C620 160 700 200 700 300 L700 650 C700 780 620 840 500 840 C380 840 300 780 300 650 Z"/>
  <path d="M300 300 L280 180 L380 220 M700 300 L720 180 L620 220"/>
  <circle cx="415" cy="350" r="80"/><circle cx="585" cy="350" r="80"/>
  <circle cx="415" cy="350" r="40"/><circle cx="585" cy="350" r="40"/>
  <circle class="f" cx="420" cy="355" r="20"/><circle class="w" cx="428" cy="347" r="6"/>
  <circle class="f" cx="590" cy="355" r="20"/><circle class="w" cx="598" cy="347" r="6"/>
  <path d="M475 440 L525 440 L500 490 Z"/>
  <path d="M300 480 C240 560 250 680 320 740 M700 480 C760 560 750 680 680 740"/>
  <path d="M400 560 Q430 590 460 560 M540 560 Q570 590 600 560 M440 640 Q470 670 500 640 Q530 670 560 640 M400 720 Q430 750 460 720 M540 720 Q570 750 600 720"/>
  <path d="M120 870 L880 870 L880 910 L120 910 Z"/>
  <path d="M430 840 L420 870 M460 840 L460 870 M540 840 L540 870 M570 840 L580 870"/>
  <path d="M800 870 C820 820 870 810 900 830 C880 860 840 870 800 870 Z"/>
`},
{ id: 'cupcake', name: 'Cupcake', svg: `
  <path d="M280 560 L720 560 L660 880 L340 880 Z"/>
  <path d="M350 560 L385 880 M420 560 L440 880 M500 560 L500 880 M580 560 L560 880 M650 560 L615 880"/>
  <path d="M250 560 C200 560 200 470 270 460 C240 390 320 340 380 370 C380 300 450 270 500 300 C550 270 620 300 620 370 C680 340 760 390 730 460 C800 470 800 560 750 560 Z"/>
  <path d="M330 470 C380 500 450 480 500 450 C550 480 620 500 670 470"/>
  <circle cx="500" cy="240" r="55"/>
  <path d="M505 185 C510 140 540 110 580 100"/>
  <path d="M380 400 L400 420 M600 410 L580 430 M460 380 L470 405 M540 380 L530 405 M300 510 L320 525 M690 510 L670 525"/>
`},
{ id: 'turtle', name: 'Turtle', svg: `
  <path d="M220 620 C220 400 360 300 500 300 C640 300 780 400 780 620 Z"/>
  <path d="M180 620 L820 620 C820 660 790 680 760 680 L240 680 C210 680 180 660 180 620 Z"/>
  <path d="M430 400 L570 400 L610 500 L570 600 L430 600 L390 500 Z"/>
  <path d="M430 400 L380 330 M570 400 L620 330 M610 500 L760 500 M390 500 L240 500 M430 600 L420 620 M570 600 L580 620"/>
  <path d="M780 560 C850 520 930 540 930 600 C930 650 870 660 820 640"/>
  <circle class="f" cx="880" cy="580" r="13"/><circle class="w" cx="884" cy="575" r="4"/>
  <path d="M870 615 Q890 625 905 612"/>
  <path d="M280 680 L270 780 L360 780 L350 680 M650 680 L640 780 L730 780 L720 680"/>
  <path d="M220 630 L130 600 L150 650 Z"/>
  <path d="M60 860 L940 860"/>
`},
{ id: 'rainbow', name: 'Rainbow', svg: `
  <path d="M120 700 A380 380 0 0 1 880 700"/>
  <path d="M190 700 A310 310 0 0 1 810 700"/>
  <path d="M260 700 A240 240 0 0 1 740 700"/>
  <path d="M330 700 A170 170 0 0 1 670 700"/>
  <path d="M400 700 A100 100 0 0 1 600 700"/>
  <path d="M60 720 C40 650 110 600 170 630 C190 570 290 570 310 630 C370 610 420 660 390 720 C380 760 340 770 310 760 L110 760 C70 760 55 740 60 720 Z"/>
  <path d="M610 720 C590 650 660 600 720 630 C740 570 840 570 860 630 C920 610 970 660 940 720 C930 760 890 770 860 760 L660 760 C620 760 605 740 610 720 Z"/>
  <circle cx="820" cy="170" r="70"/>
  <path d="M820 60 L820 80 M820 260 L820 280 M710 170 L730 170 M910 170 L930 170 M742 92 L756 106 M884 234 L898 248 M742 248 L756 234 M884 106 L898 92"/>
  <path d="M180 250 L194 286 L232 290 L204 314 L212 352 L180 332 L148 352 L156 314 L128 290 L166 286 Z"/>
`},
{ id: 'icecream', name: 'Ice cream', svg: `
  <path d="M340 520 L660 520 L500 920 Z"/>
  <path d="M380 520 L560 770 M460 520 L590 700 M540 520 L620 630 M620 520 L640 570 M620 520 L440 770 M540 520 L410 700 M460 520 L380 630 M380 520 L360 570"/>
  <path d="M320 530 C260 530 250 450 310 430 C290 340 380 300 420 340 C440 290 520 280 540 330 C600 300 690 340 680 420 C740 440 740 530 680 530 C660 570 620 560 610 540 C600 590 540 590 530 540 C500 580 450 570 450 535 C420 570 370 570 360 530 Z"/>
  <path d="M400 330 C380 230 460 170 520 180 C600 170 660 250 620 330"/>
  <circle cx="530" cy="140" r="45"/>
  <path d="M535 95 C540 60 570 40 600 40"/>
  <path d="M400 420 L410 440 M480 380 L470 405 M560 410 L575 430 M620 460 L600 475 M450 230 L465 250 M560 230 L545 250"/>
`},
];
