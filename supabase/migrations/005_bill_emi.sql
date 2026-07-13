-- 005_bill_emi — EMIs as pre-created installment rows on the bills ledger.
-- An EMI is added once and expands into one bill row per month for its whole
-- duration, all sharing an `emi_id`. Each row is a normal bill: paying it marks
-- that month paid and counts toward that month's spend (DECISIONS D14). One-off
-- bills leave every emi_* column null. Run once against the live project (idempotent).

begin;

alter table public.bills
  add column if not exists emi_id     uuid,    -- groups installments of one EMI
  add column if not exists emi_seq    integer, -- 1-based installment index within the EMI
  add column if not exists emi_months integer, -- total number of installments (duration)
  add column if not exists emi_total  numeric; -- total loan amount (display only)

-- Group lookup for progress aggregation across every month.
create index if not exists bills_user_emi_idx on public.bills (user_id, emi_id);

commit;
