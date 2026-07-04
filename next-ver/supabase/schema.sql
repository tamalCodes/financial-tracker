-- Financial Tracker — schema (next-ver)
--
-- BEST-EFFORT, reverse-engineered from the queries in src/lib/api/* and src/app/api/*.
-- This is NOT a verified dump. Before trusting it:
--   1. Compare against the live Supabase project (Table editor / `supabase db dump`).
--   2. Regenerate types: `supabase gen types typescript --project-id <ref> > src/lib/supabase/database.types.ts`
--      then delete the hand-written Database type if it diverges.
--
-- Migrations: supabase/migrations/*.sql (001 = mobile redesign). This file reflects
-- post-migration state. Money model: cumulative "Left in bank" computed on read from
-- credits/expenses/investments minus paid bills — see specs/DATA_MODEL.md.
--
-- Conventions observed:
--   * Every table is per-user via user_id (auth.users.id). Queries always filter user_id.
--   * "month" is text 'YYYY-MM-01'.

create extension if not exists "pgcrypto";

-- credits (income) -----------------------------------------------------------
-- Per-month. Feeds earned_m and Left-in-bank. Carry-forward logic REMOVED in redesign
-- (columns retained for back-compat, ignored by code).
create table if not exists public.credits (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  month               text not null,                       -- 'YYYY-MM-01'
  description         text not null,
  amount              numeric not null,
  carry_forward       boolean not null default false,      -- DEPRECATED (unused)
  carried_from_month  text,                                -- DEPRECATED (unused)
  created_at          timestamptz not null default now()
);
create index if not exists credits_user_month_idx on public.credits (user_id, month);

-- expenses --------------------------------------------------------------------
-- Per-month. Feeds spent_m (with paid bills) and Left-in-bank. `category` drives the
-- mobile UI pill + AddSheet picker.
create table if not exists public.expenses (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  month               text not null,
  description         text not null,
  amount              numeric not null,
  category            text not null default 'other'
                       check (category in ('food','shopping','transport','health','groceries','other')),
  carry_forward       boolean not null default false,      -- DEPRECATED (unused)
  carried_from_month  text,                                -- DEPRECATED (unused)
  tags                text[] not null default '{}',        -- legacy free-form labels (optional)
  tag                 text,                                 -- single free-form tag (mobile edit modal)
  created_at          timestamptz not null default now()
);
create index if not exists expenses_user_month_idx on public.expenses (user_id, month);

-- investments -----------------------------------------------------------------
-- Per-month INVESTMENT FLOW (drives invested_m + Left-in-bank). Simplified in redesign:
-- plain per-month rows; recurring/soft-delete model REMOVED. Legacy columns deprecated.
-- NOTE: the Investments PANEL (holdings/sips/portfolio) is separate manual reference data.
create table if not exists public.investments (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  month               text not null,                       -- 'YYYY-MM-01' (new canonical)
  description         text not null,
  amount              numeric not null,
  start_month         text,                                -- DEPRECATED (was first active month)
  is_active           boolean not null default true,       -- DEPRECATED (was soft-delete)
  carry_forward       boolean default false,               -- DEPRECATED
  created_at          timestamptz not null default now()
);
create index if not exists investments_user_month_idx on public.investments (user_id, month);

-- bills (Bills & EMIs) --------------------------------------------------------
-- Separate ledger from expenses. Paying a bill does NOT create an expense, but a PAID
-- bill counts toward spent_m and Left-in-bank. No overdue state.
create table if not exists public.bills (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  month       text not null,                               -- 'YYYY-MM-01'
  name        text not null,
  amount      numeric not null,
  due_date    text,                                         -- display string, e.g. '25 Jun'
  paid        boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists bills_user_month_idx on public.bills (user_id, month);

-- holdings (manual portfolio: FD + mutual funds) ------------------------------
-- Display-only reference; does NOT affect the money model.
create table if not exists public.holdings (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  kind           text not null check (kind in ('fd','mutual_fund')),
  name           text not null,
  current_value  numeric not null default 0,
  rate           numeric,                                   -- FD only (e.g. 7.10)
  maturity_date  text,                                       -- FD only, display string
  created_at     timestamptz not null default now()
);
create index if not exists holdings_user_idx on public.holdings (user_id);

-- sips (manual portfolio: active SIPs) ----------------------------------------
-- Static reference; not cumulative; does NOT affect the money model.
create table if not exists public.sips (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  monthly     numeric not null,
  due_date    text,
  paid_total  numeric not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists sips_user_idx on public.sips (user_id);

-- portfolio_totals (manual hero number) ---------------------------------------
create table if not exists public.portfolio_totals (
  user_id  uuid primary key references auth.users (id) on delete cascade,
  value    numeric not null default 0
);

-- profiles (per-user; opening bank balance set once at signup) -----------------
-- opening_balance is NOT income; it is folded into the cumulative Left-in-bank
-- read (opening + credits − expenses − paid bills − investments). See migration 002.
create table if not exists public.profiles (
  user_id         uuid primary key references auth.users (id) on delete cascade,
  opening_balance numeric not null default 0,
  created_at      timestamptz not null default now()
);

-- monthly_balances — DEPRECATED ----------------------------------------------
-- Kept for back-compat; unused since the mobile redesign. Left-in-bank is computed
-- on read (cumulative), so no closing/starting balance is maintained.
create table if not exists public.monthly_balances (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  month             text not null,
  starting_balance  numeric not null,
  closing_balance   numeric not null,
  unique (user_id, month)
);

-- RLS — enabled in migration 003. Every per-user table has a single owner policy:
--   alter table public.<t> enable row level security;
--   create policy <t>_owner on public.<t> for all to authenticated
--     using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Tables: credits, expenses, investments, bills, holdings, sips, portfolio_totals,
-- profiles, monthly_balances. The server client carries the user's auth cookie, so
-- auth.uid() resolves; routes additionally scope by user_id (belt-and-suspenders).

-- profiles seeded at signup by a SECURITY DEFINER trigger (bypasses RLS, runs before
-- the user has a session). Opening balance comes from auth user metadata:
--   create function public.handle_new_user() ... security definer:
--     insert into public.profiles (user_id, opening_balance)
--     values (new.id, coalesce((new.raw_user_meta_data->>'opening_balance')::numeric, 0));
--   create trigger on_auth_user_created after insert on auth.users
--     for each row execute function public.handle_new_user();
