"use client";

import { useEffect } from "react";

// Caching is fully removed. This component used to register a caching service
// worker; it now does the opposite — on every load it unregisters ANY service
// worker and deletes ALL caches, so no stale bundle can ever be served again.
//
// We still register /sw.js once as a one-shot kill switch: a browser that has
// the old caching SW installed only fetches an updated sw.js on navigation, and
// the kill-switch version tears itself (and its caches) down on activate. After
// that there is no SW left. Nothing here ever caches anything.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("caches" in window) {
      caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
    }

    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.getRegistrations().then((regs) => {
      if (regs.length > 0) {
        // Old caching SW present — hand control to the kill switch, which will
        // unregister itself and wipe caches, then reload the tab.
        navigator.serviceWorker.register("/sw.js").catch(() => {});
      }
    });
  }, []);

  return null;
}
