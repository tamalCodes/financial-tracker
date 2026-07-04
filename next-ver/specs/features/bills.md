# Bills & EMIs

Reverse-engineered from `src/app/api/bills/route.ts`, `src/app/api/emis/route.ts`,
`lib/api/schemas.ts`, `lib/api/dashboard.ts`, `features/dashboard/mobile/{AddSheet,BillsEmis,
useFinance}.tsx`, migration `005_bill_emi.sql`. Decisions: D14 (bills), D17 (EMIs).

## Problem
Track recurring/one-off obligations (rent, subscriptions, loan EMIs) on their **own ledger**,
separate from expenses. A **paid** bill counts toward that month's spend and cumulative
Left-in-bank (D14); an unpaid bill is a future obligation and is excluded. Paying a bill never
creates an expense row, and bills never appear in Recent payments. **No overdue state.**

## Data model — `bills` table
`id, user_id, month, name, amount, due_date (text, e.g. '25 Jun'), paid (bool), created_at`
+ EMI columns (migration 005): `emi_id (uuid), emi_seq (int, 1-based), emi_months (int),
emi_total (numeric)`. Index `bills_user_emi_idx (user_id, emi_id)`.
- **One-off bill:** every `emi_*` column null.
- **EMI:** N rows sharing one `emi_id`, one per month from the start month, `emi_seq` 1..N. Each
  row is a normal bill (D17).

## API contract

### `/api/bills` — one-off bills + installment pay/list
- **GET** `?month=` → `{ items: Bill[] }`, user-scoped, ordered by `due_date`. Returns both one-off
  bills and that month's EMI installment rows.
- **POST** `{ currentMonth, name, amount, due_date? }` → `{ item }`. One-off bill (`emi_*` null).
- **PATCH** `{ id, paid }` → `{ item }` — toggle paid. **This is also how an EMI installment is
  paid** (D17): no dedicated EMI-pay endpoint. Paying marks that month's row and adds `amount` to
  `spent_m`. 404 if not found.
- **DELETE** `?id=` → `{ ok: true }`.
- Rate limit `bills:{get 60, post/patch/delete 30}` per 60s. Auth `requireUser`, `.eq("user_id")`.

### `/api/emis` — create + roll up an installment plan
- **POST** `{ currentMonth, name, monthly, total, months }` → `{ emi_id, installments }`.
  Expands into `months` bill rows (one per month from `currentMonth`) in a single insert, all
  sharing a fresh `emi_id`; `emi_seq` 1..months, `amount = monthly`, `emi_total = total`,
  `emi_months = months`, `paid = false`, `due_date = null`. `months` ∈ 1..120.
  `monthly × months` may exceed `total` (interest) — `total` is **display only**, never summed
  into spend.
- **GET** → `{ items: EmiProgress[] }` — groups every EMI row by `emi_id` into
  `{ emi_id, name, monthly, total, months, paidCount, paidAmount, remainingCount, remainingAmount }`.
  Sorted active-first (something still due), then by name.
- Rate limit `emis:{post 15, get 60}` per 60s.

## UI / components (mobile)
- **AddSheet** — expense mode carries a **type toggle: Expense / Bill / EMI**. Bill → adds a one-off
  bill (`POST /api/bills`, optional due date). EMI → shows total-loan + duration fields above the
  monthly amount, then `POST /api/emis`. Title switches to "Add Bill" / "Add EMI".
- **BillsEmis** — card listing this month's bills. Unpaid row = icon + name + due + amount + **Pay**
  pill; paid row = green check + strikethrough + "Paid". "Paid this month" total recomputes.
  EMI rows show installment progress (from `GET /api/emis` rollup). Optimistic Pay → `PATCH`.
- **useFinance** — `addBill` / `addEmi` / `payBill` / `removeBill` + reload.

## Acceptance criteria
- [ ] Paid bill (incl. EMI installment) raises `spent_m` + reduces Left-in-bank; unpaid does not.
- [ ] Paying a bill creates no expense row; bills never show in Recent payments.
- [ ] `POST /api/emis` creates exactly `months` rows sharing one `emi_id`, seq 1..months.
- [ ] `GET /api/emis` rollup counts paid vs remaining correctly; `emi_total` never enters spend.
- [ ] No overdue state anywhere. user_id scoping on all queries.

## Files to touch
`src/app/api/bills/route.ts`, `src/app/api/emis/route.ts`, `lib/api/schemas.ts`,
`lib/api/dashboard.ts`, `features/dashboard/mobile/{AddSheet,BillsEmis,useFinance}.tsx`,
`supabase/migrations/005_bill_emi.sql`.

## Out of scope
Overdue/late tracking, autopay, reminders/notifications, interest-schedule math (EMI total is
display-only).
