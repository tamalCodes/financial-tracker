# PWA Ship Checklist — install, security, safety, agent-dev readiness

Scope: make the app a real, installable PWA with an "Install this app" prompt for
users on mobile, cover security + safety for a financial app, and close the
agent-development gaps found in the current tree.

Legend: 🔴 blocker · 🟠 important · 🟡 nice-to-have · [x] done

---

## 1. Install experience — the "Add to Home Screen" prompt

Users must be nudged to install. Chrome/Android fires `beforeinstallprompt`; iOS
Safari does NOT — it needs a manual instructions banner.

- [x] 🔴 1.1 `InstallPrompt` client component in `src/features/pwa/`:
  - Capture `beforeinstallprompt` event, `preventDefault()`, stash it.
  - Render a dismissible banner/toast: "Install Financial Tracker on your phone".
  - On click → `deferredPrompt.prompt()`; record outcome.
- [x] 🔴 1.2 iOS path (no `beforeinstallprompt`): detect iOS Safari + not already
      standalone (`navigator.standalone` / `display-mode: standalone`), show a hint:
      "Tap Share → Add to Home Screen".
- [x] 🟠 1.3 Don't nag: persist "dismissed" / "installed" in `localStorage`; suppress
      for N days. Hide entirely once `appinstalled` fires or running standalone. (14-day TTL, `appinstalled` handled.)
- [x] 🟠 1.4 Mount `InstallPrompt` in `(app)` layout so only logged-in users see it
      (or on landing — decide placement). Done: new `app/(app)/layout.tsx` mounts it; removed from root `layout.tsx`. `ServiceWorkerRegister` stays root (needs to run everywhere).
- [ ] 🟡 1.5 Track install funnel (shown / accepted / dismissed) for later analytics.

## 2. PWA correctness (installability + offline)

- [x] 🔴 2.1 Icons: add real PNGs to `public/` — `icon-192.png`, `icon-512.png`,
      `apple-touch-icon.png` (180×180), and a maskable `icon-maskable-512.png`.
      SVG-only fails iOS + weakens Android install quality. (Generated via sharp from
      the ₹ mark; maskable glyph sized into the safe zone.)
- [x] 🔴 2.2 `manifest.json`: reference the PNGs with `purpose: "any"` and
      `"maskable"`; keep `display: standalone`, `start_url`, `theme_color`. Also wired
      `metadata.icons` (icon + `apple-touch-icon`) in `layout.tsx` so Next emits the links.
- [x] 🔴 2.3 `layout.tsx` metadata: add `appleWebApp: { capable, statusBarStyle, title }`
      and confirm `themeColor`. (Done: `appleWebApp` + `viewport.themeColor` present.)
- [x] 🔴 2.4 Register a controlling SW for installability: `ServiceWorkerRegister`
      registers `public/sw.js` on every load (secure context only). The SW is a
      **minimal no-cache installable** worker — `install`/`activate`/`fetch` handlers,
      `skipWaiting` + `clients.claim`, wipes any legacy caches on activate, and a
      no-op `fetch` listener (present only because Chrome requires a fetch handler to
      fire `beforeinstallprompt`; it caches nothing so deploys are always live).
      Regression fixed 2026-07-07: the SW had been gutted into a self-unregistering
      kill switch, so no SW controlled fresh devices → Android never offered install.
- [ ] 🟡 2.5 Offline fallback: NONE by design. The SW caches nothing (pure network
      passthrough) to guarantee no stale bundles. Add an `/offline` page only if we
      later adopt content-hashed caching for the app shell.
- [ ] 🟡 2.6 iOS splash screens (`apple-touch-startup-image`) — cosmetic.
- [ ] 🔴 2.7 Verify with Lighthouse PWA audit (installable, offline, HTTPS) — target
      all green. Test real install on Android Chrome + iOS Safari.

## 3. Security (financial app — treat as sensitive)

