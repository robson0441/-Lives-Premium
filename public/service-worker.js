// Live Premium Premium PWA Service Worker
const CACHE_NAME = 'live-premium-cache-v1';

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/pwa-icon.png',
  '/pwa-icon-72.png',
  '/pwa-icon-96.png',
  '/pwa-icon-128.png',
  '/pwa-icon-144.png',
  '/pwa-icon-152.png',
  '/pwa-icon-192.png',
  '/pwa-icon-384.png',
  '/pwa-icon-512.png'
];

// Install Event - Pre-cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching critical assets');
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch Event - Modern Network-First strategy with Cache Fallback (safer for active development and instant updates)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests or browser extension schemes (chrome-extension, etc.)
  if (event.request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // 1. Bypass Service Worker cache entirely for development assets or Hot Module Replacement (HMR) files
  if (
    url.hostname === 'localhost' || 
    url.hostname === '127.0.0.1' || 
    url.pathname.includes('/@vite') ||
    url.pathname.includes('/vite') ||
    url.pathname.includes('/node_modules/') ||
    url.pathname.startsWith('/src/') ||
    url.search.includes('v=') ||
    url.search.includes('import') ||
    event.request.headers.get('Upgrade') === 'websocket'
  ) {
    return; // Let the browser fetch directly from Vite dev server without interference
  }

  // API Requests => Network-Only or Network-First (Never cache real-time stats/transactions from /api/)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Return a custom offline response if the API call fails due to lack of connection
        return new Response(
          JSON.stringify({ error: 'Você está offline. Verifique sua conexão com a internet.' }),
          {
            headers: { 'Content-Type': 'application/json' },
            status: 503
          }
        );
      })
    );
    return;
  }

  // Network-First with Cache Fallback for HTML, CSS, JS, and global assets to keep app updated instantly
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache the newly fetched safe asset if response is valid
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // If offline / network fails, return cached response if found
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If everything fails and it's a page navigation, return index.html shell from cache
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        });
      })
  );
});
