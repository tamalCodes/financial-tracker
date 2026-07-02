# PWA Ship Checklist — install, security, safety, agent-dev readiness

Scope: make the app a real, installable PWA with an "Install this app" prompt for
users on mobile, cover security + safety for a financial app, and close the
agent-development gaps found in the current tree.

Legend: 🔴 blocker · 🟠 important · 🟡 nice-to-have · [x] done

---

## 1. Install experience — the "Add to Home Screen" prompt

Users must be nudged to install. Chrome/Android fires `beforeinstallprompt`; iOS
Safari does NOT — it needs a manual instructions banner.

- [ ] 🔴 1.1 `InstallPrompt` client component in `src/features/pwa/`:
  - Capture `beforeinstallprompt` event, `preventDefault()`, stash it.
  - Render a dismissible banner/toast: "Install Financial Tracker on your phone".
  - On click → `deferredPrompt.prompt()`; record outcome.
- [ ] 🔴 1.2 iOS path (no `beforeinstallprompt`): detect iOS Safari + not already
      standalone (`navigator.standalone` / `display-mode: standalone`), show a hint:
      "Tap Share → Add to Home Screen".
- [ ] 🟠 1.3 Don't nag: persist "dismissed" / "installed" in `localStorage`; suppress
      for N days. Hide entirely once `appinstalled` fires or running standalone.
- [ ] 🟠 1.4 Mount `InstallPrompt` in `(app)` layout so only logged-in users see it
      (or on landing — decide placement).
- [ ] 🟡 1.5 Track install funnel (shown / accepted / dismissed) for later analytics.

## 2. PWA correctness (installability + offline)

- [ ] 🔴 2.1 Icons: add real PNGs to `public/` — `icon-192.png`, `icon-512.png`,
      `apple-touch-icon.png` (180×180), and a maskable `icon-maskable-512.png`.
      SVG-only fails iOS + weakens Android install quality.
- [ ] 🔴 2.2 `manifest.json`: reference the PNGs with `purpose: "any"` and
      `"maskable"`; keep `display: standalone`, `start_url`, `theme_color`.
- [ ] 🔴 2.3 `layout.tsx` metadata: add `appleWebApp: { capable, statusBarStyle, title }`
      and confirm `themeColor`.
- [ ] 🟠 2.4 Auto-reload on SW update: in `ServiceWorkerRegister`, listen for
      `controllerchange` and `location.reload()` once (guard flag) so a deploy shows
      instantly — no manual refresh. (Follows the cache-first fix already shipped.)
- [ ] 🟠 2.5 Offline fallback: cache the app shell; serve an `/offline` page when the
      network is down and no cache hit.
- [ ] 🟡 2.6 iOS splash screens (`apple-touch-startup-image`) — cosmetic.
- [ ] 🔴 2.7 Verify with Lighthouse PWA audit (installable, offline, HTTPS) — target
      all green. Test real install on Android Chrome + iOS Safari.

## 3. Security (financial app — treat as sensitive)

- [ ] 🔴 3.1 Security headers via `next.config.ts` `headers()` (or middleware):
      `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options: DENY`,
      `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
      `Permissions-Policy`. CSP must allow the Supabase origin + self; no `unsafe-inline`
      for scripts if avoidable.
- [ ] 🔴 3.2 Rate limiting is in-memory (`lib/api/rateLimit.ts` uses a module `Map`) —
      this does NOT hold on Vercel serverless (per-instance, resets on cold start).
      Move to a shared store (Upstash Redis / Vercel KV) before relying on it in prod.
- [ ] 🔴 3.3 Confirm every API route: `rateLimit()` → zod-validate body → `requireUser()`
      → query always scoped `.eq("user_id", userId)`. Audit all 12 routes for the guard.
- [ ] 🔴 3.4 Supabase Row Level Security (RLS) enabled on every table, policy = owner-only.
      Do not depend on app-layer `user_id` filtering alone.
- [ ] 🔴 3.5 Secrets: service-role key server-only (never `NEXT_PUBLIC_*`). Confirm
      `lib/supabase/server.ts` stays `import "server-only"`. `.env` is gitignored ✅;
      never commit real keys.
- [ ] 🟠 3.6 Cookies: auth cookies `HttpOnly`, `Secure`, `SameSite=Lax`. Verify SSR
      client sets these in prod.
- [ ] 🟠 3.7 Dependency + secret scanning: `npm audit` in CI; enable GitHub Dependabot
      + secret scanning / push protection on the repo.
- [ ] 🟠 3.8 Input limits: cap request body size, string lengths, numeric ranges in zod
      schemas to blunt abuse.
- [ ] 🟡 3.9 Auth hardening: enforce email confirmation before prod (currently parked),
      password strength, and lockout/backoff on repeated failed logins.

## 4. Safety / privacy

- [ ] 🟠 4.1 Financial data is personal — add a short privacy note (what's stored, where,
      that it's per-user isolated). Even a `PRIVACY.md`.
- [ ] 🟠 4.2 Account deletion / data export path (user can wipe their data).
- [ ] 🟡 4.3 SW must never cache authenticated API responses to disk cache — already
      enforced (`/api/*` = network-only). Keep it that way; re-audit if cache rules change.
- [ ] 🟡 4.4 Log hygiene: no tokens / PII in server logs or client `console`.

## 5. Agent-development readiness (gaps in current tree)

Ties to `specs/WHATS_LEFT.md` Track B. Current state: 3 test files, no CI, no E2E,
no `.env.example`.

- [ ] 🔴 5.1 Test coverage: only 3 tests (`dashboard.test.ts`, `routes.test.ts`,
      `expression.test.ts`) vs ~60 source files. Add API-route tests (auth guard, RLS
      scope, validation) + core component/hook tests.
- [ ] 🔴 5.2 E2E smoke: no Playwright. Wire login → dashboard → add txn → assert, so the
      agent write→verify loop can prove flows end-to-end. Add a screenshot recipe.
- [ ] 🔴 5.3 CI: no `.github/workflows`. Add one running `npm run verify` (typecheck +
      lint + test + build) + `npm audit` on push/PR. `verify` script already exists ✅.
- [ ] 🟠 5.4 `.env.example`: committed template of required vars (no secrets) so a fresh
      clone / agent knows what to set. Missing today.
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
