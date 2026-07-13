# Bills & EMIs

Reverse-engineered from `src/app/api/bills/route.ts`, `src/app/api/emis/route.ts`,
`lib/api/{schemas,emis}.ts`, `lib/api/dashboard.ts`, `features/dashboard/mobile/{AddSheet,Bills,Emis,
BillEditSheet,MonthPicker,useFinance,data}.tsx`, `features/dashboard/types/types.ts`,
migrations `005_bill_emi.sql`, `007_bills_autopaid_pagination.sql`.
Decisions: D14 (bills), D17 (EMIs).

## Problem
Track recurring monthly obligations on their **own ledger**, separate from generic expenses —
the things you pay every month: gas, electricity, internet/wifi, recharge/mobile, rent, food,
family, insurance, emergency/medical. A one-off bill is **paid the moment it is added** (added ==
already paid — like an expense): it counts toward that month's spend and cumulative Left-in-bank
immediately (D14). **No Pay step, no unpaid state, no overdue state** for one-off bills. Paying a
bill never creates an expense row, and bills never appear in Recent payments.

EMIs are the exception: an EMI expands into future installment rows that stay **unpaid** and are
paid one month at a time via the Pay pill (D17) — those are genuine future obligations.

## Data model — `bills` table
`id, user_id, month, name, amount, due_date (text, e.g. '25 Jun'), paid (bool, default true),
created_at` + EMI columns (migration 005): `emi_id (uuid), emi_seq (int, 1-based),
emi_months (int), emi_total (numeric)`.
- Indexes: `bills_user_emi_idx (user_id, emi_id)` (EMI rollup), `bills_user_paid_month_idx
  (user_id, month) where paid` (cumulative sum, migration 006), `bills_oneoff_user_month_created_idx
  (user_id, month, created_at desc) where emi_id is null` (one-off pagination, migration 007).
- **One-off bill:** every `emi_*` column null; inserted with `paid = true` (migration 007 also
  backfilled existing one-off rows to paid and set the column default to true).
- **EMI:** N rows sharing one `emi_id`, one per month from the start month, `emi_seq` 1..N,
  inserted `paid = false`. Each row is a normal bill (D17).
- **Keyword → icon** (`data.ts` `billIconFor`): the bill name is matched against keyword regexes
  (electricity, wifi/internet, gas, recharge/mobile, rent/housing, food/groceries, family,
  insurance, medical/emergency, AI subscriptions) to pick a 20×20 stroke icon; unmatched → generic
  card icon.

## API contract

### `/api/bills` — one-off bills (paginated) + installment pay
- **GET** `?month=&page=&pageSize=` → `{ items: Bill[], total }`, user-scoped, **one-off bills only**
  (`emi_id is null`), newest-first (`created_at desc`), paginated (`BILLS_PAGE_SIZE = 6`). Page 1
  ships inside `/api/dashboard`; this serves pages 2+. `total` = full-month one-off count.
- **POST** `{ currentMonth, name, amount, due_date? }` → `{ item }`. One-off bill (`emi_*` null),
  inserted **`paid = true`** — added == already paid, raising `spent_m` immediately (D14).
- **PATCH** `{ id, paid?, name?, amount? }` → `{ item }` — updates only the fields sent (≥1
  required). `paid` toggle is **how an EMI installment is paid** (D17): no dedicated EMI-pay
  endpoint; paying marks that month's row and adds `amount` to `spent_m`. `name`/`amount` edit a
  one-off bill in place. 404 if not found.
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
  `{ emi_id, name, monthly, total, months, startMonth, paidCount, paidAmount, remainingCount, remainingAmount }`.
  `startMonth` = the `emi_seq` 1 row's `month` (fallback: earliest month in the group).
  Sorted active-first (something still due), then by name.
- **PATCH** `{ emi_id, name?, monthly?, total?, paidCount?, startMonth? }` → `{ items: EmiProgress[] }`
  (refreshed rollup) — edits the whole EMI group: applies `name`/`emi_total`/`amount` to **every**
  installment sharing the `emi_id` (incl. already-paid rows, so past spend reflects a corrected
  `monthly`). `startMonth` (month key) **re-anchors the schedule**: each installment's `month` is
  rewritten to `startMonth + (emi_seq − 1)` — set it to a past month to **back-date** an EMI that
  began earlier. `paidCount` (0..120) records how many installments are already paid: marks the
  **first N** rows by `emi_seq` `paid = true` and the rest `paid = false` — flipping `paid` flags is
  exactly what feeds each month's spend, so with a past `startMonth`, "4 of 8 paid" raises `spent_m`
  on those four **past** months. ≥1 field.
- **DELETE** `?emi_id=` → `{ ok: true }` — drops every installment row of the EMI.
- Rate limit `emis:{post 15, get 60, patch 15, delete 15}` per 60s.

