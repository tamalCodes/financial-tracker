# Financial Tracker

Next.js PWA for personal finance tracking.
The app lives at the repository root.

## Quick Setup

Clone, install, and create local env:

```bash
npm ci
cp .env.example .env
```

Fill `.env` from Supabase:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Run local app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Supabase

Run local Supabase when needed:

```bash
npm run db:start
npm run db:reset
```

Apply migrations to linked remote project:

```bash
supabase db push --linked
```

Operator controls:

```bash
npm run ops:logout-all
npm run ops:purge-caches
```

`ops:logout-all` bumps `app_control.session_epoch`, so all sessions issued before that time must re-login.
`ops:purge-caches` bumps `app_control.purge_version`, so clients wipe service workers/caches and reload.

## Verify

Run full local verification:

```bash
npm run verify
npm audit --omit=dev
gitleaks detect --source . --redact --no-banner
```

`npm run verify` runs typecheck, lint, tests, and build.

## Vercel

This repo is linked to Vercel through `.vercel/project.json`.
The Vercel project's **Root Directory** must be the repository root (empty / `./`).

Deploy production from the repository root:

```bash
vercel --prod
```

Required Vercel production env vars:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Never commit real env values.

## OAuth

The auth screen starts Google and Apple OAuth through Supabase and returns through
`/auth/callback`. Enable both providers in Supabase Auth, store their provider credentials there,
and allow `http://localhost:3000/auth/callback` plus each production
`https://<origin>/auth/callback` URL. Provider credentials never belong in this repository.

## Agent Files

This repo intentionally keeps Claude/Codex project instructions and hooks:

- Root `AGENTS.md`
- Root `CLAUDE.md`
- `.codex/`
- `.claude/`

They are not secrets.
They document the workflow and help a new machine behave like the current one.

Graphify generated outputs are local navigation artifacts.
`graphify-out/` is ignored and should stay untracked unless deliberately publishing a sanitized graph.

## Public Repo Hygiene

Before making the repo public or cutting a release:

```bash
git branch -r
gitleaks detect --source . --redact --no-banner
npm audit --omit=dev
git status --ignored --short .env .next graphify-out
```

Expected:

- No stale remote branches.
- No Gitleaks findings in Git history.
- No production secrets tracked.
- `.env`, `.next/`, and `graphify-out/` ignored.
- `.env` excluded from Vercel uploads by `.vercelignore`.

## Specs

Start with `specs/INDEX.md`.
Specs document the app as built.
Keep affected specs current with code changes.

## Notes

The service worker exists only for PWA installability and legacy cache cleanup.
It does not cache authenticated API responses or app bundles.

Security-sensitive work left lives in `specs/features/pwa-ship-checklist.md`.
