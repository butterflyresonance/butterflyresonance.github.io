/* Étude (chess) service worker.

   Lives in /chess/, so it controls /chess/ and nothing else on the site.

   Network first for everything: when online you always get the newest page,
   so an update never hides behind a stale copy. Every successful response is
   also kept, and used when the network fails, so a game against the computer
   works offline once the page, Stockfish and the opening book have loaded
   once. Games against a person still need the network for the relays. */
const CACHE = 'table-chess-v1';

// The files a computer game needs, fetched on install so the first offline
// visit works even if Stockfish was never opened.
const CORE = [
  './',
  'manifest.json',
  'icon-192.png',
  'openings/book.json',
  'stockfish/stockfish-19-lite-single.js',
  'stockfish/stockfish-19-lite-single.wasm'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => Promise.all(CORE.map(u => cache.add(u).catch(() => {}))))   // one miss must not block install
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('table-chess-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// A slow network should not hold the page hostage when a copy is to hand.
const NETWORK_WAIT_MS = 6000;

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || !req.url.startsWith('http')) return;
  const url = new URL(req.url);
  // Same-origin files under /chess/, and the modules the page imports (esm.sh).
  // Anything else on the site, or elsewhere, is left alone.
  const mine = url.origin === self.location.origin
    ? url.pathname.startsWith('/chess/')
    : url.hostname === 'esm.sh';
  if (!mine) return;
  // Other pages in /chess/ (preview.html, the backups) are left to the network.
  // Without this they would be cached under the app's own key and replace it.
  if (req.mode === 'navigate' && !/\/chess\/(index\.html)?$/.test(url.pathname)) return;

  // The page is one file whatever the #hash or ?query, so it is cached as one.
  const key = req.mode === 'navigate' ? new Request(new URL('./', self.registration.scope)) : req;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(key, { ignoreSearch: req.mode === 'navigate' });
    const network = fetch(req).then(res => {
      if (res && res.ok) cache.put(key, res.clone()).catch(() => {});
      return res;
    });
    if (!cached) return network;
    const timer = new Promise(resolve => setTimeout(() => resolve(cached), NETWORK_WAIT_MS));
    return Promise.race([network.catch(() => cached), timer]);
  })());
});
