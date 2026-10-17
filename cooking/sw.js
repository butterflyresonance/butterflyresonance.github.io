/* Cooking service worker.

   Lives in /cooking/, so it controls /cooking/ and nothing else on the site.

   Network first: when online you always get the newest recipe. Every page you
   open is also kept, and used when the network fails, so recipes you have
   opened before still work offline. */
const CACHE = 'cooking-v2';

const CORE = [
  './',
  'manifest.json',
  'icon-192.png',
  'mash-potato/',
  'duck-ramen/',
  'spaghetti-bolognaise/',
  'shepherds-pie/',
  'smash-burgers/',
  'rissoles-and-mash/',
  'fried-rice/',
  'butter-chicken/',
  'meatballs/',
  'soy-noodles/'
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
      .then(keys => Promise.all(keys.filter(k => k.startsWith('cooking-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const NETWORK_WAIT_MS = 6000;

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || !req.url.startsWith('http')) return;
  const url = new URL(req.url);
  // Same-origin files under /cooking/, and the Google Fonts the pages use.
  const mine = url.origin === self.location.origin
    ? url.pathname.startsWith('/cooking/')
    : url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!mine) return;

  // A page is the same file whatever the #hash or ?query.
  const key = req.mode === 'navigate' ? new Request(url.origin + url.pathname) : req;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(key, { ignoreSearch: req.mode === 'navigate' });
    const network = fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) cache.put(key, res.clone()).catch(() => {});
      return res;
    });
    if (!cached) return network.catch(() => Response.error());
    const timeout = new Promise(resolve => setTimeout(() => resolve(cached), NETWORK_WAIT_MS));
    return Promise.race([network.catch(() => cached), timeout]);
  })());
});
