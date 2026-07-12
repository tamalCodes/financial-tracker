# Investments

Reverse-engineered from `src/app/api/{investments,portfolio-panel,sip-payments}/route.ts`,
`features/dashboard/mobile/{AddSheet,Investments,PortfolioManager,SipPaymentSheet,useFinance,usePortfolioData}.tsx`.
Post mobile redesign — DECISIONS D15/D22 (recurring/soft-delete model **removed**).

## Two distinct concepts (D15)
1. **Investment FLOW** — this spec. Plain per-month rows that drive the **Invested** tile +
   Left-in-bank.
2. **Portfolio panel** — editable holdings/SIP plans and a monthly SIP-recording action. Portfolio
   reference updates on a recorded SIP; cash-flow effect is opt-in.

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

## Portfolio panel read — `GET /api/portfolio-panel`
The Investments panel loads its manual reference data in **one** request via `usePortfolioData`:
```
{ value: number, holdings: Holding[], sips: Sip[] }   // one Promise.all, user-scoped
```
Consolidates the old `/api/portfolio` + `/api/holdings` + `/api/sips` fan-out (three GETs → one) to
cut the mobile home's cold-start invocations — see ARCHITECTURE → "Initial-paint fan-out". Rate limit
`portfolio-panel:get` 60/60s. Per-resource routes power **Manage** (POST/PUT/DELETE holdings/sips,
PUT portfolio total).

## Record SIPs — `POST /api/sip-payments`
Active SIPs shows a monthly total and opens a payment sheet. User selects paid plans and chooses
**Deduct from Left in bank** (on by default).

- Request: `{ currentMonth, sipIds, debitBalance }`.
- `record_sip_payments` atomically writes one `sip_payments` row per selected SIP/month, increments
  `sips.paid_total`, increments matching mutual-fund holding (or creates it), and increments hero value.
- Debit on writes one `investments` flow row, increasing Invested and lowering Left-in-bank. Debit off
  updates portfolio reference only — for money not yet debited.

## UI / components (mobile)
AddSheet **Invest** mode (amount + fund) → `POST /api/investments`. Investments adds **Manage**
(holdings/SIPs/hero value CRUD) and **Record this month** in Active SIPs. Manage uses segmented
holding-type controls instead of a native select, expands the selected holding/SIP editor directly
below its row, and reuses the expense `AmountField` calculator + operator bar for add and edit values.

## Acceptance criteria
- [ ] POST/PUT/DELETE investment flows change `invested_m` + Left-in-bank; no balance row written.
- [ ] Recording SIPs updates portfolio reference atomically; only checked debit changes `invested_m`.
- [ ] A SIP cannot be recorded twice in same month.
- [ ] Per-month rows only — no `start_month`/`is_active`/`carry_forward`/soft-delete logic.
- [ ] user_id scoping on all queries.

## Files to touch
`src/app/api/{investments,portfolio-panel,sip-payments}/route.ts`, `lib/api/schemas.ts`,
`features/dashboard/mobile/{AddSheet,Investments,PortfolioManager,SipPaymentSheet,useFinance,usePortfolioData}.tsx`,
`supabase/migrations/011_sip_payments.sql`.

## Out of scope
Returns/valuation feeds, sell flow, undoing recorded SIP batches.
