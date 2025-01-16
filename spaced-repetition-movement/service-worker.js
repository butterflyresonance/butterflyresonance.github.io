const CACHE_NAME = 'movement-practice-v1';
const urlsToCache = [
  '/spaced-repetition-movement/',
  '/spaced-repetition-movement/index.html',
  'https://fonts.googleapis.com/css2?family=Cormorant:wght@400;500;600&family=Outfit:wght@300;400;500&display=swap',
  'https://butterflyresonance.github.io/apple-touch-icon.png',
  'https://butterflyresonance.github.io/favicon-32x32.png',
  'https://butterflyresonance.github.io/favicon-16x16.png',
  'https://butterflyresonance.github.io/android-chrome-192x192.png',
  'https://butterflyresonance.github.io/android-chrome-512x512.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached response if found
        if (response) {
          return response;
        }
        // Otherwise fetch from network
        return fetch(event.request).then(
          (response) => {
            // Return the response
            return response;
          }
        );
      })
  );
});