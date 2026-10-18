// The installed app's offline copy (V1's S3). The build writes in the list of what it made and a
// version from their contents (`src/precache.ts`); `npm run dev` never registers this.
//
// Installing keeps the whole shell (the page, its hashed chunks, the manifest, the icons and the
// launch screens), so the first launch with no signal works, not just the second. The page itself
// is network first: a new deploy is always picked up when there is signal, and the last one that
// loaded still opens when there is none (cache-first would serve a stale build until a second
// launch, which is confusing to someone who was told "it's updated"). Hashed chunks never change
// under their names, so they come from the cache. Each version has a cache of its own, and the
// old ones go as a new worker takes over, so last month's bundles don't pile up on her phone.
const PRECACHE = /* precache */ [];
const VERSION = /* version */ 'dev';
const PREFIX = 'mcfrancisville-';
const CACHE = PREFIX + VERSION;
// A server may say its answers vary by `Origin` (Vite's preview does), which a module script's
// request carries and the precache's doesn't: what's kept is the same file either way.
const ANY = { ignoreVary: true };

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        // One file at a time, so one that fails can't stop the rest (or the worker) installing.
        Promise.all(
          PRECACHE.map((url) => cache.add(new Request(url, { cache: 'reload' })).catch(() => {})),
        ),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k.startsWith(PREFIX) && k !== CACHE).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/** Keeps a good response in this version's cache, under `key` (the request, or `/`). */
function keep(key, response) {
  if (response.ok) {
    const copy = response.clone();
    caches.open(CACHE).then((cache) => cache.put(key, copy));
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  // Anything a server answers (a cloud save, V1's S2) is never kept or served from here.
  if (url.pathname.startsWith('/api/')) return;
  if (request.mode === 'navigate') {
    const page = url.pathname === '/' || url.pathname === '/index.html';
    event.respondWith(
      fetch(request)
        .then((response) => (page ? keep('/', response) : response))
        .catch(() =>
          caches
            .match(request, { ignoreSearch: true, ignoreVary: true })
            .then((hit) => hit ?? caches.match('/', ANY))
            .then((hit) => hit ?? Response.error()),
        ),
    );
    return;
  }
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches
        .match(request, ANY)
        .then((hit) => hit ?? fetch(request).then((response) => keep(request, response))),
    );
    return;
  }
  event.respondWith(
    fetch(request)
      .then((response) => keep(request, response))
      .catch(() => caches.match(request, ANY).then((hit) => hit ?? Response.error())),
  );
});
