# Dashboard

Reverse-engineered from `src/app/api/dashboard/route.ts`, `src/app/api/balances/route.ts`,
`lib/api/dashboard.ts`, `lib/api/balances.ts`, `features/dashboard/*`.

## Problem
Single per-month view: starting/closing balance + the month's credits, expenses, and active
investments. Users navigate months and set/edit the month's starting balance.

## Data model touched
Reads `monthly_balances`, `credits`, `expenses`, `investments` (all user-scoped, by month).
Writes `monthly_balances` (seed on rollover, self-heal closing, starting-balance edits).

## API contract
### `GET /api/dashboard?month=YYYY-MM-01`
- → `{ balance: MonthlyBalance|null, credits[], expenses[], investments[] }`.
- Runs carry-forward (credits+expenses), seeds balance from previous month if absent,
  self-heals `closing_balance`, filters investments. All in `loadDashboardData`.
- Errors: 400 missing month, 401 unauth, 500 unexpected (message-based status mapping).

### `POST /api/balances`
- `{ currentMonth, startingBalance }` → creates `monthly_balances` row (starting = closing =
  value) via `createStartingBalance`. → `{ ok: true }`.

### `PUT /api/balances`
- `{ currentMonth, startingBalance }` → `loadDashboardData` then `updateClosingBalance(...,
  { updateStarting: true })` → recomputes closing from full lists. → `{ ok: true, balance }`.

- Auth via `requireUser`; rate limits `dashboard:get` 60, `balances:{post,put}` 30 (per 60s).

## Balances invariant
`closing = starting + Σcredits − Σexpenses − Σinvestments` (DATA_MODEL). Hot-path mutations
use `applyBalanceDelta`; full edits use `updateClosingBalance`; reads self-heal drift.

## UI / components
`Dashboard.tsx` orchestrates. `useDashboardState` (month nav, `YYYY-MM-01`, can't go past
current month, starting-balance form state). `useDashboardData(month)` fetches + holds lists,
optimistic `upsert*/remove*`, `reload`. Components: `BalancePanel`, `MonthHeader`,
`StartingBalanceModal`, `TransactionSection`, `TransactionList`, `*Form`.

## Acceptance criteria
- [ ] Month with no balance seeds from previous month's closing.
- [ ] Stored closing self-heals to match recomputed value.
- [ ] Cannot navigate to a future month.
- [ ] Editing starting balance recomputes closing from current lists.

## Files to touch
`src/app/api/dashboard/route.ts`, `src/app/api/balances/route.ts`, `lib/api/dashboard.ts`,
`lib/api/balances.ts`, `features/dashboard/Dashboard.tsx` + `hooks/` + `components/`.

## Out of scope
Charts/analytics, multi-month reports, export.
