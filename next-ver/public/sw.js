const CACHE_VERSION = "v4";
const CACHE_NAME = `financial-tracker-${CACHE_VERSION}`;
const urlsToCache = ["/", "/manifest.json", "/icon.svg"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
          return undefined;
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  // HARD RULE — never cache any data/API response, not a single byte.
  // This is a financial app used across desktop + phone: a cached response
  // could show one device stale balances the other has already changed.
  // Two escape hatches, both passthrough (browser fetches, SW stores nothing):
  //   1. Cross-origin — includes every Supabase call (*.supabase.co): auth,
  //      REST, realtime. These never touch the cache.
  //   2. Same-origin /api/* — our own route handlers.
  if (url.origin !== self.location.origin) {
    return;
  }
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Navigations: network-first, no cache write (SSR pages can embed user data).
  // Fall back to the precached shell only when fully offline.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/")));
    return;
  }

  // Immutable, content-hashed build assets: safe to serve cache-first.
  const isImmutable = url.pathname.startsWith("/_next/static/");

  if (isImmutable) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        });
      })
    );
    return;
  }

  // Remaining same-origin GETs are non-sensitive static assets (icons, manifest,
  // public files). Network-first with a cache write so the shell works offline.
  event.respondWith(
    fetch(request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseClone);
        });
        return response;
      })
      .catch(() => caches.match(request))
  );
});
