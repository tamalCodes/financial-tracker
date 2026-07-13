-- 007_bills_autopaid_pagination — bills behave like expenses now.
--
-- A one-off bill is PAID the moment it is added (no Pay step): the row counts
-- toward that month's spend + cumulative Left-in-bank immediately (DECISIONS D14).
-- EMI installments are unaffected — they stay unpaid future obligations paid
-- month-by-month (DECISIONS D17), so this only touches `emi_id is null` rows.
--
-- Also adds the index backing newest-first, paginated one-off bill reads (the
-- Bills card now paginates like Recent payments). Run once; idempotent.

begin;

-- New one-off bills default to paid (added == already paid).
alter table public.bills alter column paid set default true;

-- Backfill: any existing unpaid ONE-OFF bill is now considered paid. EMI rows
-- (emi_id not null) are left untouched — their paid state tracks real progress.
update public.bills set paid = true where paid = false and emi_id is null;

-- Paginated newest-first one-off bill reads (loadDashboardData + GET /api/bills:
-- range + order by created_at desc within a month, one-off only). Partial index
-- keeps it tight and lets Postgres skip the emi_id filter + the sort.
create index if not exists bills_oneoff_user_month_created_idx
  on public.bills (user_id, month, created_at desc) where emi_id is null;

commit;
