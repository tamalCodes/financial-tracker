# Backend-complete Checklist — close the remaining server-side gaps

Goal: a fully production-ready backend. Companion to [backend-wiring-checklist.md](./backend-wiring-checklist.md)
(which is mostly frontend integration). This doc tracks the **server-only** closeout.

Status: `[x]` done · `[~]` in progress · `[ ]` not started · `⏸` blocked (needs infra/creds).

**Decisions locked (2026-06-30):** RLS = enable · live-DB tests = add runner · CI = add · migration apply = via CLI
(downgraded to **you apply** — no CLI/Docker/DDL creds in this environment, see §E).

---

## A. RLS — database-level ownership (migration 003)
- [ ] `supabase/migrations/003_rls.sql`: `enable row level security` on every public table
      (credits, expenses, investments, bills, holdings, sips, portfolio_totals, profiles; monthly_balances too).
- [ ] Per-table policies `using (auth.uid() = user_id)` + `with check (auth.uid() = user_id)` for
      select/insert/update/delete. portfolio_totals/profiles keyed on `user_id` (PK).
- [ ] Mirror RLS into `schema.sql`.
- [ ] Verify the server client carries the user JWT so `auth.uid()` resolves (createServerClient reads the
      auth cookie → authenticated as the user). Routes already scope `.eq("user_id")` → RLS is belt-and-suspenders.

## B. Signup opening balance under RLS (trigger, replaces route upsert)
At signup there is no session yet, so an anon-client `profiles` insert is blocked by RLS. Move it to a trigger.
- [ ] `003_rls.sql` (or its own block): `handle_new_user()` `SECURITY DEFINER` trigger on `auth.users`
      AFTER INSERT → `insert into public.profiles (user_id, opening_balance)` reading
      `new.raw_user_meta_data->>'opening_balance'` (default 0).
- [ ] `signup/route.ts`: pass `options: { data: { opening_balance } }` to `supabase.auth.signUp`;
      drop the route-level `profiles` upsert (trigger owns it).
- [ ] Update `routes.test.ts` signup cases → assert `signUp` called with `opening_balance` in metadata
      (instead of a profiles upsert); keep validation (negative → 400) + default-0 cases.

## C. CI — GitHub Actions verify gate (Track B #4)
- [ ] `.github/workflows/verify.yml`: on push + PR → Node 20, `npm ci`, `npm run verify`
      (typecheck · lint · test · build). Working dir `next-ver`.

## D. Live-DB integration tests (Track B #6) — WRITTEN, runs only with Docker+CLI
- [ ] `supabase/config.toml` (local project config) so `supabase start` works.
- [ ] `supabase/seed.sql` — deterministic fixtures (one user, a few credits/expenses/bills) for assertions.
- [ ] Vitest integration project (separate from unit): `vitest.integration.config.ts` + `*.itest.ts`
      hitting a real local Supabase via the connection string. Skipped automatically when no DB env is set.
- [ ] `package.json` scripts: `test:integration`, `db:start`, `db:reset`.
- [ ] One integration test proving the real schema + RLS: a user can read only their own rows; opening
      balance flows into `leftInBank`.

## E. Apply migrations to live Supabase ⏸ (blocked — needs creds/CLI)
- [ ] Apply `001` (if not already), `002_profiles_opening_balance.sql`, `003_rls.sql` to the live project.
- [ ] **Blocked here:** no supabase CLI, no Docker, project not linked, `.env` has only URL + anon key.
      To unblock, one of:
      - run locally: `supabase link --project-ref <ref>` then `supabase db push`;
      - or give a Postgres connection string / service-role key so a one-off apply script can run the SQL.

## F. Verify
- [ ] `npm run verify` green after B/C changes (unit suite + build).
- [ ] (after E) integration suite green against live/local DB.
