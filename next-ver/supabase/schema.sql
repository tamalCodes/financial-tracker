-- Financial Tracker — schema (next-ver)
--
-- BEST-EFFORT, reverse-engineered from the queries in src/lib/api/* and src/app/api/*.
-- This is NOT a verified dump. Before trusting it:
--   1. Compare against the live Supabase project (Table editor / `supabase db dump`).
--   2. Regenerate types: `supabase gen types typescript --project-id <ref> > src/lib/supabase/database.types.ts`
--      then delete the hand-written Database type if it diverges.
--
-- Conventions observed:
--   * Every table is per-user via user_id (auth.users.id). Queries always filter user_id.
--   * "month" / "start_month" are text 'YYYY-MM-01'.
--   * monthly_balances has a unique (user_id, month) — code catches Postgres 23505 on insert.

create extension if not exists "pgcrypto";

-- credits (income) -----------------------------------------------------------
create table if not exists public.credits (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  month               text not null,                       -- 'YYYY-MM-01'
  description         text not null,
  amount              numeric not null,
  carry_forward       boolean not null default false,
  carried_from_month  text,                                -- set when auto-carried
  created_at          timestamptz not null default now()
);
create index if not exists credits_user_month_idx on public.credits (user_id, month);

-- expenses --------------------------------------------------------------------
create table if not exists public.expenses (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  month               text not null,
  description         text not null,
  amount              numeric not null,
  carry_forward       boolean not null default false,
  carried_from_month  text,
  created_at          timestamptz not null default now()
);
create index if not exists expenses_user_month_idx on public.expenses (user_id, month);

-- investments -----------------------------------------------------------------
create table if not exists public.investments (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  start_month         text not null,                       -- first active month
  description         text not null,
  amount              numeric not null,
  is_active           boolean not null default true,       -- soft-delete flag
  carry_forward       boolean default false,               -- nullable in code
  created_at          timestamptz not null default now()
);
create index if not exists investments_user_active_idx
  on public.investments (user_id, is_active, start_month);

-- monthly_balances ------------------------------------------------------------
create table if not exists public.monthly_balances (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  month             text not null,
  starting_balance  numeric not null,
  closing_balance   numeric not null,
  unique (user_id, month)
);

-- RLS: not enforced in code (queries scope by user_id). If you enable RLS, add
-- policies like:  using (auth.uid() = user_id)  on each table.
