// Service Worker — France Summer 2026
// Strategy: network-first for navigation, cache-first for assets.
// Bump CACHE_VERSION whenever a new deploy goes out (done automatically via CI or manually).

const CACHE_VERSION = 'france-2026-v1';
const SHELL = [
  '/France-2026/',
  '/France-2026/index.html'
];

// ── Install: cache the shell immediately ──────────────────────────────────────
self.addEventListener('install', event => {
  self.skipWaiting(); // activate right away, don't wait for old SW to die
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(SHELL))
  );
});

// ── Activate: delete stale caches ────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim()) // take control of all open tabs immediately
  );
});

// ── Fetch: network-first for page navigation, cache-first for static assets ──
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Only handle same-origin and GitHub Pages origin requests
  if (!url.origin.includes('github.io') && url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    // Navigation requests (the main HTML page) — always try network first
    event.respondWith(
      fetch(event.request, { cache: 'no-cache' })
        .then(response => {
          // Cache the fresh response for offline fallback
          const clone = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => {
          // Offline fallback: serve cached version
          return caches.match('/France-2026/index.html');
        })
    );
  } else {
    // Static assets (fonts, CDN scripts) — cache-first is fine
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request))
    );
  }
});
