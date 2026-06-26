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
4. **Supabase query** — always `.eq("user_id", userId)`. Reads in `lib/api/dashboard.ts`,
   mutations inline in the route.
5. **Balance sync** — mutations call `applyBalanceDelta` (`lib/api/balances.ts`) to keep
   `monthly_balances.closing_balance` consistent (see DATA_MODEL invariant).
6. **JSON response** — `{ item, balance }` / `{ ok: true, balance }` / `{ error }`.

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
`useDashboardState` owns the selected month (`YYYY-MM-01`) + UI flags. `useDashboardData(month)`
fetches `/api/dashboard?month=`, exposes `balance/credits/expenses/investments` plus optimistic
`upsert*/remove*` mutators and `reload()`. Mutations hit the resource routes, then the hook
either patches local state optimistically or `reload()`s.
