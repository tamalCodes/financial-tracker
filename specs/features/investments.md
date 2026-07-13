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

`sip_payments` table (migration `011_sip_payments.sql`): `id, user_id, sip_id, month, amount,
debited_balance, created_at`, with a `unique (sip_id, month)` guard (one payment per SIP per month)
and `sip_payments_user_month_idx` on `(user_id, month)`. RLS `sip_payments_owner` scopes all rows to
`auth.uid()`. This is a ledger of recorded SIP batches; it does **not** itself feed the money model —
the optional cash-flow effect is a separate `investments` row (see below).

`record_sip_payments(p_month text, p_sip_ids uuid[], p_debit_balance boolean)` — `SECURITY`-scoped
plpgsql RPC returning `table(total numeric, paid_count integer)`. Validates auth + `YYYY-MM-01` month
format + non-empty selection, then, per selected SIP under a `for update` lock: rejects a duplicate
month, inserts the `sip_payments` row, adds `sips.monthly` to `sips.paid_total`, and increments (or
creates) the matching `mutual_fund` holding by name. It then upserts the delta into `portfolio_totals`
and, when `p_debit_balance`, inserts one `investments` flow row (`description = 'SIPs'`). Raises if any
requested id was not found (count mismatch).

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

- Request: `{ currentMonth, sipIds, debitBalance }` (validated by `sipPaymentCreateSchema`). Response
  `{ payment: { total, paid_count } | null }` — the single RPC result row. The route is a thin wrapper:
  `requireUser` then one `supabase.rpc("record_sip_payments", ...)` call; a raised RPC error surfaces as
  **400** with its message. Rate limit `sip-payments:post` **12/60s**.
- `record_sip_payments` atomically writes one `sip_payments` row per selected SIP/month, increments
  `sips.paid_total`, increments matching mutual-fund holding (or creates it), and increments hero value.
- Debit on writes one `investments` flow row, increasing Invested and lowering Left-in-bank. Debit off
  updates portfolio reference only — for money not yet debited.
- The `unique (sip_id, month)` constraint plus the per-SIP duplicate check make re-recording a SIP in
  the same month raise `One or more selected SIPs are already recorded for this month`.

## UI / components (mobile)
AddSheet **Invest** mode (amount + fund) → `POST /api/investments`. Investments adds **Manage**
(holdings/SIPs/hero value CRUD) and **Record this month** in Active SIPs. Manage uses segmented
holding-type controls instead of a native select, expands the selected holding/SIP editor directly
below its row, and reuses the expense `AmountField` calculator + operator bar for add and edit values.
Both the **Manage portfolio** (PortfolioManager) and **Record SIPs** (SipPaymentSheet) modals share
the `Overlay`/`CARD` chrome exported from `SipPaymentSheet.tsx`. `Overlay` is **responsive**: a bottom
sheet on mobile that becomes a centered dialog on desktop (`useMediaQuery("(min-width: 1024px)")`) —
it clones its card child to override the top-only radius with a full 24px radius, `max-height:
calc(100vh - 48px)` with scroll, and centers the overlay with 24px padding. `Overlay` takes an optional
`desktopWidth` (default 500) so a modal can go wider on desktop; PortfolioManager passes `860`.

**Manage portfolio layout.** PortfolioManager tracks a `loading` state (true until the first
`/api/portfolio-panel` fetch resolves) and renders **shimmer skeleton rows** (`Skeleton` + `.ft-skel`)
in place of the old empty-then-populated flash. On the Holdings/SIPs tabs:
- **Desktop (≥1024px)** — two-column grid: the scrollable item list on the left (glassy rows, no inline
  expansion) and the **add/edit form in a sticky right panel**. Tapping **Edit** on a row swaps the
  panel to that item's edit form (row highlighted); otherwise the panel shows the add form.
- **Mobile** — single column: list on top with the edit form expanding **inline** beneath the tapped
  row, add form under a divider at the bottom.
The **Value** tab is single-column on both, with a skeleton for the value input while loading.

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
