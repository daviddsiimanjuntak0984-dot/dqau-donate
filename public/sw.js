const CACHE_PREFIX = 'dqau-cache-';
const CACHE_NAME = 'dqau-cache-v2';
const OFFLINE_URL = '/index.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll([OFFLINE_URL, '/']))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin) return;

  const isNavigation = request.mode === 'navigate' ||
    requestUrl.pathname === '/' ||
    requestUrl.pathname === '/index.html';

  // Network-first HTML avoids stale index.html references after new deployments.
  if (isNavigation) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const responseCopy = response.clone();
            event.waitUntil(
              caches.open(CACHE_NAME)
                .then((cache) => cache.put(request, responseCopy))
                .catch(() => undefined)
            );
          }
          return response;
        })
        .catch(async () => {
          const cachedPage = await caches.match(request);
          if (cachedPage) return cachedPage;
          const offlinePage = await caches.match(OFFLINE_URL);
          return offlinePage || Response.error();
        })
    );
    return;
  }

  // Vite production assets use content-hashed filenames; cache those immutable assets.
  event.respondWith(
    caches.match(request).then(async (cached) => {
      if (cached) return cached;
      const response = await fetch(request);
      if (response && response.ok && requestUrl.pathname.startsWith('/assets/')) {
        const responseCopy = response.clone();
        event.waitUntil(
          caches.open(CACHE_NAME)
            .then((cache) => cache.put(request, responseCopy))
            .catch(() => undefined)
        );
      }
      return response;
    }).catch(async () => {
      const offlinePage = await caches.match(OFFLINE_URL);
      return offlinePage || Response.error();
    })
  );
});
