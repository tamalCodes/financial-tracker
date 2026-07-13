# Dashboard

Reverse-engineered from `src/app/api/dashboard/route.ts`, `lib/api/dashboard.ts`, `lib/api/emis.ts`,
`features/dashboard/mobile/*`, `features/dashboard/hooks/useDashboardData.ts`. Post mobile redesign —
money model in DATA_MODEL; DECISIONS D13/D14/D16/D20.

> **Responsive:** this doc describes the **mobile** home. On viewports ≥ 1024px the same data
> hooks/cards reflow into a two-column dashboard with a monthly-trend chart — see
> [desktop-dashboard.md](desktop-dashboard.md). `Dashboard.tsx` branches on `useMediaQuery`.

## Problem
Per-month home view: the cumulative **Left in bank** hero + three per-month tiles
(Earned/Spent/Invested) + the month's credits, expenses (page 1), investments, and bills.
Users step months; there is **no starting/closing balance** to set — `monthly_balances` and the
whole `/api/balances` route are gone (D13).

## Data model touched (read-only)
Reads `profiles.opening_balance`, `credits`, `expenses`, `investments`, `bills` — all user-scoped.
Cumulative reads sweep every month ≤ current; the per-month display reads the current month only.
**Writes nothing** — mutations live on the resource routes and have no balance side-effect.

## API contract — `GET /api/dashboard?month=YYYY-MM-01`
Returns (`loadDashboardData`):
```
{
  summary: { leftInBank, earned, spent, invested },   // numbers
  credits:  Credit[],                                  // current month
  expenses: Expense[],                                 // page 1 only, newest-first (D20)
  expensesTotal: number,                               // full-month count
  loggedTotal:   number,                               // full-month Σ expenses
  investments: Investment[],                           // current month
  bills: Bill[],                                       // current month (one-off + EMI installments)
  emis: EmiProgress[],                                 // EMI rollup across ALL months (perf: folded in)
}
```
- `leftInBank = opening_balance + Σ_{m ≤ month}(earned − spent − paidBills − invested)` — cumulative
  (D16), summed **server-side** by the `cumulative_left_in_bank` RPC (migration 006; JS fallback in
  `cumulativeLeftInBankJs`). `spent` includes **paid bills** (D14). Tiles are current-month only and reset monthly.
- Expenses are **paginated** (D20): the payload carries page 1; the Spent tile / "N this month" use
  `expensesTotal`/`loggedTotal` from a separate amounts-only sweep, not the page. Pages 2+ via
  `GET /api/expenses?page=`.
- `emis` is the all-months EMI progress rollup (`loadEmiProgress`, `lib/api/emis.ts`), folded into the
  payload so the mobile home skips a separate `GET /api/emis` on first paint (see ARCHITECTURE →
  "Initial-paint fan-out"). It refreshes on every `reload()`.
- Errors: 400 missing month, 401 unauth, 500 unexpected. Rate limit `dashboard:get` 60/60s. Auth via
  `requireUser`.

> Related feature routes (own specs): [expenses.md](./expenses.md), [bills.md](./bills.md) (+ EMIs),
> [credits.md](./credits.md), [investments.md](./investments.md).

## UI / components (mobile)
`MobileHome` composes: `GreetingHeader` → `HeroBalance` (Left-in-bank + 3 tiles) → `Transactions`
(recent payments) → `BillsEmis` → `Investments`, overlaid by `FloatingActionBar` + `AddSheet` +
`EditSheet` + `Toaster`. `useFinance(month)` fetches `/api/dashboard`, holds lists + summary,
optimistic add/edit/remove per resource, `reload()`. Month nav can't go past the current month.
`FloatingActionBar` is an opaque, bordered surface with flat semantic-tinted action buttons; it
does not use backdrop blur or a drop shadow on mobile.

## Acceptance criteria
- [ ] `leftInBank` cumulates across months and starts from `opening_balance`.
- [ ] Spent tile = Σ current-month expenses + Σ paid bills that month.
- [ ] Tiles isolated to the current month; no read/write of `monthly_balances`.
- [ ] Cannot navigate to a future month.
- [ ] `expensesTotal`/`loggedTotal` reflect the whole month, not page 1.

## Files to touch
`src/app/api/dashboard/route.ts`, `lib/api/dashboard.ts`, `lib/api/emis.ts`,
`supabase/migrations/006_perf_leftinbank_sum.sql`,
`features/dashboard/mobile/{MobileHome,HeroBalance,GreetingHeader,useFinance}.tsx`.

## Out of scope
Charts/analytics, multi-month reports, export. Starting/closing balance (removed — D13).