- [x] 🔴 3.1 Security headers via `next.config.ts` `headers()` (or middleware):
      `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options: DENY`,
      `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
      `Permissions-Policy`. CSP must allow the Supabase origin + self; no `unsafe-inline`
      for scripts if avoidable. Done: `headers()` on `/:path*` (verified via curl on `/`
      and `/api/sips`). CSP built from `SUPABASE_URL`; dev-only `'unsafe-eval'` + `ws:`.
      RESIDUAL: `script-src` still needs `'unsafe-inline'` for Next's App Router inline
      bootstrap — tighten later with a nonce-based middleware (`strict-dynamic`).
- [ ] 🔴 3.2 Rate limiting is in-memory (`lib/api/rateLimit.ts` uses a module `Map`) —
      this does NOT hold on Vercel serverless (per-instance, resets on cold start).
      Move to a shared store (Upstash Redis / Vercel KV) before relying on it in prod.
- [x] 🔴 3.3 Confirm every API route: `rateLimit()` → validate request input where applicable → `requireUser()`
      → query always scoped `.eq("user_id", userId)`.
      Re-audited 2026-07-10: protected money/portfolio routes follow the guard/scoping pattern; auth routes and `GET /api/app-control` are intentional public/session-aware exceptions.
- [x] 🔴 3.4 Repo migration state: Supabase Row Level Security (RLS) enabled on every per-user table, policy = owner-only.
      `app_control` has RLS enabled with no client policies.
      Do not depend on app-layer `user_id` filtering alone.
- [ ] 🔴 3.4b Live DB verification: query production Supabase catalogs and confirm every deployed table still has expected RLS/policies.
- [x] 🔴 3.5 Secrets: service-role key server-only (never `NEXT_PUBLIC_*`). Confirm
      `lib/supabase/server.ts` stays `import "server-only"`. `.env` is gitignored ✅;
      never commit real keys. (Verified: `server.ts` line 1 = `import "server-only"`.)
- [ ] 🟠 3.6 Cookies: auth cookies `HttpOnly`, `Secure`, `SameSite=Lax`. Verify SSR
      client sets these in prod.
- [ ] 🟠 3.7 Dependency + secret scanning: CI exists and runs `npm audit --omit=dev` plus `npm run verify`, but does not yet run `gitleaks`.
      Add Gitleaks to CI, enable GitHub Dependabot, and enable GitHub secret scanning / push protection on the repo.
- [ ] 🟠 3.8 Input limits: cap request body size, string lengths, numeric ranges in zod
      schemas to blunt abuse.
- [ ] 🟡 3.9 Auth hardening: enforce email confirmation before prod (currently parked),
      password strength, and lockout/backoff on repeated failed logins.
- [ ] 🔴 3.10 Rotate Supabase service-role key before public launch.
      Git history now scans clean, but previously exposed secrets must be treated as burned.
- [x] 🔴 3.11 Public Git history hygiene: stale remote branch `origin/plan/mobile-redesign` deleted 2026-07-10.
      Keep Claude/Codex project files intentionally because they are workflow docs, not secrets.
      Keep Graphify output ignored/local by default; historical Graphify artifacts had no secret hit, so no history purge is required unless the repo owner later wants a cleaner public history.
- [ ] 🟠 3.12 Local generated-secret hygiene: `.env`, `.next/`, and `graphify-out/` are ignored, but `gitleaks dir` still finds local secrets in ignored files.
      Add pre-commit or documented release check so ignored local artifacts never get force-added or zipped.

## 4. Safety / privacy

- [ ] 🟠 4.1 Financial data is personal — add a short privacy note (what's stored, where,
      that it's per-user isolated). Even a `PRIVACY.md`.
- [ ] 🟠 4.2 Account deletion / data export path (user can wipe their data).
- [x] 🟡 4.3 SW must never cache authenticated API responses — trivially satisfied: the
      SW caches NOTHING at all (no-op `fetch` handler, no `respondWith`). Nothing,
      sensitive or otherwise, is ever written to a cache.
- [ ] 🟡 4.4 Log hygiene: no tokens / PII in server logs or client `console`.

## 5. Agent-development readiness (gaps in current tree)

Ties to `specs/WHATS_LEFT.md` Track B. Current state: 3 test files, no CI, no E2E,
no `.env.example`.

- [ ] 🔴 5.1 Test coverage: only 3 tests (`dashboard.test.ts`, `routes.test.ts`,
      `expression.test.ts`) vs ~60 source files. Add API-route tests (auth guard, RLS
      scope, validation) + core component/hook tests.
- [ ] 🔴 5.2 E2E smoke: no Playwright. Wire login → dashboard → add txn → assert, so the
      agent write→verify loop can prove flows end-to-end. Add a screenshot recipe.
- [ ] 🔴 5.3 CI: `.github/workflows/verify.yml` exists and runs `npm audit --omit=dev` plus `npm run verify` (typecheck +
      lint + test + build), but still needs `gitleaks detect` on push/PR.
- [x] 🟠 5.4 `.env.example`: committed template of required vars (no secrets) so a fresh
      clone / agent knows what to set.
- [ ] 🟠 5.5 Dual-app ambiguity: legacy Vite root app vs `next-ver`. Archive/delete or
      hard-document "next-ver only" so agents don't edit the dead tree. (WHATS_LEFT #5)
- [ ] 🟠 5.6 Supabase local: `db:start`/`db:reset` scripts exist ✅ — add seed data so
      data-touching tests + E2E run deterministically. (WHATS_LEFT #6)
- [ ] 🟡 5.7 `AGENTS.md` is 67 lines — keep it the single entry point; ensure it points
      at ARCHITECTURE / DATA_MODEL / CONVENTIONS and the verify command.
- [ ] 🟡 5.8 Permission allowlist: run `fewer-permission-prompts` to cut agent friction.

## 6. Deploy

- [ ] 🔴 6.1 Deploy `next-ver` to Vercel (free tier, HTTPS auto). Set env vars in Vercel
      (not committed). PWA requires HTTPS.
- [ ] 🟠 6.2 Post-deploy: re-run Lighthouse on the live URL; install on both phones.

---

## Priority path
Ship-critical order: **2 (PWA correct) → 1 (install prompt) → 6 (deploy) → 3 (security
headers + RLS) → 5.3 (CI) → 5.1/5.2 (tests + E2E)**.
The 🔴s in sections 2, 3, 6 gate a trustworthy public launch.
