-- 004_expense_tag — single free-form tag per expense (mobile edit modal).
-- One tag per payment (not the legacy `tags text[]`, which never shipped to the live DB).
-- Nullable text; short label. Run once against the live Supabase project (idempotent).

begin;

alter table public.expenses
  add column if not exists tag text;

commit;
