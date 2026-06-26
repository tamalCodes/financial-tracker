# Expenses

Reverse-engineered from `src/app/api/expenses/route.ts`, `lib/api/dashboard.ts`,
`features/dashboard/components/ExpenseForm.tsx`. Mirrors credits with **opposite** balance signs.

## Problem
Users record spending for a month; it reduces that month's balance. Recurring expenses (rent,
subscriptions) carry forward automatically.

## Data model touched
`expenses` table: `id, user_id, month, description, amount, carry_forward,
carried_from_month, created_at`. Mutations adjust `monthly_balances.closing_balance`.

## API contract — `/api/expenses`
- **POST** — `{ currentMonth, description, amount, carry_forward? }` → `{ item, balance }`.
  Balance delta **`-amount`**.
- **PUT** — `{ id, description, amount, carry_forward? }`; re-fetch → 404. → `{ item, balance }`.
  Balance delta **`oldAmt − newAmt`** (note: opposite of credits).
- **DELETE** — `?id=`; re-fetch → 404 → hard delete → `{ ok: true, balance }`.
  Balance delta **`+amount`**.
- Errors: 400 / 401 / 404 / 429.
- `select`: `"id, description, amount, created_at, carry_forward, carried_from_month"`.
- **TODO (migrate to standard)**: this route still inlines the old auth block and has **no
  `rateLimit`**. When touched, switch to `requireUser` + add `expenses:{verb}` rate limits
  per CONVENTIONS §1/§3.

## Carry-forward
Same as credits: `carry_forward=true` rows copied from previous month, deduped by
`description|amount`, `carried_from_month` set. See `ensureCarryForwardExpenses`.

## UI / components
`ExpenseForm` (`"use client"`), `TransactionSection`/`TransactionList`. `useDashboardData`:
`upsertExpense` / `removeExpense`.

## Acceptance criteria
- [ ] Create/update/delete adjust closing balance with correct (negative-leaning) sign.
- [ ] user_id scoping on all queries.
- [ ] carry_forward expenses appear next month, no dupes on reload.

## Files to touch
`src/app/api/expenses/route.ts`, `ExpenseForm.tsx`, `useDashboardData.ts`, `lib/api/dashboard.ts`.

## Out of scope
Expense categories/budgets, receipts, split transactions.
