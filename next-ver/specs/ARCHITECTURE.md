# ARCHITECTURE — next-ver

## Request lifecycle (API)
1. **Middleware** (`src/middleware.ts`) runs on every non-`/api` request (matcher excludes
   `api`, `_next/*`, static files). It builds an SSR Supabase client over the request cookies
   and calls `supabase.auth.getUser()` to **refresh the session** and rotate auth cookies
   onto the response. It does NOT gate `/api/*` — route handlers self-authenticate.
2. **Route handler** (`src/app/api/<name>/route.ts`) — `rateLimit()` → validate body →
   `createSupabaseServerClient()` → `requireUser(supabase)`.
3. **Auth guard** (`requireUser`, `src/lib/supabase/auth.ts`) — local JWT cookie first, then
   `supabase.auth.getUser()`; throws a 401 `NextResponse` otherwise.
4. **Supabase query** — always `.eq("user_id", userId)` (RLS also on, D21). Reads in
   `lib/api/dashboard.ts`, mutations inline in the route.
5. **No balance sync** — mutations have **no balance side-effect** (D13). `monthly_balances` and
   `applyBalanceDelta`/`lib/api/balances.ts` are gone; Left-in-bank and the per-month tiles are
   computed on read in `loadDashboardData` (DATA_MODEL money model).
6. **JSON response** — `{ item }` / `{ ok: true }` / `{ error }` (no `balance` object anymore).

## Auth model
- **Two clients, two purposes:**
  - `lib/supabase/cookies.ts` → `createSupabaseServerClient()`: SSR client bound to request
    cookies (`@supabase/ssr`). Used by route handlers; can read/refresh the session.
  - `lib/supabase/server.ts` → `supabaseServer`: service-role (or anon) client, no session
    persistence. For privileged server-only work.
- **Cookie resolution** (`getUserFromCookies`): derives project ref from `SUPABASE_URL`, then
  finds `sb-<ref>-auth-token` → `sb-access-token` → any `*-auth-token` cookie, extracts the
  access token (handles raw string / JSON / `currentSession.access_token`), and verifies it
  with `jose.jwtVerify` against `SUPABASE_JWT_SECRET`. Returns `{ id, email, accessToken }`
  or `null`. This is the fast path — no network call.
- **Fallback**: if the cookie path yields nothing, `supabase.auth.getUser()` (network).
- **Client side**: `AuthContext` (`features/auth/AuthContext.tsx`, `"use client"`) calls
  `/api/auth/{me,login,signup,logout}` and holds `{ user, loading, signIn, signUp, signOut }`.

## Client / server boundary
- **Server (default)**: route handlers, `lib/*`, RSC pages. `lib/supabase/server.ts` is
  `import "server-only"`.
- **Client (`"use client"`)**: `AuthContext`, dashboard hooks (`useDashboardData`,
  `useDashboardState`), forms, anything stateful/interactive. Data flows client → `fetch`
  `/api/*` → handler. No direct Supabase calls from the client.

## Folder / naming conventions
- Route groups: `(auth)` (login/signup), `(app)` (dashboard) — parens = no URL segment.
- API: one `route.ts` per resource folder, exporting `GET/POST/PUT/DELETE`.
- Features: `src/features/<feature>/{components,hooks,types,utils}`; cross-cutting helpers in
  `src/lib/{api,supabase}`. Absolute `@/` imports throughout.

## State & data fetching pattern
Mobile: `useFinance(month)` fetches `/api/dashboard?month=`, exposes `summary` (leftInBank + tiles)
+ `credits/expenses/investments/bills` plus optimistic add/edit/remove per resource and `reload()`.
Expenses are paginated (D20) — page 1 in the dashboard payload, 2+ via `GET /api/expenses?page=`.
Mutations hit the resource routes, then the hook patches local state optimistically or `reload()`s.
(Legacy desktop `useDashboardState`/`useDashboardData` were torn down with the demo — commit
`refactor(dashboard): teardown demo`.)

## Security headers (CSP + hardening) — D19
`next.config.ts` `headers()` sends on every route: **Content-Security-Policy** (default-src 'self';
`'unsafe-inline'` for script/style until a nonce middleware lands; dev-only `'unsafe-eval'` + ws for
HMR, gated on `NODE_ENV`; `connect-src` allowlists the Supabase origin as defense-in-depth),
**HSTS** (2y, preload), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
`Referrer-Policy: strict-origin-when-cross-origin`, and a locked-down `Permissions-Policy`. Set at
the config layer (not middleware) so it applies uniformly and survives static/edge responses.
