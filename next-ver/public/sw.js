// KILL SWITCH — this service worker exists only to remove itself and wipe every
// cache the old caching SW left behind. We no longer cache anything, anywhere:
// the caching layer kept serving stale JS bundles after code changes (dev chunk
// URLs aren't content-hashed), so it was pure downside. There is no fetch
// handler here — every request goes straight to the network, untouched.
//
// An already-installed old SW is picked up for update on the next navigation
// (browsers byte-compare sw.js out-of-band, bypassing the HTTP cache). When this
// version installs it takes over, nukes all caches, unregisters itself, and
// reloads every open tab so the freshly-fetched code shows immediately.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: "window" });
      clients.forEach((client) => client.navigate(client.url));
    })()
  );
});

// No fetch listener on purpose — nothing is intercepted or cached.
