const CACHE_NAME = 'dqau-donate-v3';
const OFFLINE_URL = '/offline.html';
const PRECACHE_URLS = ['/', '/index.html', OFFLINE_URL, '/manifest.webmanifest', '/icon.svg', '/icon-192.svg', '/icon-512.svg', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((key) => key.startsWith('dqau-donate-') && key !== CACHE_NAME).map((key) => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request)
      .then((response) => {
        if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
        return response;
      })
      .catch(async () => (await caches.match(request)) || (await caches.match(OFFLINE_URL)) || (await caches.match('/index.html'))));
    return;
  }

  if (/\.(?:js|css|svg|png|webmanifest|woff2?)$/i.test(url.pathname)) {
    event.respondWith(caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
        return response;
      });
    }));
  }
});
