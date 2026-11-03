/* Étude server — a Cloudflare Worker with three kinds of Durable Object.

   The server is the record of every online game. Phones send it moves; it checks
   each one with chess.js, keeps it, and sends the game back to both players.
   A player who isn't there gets it when they next open the app, and a push
   notification if they turned those on.

     Directory   one for the whole app: names and short codes for finding friends,
                 the key the server signs push notifications with, the newest build seen
     User        one per account: name, friends, friend requests, the games list,
                 where to send notifications, and the phones that are connected now
     Game        one per game: the players, the moves, the result, the chat,
                 a takeback or rematch being asked for, and the time limit

   Accounts. An account is an Ed25519 key pair made on the phone. The account's id
   is the public key; the private key never leaves the phone. To connect, the phone
   signs "etude:<id>:<time>" and the Worker checks the signature against the id, so
   the server stores no passwords and nothing that would let anyone log in.

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
const unb64u = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), c => c.charCodeAt(0));
const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';   // Crockford: no I, L, O, U
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
const cleanName = n => String(n || '').replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);
const makeGameCode = () => [...crypto.getRandomValues(new Uint8Array(9))].map(b => CODE_ALPHA[b % CODE_ALPHA.length]).join('');
const other = c => c === 'w' ? 'b' : 'w';
const userStub = (env, id) => env.USERS.get(env.USERS.idFromName(id));
const gameStub = (env, g) => env.GAMES.get(env.GAMES.idFromName(g));
const dirStub = env => env.DIR.get(env.DIR.idFromName('directory'));
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
async function verifyLogin(id, t, sig) {
  if (!/^\d{10,16}$/.test(t || '')) return false;
  if (Math.abs(Date.now() - Number(t)) > SIGN_WINDOW) return false;
  return signedBy(id, `etude:${id}:${t}`, sig);
}

/* ---------- the Worker: checks who is connecting, then hands them to their User ---------- */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    const m = /^\/u\/([A-Za-z0-9_-]{43})$/.exec(url.pathname);
    if (m) {
      if (!ORIGINS.includes(origin)) return new Response('Not allowed from ' + origin, { status: 403 });
      if (request.headers.get('Upgrade') !== 'websocket') return new Response('Expected a WebSocket', { status: 426 });
      if (!await verifyLogin(m[1], url.searchParams.get('t'), url.searchParams.get('s'))) return new Response('Signature not accepted', { status: 401 });
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
    this.sql.exec(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT, lname TEXT, code TEXT, at INTEGER)`);
    this.sql.exec(`CREATE INDEX IF NOT EXISTS users_code ON users(code)`);
  }
  put(id, name) {
    const code = shortCode(id);
    this.sql.exec(`INSERT INTO users (id, name, lname, code, at) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET name = excluded.name, lname = excluded.lname, at = excluded.at`, id, name, name.toLowerCase(), code, Date.now());
  }
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
    return rows.filter(r => r.id !== me);
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
  async load() {
    if (this.g === undefined) this.g = (await this.ctx.storage.get('g')) || null;
    return this.g;
  }
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
  async setAlarm() {
    const d = this.deadline();
    if (!d) { await this.ctx.storage.deleteAlarm(); return; }
    // a reminder when a quarter of the time is left, then the deadline itself
    const remind = d - this.g.limit * this.day / 4;
    await this.ctx.storage.setAlarm(!this.g.reminded && remind > Date.now() ? remind : d);
  }
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
  async state(uid) {
    await this.load();
    if (!this.g) return { gone: true };
    if (this.colorOf(uid)) return this.view();
    // someone opening an invite link: just enough to say who it's from
    if (this.g.pending === 'invite') return { id: this.g.id, invite: true, from: this.g.names[this.g.w ? 'w' : 'b'], seat: this.g.w ? 'b' : 'w', limit: this.g.limit };
    return { notYours: true };
  }
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

  async snapshot() {
    const me = await this.me();
    const dir = dirStub(this.env);
    return { me, friends: await this.getMap('friends'), reqIn: await this.getMap('reqIn'), reqOut: await this.getMap('reqOut'),
      blocked: await this.getMap('blocked'), games: await this.getMap('games'), push: ((await this.ctx.storage.get('subs')) || []).map(s => s.endpoint),
      vapid: (await dir.vapid()).pub };
  }
  async sendLists(what) {
    const out = { k: 'lists' };
    for (const k of what) out[k] = await this.getMap(k);
    this.toAll(out);
  }

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
      default: {
        // moves, chat and the rest go to the game
        if (!g) return { err: 'bad' };
        const r = await gameStub(this.env, g).act(uid, msg.op, msg);
        return r.err ? { err: r.err, state: r.view } : { state: r.view, next: r.next };
      }
    }
  }

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
  async unfriend(id) {
    for (const k of ['friends', 'reqIn', 'reqOut']) { const m = await this.getMap(k); delete m[id]; await this.ctx.storage.put(k, m); }
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
  async friendDeclined(from, cancelled) {
    const k = cancelled ? 'reqIn' : 'reqOut';
    const m = await this.getMap(k); delete m[from]; await this.ctx.storage.put(k, m);
    await this.sendLists([k]);
  }
  async friendRemoved(from) {
    await this.unfriend(from);
    await this.sendLists(['friends', 'reqIn', 'reqOut']);
  }
  async friendRenamed(from, name) {
    const friends = await this.getMap('friends');
    if (!friends[from]) return;
    friends[from].name = name;
    await this.ctx.storage.put('friends', friends);
    await this.sendLists(['friends']);
  }
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
const cat = (...parts) => { const n = parts.reduce((s, p) => s + p.length, 0), out = new Uint8Array(n); let o = 0; for (const p of parts) { out.set(p, o); o += p.length; } return out; };
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

async function vapidHeader(endpoint, vapid) {
  const aud = new URL(endpoint).origin;
  const head = b64u(utf8(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const claims = b64u(utf8(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: APP_URL })));
  const key = await crypto.subtle.importKey('jwk', vapid.priv, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const sig = b64u(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, utf8(`${head}.${claims}`)));
  return `vapid t=${head}.${claims}.${sig}, k=${vapid.pub}`;
}

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
