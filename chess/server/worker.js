/* Étude table server — a Cloudflare Worker.

   Each table (the 9-character code in the link) gets its own small "Durable
   Object": one instance somewhere on Cloudflare's network that both players'
   phones keep a WebSocket open to. Whatever one phone sends, the table passes
   to the other phone(s) at that table, and it says when someone arrives or
   leaves. It keeps nothing: no games, no accounts. The phones still hold the
   game themselves, exactly as before.

   Messages to the phones (JSON):
     { k: 'join',  id }        someone is at the table (sent for each one already there, and for newcomers)
     { k: 'leave', id }        they've gone
     { k: 'msg',   id, data }  what they sent, as the text they sent it

   Hibernation: between messages the table sleeps with the sockets still open,
   so a game sitting idle costs nothing. */

// Pages allowed to use the server, so nobody else's app can run up the free allowance.
const ORIGINS = [
  'https://butterflyresonance.github.io',
  'http://localhost:8765',
  'http://localhost:8787',
];
const MAX_AT_TABLE = 6;          // two players, and room for an old tab or two
const MAX_MESSAGE = 20000;       // characters; a whole game's state is far smaller

export class Table {
  constructor(ctx) {
    this.ctx = ctx;
    // keep-alives from the phones are answered without waking the table
    this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
  }

  async fetch(request) {
    if (request.headers.get('Upgrade') !== 'websocket') return new Response('Expected a WebSocket', { status: 426 });
    const here = this.ctx.getWebSockets();
    if (here.length >= MAX_AT_TABLE) return new Response('This table is full', { status: 429 });

    const id = crypto.randomUUID().slice(0, 8);
    const [client, server] = Object.values(new WebSocketPair());
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ id });

    for (const ws of here) {
      const other = ws.deserializeAttachment();
      if (!other) continue;
      send(ws, { k: 'join', id });
      send(server, { k: 'join', id: other.id });
    }
    return new Response(null, { status: 101, webSocket: client });
  }

  webSocketMessage(ws, message) {
    if (typeof message !== 'string' || message.length > MAX_MESSAGE) return;
    const me = ws.deserializeAttachment();
    if (!me) return;
    for (const other of this.ctx.getWebSockets()) {
      if (other !== ws) send(other, { k: 'msg', id: me.id, data: message });
    }
  }

  webSocketClose(ws, code) { this.gone(ws); try { ws.close(code === 1005 ? 1000 : code, 'bye'); } catch {} }
  webSocketError(ws) { this.gone(ws); }

  gone(ws) {
    const me = ws.deserializeAttachment();
    if (!me) return;
    ws.serializeAttachment(null);
    for (const other of this.ctx.getWebSockets()) {
      if (other !== ws) send(other, { k: 'leave', id: me.id });
    }
  }
}

function send(ws, obj) {
  try { ws.send(JSON.stringify(obj)); } catch {}
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const m = /^\/table\/([a-z0-9]{6,20})$/.exec(url.pathname);
    if (!m) return new Response('Étude table server. Nothing to see here.', { headers: { 'content-type': 'text/plain; charset=utf-8' } });
    const origin = request.headers.get('Origin');
    if (!ORIGINS.includes(origin)) return new Response('Not allowed from ' + origin, { status: 403 });
    const table = env.TABLES.get(env.TABLES.idFromName(m[1]));
    return table.fetch(request);
  },
};
