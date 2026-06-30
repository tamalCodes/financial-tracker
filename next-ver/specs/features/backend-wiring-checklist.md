# Backend Wiring Checklist — replace demo data with the real API

Companion to [mobile-redesign-checklist.md](./mobile-redesign-checklist.md). The mobile UI is built
pixel-from-DC and driven by **in-memory demo data** (`src/features/dashboard/mobile/`). This doc is
the source of truth for the work to **remove the demo and connect the backend**.

**Key finding:** every API route already exists (PART B). No new endpoints are required for the core
flow — this is mostly an *integration + decisions + tests* effort, not new server code.

**Last updated:** created. Status convention: `[x]` done · `[~]` in progress · `[ ]` not started · `⏸` blocked-on-decision.

---

## 0. Endpoint inventory (verified present)

| Route | Methods | Feeds |
|---|---|---|
| `GET /api/dashboard?month=` | GET | summary + credits + expenses + investments + bills (per-month, cumulative `leftInBank`) |
| `/api/expenses` | POST · PUT · DELETE | Transactions / AddSheet expense |
| `/api/credits` | POST · PUT · DELETE | AddSheet income |
| `/api/investments` | POST · PUT · DELETE | AddSheet invest + Invested tile |
| `/api/bills` | GET · POST · PATCH · DELETE | BillsEmis (PATCH = toggle paid) |
| `/api/holdings` | GET · POST · PUT · DELETE | Investments → Fixed Deposits + Mutual Funds (split by `kind`) |
| `/api/sips` | GET · POST · PUT · DELETE | Investments → Active SIPs |
| `/api/portfolio` | GET · PUT | Investments → Portfolio value (single row, inline edit) |

Lists for credits/expenses/investments/bills come from the **dashboard payload** (no per-entity GET).
holdings/sips/portfolio are **separate fetches**, lazy-loaded when the Investments panel opens (B5 decision).

---

## 1. ✅ DECISIONS — RESOLVED (2026-06-29)

All five resolved. Each now drives concrete work in §2/§4.

- [x] **D-A — Opening-balance money model.** ✅ **Account starts from a user-set opening bank balance,
  then purely additive on top.** No demo baseline (`SALARY`/`AUTO_INVEST`/`SPENT_BASE` all dropped).
  - **UX:** opening balance asked **once, at signup** (never again). Owner's value = `70000`.
  - **Storage:** new `profiles` table with `opening_balance` column (NOT a credit row — opening balance
    is **not income**, must stay out of the `earned` tile). `monthly_balances.starting_balance` stays
    deprecated.
  - **Formula change:** `cumulativeLeftInBank` becomes `opening_balance + Σcredits − Σexpenses −
    ΣpaidBills − Σinvestments`. Currently (`lib/api/dashboard.ts:62`) it omits opening balance entirely.
  - **Work:** migration (`profiles` + opening_balance); signup form field + `signup/route.ts` param →
    insert profile row; formula update; update `dashboard.test.ts` (case at line 96 expects `30500` with
    no baseline — recompute with opening balance). See §2.2 / §4.
- [x] **D-B — `leftInBank` clamp ≥ 0, no negatives.** ✅ Keep the `Math.max(0, …)` clamp. "Left in bank"
  = how much remains in the bank, floor **0**, never negative. (Overrides the earlier F1 "show signed" lean.)
- [x] **D-C — Hardcoded bill icon set.** ✅ Fixed icon set keyed by bill name: **electric · wifi · gas**
  + one **miscellaneous** fallback. Map bill name keyword → icon, else misc. No per-bill icon column.
- [x] **D-D — Holding sub-line = maturity only.** ✅ Drop the `% p.a.` rate from the FD sub-line.
  Sub = `"matures <maturity_date>"`. (Rate display revisited later.)
- [x] **D-E — Transactions: keep API, defer UI.** ✅ `PUT`/`DELETE /api/expenses` stay. No edit/delete
  affordance now — Transactions card is **read-only** (add via AddSheet only). UI revisited later.

---

## 2. Integration — per surface (replace demo → real)

### 2.1 Data layer ✅
- [x] `mobile/data.ts` trimmed to presentational only (`DISPLAY`, `BODY`, `fmt`, `CATS`, `catOf`, mode
      matrix) + **D-C `billIconFor`** keyword map (electric/wifi/gas/misc). All seed/model constants removed
      (`SEED_TXS`, `BILL_DEFS`, `FDS`, `FUNDS`, `SIPS`, `PORTFOLIO_TOTAL`, `SALARY`, `AUTO_INVEST`,
      `SPENT_BASE`, `MONTHS`).
- [x] `useFinanceDemo` **deleted**; replaced by `mobile/useFinance.ts` (wraps `useDashboardData` +
      `useDashboardState` + AddSheet form state) + new `mobile/usePortfolioData.ts` (2.5). Same return
      shape → leaf components untouched.
- [x] Payload → props mapping done in `useFinance` (HeroBalance/Transactions/BillsEmis exactly as listed).

### 2.2 HeroBalance + month nav ✅
- [x] Month stepper wired via `useFinance` (`prevMonth`/`nextMonth` → `handleChangeMonth`;
      `canNavigateNextMonth` exposed; next no-ops past current month).
