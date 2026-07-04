-- 006_perf_leftinbank_sum — push the cumulative "Left in bank" math into Postgres.
--
-- Before: loadDashboardData read EVERY historical amount row (credits/expenses/
-- investments/paid bills across all months <= current) into the app and summed in
-- JS — O(all history) rows over the wire on every dashboard load.
-- After: one RPC returns the scalar; Postgres sums against the (user_id, month)
-- indexes. See specs/DATA_MODEL.md (money model) and lib/api/dashboard.ts.
--
-- RLS-safe: security invoker + scoped to auth.uid() (the SSR client carries the
-- user's auth cookie, so auth.uid() resolves). Run once against the live project
-- (idempotent).

begin;

-- Supporting indexes ---------------------------------------------------------
-- Paginated newest-first expense reads (loadDashboardData: range + order by
-- created_at desc within a month). Avoids a sort on top of the index scan.
create index if not exists expenses_user_month_created_idx
  on public.expenses (user_id, month, created_at desc);

-- Only PAID bills feed the cumulative sum; a partial index keeps it tight.
create index if not exists bills_user_paid_month_idx
  on public.bills (user_id, month) where paid;

-- (user_id, month) composites for credits/expenses/investments/bills and the
-- (user_id, emi_id) group index already exist (schema.sql + migration 005).

-- Cumulative Left-in-bank ----------------------------------------------------
-- NOTE: `month` column type is inconsistent across tables in the live DB (some
-- `date`, some `text` 'YYYY-MM-01'). `month::date <= p_month::date` compares
-- correctly regardless. The (user_id, month) index still serves the user_id prefix.
create or replace function public.cumulative_left_in_bank(p_month text)
returns numeric
language sql
stable
security invoker
set search_path = public
as $$
  select
    coalesce((select opening_balance from public.profiles
        where user_id = auth.uid()), 0)
    + coalesce((select sum(amount) from public.credits
        where user_id = auth.uid() and month::date <= p_month::date), 0)
    - coalesce((select sum(amount) from public.expenses
        where user_id = auth.uid() and month::date <= p_month::date), 0)
    - coalesce((select sum(amount) from public.bills
        where user_id = auth.uid() and paid and month::date <= p_month::date), 0)
    - coalesce((select sum(amount) from public.investments
        where user_id = auth.uid() and month::date <= p_month::date), 0);
$$;

grant execute on function public.cumulative_left_in_bank(text) to authenticated;

commit;
