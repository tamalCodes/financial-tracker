# Auth

Reverse-engineered from `src/app/api/auth/*`, `lib/supabase/{auth,cookies}.ts`,
`features/auth/AuthContext.tsx`, `src/middleware.ts`.

## Problem
Email/password auth via Supabase. Server routes authenticate from cookies; the client holds
session state in `AuthContext`.

## Data model touched
Supabase `auth.users` (managed by Supabase). No app tables.

## API contract — `/api/auth/*`
- **POST `/login`** — `{ email, password }` → `signInWithPassword`. → `{ ok: true }`.
  Errors: 401 bad creds, 429. Rate limit `auth:login` `{10, 60_000}`.
- **POST `/signup`** — `{ email, password }` → `signUp`. → `{ ok: true }`. 400 / 429.
  Rate limit `auth:signup` `{6, 60_000}`.
- **POST `/logout`** — `signOut`. → `{ ok: true }`. 400 / 429. `auth:logout` `{30, 60_000}`.
- **GET `/me`** — `getUserFromCookies` first (fast, JWT verify), else `supabase.auth.getUser()`.
  → `{ user: { id, email }|null }` (200 even when null). `auth:me` `{60, 60_000}`.

All auth routes already follow CONVENTIONS (rate limit + error shape) — these are the
**reference** for §3.

## Auth model (see ARCHITECTURE)
- `getUserFromCookies`: resolve `sb-<ref>-auth-token` / `sb-access-token` / `*-auth-token`,
  extract access token, `jose.jwtVerify` with `SUPABASE_JWT_SECRET`.
- `requireUser(supabase)`: cookie path → fallback `getUser()` → throw 401 `NextResponse`.
- `middleware.ts`: refreshes session on non-`/api` requests (rotates cookies).

## UI / components
`AuthContext` (`"use client"`) — `{ user, loading, signIn, signUp, signOut }`; `refreshUser`
calls `/api/auth/me`. `AuthForm` in `(auth)/login`+`(auth)/signup` pages.
**Log out** is triggered from `AvatarMenu` (`features/dashboard/mobile/AvatarMenu.tsx`) — the
avatar dropdown in both mobile (`GreetingHeader`) and desktop (`DesktopHome`) headers. It calls
`signOut()` then `router.replace("/login")`. The avatar was previously inert (no logout path).

## Acceptance criteria
- [ ] Login/signup/logout set/clear the Supabase session cookie.
- [ ] `/me` returns the user with no extra network call when the JWT cookie is valid.
- [ ] Protected routes 401 without a valid session.
- [ ] All auth routes rate-limited.

## Files to touch
`src/app/api/auth/*/route.ts`, `lib/supabase/auth.ts`, `lib/supabase/cookies.ts`,
`features/auth/AuthContext.tsx`, `features/auth/components/AuthForm.tsx`, `src/middleware.ts`.

## Out of scope
OAuth/social, password reset, email verification flows, MFA.
