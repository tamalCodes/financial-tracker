# Backend-complete Checklist — close the remaining server-side gaps

Goal: a fully production-ready backend. Companion to [backend-wiring-checklist.md](./backend-wiring-checklist.md)
(which is mostly frontend integration). This doc tracks the **server-only** closeout.

Status: `[x]` done · `[~]` in progress · `[ ]` not started · `⏸` blocked (needs infra/creds).

**Decisions locked (2026-06-30):** RLS = enable · live-DB tests = add runner · CI = add · migration apply = via CLI
(downgraded to **you apply** — no CLI/Docker/DDL creds in this environment, see §E).

---

## A. RLS — database-level ownership (migration 003) ✅
- [x] `supabase/migrations/003_rls.sql`: `enable row level security` on every per-user table
      (credits, expenses, investments, bills, holdings, sips, portfolio_totals, profiles, monthly_balances)
      via a `do $$` loop.
- [x] Per-table owner policy `<t>_owner ... for all to authenticated using (auth.uid() = user_id)
      with check (auth.uid() = user_id)`. Idempotent (drop-if-exists). portfolio_totals/profiles keyed on `user_id` PK.
- [x] Mirrored into `schema.sql`.
- [x] Server client carries the user's auth cookie → `auth.uid()` resolves; routes still scope `.eq("user_id")`
      (belt-and-suspenders). **Needs live-DB verification once 003 applied (§E + §D integration suite).**

## B. Signup opening balance under RLS (trigger, replaces route upsert) ✅
- [x] `003_rls.sql`: `handle_new_user()` `SECURITY DEFINER` trigger on `auth.users` AFTER INSERT →
      `insert into public.profiles (user_id, opening_balance)` from
      `new.raw_user_meta_data->>'opening_balance'` (coalesce 0), `on conflict do nothing`.
- [x] `signup/route.ts`: passes `options: { data: { opening_balance } }` to `signUp`; route-level
      profiles upsert removed (trigger owns it).
- [x] `routes.test.ts` signup cases updated → assert `signUp` called with `opening_balance` metadata;
      negative → 400 (and signUp not called) + default-0 retained.

## C. CI — GitHub Actions verify gate (Track B #4) ✅
- [x] `.github/workflows/verify.yml`: push (main) + PR → Node 20, `npm ci`, `npm run verify`,
      working dir `next-ver`; SUPABASE_URL/ANON_KEY from secrets with safe fallbacks.

## D. Live-DB integration tests (Track B #6) ✅ written — runs only with Docker+CLI
- [x] `supabase/config.toml` (local config; email confirmations off so signup yields a session).
- [x] `supabase/seed.sql` (users created in test setup via auth admin API — documented why).
- [x] `vitest.integration.config.ts` + `src/lib/api/dashboard.itest.ts` (matches `*.itest.ts`, excluded
      from the unit run; `describe.skipIf` when DB env absent).
- [x] `package.json`: `test:integration`, `db:start`, `db:reset`.
- [x] Integration suite asserts: trigger seeds opening_balance · `leftInBank` = opening + earned − spent ·
      RLS isolates users (B can't read A's rows). **Not executed here — no Docker/CLI (§E).**

## E. Apply migrations to live Supabase ✅ (2026-06-30)
- [x] Linked project `zbjqcdkjgycxqqfazscl`; `supabase db push` applied `002` + `003` (001 already live).
      RLS, `profiles`, and the `handle_new_user` trigger now on the live project.
- [ ] **Smoke the live app:** login → dashboard must still load rows (proves the server client carries the
      user JWT so `auth.uid()` resolves under RLS). If dashboard goes empty after this, RLS/JWT wiring is wrong.

## F. Verify
- [x] `npm run verify` green — 35 unit tests · typecheck (incl. `.itest.ts`) · lint · build (2026-06-30).
- [ ] (after E) integration suite green against live/local DB.