## UI / components (mobile)
- **AddSheet** — expense mode carries a **type toggle: Expense / Bill / EMI**. Bill → adds a one-off
  bill (`POST /api/bills`, optional due date). EMI → shows total-loan + duration fields above the
  monthly amount, then `POST /api/emis`. Title switches to "Add Bill" / "Add EMI".
- **Bills** and **Emis** — **two separate cards** (split for clarity).
  - **Bills** = one-off bills only. **No paid/total header, no Pay button** (all bills are paid on
    add). Header is just the title + a one-line hint ("What you pay monthly — rent, utilities,
    recharge, insurance"). Rows read like Recent payments: keyword icon + name + amount, tappable to
    open the edit sheet. The list **paginates** (page 1 from the dashboard payload, pages 2+ from
    `GET /api/bills`) with a Prev/Next pager shown only when `pages > 1`.
  - **Emis** = one strip per EMI (from the dashboard EMI rollup): name, `n of N paid`, progress bar,
    `Paid ₹x / ₹total`. Keeps the compact **paid / total** header (green paid, muted total) and the
    inline **Pay ₹monthly** pill on this month's due instalment. Tapping a strip opens the EMI edit
    sheet. Header total = Σ EMI `total`; paid = Σ `paidAmount`.
- **BillEditSheet** — one sheet, two kinds. Bill → name + amount, Save (`PATCH /api/bills`),
  Delete (`DELETE /api/bills?id=`). EMI → name + monthly + total loan + a **Started** month picker
  (`MonthPicker`: click to drop a calendar popover — year pager `‹ 2026 ›` over a 3×4 month grid —
  emits a month key) + a **Months paid** stepper (`−`/`+`, clamped 0..months, shows `N / months`),
  Save (`PATCH /api/emis` incl. `startMonth` + `paidCount`), Delete whole EMI
  (`DELETE /api/emis?emi_id=`). Back-date via Started, then set Months paid so past installments land
  paid. Mirrors the recent-payment EditSheet UX.
  **Responsive:** self-detects `≥1024px` (`useMediaQuery`) → centered dialog card (24px radius, no
  grabber); **EMI edit widens to 660px and lays fields out in a 2-column grid** (Name full-width,
  Monthly/Total + Started/Months-paid paired), with Save + Delete side by side. Bills stay single
  column (460px). Mobile bottom sheet unchanged below 1024px. Same desktop-dialog treatment as
  `AddSheet`.
- **useFinance** — `pay` (EMI installments only now) / `openBillEdit` / `openEmiEdit` /
  `saveBillEdit` / `deleteBillEdit` (EMI edit state carries `paidCount` — clamped 0..months via
  `setBillEditPaidCount` — and `startMonth` — set absolutely via `setBillEditStartMonth` from the
  month picker; both sent on save), one-off bill pagination (`billPage` / `billPages` /
  `setBillPage`, page 2+ fetched from `GET /api/bills`), plus derived `emiCards`, `emisSummary` +
  reload. Adding a bill resets `billPage` to 1 (newest lands on page 1).

## Acceptance criteria
- [ ] A one-off bill is `paid = true` on add → raises `spent_m` + reduces Left-in-bank immediately,
      with no Pay step. A paid EMI installment does the same; an unpaid EMI installment does not.
- [ ] Adding/paying a bill creates no expense row; bills never show in Recent payments.
- [ ] Bills card shows no paid/total header and no Pay button; rows are tappable-to-edit and the
      list paginates (page 1 in dashboard payload, pages 2+ from `GET /api/bills`, newest-first).
- [ ] `POST /api/emis` creates exactly `months` rows sharing one `emi_id`, seq 1..months, unpaid.
- [ ] `GET /api/emis` rollup counts paid vs remaining correctly; `emi_total` never enters spend.
- [ ] Editing a bill (name/amount) or an EMI (name/monthly/total) persists and re-renders; delete
      removes the bill / whole EMI. Bills and EMIs render as two separate cards.
- [ ] Editing an EMI's **Months paid** to N marks the first N installments paid + the rest unpaid,
      raising/lowering `spent_m` on those months accordingly; the rollup `paidCount` updates.
- [ ] Editing an EMI's **Started** month rewrites every installment's `month` to
      `startMonth + (emi_seq−1)`; with a past start + Months paid = N, the N paid installments land on
      past months and raise those months' `spent_m` / lower cumulative Left-in-bank.
- [ ] No overdue state anywhere. user_id scoping on all queries.

## Files to touch
`src/app/api/bills/route.ts`, `src/app/api/emis/route.ts`, `lib/api/schemas.ts`,
`lib/api/dashboard.ts`,
`features/dashboard/mobile/{AddSheet,Bills,Emis,BillEditSheet,useFinance,data}.tsx`,
`supabase/migrations/{005_bill_emi,007_bills_autopaid_pagination}.sql`.

## Out of scope
Overdue/late tracking, autopay, reminders/notifications, interest-schedule math (EMI total is
display-only).
