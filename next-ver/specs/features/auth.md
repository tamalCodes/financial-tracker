# Auth

Reverse-engineered from `src/app/api/auth/*`, `src/app/auth/callback/route.ts`, `src/app/{globals,layout}.tsx`, `public/{icon.svg,manifest.json,auth-testimonials/*.png}`, `lib/supabase/{auth,cookies}.ts`, `supabase/config.toml`,
`features/auth/{AuthContext.tsx,identity.ts}`, `features/auth/components/AuthForm.tsx`,
`src/app/(auth)/layout.tsx`, `src/middleware.ts`,
`supabase/migrations/{003_rls,008_profiles_full_name,010_profiles_last_login}.sql`.

## Problem
Email/password plus Google/Apple OAuth through Supabase. Server routes authenticate from cookies;
the client holds session state in `AuthContext`.

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
- **POST `/oauth`** — `{ provider: "google" | "apple" }` → starts Supabase OAuth PKCE with a
  same-origin `/auth/callback` redirect. → `{ url }`. 400 unsupported/provider error, 429.
  Rate limit `auth:oauth` `{10, 60_000}`.
- **GET `/me`** — `getUserFromCookies` first (fast, JWT verify), else `supabase.auth.getUser()`.
  → `{ user: { id, email, fullName }|null }` (200 even when null). `auth:me` `{60, 60_000}`.
  `fullName` comes from JWT `user_metadata.full_name` (cookie path) or `user_metadata` on
  the `getUser()` fallback — no profiles query.
- **GET `/auth/callback`** — exchanges Supabase OAuth `code` for the cookie session then redirects
  to `/dashboard`; missing/exchange error redirects to `/login?error=oauth`.

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
`AuthContext` (`"use client"`) — `{ user, loading, signIn, signUp, signInWithOAuth, signOut }`;
`user` carries `fullName`; `signUp(email, password, fullName, openingBalance?)`;
`signInWithOAuth(provider)` obtains the server-generated Supabase authorize URL then navigates;
`refreshUser` calls `/api/auth/me`. `AuthForm` in `(auth)/login`+`(auth)/signup` pages.
**Log out** is triggered from `AvatarMenu` (`features/dashboard/mobile/AvatarMenu.tsx`) — the
avatar dropdown in both mobile (`GreetingHeader`) and desktop (`DesktopHome`) headers. It calls
`signOut()` then `router.replace("/login")`. The avatar was previously inert (no logout path).

**Auth pages support light and dark mode.** Root `ThemeProvider` owns `<html>.dark` before paint.
`AuthForm` scopes the Kharcha gold design tokens to auth only: `#191613` / `#F3EFE5` / `#D8B36A`
for dark and `#F4F1E8` / `#201B13` / `#9C7B33` for light. Bricolage Grotesque remains display/UI;
Geist is used for field and supporting copy.

Desktop is a 0.92fr/1.08fr 1440×850 split. Left has the 48px rupee brand, a 250px through-line,
and the `Money, clearly.` story. Right has a vertically centred 390px form with Google and Apple
buttons always side-by-side and equal-width. Mobile at ≤600px becomes a 390×844 single column with
the 44px mark, device notch, condensed 44px through-line, and three-up step labels.

The through-line is one gradient Bézier path with a 12s dashed flow, 11s glow marker with desktop
trails, and three desktop pulse-ring nodes. Reduced-motion removes animated markers/rings and
pauses `kh-*` animation while preserving the static path and labels. Login is email-first: a valid
email submit changes the CTA to the password step with a short reveal transition, then `Continue`
uses the existing password login route. It intentionally does not expose whether an email exists.
Signup adds full name/current balance. The desktop login shows a slow (8s) rotating customer-story
carousel, with five fictional AI-generated profile portraits and no star rating. Its dot controls
are keyboard-accessible buttons: selecting one switches to that story and restarts the 8s timer.
Mobile omits the carousel. Password eye toggles text/password. Hover, focus halo, placeholder,
and autofill rules match the handoff.

Supabase project configuration must enable Google and Apple providers and allow each deployed
`https://<origin>/auth/callback` redirect URL; local source alone cannot supply provider credentials.

## Acceptance criteria
- [ ] Login/signup/logout set/clear the Supabase session cookie.
- [ ] Successful login writes `profiles.last_login_at` with the server timestamp.
- [ ] `/me` returns the user with no extra network call when the JWT cookie is valid.
- [ ] Protected routes 401 without a valid session.
- [ ] All auth routes rate-limited.
- [ ] Google and Apple start Supabase OAuth and callback exchanges the PKCE code into a cookie session.
- [ ] Desktop/mobile dark/light through-line, side-by-side social controls, focus/hover, password eye,
  in-place mode switch, and reduced-motion behaviour match the Kharcha handoff.
- [ ] Login initially renders email plus `Continue`; password animates in only after the email step,
  with no account-existence disclosure.

## Files to touch
`src/app/api/auth/*/route.ts`, `src/app/auth/callback/route.ts`, `lib/api/schemas.ts` (`signupSchema`), `lib/supabase/auth.ts`,
`lib/supabase/cookies.ts`, `features/auth/{AuthContext.tsx,identity.ts}`,
`features/auth/components/AuthForm.tsx`, `src/app/(auth)/layout.tsx`, `src/app/{globals,layout}.tsx`,
`public/{icon.svg,manifest.json,auth-testimonials/*.png}`,
`features/dashboard/{mobile/MobileHome,desktop/DesktopHome}.tsx`,
`supabase/migrations/{008_profiles_full_name,010_profiles_last_login}.sql`, `supabase/config.toml`, `src/middleware.ts`.

## Out of scope
Password reset, email verification flows, MFA.
