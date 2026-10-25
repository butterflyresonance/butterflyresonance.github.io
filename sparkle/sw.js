/* Sparkle service worker. Lives in /sparkle/, so it controls only this app.
   Network first: online you always get the newest page; every good response is
   also kept, and used when there's no network, so the app works offline once
   it has been opened. */
const CACHE = 'sparkle-v3';
const CORE = ['./', 'manifest.json', 'icons.json', 'pages.json', 'icon-192.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('sparkle-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith('/sparkle/')) return;
  const key = req.mode === 'navigate' ? new Request(new URL('./', self.registration.scope)) : req;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const res = await fetch(req);
      if (res && res.ok) cache.put(key, res.clone()).catch(() => {});
      return res;
    } catch {
      return (await cache.match(key, { ignoreSearch: req.mode === 'navigate' })) || Response.error();
    }
  })());
});
