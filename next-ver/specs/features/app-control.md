# App Control — kill switch + cache-purge broadcast

## Problem
Operators need two DB-driven levers, controllable with a single SQL statement:
1. **Kill switch** — force-log-out every active user at once (e.g. after a security event or a breaking auth change).
2. **Cache purge** — make every client evict any stale service worker + caches and reload.
The second exists because the app's stance is **no caching, ever**: a legacy caching SW once served stale JS bundles, and returning users may still carry it. This broadcast evicts it without a manual hard-reload.

## Data model touched
New singleton table `public.app_control` (migration `009_app_control.sql`), not a per-user table:
- `id smallint` — fixed `1` (singleton, `check (id = 1)`).
- `session_epoch bigint` default `0` — unix seconds. A session whose JWT `iat` is **older** than this is treated as logged out. `0` never kills.
- `purge_version integer` default `0` — bump to trigger a client-side SW/cache wipe + reload.
- `updated_at timestamptz`.
RLS is **enabled with no policies**: only the service-role server client (bypasses RLS) reads/writes it. No `monthly_balances` impact.

### Operator commands
Canonical scripts live in `supabase/ops/` (see `supabase/ops/README.md`):
- **Log out all users**: `npm run ops:logout-all` or `supabase/ops/logout-all-users.sql`.
- **Force cache purge**: `npm run ops:purge-caches` or `supabase/ops/force-cache-purge.sql`.

The npm scripts run `supabase/ops/run.sh`, which PATCHes the row over the REST API using `SUPABASE_SERVICE_ROLE_KEY` from `next-ver/.env` (bypasses RLS; hits prod). Raw SQL equivalent:
```sql
-- Log out ALL users now:
update public.app_control set session_epoch = extract(epoch from now())::bigint,
  updated_at = now() where id = 1;
-- Force every client to purge old SW/caches and reload:
update public.app_control set purge_version = purge_version + 1,
  updated_at = now() where id = 1;
```

## API contract
**`GET /api/app-control`**
- **Request**: none (reads the caller's auth cookie if present).
- **Response**: `{ purgeVersion: number, killed: boolean }`. `killed` = a valid token exists whose `iat < session_epoch`. `Cache-Control: no-store`. Holds no secrets; works with or without a session.
- **Errors**: 429 limited.
- **Rate limit**: `app-control` — `{ limit: 120, windowMs: 60_000 }`.
- **Money-model effect**: none.

### Server-side enforcement (the real kill switch)
- `lib/api/appControl.ts` — `getAppControl()` reads the singleton via the service-role client, cached in-memory `TTL_MS = 30_000` (fail-**open** on DB error so a transient failure never locks everyone out). `getSessionEpoch()` is the hot-path accessor.
- `lib/supabase/auth.ts` — enforcement works **with or without `SUPABASE_JWT_SECRET`** (the secret is unset in this project, so the secret-free path is the live one):
  - `getAccessTokenClaims()` — fast path: locally **verify** the cookie JWT. Returns `null` when the secret is unset.
  - `getAuthContext(supabase)` — resolves `{ userId, email, fullName, issuedAt }`. Secret set → verified claims. Secret unset → `supabase.auth.getUser()` does the crypto verification, then `decodeJwt()` reads `iat` from the already-authenticated token (decode-only, no signature check). No kill check — used by the endpoint to compute `killed`.
  - `isSessionKilled(issuedAt, epoch)` — `epoch > 0 && issuedAt > 0 && issuedAt < epoch` (fail-open on unknown `iat`).
  - `getLiveUser(supabase)` — `getAuthContext` + kill check → `null` when unauthenticated **or** killed. Used by `requireUser()` (all routes) and `/api/auth/me` (so the client's AuthContext drops the user on kill).
- **Why not the JWT secret**: the earlier design keyed enforcement on `getAccessTokenClaims()`, which needs `SUPABASE_JWT_SECRET`. That var is commented out in `.env` (and absent on Vercel), so claims were always `null`, `requireUser` fell straight through, and the kill switch was a no-op. The decode-`iat` path removes that dependency.

## UI / components
- `features/pwa/AppControl.tsx` (`"use client"`) — mounted **globally** in `src/app/layout.tsx` (inside `AuthProvider`, beside `ServiceWorkerRegister`). Polls `/api/app-control` on mount and on `visibilitychange` → visible (PWA foreground), so a flag flip converges within seconds.
  - `killed` → `signOut()` then `location.href = "/"`.
  - `purgeVersion` changed vs `localStorage["app-purge-version"]` → unregister all SWs, delete all caches, reload. First run baselines silently (no reload). All failures swallowed.
- Client never reads `app_control` directly — only through the endpoint.

## Acceptance criteria
- [x] Bumping `session_epoch` 401s existing sessions on their next API call (server) and logs them out on next load/foreground (client).
- [x] Killed session is not resurrected by the Supabase fallback in `requireUser`.
- [x] Bumping `purge_version` makes each device wipe SW + caches and reload exactly once.
- [x] Kill-switch epoch read is cached (30s) and fails open on DB error.
- [x] `GET /api/app-control` rate-limited; leaks no secrets.

## Files to touch
`supabase/migrations/009_app_control.sql` — table + RLS.
`src/lib/api/appControl.ts` — cached epoch/purge reader.
`src/lib/supabase/auth.ts` — `getAuthContext` / `getLiveUser` / `isSessionKilled`; secret-free kill check in `requireUser`.
`src/app/api/app-control/route.ts` — poll endpoint (`killed` via `getAuthContext`).
`src/app/api/auth/me/route.ts` — uses `getLiveUser` so `/me` reflects the kill switch.
`src/features/pwa/AppControl.tsx` — client boot service.
`src/app/layout.tsx` — global mount.
`supabase/ops/{logout-all-users,force-cache-purge}.sql`, `supabase/ops/run.sh`, `supabase/ops/README.md`, `package.json` (`ops:*` scripts) — operator commands.

## Out of scope
- Per-user (targeted) logout — this is global only.
- Any actual caching. The purge path only *removes* caches; see `pwa-ship-checklist.md` §2 for the no-cache SW that stays (required for installability).
- Moving the in-memory rate limiter / epoch cache to a shared store (Upstash/KV) — tracked in `pwa-ship-checklist.md` §3.2.
