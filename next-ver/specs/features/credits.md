# Credits (income)

Reverse-engineered from `src/app/api/credits/route.ts` (canonical reference route),
`lib/api/dashboard.ts`, `features/dashboard/mobile/{AddSheet,useFinance}.tsx`. Post mobile
redesign — DECISIONS D13; DATA_MODEL money model.

## Problem
Users record income for a month; it feeds that month's **Earned** tile and the cumulative
Left-in-bank. **No carry-forward, no balance side-effect** — the running balance is computed on
read (D13).

## Data model touched
`credits` table: `id, user_id, month, description, amount, created_at`. Deprecated/unused:
`carry_forward, carried_from_month`. Feeds `earned_m` + Left-in-bank.

## API contract — `/api/credits`
- **POST** — `{ currentMonth, description, amount }` → `{ item }`. Inserts `month = currentMonth`.
- **PUT** — `{ id, description, amount }`; re-fetch (user-scoped) → 404 if missing → `{ item }`.
- **DELETE** — `?id=` → 404 if missing → hard delete → `{ ok: true }`.
- **No `balance` in any response** (removed with `monthly_balances`, D13).
- Errors: 400 / 401 / 404 / 429. Rate limit `credits:{post,put,delete}` 30/60s. Auth
  `requireUser`, all queries `.eq("user_id", userId)`.
- `select`: `"id, description, amount, created_at"`.

## No carry-forward
Removed with the redesign (D13). `carry_forward`/`carried_from_month` retained but unused;
cumulative Left-in-bank replaces month-to-month copying.

## UI / components (mobile)
AddSheet **Income** mode (amount + source) → `POST /api/credits`. `useFinance` holds credits +
optimistic `addCredit`/`editCredit`/`removeCredit`.

## Acceptance criteria
- [ ] Create/update/delete change `earned_m` + Left-in-bank; no balance row written.
- [ ] All queries scoped by `user_id`.

## Files to touch
`src/app/api/credits/route.ts`, `lib/api/schemas.ts`, `lib/api/dashboard.ts`,
`features/dashboard/mobile/{AddSheet,useFinance}.tsx`.

## Out of scope
Credit categories, attachments, multi-currency.
