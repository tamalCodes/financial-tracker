"use client";

import { Download, Share, X } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * BeforeInstallPromptEvent isn't in the standard lib DOM types yet.
 * Chrome/Edge/Android fire it; we capture + defer it to trigger install on tap.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa-install-dismissed-at";
// Re-show the prompt this long after a dismiss so we don't nag.
const DISMISS_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

type Platform = "android" | "ios" | null;

/** True when already launched from the home screen (installed) — never prompt then. */
function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari exposes this non-standard flag when launched standalone.
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function recentlyDismissed(): boolean {
  const at = window.localStorage.getItem(DISMISS_KEY);
  if (!at) return false;
  const elapsed = Date.now() - Number(at);
  return Number.isFinite(elapsed) && elapsed < DISMISS_TTL_MS;
}

/**
 * Cross-platform "install this app" nudge.
 * - Android/Chrome: captures `beforeinstallprompt`, shows a banner, and triggers the
 *   native install sheet on tap.
 * - iOS Safari: no such event exists, so we show manual "Share → Add to Home Screen"
 *   instructions instead.
 * Dismissals persist for {@link DISMISS_TTL_MS}; hides permanently once installed.
 */
export default function InstallPrompt() {
  const [platform, setPlatform] = useState<Platform>(null);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;

    // Android / Chromium: capture the install event before the browser shows its own.
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setPlatform("android");
    };

    // Any platform: hide + remember once the app is actually installed.
    const onInstalled = () => {
      setPlatform(null);
      setDeferredPrompt(null);
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    // iOS never fires beforeinstallprompt — fall back to manual instructions.
    // Deferred so we don't call setState synchronously in the effect body.
    const iosTimer = isIos()
      ? window.setTimeout(() => setPlatform("ios"), 0)
      : undefined;

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      if (iosTimer) window.clearTimeout(iosTimer);
    };
  }, []);

  const dismiss = () => {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setPlatform(null);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === "accepted") {
      setPlatform(null);
    } else {
      dismiss();
    }
  };

  if (!platform) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-surface border border-line bg-surface/80 p-4 shadow-2xl shadow-slate-900/10 backdrop-blur-xl">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-indigo-500/10 text-indigo-500">
          <Download className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">Install Financial Tracker</p>
          {platform === "ios" ? (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
              Tap
              <Share className="inline h-3.5 w-3.5" aria-label="the Share button" />
              then &ldquo;Add to Home Screen&rdquo;
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-muted">
              Add it to your home screen for quick access, offline.
            </p>
          )}
        </div>

        {platform === "android" && (
          <button
            type="button"
            onClick={install}
            className="shrink-0 rounded-control bg-ink px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
          >
            Install
          </button>
        )}

        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          className="-mr-1 shrink-0 rounded-lg p-1.5 text-faint transition-colors hover:bg-slate-100 hover:text-body"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
