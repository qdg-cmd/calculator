self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function(e) {
  // Pass-through fetch (No caching yet, just to pass Chrome's PWA requirement)
  e.respondWith(fetch(e.request));
});
