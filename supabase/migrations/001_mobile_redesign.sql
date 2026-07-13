-- Migration 001 — Mobile redesign (cloth handoff)
-- Plan: specs/features/mobile-redesign.md (Phase B0).
--
-- Additive + non-destructive. Introduces the new money model:
--   * cumulative "Left in bank" replaces monthly_balances closing (table kept, deprecated)
--   * expenses gain a category enum
--   * investments become plain per-month flow rows (legacy recurring columns deprecated)
--   * new domains: bills (separate ledger), holdings + sips + portfolio_totals (manual portfolio)
--
-- Run once against the live Supabase project. Safe to re-run (idempotent guards).

begin;

-- 1) expenses.category -------------------------------------------------------
alter table public.expenses
  add column if not exists category text not null default 'other';
alter table public.expenses
  drop constraint if exists expenses_category_chk;
alter table public.expenses
  add constraint expenses_category_chk
  check (category in ('food','shopping','transport','health','groceries','other'));

-- 2) investments → per-month flow -------------------------------------------
-- Add `month`; backfill from legacy `start_month`. Legacy columns
-- (start_month, is_active, carry_forward) are now DEPRECATED — kept for back-compat,
-- ignored by code. New rows set `month`.
alter table public.investments
  add column if not exists month text;
update public.investments
  set month = start_month
  where month is null;
create index if not exists investments_user_month_idx
  on public.investments (user_id, month);

-- 3) bills (separate ledger; paid bills count toward monthly spend) ----------
create table if not exists public.bills (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  month       text not null,                 -- 'YYYY-MM-01'
  name        text not null,
  amount      numeric not null,
  due_date    text,                           -- display string, e.g. '25 Jun'
  paid        boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists bills_user_month_idx on public.bills (user_id, month);

-- 4) holdings (manual portfolio reference: FD + mutual funds) -----------------
create table if not exists public.holdings (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  kind           text not null check (kind in ('fd','mutual_fund')),
  name           text not null,
  current_value  numeric not null default 0,
  rate           numeric,                     -- FD only (e.g. 7.10)
  maturity_date  text,                          -- FD only, display string
  created_at     timestamptz not null default now()
);
create index if not exists holdings_user_idx on public.holdings (user_id);

-- 5) sips (manual portfolio reference: active SIPs; static, not cumulative) ---
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

-- 6) portfolio_totals (manual hero number, one row per user) -----------------
create table if not exists public.portfolio_totals (
  user_id  uuid primary key references auth.users (id) on delete cascade,
  value    numeric not null default 0
);

-- 7) monthly_balances — DEPRECATED ------------------------------------------
-- Left in place for back-compat; no longer read or written. The cumulative
-- "Left in bank" is computed on read from credits/expenses/investments/bills.
comment on table public.monthly_balances is
  'DEPRECATED since mobile redesign (001). Unused; cumulative balance computed on read.';

commit;
