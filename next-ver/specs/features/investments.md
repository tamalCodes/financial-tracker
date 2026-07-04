# Investments

Reverse-engineered from `src/app/api/investments/route.ts`, `lib/api/dashboard.ts`,
`features/dashboard/mobile/{AddSheet,Investments,useFinance}.tsx`. Post mobile redesign —
DECISIONS D15 (recurring/soft-delete model **removed**).

## Two distinct concepts (D15)
1. **Investment FLOW** — this spec. Plain per-month rows that drive the **Invested** tile +
   Left-in-bank.
2. **Portfolio panel** — manual, display-only reference (`holdings`, `sips`, `portfolio_totals`);
   does **not** affect the money model. Separate routes/UI.

## Problem (flow)
Users log per-month money moved into investments; it feeds `invested_m` and reduces Left-in-bank.
No recurring model, no soft delete, no balance side-effect — computed on read (D13/D15).

## Data model touched
`investments` table: `id, user_id, month, description, amount, created_at`. Deprecated/unused:
`start_month, is_active, carry_forward` (old recurring/soft-delete model — D15). Feeds
`invested_m` + Left-in-bank.

## API contract — `/api/investments`
- **POST** — `{ currentMonth, description, amount }` → `{ item }`. Inserts `month = currentMonth`.
- **PUT** — `{ id, description, amount }` → `{ item }` (edit).
- **DELETE** — `?id=` → **hard delete** → `{ ok: true }`.
- **No `balance` in any response.** Errors 400/401/404/429. Rate limit
  `investments:{post,put,delete}` 30/60s. Auth `requireUser`, `.eq("user_id")`.
- `select`: `"id, description, amount, month, created_at"`.

## UI / components (mobile)
AddSheet **Invest** mode (amount + fund) → `POST /api/investments`. The Investments panel
(portfolio value + Holdings/SIPs) is manual reference — see DATA_MODEL `holdings`/`sips`/
`portfolio_totals`.

## Acceptance criteria
- [ ] POST/PUT/DELETE change `invested_m` + Left-in-bank; no balance row written.
- [ ] Per-month rows only — no `start_month`/`is_active`/`carry_forward`/soft-delete logic.
- [ ] user_id scoping on all queries.

## Files to touch
`src/app/api/investments/route.ts`, `lib/api/schemas.ts`, `lib/api/dashboard.ts`,
`features/dashboard/mobile/{AddSheet,Investments,useFinance}.tsx`.

## Out of scope
Returns/valuation feeds, sell flow. Portfolio panel CRUD (holdings/sips/portfolio) tracked
separately.
