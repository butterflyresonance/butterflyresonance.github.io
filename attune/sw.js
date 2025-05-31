// Attune Game Service Worker - Simplified Network-First
const CACHE_NAME = 'attune-v1.0.3'; // Increment to clear old caches

// Install event - cache initial resources
self.addEventListener('install', (event) => {
    console.log('Attune SW: Installing...');
    // Take control immediately without waiting
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Attune SW: Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Attune SW: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // Take control of all clients immediately
    return self.clients.claim();
});

// Fetch event - Network-first for EVERYTHING
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') {
        return;
    }
    
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (response && response.status === 200) {
                    // Update cache with fresh content
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    return response;
                }
                throw new Error('Network response not ok');
            })
            .catch((error) => {
                // Fallback to cache if network fails
                console.log('Attune SW: Network failed, serving from cache:', event.request.url);
                return caches.match(event.request);
            })
    );
});