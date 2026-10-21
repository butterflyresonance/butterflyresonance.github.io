/* Food Sleuth service worker. Controls /food-sleuth/ only.

   Network first, so an update is never hidden behind an old copy; every
   successful response is also kept and used when there's no network. The
   label reader's files (ocr/, about 6 MB for this phone) are kept the first
   time a label is read, so after that, reading works offline too. */
const CACHE = 'food-sleuth-v1';
const CORE = ['./', 'reader.js', 'manifest.json', 'icon-192.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE)
    .then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {}))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('food-sleuth-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

const NETWORK_WAIT_MS = 6000;
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || !req.url.startsWith('http')) return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith('/food-sleuth/')) return;
  const key = req.mode === 'navigate' ? new Request(new URL('./', self.registration.scope)) : req;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(key, { ignoreSearch: req.mode === 'navigate' });
    const network = fetch(req).then(res => {
      if (res && res.ok) cache.put(key, res.clone()).catch(() => {});
      return res;
    });
    if (!cached) return network;
    const timer = new Promise(r => setTimeout(() => r(cached), NETWORK_WAIT_MS));
    return Promise.race([network.catch(() => cached), timer]);
  })());
});
