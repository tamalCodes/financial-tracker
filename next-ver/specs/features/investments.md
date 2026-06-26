# Investments

Reverse-engineered from `src/app/api/investments/route.ts`, `lib/api/dashboard.ts`,
`features/dashboard/components/InvestmentForm.tsx`. Differs from credits/expenses: **no copy
on carry-forward**, **soft delete**, **no PUT**.

## Problem
Users record recurring or one-off investments. An investment reduces the balance and (if
`carry_forward`) counts every month from its `start_month` onward, without duplicating rows.

## Data model touched
`investments` table: `id, user_id, start_month, description, amount, is_active, carry_forward,
created_at`. Mutations adjust `monthly_balances.closing_balance`.

## API contract — `/api/investments`
- **POST** — `{ currentMonth, description, amount, carry_forward? }`. Inserts with
  `start_month = currentMonth`, `is_active = true`. → `{ item, balance }`.
  Balance delta **`-amount`**.
- **DELETE** — `?id=`; re-fetch (user-scoped) → 404 → **soft delete** (`is_active=false`).
  → `{ ok: true, balance }`. Balance delta **`+amount`** on the row's `start_month`.
- **No PUT** today.
- Errors: 400 / 401 / 404 / 429.
- `select`: `"id, description, amount, carry_forward, start_month, created_at, is_active"`.
- **TODO (migrate to standard)**: inlines old auth block, no `rateLimit`. Switch to
  `requireUser` + add `investments:{verb}` rate limits when touched.

## Carry-forward (NOT copied)
Read filter: `lte("start_month", currentMonth)` + `is_active=true`, then keep rows where
`carry_forward` is true OR `start_month === currentMonth`. One row spans months.

## UI / components
`InvestmentForm` (`"use client"`), `TransactionSection`/`TransactionList`. `useDashboardData`:
`upsertInvestment` / `removeInvestment`.

## Acceptance criteria
- [ ] POST subtracts amount; DELETE (soft) adds it back, both on `start_month`.
- [ ] carry_forward investment counts in all months ≥ start_month, exactly once each.
- [ ] non-carry investment counts only in its start_month.
- [ ] user_id scoping on all queries.

## Files to touch
`src/app/api/investments/route.ts`, `InvestmentForm.tsx`, `useDashboardData.ts`,
`lib/api/dashboard.ts` (filter logic).

## Out of scope
Returns/valuation tracking, sell flow, PUT/edit (add later).
