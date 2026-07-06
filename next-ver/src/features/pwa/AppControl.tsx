"use client";

import { useEffect } from "react";
import { useAuth } from "@/features/auth/AuthContext";

// Tracks the last purge_version this device has already acted on, so a bump in
// the DB triggers exactly one purge+reload per device.
const PURGE_KEY = "app-purge-version";

/**
 * Wipe every service worker and cache on this device, then reload. This is the
 * "no cache, ever" enforcement: it evicts the legacy caching service worker some
 * returning users still carry. Our own install-prompt SW (which caches nothing)
 * re-registers itself on the next load.
 */
async function purgeCachesAndReload() {
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((reg) => reg.unregister()));
    }
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } finally {
    window.location.reload();
  }
}

/**
 * DB-driven kill switch + cache-purge broadcast. Mounted globally; it polls
 * /api/app-control on load and again whenever the tab/PWA is foregrounded, so a
 * flag flipped in the database converges on real devices within seconds.
 *
 * - killed → this session was invalidated server-side; sign out and go home.
 * - purgeVersion changed → nuke SW + caches and reload.
 *
 * Any failure (offline, transient) is swallowed: control checks must never
 * disrupt a working app.
 */
export default function AppControl() {
  const { signOut } = useAuth();

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      let data: { purgeVersion?: number; killed?: boolean };
      try {
        const res = await fetch("/api/app-control", { cache: "no-store" });
        if (!res.ok) return;
        data = await res.json();
      } catch {
        return;
      }
      if (cancelled) return;

      // 1) Kill switch: server invalidated this session → log out and reset.
      if (data.killed) {
        try {
          await signOut();
        } catch {
          // ignore — redirect below still lands the user on the logged-out home
        }
        window.location.href = "/";
        return;
      }

      // 2) Purge broadcast: baseline silently on first run; purge only on change.
      const server = String(data.purgeVersion ?? 0);
      const seen = window.localStorage.getItem(PURGE_KEY);
      if (seen === null) {
        window.localStorage.setItem(PURGE_KEY, server);
      } else if (seen !== server) {
        window.localStorage.setItem(PURGE_KEY, server);
        await purgeCachesAndReload();
      }
    };

    check();
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [signOut]);

  return null;
}
