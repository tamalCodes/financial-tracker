# Mobile App Strategy — PWA now, thin native shell later

Goal (user's words): use the app on personal Android + iOS devices, no Play Store /
App Store spend, no separate React Native codebase to maintain. Expo was floated.

## TL;DR decision

**Ship as a PWA. Do NOT rewrite in Expo/React Native.**
The existing Next.js app already IS the mobile app once installed to the home screen —
free, cross-platform, one codebase. Expo would mean a second RN codebase (contradicts
"no RN code") and iOS-on-device still costs $99/yr regardless (Apple's rule, not Expo's).

If a store listing is ever wanted, wrap the SAME web app in **Capacitor** (no rewrite) —
Android APK sideload is free; iOS still needs the paid Apple account.

## Why Expo does not fit here

| Constraint                 | Expo reality |
|----------------------------|--------------|
| "no React Native code"     | Expo *is* React Native — the Next.js UI does not port over; would be a rewrite |
| "no money"                 | iOS: any on-device install (even sideload/TestFlight) needs Apple Developer $99/yr |
| Android free install       | ✅ Expo can build a sideloadable APK for free |
| iOS free install           | ❌ 7-day-expiry sideload only with a free Apple ID — impractical |

PWA sidesteps all of this: iOS "Add to Home Screen" installs a standalone app for **free**,
no store, no dev account.

## Current PWA state (audit)

Present:
- `public/manifest.json` — name, standalone, theme_color, orientation ✅
- `public/sw.js` — service worker, cache strategy fixed (network-first for data) ✅
- `src/features/pwa/ServiceWorkerRegister.tsx` — registers + skipWaiting ✅
- `layout.tsx` metadata → manifest linked ✅

Gaps (see roadmap):
- Icons: only `icon.svg`. iOS needs a PNG apple-touch-icon; Android install quality
  wants maskable 192/512 PNGs.
- No `appleWebApp` metadata (iOS standalone status bar / title).
- SW updates skipWaiting but page does not auto-reload → user sees stale UI for one
  extra manual refresh after a deploy.
- No offline fallback page (optional for a personal app).

## Roadmap

### Phase 1 — Solid installable PWA (free, ~half a day)  ← do this
- [ ] P1.1 Add PNG icons: `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`,
      `apple-touch-icon.png` (180×180) in `public/`; reference in `manifest.json`
      (`purpose: "any"` + `"maskable"`).
- [ ] P1.2 `layout.tsx` metadata: `appleWebApp: { capable: true, statusBarStyle,
      title }`, and confirm `themeColor`.
- [ ] P1.3 Auto-reload on SW update: in `ServiceWorkerRegister`, on
      `navigator.serviceWorker.controller` `controllerchange`, reload once (guard with
      a flag to avoid reload loops). Kills the "one extra refresh" issue.
- [ ] P1.4 Deploy to Vercel (free tier, HTTPS included). This is the "server" for the PWA.
- [ ] P1.5 Install test: Android Chrome "Install app"; iOS Safari "Add to Home Screen";
      confirm standalone launch, icon, offline shell.

### Phase 2 — Nice-to-have PWA polish (optional)
- [ ] P2.1 Offline fallback route + cache the app shell.
- [ ] P2.2 iOS splash screens (per-device `apple-touch-startup-image`) — cosmetic.
- [ ] P2.3 Web Push (Android + iOS 16.4+ when installed) — only if reminders wanted.

### Phase 3 — Only if a store listing is ever needed (later, some cost)
- [ ] P3.1 Wrap existing web app with **Capacitor** (no UI rewrite; loads the deployed
      site or a bundled build).
- [ ] P3.2 Android: `capacitor build android` → APK, sideload free, or Play Store
      ($25 one-time) if public listing wanted.
- [ ] P3.3 iOS: requires Apple Developer ($99/yr). Only pursue if iOS store/TestFlight
      distribution is truly needed — otherwise the Phase 1 PWA already runs on iPhone.

## Bottom line
Phase 1 gets a real, installable, offline-capable app on both your phones for $0 and
zero new codebases. Expo is the wrong tool for these constraints; Capacitor is the
cheap escape hatch later if a store listing matters.