- [x] **D-A backend:** ✅ migration `002_profiles_opening_balance.sql` (`profiles` table) + `schema.sql`
      + hand-written `database.types.ts` `profiles` entry. `signup/route.ts` now validates via
      `signupSchema` (email/password/`openingBalance` ≥0, default 0) and upserts the profile row from the
      `signUp` user id (idempotent). ✅ **Frontend now wired too:** `AuthForm` shows a "Current bank
      balance" field on signup; `AuthContext.signUp(email, password, openingBalance)` sends it. (Backend
      since switched to a signup-metadata trigger under RLS — see backend-complete-checklist §B.)
- [x] **D-A formula:** ✅ `cumulativeLeftInBank` (`lib/api/dashboard.ts`) now fetches `profiles` and
      returns `opening_balance + earned − spent − invested`. Tests updated (opening 70000, +no-profile→0 case).
- [x] **D-B:** `fmt` keeps the `Math.max(0, …)` clamp (no negative balance shown).

### 2.3 AddSheet (the 3 modes → 3 routes) ✅
- [x] expense → `POST /api/expenses` `{ currentMonth, description: note||categoryLabel, amount, category }`.
- [x] income → `POST /api/credits` `{ currentMonth, description: note||"Income", amount }`.
- [x] investment → `POST /api/investments` `{ currentMonth, description: note||"Investment", amount }`.
- [x] On success: optimistic `upsert*` then `reload()`; no-op on amount 0/empty; `saving` guard prevents
      double-submit.
- [x] `currentMonth` ('YYYY-MM-01') from `useDashboardState` (demo `MONTHS` gone).

### 2.4 BillsEmis ✅ (core)
- [x] Pay → `PATCH /api/bills` `{ id, paid: true }`, optimistic via `setBills`, reload; reverts on failure.
- [ ] (Deferred affordance) add-bill "+" → `POST /api/bills`. *(deferred UI)*
- [ ] (Deferred affordance) delete → `DELETE /api/bills?id=`. *(deferred UI)*

### 2.5 Investments panel (NEW client hook) ✅ (read)
- [x] `usePortfolioData()` — fetches `GET /api/portfolio` + `/api/holdings` + `/api/sips` on mount.
- [x] Holdings split by `kind`: `fd` → Fixed Deposits (sub = `"matures <maturity_date>"`, no rate),
      `mutual_fund` → Mutual Funds; sips mapped to rows.
- [ ] Portfolio value inline edit → `PUT /api/portfolio`. *(deferred UI)*
- [ ] (Deferred affordances) add/edit holdings + sips → `POST/PUT/DELETE /api/{holdings,sips}`.

### 2.6 Greeting identity ✅
- [x] `MobileHome` derives name + initials from `useAuth().user.email`, time-based greeting from the hour,
      month pill ← `monthLabel`. Hardcoded `Arjun Kapoor / AK` gone.

---

## 3. Demo teardown ✅
- [x] Deleted temp route `src/app/demo/`.
- [x] Deleted `useFinanceDemo.ts`; `data.ts` trimmed (2.1).
- [x] Deleted the whole dead `dashboard/components/` dir (ExpenseForm/CreditForm/InvestmentForm,
      TransactionSection/List, old desktop GreetingHeader/HeroBalance/Transactions, AmountInput/TagInput —
      nothing outside the dir imported it). Removed `MonthlyBalance` type; pruned dead starting-balance
      state from `useDashboardState`. `BalancePanel`/`StartingBalanceModal` were already gone (F1).
- [ ] Revert `.claude/launch.json` `autoPort` if not wanted. *(cosmetic, optional)*

---

## 4. Backend hardening (the real server-side gap — Track B #2)
Routes exist but **route-handler tests do not** (flagged since B3/B5/B6). ✅ Added in
`src/app/api/routes.test.ts` (20 cases) — Supabase + auth mocked, scoping asserted at query layer.
- [x] Ownership scoping test — ✅ expenses/credits/investments PUT+DELETE and bills PATCH+DELETE all
      assert `.eq("user_id", userId)` on the mutating op.
- [x] Validation test — ✅ bad/missing body → 400 (expenses/credits POST, bills PATCH, bills DELETE
      missing id); rate-limit 429 covered (exceed per-IP limit) + 401 auth propagation.
- [x] Money-model test extension — ✅ paid-bill / cross-month cumulative in `dashboard.test.ts` (now incl.
      opening balance); credits/investments/expenses POST assert user-scoped per-month insert shape.
- [ ] (Track B #6) Local Supabase seed/migration runner so these tests can hit a **real** DB
      (current tests mock Supabase — no live-DB integration yet). *Remaining.*
- [x] **D-A** `profiles`: ✅ signup upsert tested (opening_balance set / default 0 / negative→400);
      `cumulativeLeftInBank` opening-balance + no-profile→0 cases in `dashboard.test.ts`.

---

## 5. Verify gate
- [x] `npm run verify` green (typecheck · lint · test · build). ✅ 2026-06-29 — 25 tests pass, build clean.
- [ ] (Track B #3) E2E smoke: login → dashboard → AddSheet expense → row appears → Left-in-bank updates.
- [ ] react-best-practices pass + `Claude_Preview` screenshots vs handoff `screenshots/01..06`.

---

## Fastest path
**§1 decisions** → §2.1 data layer swap → §2.3 AddSheet + §2.2 HeroBalance (core loop) → §2.4/§2.5
(bills + portfolio) → §3 teardown → §4/§5 tests + verify.
