// Offline shell for HomeRanking. Kitchen wifi is unreliable and logging a
// chore must never depend on the network.
// Both values are rewritten by scripts/gen-sw.mjs after the Vite build: the
// asset filenames are content-hashed, so the list can only be known then.
// Without precaching, the first visit never populates the cache — the worker
// does not control the page until after those requests have already gone out.
const CACHE = 'homeranking-__BUILD_ID__'
const PRECACHE = ['./'].concat(__PRECACHE_LIST__)

self.addEventListener('install', (e) => {
  self.skipWaiting()
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      // one bad asset must not fail the whole install
      Promise.all(PRECACHE.map((u) => c.add(u).catch(() => {}))),
    ),
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const { request } = e
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return

  // Navigations: network first so a new deploy is picked up, cache as fallback.
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put('./', copy))
          return res
        })
        .catch(() => caches.match('./', { ignoreVary: true }).then((r) => r || Response.error())),
    )
    return
  }

  // Hashed assets never change under the same URL, so cache first is safe.
  // ignoreVary matters: the server sends a Vary header, and without this the
  // precached entry does not match the runtime request and offline breaks.
  e.respondWith(
    caches.match(request, { ignoreVary: true }).then(
      (hit) =>
        hit ||
        fetch(request)
          .then((res) => {
            if (res.ok) {
              const copy = res.clone()
              caches.open(CACHE).then((c) => c.put(request, copy))
            }
            return res
          })
          .catch(() => caches.match(request, { ignoreVary: true, ignoreSearch: true })),
    ),
  )
})
