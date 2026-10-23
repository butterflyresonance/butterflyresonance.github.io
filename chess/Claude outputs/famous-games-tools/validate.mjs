import { Chess } from '../mods/chess.mjs';
import fs from 'fs';
const games = JSON.parse(fs.readFileSync('raw.json', 'utf8'));
const out = [];
for (const g of games) {
  const c = new Chess();
  let bad = null;
  for (const [i, m] of g.moves.entries()) { try { c.move(m); } catch { bad = `illegal at ply ${i + 1}: ${m}`; break; } }
  let keyPly = null;
  if (g.key) {
    const [, n, dots, s] = /(\d+)(\.\.\.|\.)(.+)/.exec(g.key);
    keyPly = (Number(n) - 1) * 2 + (dots === '...' ? 1 : 0);      // index into moves
    if (g.moves[keyPly] !== s) bad = (bad || '') + ` key ${g.key} is ${g.moves[keyPly]}`;
  }
  const res = g.result, mate = c.isCheckmate();
  console.log(`${bad ? 'XX' : 'ok'} ${g.id.padEnd(26)} ${String(g.moves.length).padStart(3)} plies ${res.padEnd(7)}${mate ? ' mate' : ''}${bad ? '  ' + bad : ''}`);
  if (!bad) out.push({ ...g, key: keyPly });
}
fs.writeFileSync('games.json', JSON.stringify(out));
console.log(out.length, 'valid;', fs.statSync('games.json').size, 'bytes');
