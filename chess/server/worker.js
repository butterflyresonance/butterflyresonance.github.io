/* Étude server — a Cloudflare Worker with three kinds of Durable Object.

   The server is the record of every online game. Phones send it moves; it checks
   each one with chess.js, keeps it, and sends the game back to both players.
   A player who isn't there gets it when they next open the app, and a push
   notification if they turned those on.

     Directory   one for the whole app: every account's name, code, when it was made
                 and last connected (for search and the Accounts screen), deleted ids
                 (refused from then on), the key the server signs push notifications
                 with, and the newest build seen
     User        one per account: name, friends, friend requests, the games list,
                 where to send notifications, and the phones that are connected now
     Game        one per game: the players, the moves, the result, the chat,
                 a takeback or rematch being asked for, and the time limit

   Accounts. An account is an Ed25519 key pair made on the phone. The account's id
   is the public key; the private key never leaves the phone. To connect, the phone
   signs "etude:<id>:<time>" and the Worker checks the signature against the id, so
   the server stores no passwords and nothing that would let anyone log in.

   Admin. For accounts listed in ADMIN_IDS (wrangler.toml), 'hello' says admin: true
   and the app shows an Accounts screen: every account, with Delete (adminList,
   adminDelete). The server checks the list on every admin request. Any account
   can delete itself (deleteAccount).

   Each phone keeps one WebSocket open to its own User object while the app is
   open. Everything goes over it as { id, op, ... }, and every request gets one
   reply { k: 'res', id, ok, ... }. Games and lists arrive as { k: 'game' },
   { k: 'gsum' }, { k: 'friends' } and so on whenever they change. */

import { DurableObject } from 'cloudflare:workers';
import { Chess } from './chess.js';

// Pages allowed to use the server, so nobody else's app can run up the free allowance.
const ORIGINS = [
  'https://butterflyresonance.github.io',
  'http://localhost:8765',
  'http://localhost:8787',
];
const APP_URL = 'https://butterflyresonance.github.io/chess/';
const SIGN_WINDOW = 10 * 60 * 1000;       // a login signature is good for 10 minutes either side of now
const MAX_MESSAGE = 4000;
const MAX_CHAT = 200;                     // messages kept per game
const NAME_MAX = 30;
const CODE_ALPHA = 'abcdefghjkmnpqrstuvwxyz23456789';   // game codes, as the app has always made them
const GAME_RE = /^[a-z0-9]{9}$/;
const ID_RE = /^[A-Za-z0-9_-]{43}$/;      // 32 bytes, base64url
const LIMITS = [0, 1, 3, 7];              // days per move; 0 is no limit
const DAY = 86400000;

