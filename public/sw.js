// Minimal service worker. Its whole job is to make the app INSTALLABLE:
// Chrome/Android only fires `beforeinstallprompt` (the "Install" prompt) when a
// service worker with a fetch handler is registered and controlling the page.
//
// It caches NOTHING. Every request goes straight to the network, so a deploy is
// always live and we never serve a stale JS bundle (the reason the old caching
// SW was removed). Do not add caching here without content-hashed URLs.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Wipe any caches left behind by the old caching service worker.
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      // Take control of open tabs immediately so this SW is "controlling" —
      // required for the install prompt on first load.
      await self.clients.claim();
    })()
  );
});

// A fetch handler MUST exist for the app to be installable, but we intercept
// nothing: no respondWith() means the browser handles every request normally
// over the network. Zero caching, zero staleness.
self.addEventListener("fetch", () => {});
