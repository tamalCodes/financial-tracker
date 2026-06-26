# Credits (income)

Reverse-engineered from `src/app/api/credits/route.ts` (canonical reference route),
`lib/api/dashboard.ts`, `features/dashboard/components/CreditForm.tsx`.

## Problem
Users record income for a month and see it added to that month's balance. Recurring income
(salary) can carry forward automatically into future months.

## Data model touched
`credits` table (see DATA_MODEL): `id, user_id, month, description, amount, carry_forward,
carried_from_month, created_at`. Mutations adjust `monthly_balances.closing_balance`.

## API contract — `/api/credits`
- **POST** — create. Body `{ currentMonth, description, amount, carry_forward? }`.
  → `{ item, balance }`. Balance delta **`+amount`**.
- **PUT** — update. Body `{ id, description, amount, carry_forward? }`.
  Re-fetches existing (user-scoped) → 404 if missing. → `{ item, balance }`.
  Balance delta **`newAmt − oldAmt`** on existing row's `month`.
- **DELETE** — `?id=`. Re-fetch → 404 if missing → hard delete. → `{ ok: true, balance }`.
  Balance delta **`-amount`**.
- Errors: 400 missing fields / insert error, 401 unauth, 404 not found, 429 limited.
- Rate limit: `credits:{post,put,delete}` `{ limit: 30, windowMs: 60_000 }`.
- Auth: `requireUser(supabase)` inside try/catch.
- `select`: `"id, description, amount, created_at, carry_forward"`.

## Carry-forward
On `loadDashboardData`, `carry_forward=true` credits in the previous month are copied into the
current month (`carried_from_month` set, deduped by `description|amount`).

## UI / components
`CreditForm` (`"use client"`); list via `TransactionSection`/`TransactionList`. Data through
`useDashboardData` — `upsertCredit` (optimistic) / `removeCredit`, `setBalance` from response.

## Acceptance criteria
- [ ] Create/update/delete adjust closing balance with correct sign.
- [ ] All queries scoped by `user_id`.
- [ ] carry_forward credits appear next month, not duplicated on reload.

## Files to touch
`src/app/api/credits/route.ts`, `features/dashboard/components/CreditForm.tsx`,
`features/dashboard/hooks/useDashboardData.ts`, `lib/api/dashboard.ts` (carry-forward).

## Out of scope
Credit categories, attachments, multi-currency.