/* ---------- small helpers ---------- */
const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
// base64url text to bytes
const unb64u = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), c => c.charCodeAt(0));
const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';   // Crockford: no I, L, O, U
// bytes to Crockford base32 text
function base32(bytes) {
  let out = '', bits = 0, val = 0;
  for (const b of bytes) {
    val = (val << 8) | b; bits += 8;
    while (bits >= 5) { out += B32[(val >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits) out += B32[(val << (5 - bits)) & 31];
  return out;
}
// the short code shown beside a name: the first 8 characters of the public key in base32
const shortCode = id => base32(unb64u(id)).slice(0, 8);
// a name with control characters removed and spaces tidied, at most NAME_MAX
const cleanName = n => String(n || '').replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);
// a random 9-character game code
const makeGameCode = () => [...crypto.getRandomValues(new Uint8Array(9))].map(b => CODE_ALPHA[b % CODE_ALPHA.length]).join('');
// the other colour
const other = c => c === 'w' ? 'b' : 'w';
// the User object for an account id
const userStub = (env, id) => env.USERS.get(env.USERS.idFromName(id));
// the Game object for a game code
const gameStub = (env, g) => env.GAMES.get(env.GAMES.idFromName(g));
// the one Directory object
const dirStub = env => env.DIR.get(env.DIR.idFromName('directory'));
// true if the account id is listed in ADMIN_IDS (wrangler.toml [vars])
const isAdmin = (env, id) => String(env.ADMIN_IDS || '').split(/[\s,]+/).filter(Boolean).includes(id);
// send JSON on a socket, ignoring a socket that has closed
function send(ws, obj) { try { ws.send(JSON.stringify(obj)); } catch {} }

// builds are named YYYY-MM-DD.N-word; compare by date, then N as a number
function newerBuild(a, b) {
  const pa = /^(\d{4}-\d{2}-\d{2})\.(\d+)/.exec(a || ''), pb = /^(\d{4}-\d{2}-\d{2})\.(\d+)/.exec(b || '');
  if (!pa) return false;
  if (!pb) return true;
  return pa[1] !== pb[1] ? pa[1] > pb[1] : Number(pa[2]) > Number(pb[2]);
}

// was this text signed with the key whose public half is this id?
async function signedBy(id, text, sig) {
  if (!ID_RE.test(id || '') || typeof sig !== 'string' || !/^[A-Za-z0-9_-]{80,90}$/.test(sig)) return false;
  try {
    const key = await crypto.subtle.importKey('raw', unb64u(id), { name: 'Ed25519' }, false, ['verify']);
    return await crypto.subtle.verify({ name: 'Ed25519' }, key, unb64u(sig), new TextEncoder().encode(text));
  } catch { return false; }
}
// a connection's login: the signature of 'etude:<id>:<time>', made within SIGN_WINDOW of now
async function verifyLogin(id, t, sig) {
  if (!/^\d{10,16}$/.test(t || '')) return false;
  if (Math.abs(Date.now() - Number(t)) > SIGN_WINDOW) return false;
  return signedBy(id, `etude:${id}:${t}`, sig);
}

/* ---------- the Worker: checks who is connecting, then hands them to their User ---------- */
export default {
  // every request: a signed WebSocket connection goes to its User; anything else gets a plain reply
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    const m = /^\/u\/([A-Za-z0-9_-]{43})$/.exec(url.pathname);
    if (m) {
      if (!ORIGINS.includes(origin)) return new Response('Not allowed from ' + origin, { status: 403 });
      if (request.headers.get('Upgrade') !== 'websocket') return new Response('Expected a WebSocket', { status: 426 });
      if (!await verifyLogin(m[1], url.searchParams.get('t'), url.searchParams.get('s'))) return new Response('Signature not accepted', { status: 401 });
      // a deleted account: the phone is told so over the socket (a refused upgrade looks like a network fault)
      if (await dirStub(env).isDeleted(m[1])) {
        const [client, server] = Object.values(new WebSocketPair());
        server.accept();
        server.send(JSON.stringify({ k: 'deleted' }));
        server.close(4001, 'deleted');
        return new Response(null, { status: 101, webSocket: client });
      }
      return userStub(env, m[1]).fetch(request);
    }
    return new Response('Étude server. Nothing to see here.', { headers: { 'content-type': 'text/plain; charset=utf-8' } });
  },
};

/* ======================= Directory ======================= */
export class Directory extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    // users: every account (made: when it first connected; seen: when it last did); deleted: ids refused from now on
    this.sql.exec(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT, lname TEXT, code TEXT, at INTEGER, made INTEGER, seen INTEGER)`);
    this.sql.exec(`CREATE INDEX IF NOT EXISTS users_code ON users(code)`);
    this.sql.exec(`CREATE TABLE IF NOT EXISTS deleted (id TEXT PRIMARY KEY, at INTEGER)`);
  }
  // add or rename an account in the directory
  put(id, name) {
    const now = Date.now();
    this.sql.exec(`INSERT INTO users (id, name, lname, code, at, made, seen) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET name = excluded.name, lname = excluded.lname, at = excluded.at`, id, name, name.toLowerCase(), shortCode(id), now, now, now);
  }
  // an account has connected: add it if new, and note when
  touch(id) {
    const now = Date.now();
    this.sql.exec(`INSERT INTO users (id, name, lname, code, at, made, seen) VALUES (?, '', '', ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET seen = excluded.seen`, id, shortCode(id), now, now, now);
  }
  isDeleted(id) { return this.sql.exec(`SELECT 1 FROM deleted WHERE id = ?`, id).toArray().length > 0; }   // true if the account was deleted
  // take an account out of the directory and refuse it from now on
  markDeleted(id) {
    this.sql.exec(`DELETE FROM users WHERE id = ?`, id);
    this.sql.exec(`INSERT OR REPLACE INTO deleted (id, at) VALUES (?, ?)`, id, Date.now());
  }
  // every account, for the admin page, most recently seen first
  all() { return this.sql.exec(`SELECT id, name, code, made, seen FROM users ORDER BY seen DESC`).toArray(); }
  // an account's id, name and code, or null
  get(id) {
    const r = this.sql.exec(`SELECT id, name, code FROM users WHERE id = ?`, id).toArray();
    return r[0] || null;
  }
  // a code (with or without its dash) finds that person; anything else searches names
  search(q, me) {
    q = String(q || '').trim();
    if (!q) return [];
    const c = q.toUpperCase().replace(/[^0-9A-Z]/g, '').replace(/[IL]/g, '1').replace(/O/g, '0');
    let rows = [];
    if (c.length >= 4 && /^[0-9A-HJKMNP-TV-Z]+$/.test(c)) rows = this.sql.exec(`SELECT id, name, code FROM users WHERE code LIKE ? LIMIT 20`, c.slice(0, 8) + '%').toArray();
    if (!rows.length) rows = this.sql.exec(`SELECT id, name, code FROM users WHERE lname LIKE ? ESCAPE '\\' ORDER BY at DESC LIMIT 20`,
      '%' + q.toLowerCase().replace(/[\\%_]/g, x => '\\' + x) + '%').toArray();
    return rows.filter(r => r.id !== me && r.name);
  }
  // the key push notifications are signed with: made once, kept here
  async vapid() {
    let k = await this.ctx.storage.get('vapid');
    if (!k) {
      const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
      k = { priv: await crypto.subtle.exportKey('jwk', pair.privateKey), pub: b64u(await crypto.subtle.exportKey('raw', pair.publicKey)) };
      await this.ctx.storage.put('vapid', k);
    }
    return k;
  }
  // the newest build any phone has connected with, so older ones can be told to reload
  async build(v) {
    let top = await this.ctx.storage.get('build');
    if (typeof v === 'string' && v.length < 60 && newerBuild(v, top)) { top = v; await this.ctx.storage.put('build', top); }
    return top || v || null;
  }
}

/* ======================= Game ======================= */
/* One game. Seats are user ids; 'pending' is 'challenge' (waiting for the friend
   to accept) or 'invite' (a link is out, the other seat is empty). Moves are SAN
   from the standard start. Nothing can be played while it is pending. */
export class Game extends DurableObject {
  // the game from storage, once per wake-up
  async load() {
    if (this.g === undefined) this.g = (await this.ctx.storage.get('g')) || null;
    return this.g;
  }
  // a chess.js board at the game's current position (kept between moves)
  board() {
    if (!this.chess || this.chessPly !== this.g.moves.length) {
      this.chess = new Chess();
      for (const san of this.g.moves) this.chess.move(san);
      this.chessPly = this.g.moves.length;
    }
    return this.chess;
  }
  // a day, unless a test run shortens it (wrangler dev --var TEST_DAY_MS:...)
  get day() { return Number(this.env.TEST_DAY_MS) || DAY; }
  colorOf(uid) { return !this.g ? null : this.g.w === uid ? 'w' : this.g.b === uid ? 'b' : null; }
  // when the side to move runs out of time, or null
  deadline() {
    const g = this.g;
    return g.limit && !g.result && !g.pending ? (g.lastAt || g.startAt) + g.limit * this.day : null;
  }
  // what both players see
  view() {
    const g = this.g;
    return { id: g.id, w: g.w, b: g.b, names: g.names, moves: g.moves, result: g.result, pending: g.pending, by: g.by,
      limit: g.limit, deadline: this.deadline(), chat: g.chat, seen: g.seen, tb: g.tb, rm: g.rm, next: g.next,
      flags: g.flags, v: g.v, created: g.created, at: g.at };
  }
  // one line for a player's games list
  summaryFor(c) {
    const g = this.g;
    const last = g.moves.length ? g.moves[g.moves.length - 1] : null;
    const theirs = other(c);
    const unread = g.chat.filter((m, i) => m.by === theirs && i >= (g.seen[c] || 0)).length;
    return { g: g.id, color: c, opp: g[theirs], oppName: g.names[theirs] || '', n: g.moves.length, last,
      turn: g.moves.length % 2 ? 'b' : 'w', result: g.result, pending: g.pending, mine: g.by === g[c],
      limit: g.limit, deadline: this.deadline(), unread, at: g.at, next: g.next };
  }
  // store the game, set the alarm, and send it to both players' Users; each event goes to the player it names
  async save(events) {
    const g = this.g;
    events = [].concat(events || []);
    g.v = (g.v || 0) + 1;
    g.at = Date.now();
    await this.ctx.storage.put('g', g);
    await this.setAlarm();
    // both players' lists and phones; the event is news for the player it names
    const view = this.view();
    const jobs = [];
    for (const c of ['w', 'b']) {
      if (!g[c]) continue;
      const event = events.find(e => e.to === c);
      jobs.push(userStub(this.env, g[c]).gameUpdate(this.summaryFor(c), view, event ? { ...event, g: g.id, from: g.names[other(c)] || 'Your opponent' } : null)
        .catch(e => console.warn('notify', e)));
    }
    await Promise.all(jobs);
    return view;
  }
  // wake at the reminder time, then at the deadline; no alarm without a limit
  async setAlarm() {
    const d = this.deadline();
    if (!d) { await this.ctx.storage.deleteAlarm(); return; }
    // a reminder when a quarter of the time is left, then the deadline itself
    const remind = d - this.g.limit * this.day / 4;
    await this.ctx.storage.setAlarm(!this.g.reminded && remind > Date.now() ? remind : d);
  }
  // the alarm: a reminder to the side to move, or a loss on time
  async alarm() {
    await this.load();
    const g = this.g;
    const d = g && this.deadline();
    if (!d) return;
    const side = g.moves.length % 2 ? 'b' : 'w';
    if (Date.now() >= d - 1000) {
      g.result = { type: 'time', winner: other(side) };
      g.tb = g.rm = null;
      await this.save([{ type: 'time', to: side }, { type: 'timewin', to: other(side) }]);
    } else if (!g.reminded) {
      g.reminded = true;
      await this.ctx.storage.put('g', g);
      const left = d - Date.now();
      const view = this.view();
      await userStub(this.env, g[side]).gameUpdate(this.summaryFor(side), view,
        { type: 'reminder', to: side, g: g.id, from: g.names[other(side)] || 'your opponent', hours: Math.max(1, Math.round(left / 3600000)) }).catch(() => {});
      await this.setAlarm();
    }
  }

  /* ---- made by a User ---- */
  async create({ id, w, b, names, limit, pending, by }) {
    await this.load();
    if (this.g) throw new Error('exists');
    this.g = { id, w: w || null, b: b || null, names: names || {}, moves: [], result: null, pending: pending || null, by,
      limit: LIMITS.includes(limit) ? limit : 0, created: Date.now(), startAt: pending ? null : Date.now(), lastAt: null,
      chat: [], seen: { w: 0, b: 0 }, tb: null, rm: null, next: null, flags: { w: {}, b: {} }, v: 0 };
    const opp = by === w ? 'b' : 'w';
    return this.save(pending === 'challenge' ? { type: 'challenge', to: opp } : null);
  }
  // the game for one of its players; for an open invite, who it's from
  async state(uid) {
    await this.load();
    if (!this.g) return { gone: true };
    if (this.colorOf(uid)) return this.view();
    // someone opening an invite link: just enough to say who it's from
    if (this.g.pending === 'invite') return { id: this.g.id, invite: true, from: this.g.names[this.g.w ? 'w' : 'b'], seat: this.g.w ? 'b' : 'w', limit: this.g.limit };
    return { notYours: true };
  }
  // take the empty seat of an invite; returns the inviter so the Users can become friends
  async join(uid, name) {
    await this.load();
    const g = this.g;
    if (!g) return { err: 'gone' };
    if (this.colorOf(uid)) return { view: this.view() };
    if (g.pending !== 'invite') return { err: 'taken' };
    const seat = g.w ? 'b' : 'w';
    g[seat] = uid;
    g.names[seat] = name;
    g.pending = null;
    g.startAt = Date.now();
    return { view: await this.save({ type: 'joined', to: other(seat) }), host: g[other(seat)], hostName: g.names[other(seat)] };
  }
  // a player changed their name
  async rename(uid, name) {
    await this.load();
    const c = this.colorOf(uid);
    if (!c || this.g.names[c] === name) return;
    this.g.names[c] = name;
    await this.save(null);
  }
  /* everything a player does in the game: one entry point, one save */
  async act(uid, op, a = {}) {
    await this.load();
    const g = this.g;
    if (!g) return { err: 'gone' };
    const me = this.colorOf(uid);
    if (!me) return { err: 'notYours' };
    const them = other(me);
    const fail = err => ({ err, view: this.view() });

    if (op === 'accept') {
      if (g.pending !== 'challenge' || g.by === uid) return fail('notPending');
      g.pending = null; g.startAt = Date.now();
      return { view: await this.save({ type: 'accepted', to: them }) };
    }
    if (op === 'decline' || op === 'cancel') {
      if (!g.pending) return fail('started');
      g.result = { type: op === 'decline' ? 'declined' : 'cancelled', winner: null };
      g.pending = null;
      return { view: await this.save(op === 'decline' && g[them] ? { type: 'declined', to: them } : null) };
    }
    if (op === 'chat') {
      const text = String(a.text || '').trim().slice(0, 500);
      if (!text) return fail('empty');
      if (a.cid && g.chat.some(m => m.cid === a.cid)) return { view: this.view() };     // sent twice: kept once
      g.chat.push({ by: me, text, at: Date.now(), cid: String(a.cid || '').slice(0, 20) });
      if (g.chat.length > MAX_CHAT) {
        const cut = g.chat.length - MAX_CHAT;
        g.chat = g.chat.slice(cut);
        g.seen = { w: Math.max(0, (g.seen.w || 0) - cut), b: Math.max(0, (g.seen.b || 0) - cut) };
      }
      g.seen[me] = g.chat.length;    // your own messages count as read
      return { view: await this.save({ type: 'chat', to: them, text }) };
    }
    if (op === 'seen') {
      const n = Math.min(g.chat.length, Number(a.n) || 0);
      if (n <= (g.seen[me] || 0)) return { view: this.view() };
      g.seen[me] = n;
      return { view: await this.save(null) };
    }
    if (op === 'flags') {
      g.flags[me] = { hints: !!a.hints, auto: !!a.auto, coach: !!a.coach, review: !!a.review };
      return { view: await this.save(null) };
    }
    if (op === 'rematch') {
      if (!g.result || g.pending || g.next) return fail('notOver');
      if (g.rm && g.rm.by === them) return this.startRematch();      // both asked: that's a yes from each
      g.rm = { by: me };
      return { view: await this.save({ type: 'rematch', to: them }) };
    }
    if (op === 'rematchAnswer') {
      if (!g.rm || g.rm.by !== them) return fail('notAsked');
      if (a.ok) return this.startRematch();
      g.rm = null;
      return { view: await this.save({ type: 'rematchNo', to: them }) };
    }

    // the rest need a game that's under way
    if (g.pending) return fail('pending');
    if (g.result) return fail('over');

    if (op === 'move') {
      if (a.ply !== g.moves.length) return fail('stale');
      const chess = this.board();
      if (chess.turn() !== me) return fail('notYourTurn');
      let m;
      try { m = chess.move(String(a.san)); } catch { m = null; }
      if (!m) { this.chess = null; return fail('illegal'); }
      g.moves.push(m.san);
      this.chessPly = g.moves.length;
      g.lastAt = Date.now();
      g.reminded = false;
      g.tb = null;
      if (chess.isCheckmate()) g.result = { type: 'checkmate', winner: me };
      else if (chess.isStalemate()) g.result = { type: 'stalemate', winner: null };
      else if (chess.isDraw()) g.result = { type: 'draw', winner: null,
        why: chess.isInsufficientMaterial() ? 'insufficient material' : chess.isThreefoldRepetition() ? 'threefold repetition' : 'fifty-move rule' };
      return { view: await this.save({ type: g.result ? 'end' : 'move', to: them, san: m.san, ply: g.moves.length - 1 }) };
    }
    if (op === 'resign') {
      g.result = { type: 'resign', winner: them };
      g.tb = null;
      return { view: await this.save({ type: 'resign', to: them }) };
    }
    if (op === 'takeback') {
      if (!g.moves.length) return fail('nothing');
      g.tb = { by: me, ply: g.moves.length };
      return { view: await this.save({ type: 'takeback', to: them }) };
    }
    if (op === 'takebackAnswer') {
      if (!g.tb || g.tb.by !== them) return fail('notAsked');
      const asked = g.tb;
      g.tb = null;
      if (!a.ok || asked.ply !== g.moves.length) return { view: await this.save({ type: 'takebackNo', to: them }) };
      // back to the asker's turn, removing at least one of their own moves
      const turn = g.moves.length % 2 ? 'b' : 'w';
      const drop = Math.min(turn === them ? 2 : 1, g.moves.length);
      g.moves = g.moves.slice(0, g.moves.length - drop);
      this.chess = null;
      g.lastAt = Date.now();
      return { view: await this.save({ type: 'takebackYes', to: them }) };
    }
    return fail('unknown');
  }
  // both agreed to a rematch: a new game with colours swapped and the same limit
  async startRematch() {
    const g = this.g;
    const id = makeGameCode();
    // colours swap; the same time limit
    await gameStub(this.env, id).create({ id, w: g.b, b: g.w, names: { w: g.names.b, b: g.names.w }, limit: g.limit, pending: null, by: g.rm ? g[g.rm.by] : g.w });
    g.rm = null;
    g.next = id;
    return { view: await this.save(null), next: id };
  }
}

/* ======================= User ======================= */
export class User extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    // keep-alives are answered without waking the object
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
  }
  async me() { return (await this.ctx.storage.get('me')) || null; }
  async getMap(k) { return (await this.ctx.storage.get(k)) || {}; }
  sockets() { return this.ctx.getWebSockets(); }
  toAll(obj) { for (const ws of this.sockets()) send(ws, obj); }

  // a phone connects (already checked by the Worker): accept its WebSocket
  async fetch(request) {
    const url = new URL(request.url);
    const id = /^\/u\/([A-Za-z0-9_-]{43})$/.exec(url.pathname)[1];
    if (!await this.me()) await this.ctx.storage.put('me', { id, name: '', code: shortCode(id), created: Date.now() });
    if (this.sockets().length >= 12) {
      // an old tab left open everywhere: the oldest goes
      try { this.sockets()[0].close(4000, 'too many'); } catch {}
    }
    const [client, server] = Object.values(new WebSocketPair());
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ visible: true, game: null, v: url.searchParams.get('v') || '' });
    return new Response(null, { status: 101, webSocket: client });
  }

  // a request from a phone: handle it and send exactly one reply
  async webSocketMessage(ws, raw) {
    if (typeof raw !== 'string' || raw.length > MAX_MESSAGE) return;
    let msg; try { msg = JSON.parse(raw); } catch { return; }
    if (!msg || typeof msg.op !== 'string') return;
    let reply;
    try { reply = await this.handle(ws, msg); }
    catch (e) { console.warn(msg.op, e && e.stack || e); reply = { err: 'server' }; }
    send(ws, { k: 'res', id: msg.id, ok: !(reply && reply.err), ...(reply || {}) });
  }
  webSocketClose(ws, code) { try { ws.close(code === 1005 ? 1000 : code, 'bye'); } catch {} }
  webSocketError() {}

  // everything a phone needs on connecting: you, friends, requests, games, notifications, the push key
  async snapshot() {
    const me = await this.me();
    const dir = dirStub(this.env);
    return { me, friends: await this.getMap('friends'), reqIn: await this.getMap('reqIn'), reqOut: await this.getMap('reqOut'),
      blocked: await this.getMap('blocked'), games: await this.getMap('games'), push: ((await this.ctx.storage.get('subs')) || []).map(s => s.endpoint),
      vapid: (await dir.vapid()).pub, admin: isAdmin(this.env, me.id) };
  }
  // send these lists to every connected phone
  async sendLists(what) {
    const out = { k: 'lists' };
    for (const k of what) out[k] = await this.getMap(k);
    this.toAll(out);
  }

  // one request from a phone, by op; ops not listed here go to the game (Game.act)
  async handle(ws, msg) {
    const me = await this.me();
    const uid = me.id;
    const att = ws.deserializeAttachment() || {};
    const g = typeof msg.g === 'string' && GAME_RE.test(msg.g) ? msg.g : null;
    const named = () => me.name ? null : { err: 'noName' };

    switch (msg.op) {
      case 'hello': {
        if (typeof msg.v === 'string') att.v = msg.v.slice(0, 60);
        att.visible = !!msg.visible; att.game = typeof msg.game === 'string' ? msg.game : null;
        ws.serializeAttachment(att);
        const name = cleanName(msg.name);
        if (name && !me.name) await this.setName(name);
        await dirStub(this.env).touch(uid);
        const top = await dirStub(this.env).build(att.v);
        return { ...(await this.snapshot()), build: top };
      }
      case 'vis': {
        att.visible = !!msg.visible; att.game = typeof msg.game === 'string' ? msg.game : null;
        ws.serializeAttachment(att);
        return {};
      }
      case 'setName': {
        const name = cleanName(msg.name);
        if (!name) return { err: 'empty' };
        await this.setName(name);
        return { me: await this.me() };
      }
      case 'search': {
        if (named()) return named();
        const rows = await dirStub(this.env).search(msg.q, uid);
        const friends = await this.getMap('friends'), out = await this.getMap('reqOut'), inc = await this.getMap('reqIn');
        return { rows: rows.map(r => ({ ...r, friend: !!friends[r.id], asked: !!out[r.id], asksYou: !!inc[r.id] })) };
      }
      case 'friendAdd': {
        if (named()) return named();
        const to = msg.to;
        if (!ID_RE.test(to || '') || to === uid) return { err: 'bad' };
        const who = await dirStub(this.env).get(to);
        if (!who) return { err: 'noSuchUser' };
        const friends = await this.getMap('friends');
        if (friends[to]) return {};
        const inc = await this.getMap('reqIn');
        if (inc[to]) return this.befriend(to, who.name);          // they'd already asked: that's both
        const blocked = await this.getMap('blocked');
        delete blocked[to]; await this.ctx.storage.put('blocked', blocked);
        const out = await this.getMap('reqOut');
        out[to] = { name: who.name, code: who.code, at: Date.now() };
        await this.ctx.storage.put('reqOut', out);
        await userStub(this.env, to).friendRequest(uid, me.name);
        await this.sendLists(['reqOut', 'blocked']);
        return {};
      }
      /* A friend link: "etude-friend:<their id>" signed with their key. Only they
         can make one, so opening it is both people agreeing: friends at once. */
      case 'friendLink': {
        if (named()) return named();
        const from = msg.from;
        if (!ID_RE.test(from || '')) return { err: 'badLink' };
        if (from === uid) return { err: 'own' };
        if (!await signedBy(from, `etude-friend:${from}`, msg.sig)) return { err: 'badLink' };
        const who = await dirStub(this.env).get(from);
        if (!who) return { err: 'noSuchUser' };
        const friends = await this.getMap('friends');
        if (friends[from]) return { name: who.name, already: true };
        if (!await userStub(this.env, from).linkFriend(uid, me.name)) return { err: 'refused' };
        friends[from] = { name: who.name, code: shortCode(from), at: Date.now() };
        await this.ctx.storage.put('friends', friends);
        for (const k of ['reqIn', 'reqOut', 'blocked']) { const m = await this.getMap(k); delete m[from]; await this.ctx.storage.put(k, m); }
        await this.sendLists(['friends', 'reqIn', 'reqOut', 'blocked']);
        return { name: who.name };
      }
      case 'friendAnswer': {
        const inc = await this.getMap('reqIn');
        const r = inc[msg.from];
        if (!r) return { err: 'notAsked' };
        delete inc[msg.from]; await this.ctx.storage.put('reqIn', inc);
        if (msg.ok) return this.befriend(msg.from, r.name);
        await userStub(this.env, msg.from).friendDeclined(uid);
        await this.sendLists(['reqIn']);
        return {};
      }
      case 'friendCancel': {
        const out = await this.getMap('reqOut');
        if (!out[msg.to]) return {};
        delete out[msg.to]; await this.ctx.storage.put('reqOut', out);
        await userStub(this.env, msg.to).friendDeclined(uid, true);
        await this.sendLists(['reqOut']);
        return {};
      }
      case 'friendRemove':
      case 'block': {
        if (!ID_RE.test(msg.to || '')) return { err: 'bad' };
        await this.unfriend(msg.to);
        await userStub(this.env, msg.to).friendRemoved(uid);
        if (msg.op === 'block') {
          const blocked = await this.getMap('blocked');
          const f = (await dirStub(this.env).get(msg.to)) || {};
          blocked[msg.to] = { name: f.name || '', code: f.code || shortCode(msg.to), at: Date.now() };
          await this.ctx.storage.put('blocked', blocked);
          const inc = await this.getMap('reqIn'); delete inc[msg.to]; await this.ctx.storage.put('reqIn', inc);
        }
        await this.sendLists(['friends', 'reqIn', 'reqOut', 'blocked']);
        return {};
      }
      case 'unblock': {
        const blocked = await this.getMap('blocked');
        delete blocked[msg.to]; await this.ctx.storage.put('blocked', blocked);
        await this.sendLists(['blocked']);
        return {};
      }
      case 'challenge':
      case 'invite': {
        if (named()) return named();
        const color = msg.color === 'b' ? 'b' : 'w';
        const limit = LIMITS.includes(msg.limit) ? msg.limit : 0;
        const id = makeGameCode();
        if (msg.op === 'challenge') {
          const friends = await this.getMap('friends');
          const f = friends[msg.to];
          if (!f) return { err: 'notFriend' };
          const opp = msg.to;
          await gameStub(this.env, id).create({ id, w: color === 'w' ? uid : opp, b: color === 'w' ? opp : uid,
            names: { [color]: me.name, [other(color)]: f.name }, limit, pending: 'challenge', by: uid });
        } else {
          await gameStub(this.env, id).create({ id, [color]: uid, names: { [color]: me.name }, limit, pending: 'invite', by: uid });
        }
        return { g: id };
      }
      case 'state': {
        if (!g) return { err: 'bad' };
        const s = await gameStub(this.env, g).state(uid);
        if (s.gone || s.notYours) {
          // a game that's in the list but no longer on the server: take it off
          const games = await this.getMap('games');
          if (games[g] && s.gone) { delete games[g]; await this.ctx.storage.put('games', games); await this.sendLists(['games']); }
        }
        return { state: s };
      }
      case 'join': {
        if (named()) return named();
        if (!g) return { err: 'bad' };
        const r = await gameStub(this.env, g).join(uid, me.name);
        if (r.err) return r;
        // joining from someone's link makes you friends with them
        if (r.host && r.host !== uid) {
          const blocked = await this.getMap('blocked');
          if (!blocked[r.host]) await this.befriend(r.host, r.hostName, true);
        }
        return { state: r.view };
      }
      case 'forget': {
        // take a finished or declined game off the list
        const games = await this.getMap('games');
        delete games[g]; await this.ctx.storage.put('games', games);
        await this.sendLists(['games']);
        return {};
      }
      case 'push': {
        const subs = ((await this.ctx.storage.get('subs')) || []).filter(s => s.endpoint !== (msg.sub && msg.sub.endpoint) && s.endpoint !== msg.drop);
        const s = msg.sub;
        if (s && typeof s.endpoint === 'string' && /^https:\/\//.test(s.endpoint) && s.keys && s.keys.p256dh && s.keys.auth)
          subs.push({ endpoint: s.endpoint, keys: { p256dh: s.keys.p256dh, auth: s.keys.auth }, at: Date.now() });
        await this.ctx.storage.put('subs', subs.slice(-8));
        return { push: subs.map(x => x.endpoint) };
      }
      case 'testPush': {
        const sent = await this.pushAll({ title: 'Étude', body: 'Notifications are working.', tag: 'test', url: APP_URL });
        return { sent };
      }
      case 'deleteAccount': {
        // the name typed to confirm must match
        if (cleanName(msg.name).toLowerCase() !== (me.name || '').toLowerCase()) return { err: 'confirm' };
        await this.deleteSelf();
        return {};
      }
      case 'adminList': {
        if (!isAdmin(this.env, uid)) return { err: 'notAdmin' };
        const rows = await dirStub(this.env).all();
        const stats = await Promise.all(rows.map(r => userStub(this.env, r.id).stats().catch(() => null)));
        return { rows: rows.map((r, i) => ({ ...r, ...(stats[i] || {}), admin: isAdmin(this.env, r.id), you: r.id === uid })) };
      }
      case 'adminDelete': {
        if (!isAdmin(this.env, uid)) return { err: 'notAdmin' };
        if (!ID_RE.test(msg.to || '')) return { err: 'bad' };
        if (msg.to === uid) await this.deleteSelf();
        else await userStub(this.env, msg.to).deleteSelf();
        return {};
      }
      default: {
        // moves, chat and the rest go to the game
        if (!g) return { err: 'bad' };
        const r = await gameStub(this.env, g).act(uid, msg.op, msg);
        return r.err ? { err: r.err, state: r.view } : { state: r.view, next: r.next };
      }
    }
  }

  // change your name, in the directory, for friends and in games under way
  async setName(name) {
    const me = await this.me();
    me.name = name;
    await this.ctx.storage.put('me', me);
    await dirStub(this.env).put(me.id, name);
    // friends see the new name; so do games under way
    const friends = await this.getMap('friends');
    await Promise.all(Object.keys(friends).map(f => userStub(this.env, f).friendRenamed(me.id, name).catch(() => {})));
    const games = await this.getMap('games');
    await Promise.all(Object.values(games).filter(x => !x.result).map(x => gameStub(this.env, x.g).rename(me.id, name).catch(() => {})));
    this.toAll({ k: 'me', me });
  }
  // make this account and id friends on both sides
  async befriend(id, name, quiet = false) {
    const friends = await this.getMap('friends');
    friends[id] = { name, code: shortCode(id), at: Date.now() };
    await this.ctx.storage.put('friends', friends);
    for (const k of ['reqIn', 'reqOut']) { const m = await this.getMap(k); delete m[id]; await this.ctx.storage.put(k, m); }
    const me = await this.me();
    await userStub(this.env, id).friendAccepted(me.id, me.name, quiet);
    await this.sendLists(['friends', 'reqIn', 'reqOut']);
    return {};
  }
  // remove an id from friends and requests on this side
  async unfriend(id) {
    for (const k of ['friends', 'reqIn', 'reqOut']) { const m = await this.getMap(k); delete m[id]; await this.ctx.storage.put(k, m); }
  }

  /* Delete this account: games under way are resigned (or, not yet started,
     cancelled or declined), friends and requests are removed on both sides,
     the directory refuses the id from now on, its phones are told, and
     everything stored here is erased. Finished games keep its name. */
  async deleteSelf() {
    const me = await this.me();
    if (!me) return;
    await dirStub(this.env).markDeleted(me.id);
    const games = Object.values(await this.getMap('games')).filter(x => !x.result);
    for (const x of games) {
      const op = !x.pending ? 'resign' : x.mine ? 'cancel' : 'decline';
      await gameStub(this.env, x.g).act(me.id, op).catch(e => console.warn('delete: game', e));
    }
    const others = new Set();
    for (const k of ['friends', 'reqIn', 'reqOut']) for (const id of Object.keys(await this.getMap(k))) others.add(id);
    await Promise.all([...others].map(id => userStub(this.env, id).friendRemoved(me.id).catch(() => {})));
    for (const ws of this.sockets()) { send(ws, { k: 'deleted' }); try { ws.close(4001, 'deleted'); } catch {} }
    await this.ctx.storage.deleteAll();
  }
  // counts for the Accounts screen
  async stats() {
    const games = Object.values(await this.getMap('games'));
    return { friends: Object.keys(await this.getMap('friends')).length, live: games.filter(x => !x.result).length, finished: games.filter(x => x.result).length };
  }

  /* ---- called by other Users and by Games ---- */
  async friendRequest(from, name) {
    const blocked = await this.getMap('blocked');
    if (blocked[from]) return;
    const friends = await this.getMap('friends');
    if (friends[from]) { await userStub(this.env, from).friendAccepted((await this.me()).id, (await this.me()).name, true); return; }
    const out = await this.getMap('reqOut');
    if (out[from]) { await this.befriend(from, name); return; }   // both asked
    const inc = await this.getMap('reqIn');
    inc[from] = { name, code: shortCode(from), at: Date.now() };
    await this.ctx.storage.put('reqIn', inc);
    await this.sendLists(['reqIn']);
    await this.tell({ type: 'friendRequest', from: name });
  }
  // another account accepted, or became friends another way
  async friendAccepted(from, name, quiet) {
    const friends = await this.getMap('friends');
    const was = !!friends[from];
    friends[from] = { name, code: shortCode(from), at: (friends[from] && friends[from].at) || Date.now() };
    await this.ctx.storage.put('friends', friends);
    for (const k of ['reqIn', 'reqOut']) { const m = await this.getMap(k); delete m[from]; await this.ctx.storage.put(k, m); }
    await this.sendLists(['friends', 'reqIn', 'reqOut']);
    if (!was && !quiet) await this.tell({ type: 'friendAccepted', from: name });
  }
  // someone opened this account's friend link; false if they're blocked here
  async linkFriend(from, name) {
    const blocked = await this.getMap('blocked');
    if (blocked[from]) return false;
    const friends = await this.getMap('friends');
    const was = !!friends[from];
    friends[from] = { name, code: shortCode(from), at: (friends[from] && friends[from].at) || Date.now() };
    await this.ctx.storage.put('friends', friends);
    for (const k of ['reqIn', 'reqOut']) { const m = await this.getMap(k); delete m[from]; await this.ctx.storage.put(k, m); }
    await this.sendLists(['friends', 'reqIn', 'reqOut']);
    if (!was) await this.tell({ type: 'friendLinked', from: name });
    return true;
  }
  // a request was declined (or cancelled by its sender)
  async friendDeclined(from, cancelled) {
    const k = cancelled ? 'reqIn' : 'reqOut';
    const m = await this.getMap(k); delete m[from]; await this.ctx.storage.put(k, m);
    await this.sendLists([k]);
  }
  // another account removed or blocked this one
  async friendRemoved(from) {
    await this.unfriend(from);
    await this.sendLists(['friends', 'reqIn', 'reqOut']);
  }
  // a friend changed their name
  async friendRenamed(from, name) {
    const friends = await this.getMap('friends');
    if (!friends[from]) return;
    friends[from].name = name;
    await this.ctx.storage.put('friends', friends);
    await this.sendLists(['friends']);
  }
  // a game changed: update the list, send it to phones that have it open, and tell the news
  async gameUpdate(summary, view, event) {
    const games = await this.getMap('games');
    games[summary.g] = summary;
    // the list keeps every game under way and the 30 most recent finished ones
    const done = Object.values(games).filter(x => x.result).sort((a, b) => b.at - a.at);
    for (const x of done.slice(30)) delete games[x.g];
    await this.ctx.storage.put('games', games);
    for (const ws of this.sockets()) {
      const att = ws.deserializeAttachment() || {};
      if (att.game === summary.g) send(ws, { k: 'game', state: view });
      send(ws, { k: 'gsum', sum: summary });
    }
    if (event) await this.tell(event);
  }
  /* News for this player. A phone with the app on screen shows it itself (as a
     pop-up, or not at all when that game is the one open); with none on screen,
     it goes as a push notification. */
  async tell(event) {
    const visible = this.sockets().filter(ws => (ws.deserializeAttachment() || {}).visible);
    if (visible.length) { for (const ws of visible) send(ws, { k: 'event', event }); return; }
    const n = describe(event);
    if (n) await this.pushAll(n);
  }
  // send a notification to every subscribed device; forget ones that have gone
  async pushAll(note) {
    const subs = (await this.ctx.storage.get('subs')) || [];
    if (!subs.length) return 0;
    const vapid = await dirStub(this.env).vapid();
    let sent = 0;
    const keep = [];
    for (const s of subs) {
      try {
        const res = await webPush(s, JSON.stringify(note), vapid);
        if (res.status === 404 || res.status === 410) continue;     // that phone has gone: forget it
        if (res.ok) sent++;
        else console.warn('push', res.status, await res.text());
      } catch (e) { console.warn('push', e); }
      keep.push(s);
    }
    if (keep.length !== subs.length) await this.ctx.storage.put('subs', keep);
    return sent;
  }
}

// the words of a notification
function describe(e) {
  const url = e.g ? `${APP_URL}#r=${e.g}` : APP_URL;
  const tag = e.g || e.type;
  const who = e.from || 'Your opponent';
  const T = {
    move: [`${who} moved`, `${e.san}. Your move.`],
    end: [`${who} moved`, `${e.san}. The game is over.`],
    chat: [`${who}`, e.text],
    challenge: [`${who} challenges you`, 'Open Étude to accept or decline.'],
    accepted: [`${who} accepted`, 'The game has started.'],
    declined: [`${who} declined`, 'Your challenge was declined.'],
    joined: [`${who} joined your game`, 'The game has started.'],
    resign: [`${who} resigned`, 'You win.'],
    takeback: [`${who} asks for a takeback`, 'Open the game to answer.'],
    takebackYes: [`${who} allowed the takeback`, 'Your move.'],
    takebackNo: [`${who} kept the move`, 'No takeback.'],
    rematch: [`${who} offers a rematch`, 'Open the game to answer.'],
    rematchNo: [`${who} declined a rematch`, ''],
    reminder: [`Your move against ${who}`, `About ${e.hours} hour${e.hours === 1 ? '' : 's'} left before you lose on time.`],
    time: [`Out of time against ${who}`, 'You ran out of time. The game is over.'],
    timewin: [`${who} ran out of time`, 'You win.'],
    friendRequest: [`${who} wants to be friends`, 'Open Étude to accept.'],
    friendAccepted: [`${who} accepted your friend request`, ''],
    friendLinked: [`${who} added you as a friend`, 'From your friend link.'],
  }[e.type];
  return T ? { title: T[0], body: T[1], url, tag } : null;
}

/* ---------- Web Push (RFC 8291 encryption, RFC 8292 VAPID), with nothing but WebCrypto ---------- */
async function hkdf(salt, ikm, info, bytes) {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, bytes * 8));
}
// join byte arrays
const cat = (...parts) => { const n = parts.reduce((s, p) => s + p.length, 0), out = new Uint8Array(n); let o = 0; for (const p of parts) { out.set(p, o); o += p.length; } return out; };
// text to UTF-8 bytes
const utf8 = s => new TextEncoder().encode(s);

