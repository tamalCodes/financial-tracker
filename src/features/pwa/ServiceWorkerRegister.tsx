"use client";

import { useEffect } from "react";

// Registers the minimal service worker (public/sw.js) on every load. A
// registered, controlling SW with a fetch handler is a hard requirement for the
// app to be installable — without it Chrome/Android never fires
// `beforeinstallprompt`, so the "Install" prompt (InstallPrompt.tsx) can't show.
//
// The SW itself caches nothing (see public/sw.js), so registering it costs no
// staleness risk. Registration only works in a secure context (https or
// localhost); over a plain-http LAN IP the browser silently refuses, which is
// expected.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => navigator.serviceWorker.register("/sw.js").catch(() => {});
    const schedule = () => window.setTimeout(register, 0);

    if (document.readyState === "complete") {
      const timeout = schedule();
      return () => window.clearTimeout(timeout);
    }

    window.addEventListener("load", schedule, { once: true });
    return () => window.removeEventListener("load", schedule);
  }, []);

  return null;
}
