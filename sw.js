// Service Worker — Network-First Strategy
// Always fetches latest from GitHub Pages, falls back to cache if offline.

const CACHE_NAME = 'gold-bot-v1';

// On install, skip waiting to activate immediately
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

// On activate, claim all clients so SW takes effect immediately
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(names =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

// Network-first: try network, cache the response, fall back to cache if offline
self.addEventListener('fetch', (e) => {
  // Only handle same-origin navigation/page requests
  if (e.request.method !== 'GET') return;

  // Let Firebase, TradingView, and other external requests pass through
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Clone and cache the fresh response
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return response;
      })
      .catch(() => {
        // Offline: serve from cache
        return caches.match(e.request);
      })
  );
});
