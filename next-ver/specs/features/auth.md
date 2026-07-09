# Auth

Reverse-engineered from `src/app/api/auth/*`, `src/app/{globals,layout}.tsx`, `public/{icon.svg,manifest.json}`, `lib/supabase/{auth,cookies}.ts`,
`features/auth/{AuthContext.tsx,identity.ts}`, `features/auth/components/AuthForm.tsx`,
`src/app/(auth)/layout.tsx`, `src/middleware.ts`,
`supabase/migrations/{003_rls,008_profiles_full_name,010_profiles_last_login}.sql`.

## Problem
Email/password auth via Supabase. Server routes authenticate from cookies; the client holds
session state in `AuthContext`.

## Data model touched
Supabase `auth.users` (managed by Supabase).
`public.profiles` stores signup profile data and login audit data:
- `opening_balance` and `full_name` are seeded by the signup trigger.
- `last_login_at` is updated after every successful password login.

## API contract — `/api/auth/*`
- **POST `/login`** — `{ email, password }` → `signInWithPassword`, then service-role upsert of `profiles.last_login_at`. → `{ ok: true }`.
  Errors: 401 bad creds, 429. Rate limit `auth:login` `{10, 60_000}`.
  If Supabase accepts the password but the audit timestamp cannot be written, the route returns 500 instead of silently losing the login event.
- **POST `/signup`** — `{ email, password, fullName, openingBalance? }` → `signUp` with
  `options.data = { full_name, opening_balance }`. → `{ ok: true }`. 400 / 429.
  Rate limit `auth:signup` `{6, 60_000}`. `fullName` required (`signupSchema`, 1–80 chars);
  `openingBalance` optional, clamped ≥ 0.
- **POST `/logout`** — `signOut`. → `{ ok: true }`. 400 / 429. `auth:logout` `{30, 60_000}`.
- **GET `/me`** — `getUserFromCookies` first (fast, JWT verify), else `supabase.auth.getUser()`.
  → `{ user: { id, email, fullName }|null }` (200 even when null). `auth:me` `{60, 60_000}`.
  `fullName` comes from JWT `user_metadata.full_name` (cookie path) or `user_metadata` on
  the `getUser()` fallback — no profiles query.

All auth routes already follow CONVENTIONS (rate limit + error shape) — these are the
**reference** for §3.

## Auth model (see ARCHITECTURE)
- `getUserFromCookies`: resolve `sb-<ref>-auth-token` / `sb-access-token` / `*-auth-token`,
  extract access token, `jose.jwtVerify` with `SUPABASE_JWT_SECRET`.
- `requireUser(supabase)`: cookie path → fallback `getUser()` → throw 401 `NextResponse`.
- `middleware.ts`: refreshes session on non-`/api` requests (rotates cookies).

## Full name & greeting identity (D-A)
- Signup captures **email + password + full name + current bank balance**; login is
  unchanged (email + password only). `AuthForm` renders the Full name + bank-balance
  fields only in signup mode.
- `full_name` is stored two ways: (1) in the JWT `user_metadata` (set via `signUp`
  metadata) so `/me` reads it back with no query, and (2) durably on `public.profiles`
  via the `handle_new_user` trigger (migration 008).
- `last_login_at` lives only on `public.profiles`.
  It is written by the login route after successful authentication using the service-role client, so it does not depend on user RLS state.
  Existing missing `profiles` rows are repaired through an upsert keyed by `user_id`.
- `features/auth/identity.ts` `identityFrom(fullName, email)` → `{ name, initials }`:
  greeting shows the **first name** only; avatar shows up to two initials. Falls back to
  the email local-part for pre-008 accounts with no `full_name`. Used by both
  `MobileHome` (`GreetingHeader`) and `DesktopHome`.

## UI / components
`AuthContext` (`"use client"`) — `{ user, loading, signIn, signUp, signOut }`; `user` now
carries `fullName`; `signUp(email, password, fullName, openingBalance?)`; `refreshUser`
calls `/api/auth/me`. `AuthForm` in `(auth)/login`+`(auth)/signup` pages.
**Log out** is triggered from `AvatarMenu` (`features/dashboard/mobile/AvatarMenu.tsx`) — the
avatar dropdown in both mobile (`GreetingHeader`) and desktop (`DesktopHome`) headers. It calls
`signOut()` then `router.replace("/login")`. The avatar was previously inert (no logout path).

**Auth pages support light and dark mode.** The root `ThemeProvider` owns the `<html>.dark`
class before paint, and `src/app/(auth)/layout.tsx` no longer strips theme state.
`AuthForm` renders a restrained, full-width responsive desktop split: a quiet, low-contrast brand
canvas on large screens and an unboxed form surface. The `Kharcha` name and a single squircle
rupee mark appear only in the active mobile or desktop brand location. Its warm canvas uses a
minimal money-flow scene rather than a data-looking chart: three quiet text milestones make the
loop `Income → Spending → Growth` tangible, linked by one soft dotted path. The path animates
continuously with one moving marker; motion stops for reduced-motion preference. The header keeps
its money label and signal together. Login also includes a separate, thin animated product-principle
rail below the form, leaving the hero unboxed and uncluttered. Verified customer feedback can later
replace that rail, but it must not invent customer names or quotes. It makes the app's financial
purpose legible
without inventing a user balance or score. Motion stops for reduced-motion preference. The root
metadata, Apple app title, and web manifest are all named
`Kharcha`; the browser favicon is the same rounded rupee mark as auth branding. Login has one
heading, one supporting line, and no segmented sign-in/sign-up toggle; the single link below the
form switches modes. Fields and primary action use soft rectangular corners; fields also have a
quiet focus halo. Signup keeps its necessary guidance and opening-balance explanation. The form
preserves the same auth contract, password reveal, and light/dark support. Signup must fit inside
the desktop viewport without making the page scroll.

## Acceptance criteria
- [ ] Login/signup/logout set/clear the Supabase session cookie.
- [ ] Successful login writes `profiles.last_login_at` with the server timestamp.
- [ ] `/me` returns the user with no extra network call when the JWT cookie is valid.
- [ ] Protected routes 401 without a valid session.
- [ ] All auth routes rate-limited.

## Files to touch
`src/app/api/auth/*/route.ts`, `lib/api/schemas.ts` (`signupSchema`), `lib/supabase/auth.ts`,
`lib/supabase/cookies.ts`, `features/auth/{AuthContext.tsx,identity.ts}`,
`features/auth/components/AuthForm.tsx`, `src/app/(auth)/layout.tsx`, `src/app/{globals,layout}.tsx`,
`public/{icon.svg,manifest.json}`,
`features/dashboard/{mobile/MobileHome,desktop/DesktopHome}.tsx`,
`supabase/migrations/{008_profiles_full_name,010_profiles_last_login}.sql`, `src/middleware.ts`.

## Out of scope
OAuth/social, password reset, email verification flows, MFA.