export async function encryptPush(sub, payload) {
  const uaPublic = unb64u(sub.keys.p256dh), auth = unb64u(sub.keys.auth);
  const local = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const asPublic = new Uint8Array(await crypto.subtle.exportKey('raw', local.publicKey));
  const uaKey = await crypto.subtle.importKey('raw', uaPublic, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, local.privateKey, 256));
  const ikm = await hkdf(auth, shared, cat(utf8('WebPush: info\0'), uaPublic, asPublic), 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, utf8('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, utf8('Content-Encoding: nonce\0'), 12);
  const key = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const body = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, key, cat(utf8(payload), new Uint8Array([2]))));
  const rs = new Uint8Array([0, 0, 16, 0]);     // record size 4096
  return cat(salt, rs, new Uint8Array([asPublic.length]), asPublic, body);
}

// the VAPID Authorization header: a JWT for the push service, signed with the server's push key
async function vapidHeader(endpoint, vapid) {
  const aud = new URL(endpoint).origin;
  const head = b64u(utf8(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const claims = b64u(utf8(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: APP_URL })));
  const key = await crypto.subtle.importKey('jwk', vapid.priv, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const sig = b64u(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, utf8(`${head}.${claims}`)));
  return `vapid t=${head}.${claims}.${sig}, k=${vapid.pub}`;
}

// send one encrypted push notification
async function webPush(sub, payload, vapid) {
  return fetch(sub.endpoint, {
    method: 'POST',
    headers: {
      Authorization: await vapidHeader(sub.endpoint, vapid),
      TTL: '86400',
      Urgency: 'normal',
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
    },
    body: await encryptPush(sub, payload),
  });
}
