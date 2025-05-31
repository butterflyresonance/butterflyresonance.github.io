// Attune Game Service Worker
const CACHE_NAME = 'attune-v1.0.1'; // Increment version to force update
const urlsToCache = [
    'https://butterflyresonance.github.io/attune/',
    'https://butterflyresonance.github.io/attune/index.html',
    'https://butterflyresonance.github.io/attune/styles.css',
    'https://butterflyresonance.github.io/attune/app.js',
    'https://butterflyresonance.github.io/attune/manifest.json',
    'https://butterflyresonance.github.io/android-chrome-192x192.png',
    'https://butterflyresonance.github.io/android-chrome-512x512.png'
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

// Fetch event - Network-first strategy for HTML, cache-first for assets
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }
    
    const url = new URL(event.request.url);
    const isHTMLRequest = event.request.destination === 'document' || 
                         url.pathname.endsWith('.html') || 
                         url.pathname.endsWith('/');
    
    if (isHTMLRequest) {
        // Network-first strategy for HTML files
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (response && response.status === 200) {
                        console.log('Attune SW: Serving fresh HTML from network:', event.request.url);
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
                    console.log('Attune SW: Network failed, serving HTML from cache:', event.request.url);
                    return caches.match(event.request);
                })
        );
    } else {
        // Cache-first strategy for assets (CSS, JS, images)
        event.respondWith(
            caches.match(event.request)
                .then((response) => {
                    if (response) {
                        console.log('Attune SW: Serving asset from cache:', event.request.url);
                        return response;
                    }
                    
                    console.log('Attune SW: Fetching asset from network:', event.request.url);
                    return fetch(event.request)
                        .then((response) => {
                            if (!response || response.status !== 200 || response.type !== 'basic') {
                                return response;
                            }
                            
                            // Clone and cache the response
                            const responseToCache = response.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(event.request, responseToCache);
                                });
                            
                            return response;
                        })
                        .catch((error) => {
                            console.error('Attune SW: Asset fetch failed:', error);
                        });
                })
        );
    }
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

// Simplified update check function
async function checkForUpdates() {
    try {
        console.log('Attune SW: Checking for app updates...');
        
        // Force check the main HTML file
        const response = await fetch('https://butterflyresonance.github.io/attune/index.html', {
            cache: 'no-cache',
            headers: {
                'Cache-Control': 'no-cache'
            }
        });
        
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put('https://butterflyresonance.github.io/attune/index.html', response.clone());
            
            // Notify clients about the update
            const clients = await self.clients.matchAll();
            clients.forEach(client => {
                client.postMessage({
                    type: 'UPDATE_AVAILABLE',
                    message: 'New version available!'
                });
            });
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
        clients.openWindow('https://butterflyresonance.github.io/attune/')
    );
});