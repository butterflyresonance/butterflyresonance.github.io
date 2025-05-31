// Attune Game Service Worker
const CACHE_NAME = 'attune-v1.0.0';
const urlsToCache = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    console.log('Attune SW: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Attune SW: Caching app resources');
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.error('Attune SW: Failed to cache resources', error);
            })
    );
    // Take control immediately
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

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                if (response) {
                    console.log('Attune SW: Serving from cache:', event.request.url);
                    return response;
                }
                
                console.log('Attune SW: Fetching from network:', event.request.url);
                return fetch(event.request)
                    .then((response) => {
                        // Don't cache if not a valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Clone the response for caching
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch((error) => {
                        console.error('Attune SW: Fetch failed:', error);
                        // Return a basic offline page if available
                        if (event.request.destination === 'document') {
                            return caches.match('./index.html');
                        }
                    });
            })
    );
});

// Background sync for updates
self.addEventListener('sync', (event) => {
    if (event.tag === 'attune-update-check') {
        console.log('Attune SW: Checking for updates...');
        event.waitUntil(checkForUpdates());
    }
});

// Message handling for manual update checks
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CHECK_UPDATE') {
        event.waitUntil(checkForUpdates());
    }
});

// Function to check for updates
async function checkForUpdates() {
    try {
        console.log('Attune SW: Checking for app updates...');
        
        // Check if any of our cached resources have been updated
        const cache = await caches.open(CACHE_NAME);
        const requests = await cache.keys();
        
        for (const request of requests) {
            try {
                const networkResponse = await fetch(request.url, {
                    cache: 'no-cache'
                });
                
                if (networkResponse.ok) {
                    const cachedResponse = await cache.match(request);
                    
                    if (cachedResponse) {
                        const networkHeaders = networkResponse.headers.get('last-modified') || 
                                             networkResponse.headers.get('etag');
                        const cachedHeaders = cachedResponse.headers.get('last-modified') || 
                                            cachedResponse.headers.get('etag');
                        
                        if (networkHeaders && cachedHeaders && networkHeaders !== cachedHeaders) {
                            console.log('Attune SW: Update found for:', request.url);
                            // Update the cache
                            await cache.put(request, networkResponse.clone());
                            
                            // Notify clients about the update
                            const clients = await self.clients.matchAll();
                            clients.forEach(client => {
                                client.postMessage({
                                    type: 'UPDATE_AVAILABLE',
                                    url: request.url
                                });
                            });
                        }
                    }
                }
            } catch (fetchError) {
                console.log('Attune SW: Could not check update for:', request.url, fetchError);
            }
        }
    } catch (error) {
        console.error('Attune SW: Update check failed:', error);
    }
}

// Periodic background sync registration
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'attune-periodic-update') {
        event.waitUntil(checkForUpdates());
    }
});

// Push notification support (future feature)
self.addEventListener('push', (event) => {
    console.log('Attune SW: Push message received');
    // Future: Handle push notifications for multiplayer features
});

// Handle app shortcuts (if defined in manifest)
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow('./')
    );
});