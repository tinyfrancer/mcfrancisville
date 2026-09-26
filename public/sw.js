// Network first, cache as the fallback: a new deploy is always picked up when there is signal, and
// the last version that loaded still opens when there is none. Cache-first would be faster but would
// serve a stale build until a second launch, which is confusing to someone who was told "it's
// updated".
const CACHE = 'mcfrancisville-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() =>
        caches
          .match(request)
          .then((hit) => hit ?? (request.mode === 'navigate' ? caches.match('/') : undefined))
          .then((hit) => hit ?? Response.error()),
      ),
  );
});
