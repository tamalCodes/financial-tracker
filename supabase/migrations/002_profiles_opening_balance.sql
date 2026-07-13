-- Migration 002 — Profiles + opening bank balance (D-A)
-- Decision: specs/features/backend-wiring-checklist.md §1 D-A.
--
-- The money model is additive on top of a one-time opening bank balance the user
-- sets at signup (asked once, never again). Opening balance is NOT income — it is
-- stored on a per-user `profiles` row and folded into the cumulative "Left in bank"
-- read, so the `earned` tile stays truthful.
--
--   leftInBank = opening_balance + Σcredits − Σexpenses − ΣpaidBills − Σinvestments
--
-- Additive + non-destructive. Safe to re-run (idempotent guards).
-- RLS: not enforced in code (queries scope by user_id) — matches existing tables.

begin;

create table if not exists public.profiles (
  user_id         uuid primary key references auth.users (id) on delete cascade,
  opening_balance numeric not null default 0,
  created_at      timestamptz not null default now()
);

commit;
