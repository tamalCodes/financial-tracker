# Mobile Redesign — Living Checklist & Progress Tracker

Companion to [mobile-redesign.md](./mobile-redesign.md) (the plan). **This is the source of
truth for status.** Update checkboxes as work lands; keep the "Last updated" line current.
Convention: `[x]` done · `[~]` in progress · `[ ]` not started · `⏸` blocked.

**Last updated:** after commit `3edfc40` (backend money core).
**Branch:** `main` only (repo `CLAUDE.md` — never branch).

---

## Status at a glance

| Phase | Area | Status | Commit |
|---|---|---|---|
| B0 | Schema & migrations | ✅ done | `3edfc40` |
| B1 | Money-model rewrite | ✅ done | `3edfc40` |
| B2 | Expense category | ✅ done (folded) | `3edfc40` |
| B3 | Bills route | ⬜ todo | — |
| B4 | Investments per-month | ✅ done (folded) | `3edfc40` |
| B5 | Portfolio routes (holdings/sips/total) | ⬜ todo | — |
| B6 | Backend verify gate | ⬜ todo | — |
| F0 | Tokens & fonts | ⬜ todo | — |
| F1 | Greeting + HeroBalance | ⬜ todo | — |
| F2 | Transactions card | ⬜ todo | — |
| F3 | Floating bar + AddSheet | ⬜ todo | — |
| F4 | Bills & EMIs card | ⬜ todo | — |
| F5 | Investments panel | ⬜ todo | — |
| F6 | Compose home + verify | ⬜ todo | — |

**Blockers / external:**
- ⏸ **Migration `001_mobile_redesign.sql` NOT applied to live Supabase** — agent cannot apply (no creds; won't touch DB). User must run it before new routes/UI work end-to-end. New tables: `bills`, `holdings`, `sips`, `portfolio_totals`; altered: `expenses` (+category), `investments` (+month).
- Open sub-decision (assumed NO): SIP/holding payments do **not** feed the monthly "Invested" tile (confirm before B5/F5).

---

# PART B — Backend

## B0 — Schema & migrations ✅
- [x] `supabase/migrations/001_mobile_redesign.sql` (additive, idempotent)
- [x] `expenses.category` enum + CHECK
- [x] `investments.month` col + backfill; legacy cols deprecated
- [x] new `bills` table + index
- [x] new `holdings` table + index
- [x] new `sips` table + index
- [x] new `portfolio_totals` table
- [x] `monthly_balances` deprecated comment
- [x] `supabase/schema.sql` reflects post-migration state
- [x] `src/lib/supabase/database.types.ts` updated (new tables, ExpenseCategory, HoldingKind)
- [x] `src/features/dashboard/types/types.ts` (Bill/Holding/Sip/MonthSummary; Expense.category; Investment.month; MonthlyBalance kept deprecated)
- [x] `specs/DATA_MODEL.md` rewritten (cumulative money model)
- [x] `specs/DECISIONS.md` D13/D14/D15
- [ ] **User: apply migration to live Supabase** ⏸

## B1 — Money-model rewrite ✅
- [x] delete `src/lib/api/balances.ts` (applyBalanceDelta/calculateClosingBalance/updateClosingBalance/createStartingBalance)
- [x] delete `src/lib/api/balances.test.ts`
- [x] delete `src/app/api/balances/route.ts` (+ folder)
- [x] `src/lib/api/dashboard.ts`: `cumulativeLeftInBank` + `loadDashboardData` new payload `{ summary, credits, expenses, investments, bills }`
- [x] remove carry-forward (`ensureCarryForward*`), seed/self-heal/rollover
- [x] `src/app/api/dashboard/route.ts` returns new payload (no code change needed)
- [x] `src/lib/api/dashboard.test.ts` — 4 cases (cumulative, future-month exclusion, unpaid bills ignored, per-month summary)
- [x] typecheck 0 · eslint 0 · tests green

## B2 — Expense category ✅ (folded into B1 commit)
- [x] `src/lib/api/schemas.ts`: `expenseCategory` enum on create/update (optional, default 'other'); removed `startingBalanceSchema`
- [x] `src/app/api/expenses/route.ts`: store/return `category`; de-balanced; `tags` retained
- [ ] (F-side) AddSheet category picker → F3

## B4 — Investments per-month flow ✅ (folded)
- [x] `src/app/api/investments/route.ts`: per-month `month` insert; hard DELETE; added PUT; de-balanced; removed start_month/is_active/carry_forward logic
- [x] `select` = `id, description, amount, month, created_at`

## B3 — Bills route ⬜
- [ ] `src/lib/api/schemas.ts`: `billCreateSchema` `{currentMonth, name, amount, due_date?}`, `billPatchSchema` `{id, paid}`
- [ ] `src/app/api/bills/route.ts`:
  - [ ] GET `?month=` (user-scoped, order due_date)
  - [ ] POST create
  - [ ] PATCH toggle `paid`
  - [ ] DELETE `?id=`
  - [ ] conventions: rateLimit `bills:{get,post,patch,delete}`, requireUser, validate, handleError, `.eq("user_id")`
- [ ] vitest: pay toggles paid; paidTotal recompute; paid bill raises spent_m; unpaid excluded; ownership
- [ ] dashboard already returns `bills` (B1) — verify shape

## B5 — Portfolio routes (manual) ⬜
- [ ] schemas: holding/sip/portfolioTotal create+update
- [ ] `src/app/api/holdings/route.ts`: GET·POST·PUT·DELETE (kind fd|mutual_fund, current_value, rate?, maturity_date?)
- [ ] `src/app/api/sips/route.ts`: GET·POST·PUT·DELETE (name, monthly, due_date, paid_total)
- [ ] `src/app/api/portfolio/route.ts`: GET·PUT (upsert single `portfolio_totals` row per user)
- [ ] decide: include holdings/sips/portfolio in dashboard payload OR separate fetch (lean: separate `/api/portfolio`-family, lazy-load when Investments panel opens)
- [ ] vitest: per-user scoping; portfolio_total upsert; CRUD
- [ ] confirm SIP/holding does NOT affect money model (open sub-decision)

## B6 — Backend verify gate ⬜
- [ ] `package.json` scripts: `typecheck` (`tsc --noEmit`), `verify` (`typecheck && eslint . && vitest run && next build`)
- [ ] note: Next 16 removed `next lint` → use `eslint` directly
- [ ] route ownership/validation tests for bills + portfolio
- [ ] `WHATS_LEFT.md` Track B #1 → mark progressing
- [ ] run `npm run verify` green

---

# PART C — Frontend (only after PART B green)

High-fidelity per handoff §5 + tokens §8. Reuse `shared/ui/*`. 412px; QA vs `screenshots/01..06`.

## F0 — Tokens & fonts ⬜
- [ ] load **Geist** (`next/font`), add `--font-body`
- [ ] split `--color-investment` → violet `139,92,246` (text `#6d28d9`, deep `#5b21b6`)
- [ ] category color tokens (Food/Shopping/Transport/Health/Groceries/Other — values in plan §F0)
- [ ] glass-tile recipe util (gradient + border + inset highlight)
- [ ] document credit/expense/investment + glass + category tokens INTO `DESIGN_SYSTEM.md` (currently omitted — WHATS_LEFT)

## F1 — Greeting header + HeroBalance ⬜
- [ ] `GreetingHeader` (greeting + name + month pill + AK avatar; name/avatar from auth user)
- [ ] `HeroBalance` (reskin `BalancePanel`): cumulative `₹{leftInBank}` 36px + 3 glass tiles (Earned/Spent/Invested = per-month from `summary`)
- [ ] month stepper wired to `handleChangeMonth`
- [ ] **remove** `StartingBalanceModal` + starting-balance flow from `Dashboard.tsx` (model gone)
- [ ] `useDashboardData` reads `summary` (not `balance`); drop `setBalance`/`MonthlyBalance`
- [ ] retire deprecated `MonthlyBalance` type once unused

## F2 — Transactions (Recent payments) ⬜
- [ ] reskin expenses list: count subtitle, red total pill, no minus sign
- [ ] category pill from `expense.category` (glass tint per category)
- [ ] `TransactionList`/`TransactionSection` reuse or replace

## F3 — Floating bar + AddSheet (unify 3 forms) ⬜
- [ ] `FloatingActionBar` (fixed bottom-center frosted pill, 3 circular buttons, safe-area)
- [ ] `AddSheet` bottom sheet, 3 modes (mode matrix §6): amount field (strip non-digits, reuse AmountInput), expense-only category picker (6 pills, default Food), mode 2nd field (Note/Source/Fund), indigo submit
- [ ] route expense→`/api/expenses`(+category), income→`/api/credits`, invest→`/api/investments`
- [ ] **retire** `ExpenseForm`/`CreditForm`/`InvestmentForm` (replaced by AddSheet)
- [ ] optimistic add via `useDashboardData` upsert*

## F4 — Bills & EMIs card ⬜
- [ ] `BillsEmis` card: unpaid row (line icon + name + Due + amount + Pay pill) / paid row (check + strikethrough + "Paid")
- [ ] "Paid this month" total recomputes
- [ ] optimistic Pay → PATCH `/api/bills`
- [ ] add-bill entry point (sheet or inline) — **gap: handoff has no add-bill UI; needs design decision**
- [ ] no overdue state

## F5 — Investments panel (tabbed) ⬜
- [ ] portfolio value (manual, inline-edit → `/api/portfolio`)
- [ ] segmented Holdings/Active SIPs control (local UI state)
- [ ] Holdings: FD section (rate/maturity) + Mutual Funds section (current value) → `/api/holdings`
- [ ] Active SIPs: monthly/due/paid rows → `/api/sips`
- [ ] manual add/edit entry points for holdings + sips — **gap: handoff has no add UI; needs design**

## F6 — Compose home + verify ⬜
- [ ] rework `Dashboard.tsx` (mobile): GreetingHeader → HeroBalance → Transactions → BillsEmis → Investments, `flex-col gap-16px`, padding `4px 16px`, 104px bottom, bg `#f1f5f9`
- [ ] overlay FloatingActionBar + AddSheet
- [ ] keep `useDashboardState` month nav; rework `useDashboardData` for new payload + bills + portfolio
- [ ] `npm run verify` green
- [ ] react-best-practices pass
- [ ] Claude_Preview mobile screenshots vs handoff `screenshots/01..06`
- [ ] accessibility: 44px touch targets (WHATS_LEFT 0.1b)

---

## Cross-cutting cleanup (track separately)
- [ ] remove deprecated `MonthlyBalance` type when frontend no longer imports it
- [ ] decide fate of legacy `carry_forward`/`carried_from_month`/`tags`/`start_month`/`is_active`/`monthly_balances` columns (drop in a later migration once confirmed unused)
- [ ] `StartingBalanceModal.tsx`, `BalancePanel.tsx`, `*Form.tsx` deletion once F-phases replace them
- [ ] update feature specs `credits.md`/`expenses.md`/`investments.md`/`dashboard.md` to the new model (currently describe old balance system)
- [ ] graphify refresh after frontend lands

## New design gaps surfaced (need owner input)
- [ ] **Add-bill UI**: cloth handoff shows Pay but no "add a bill" flow. How are bills created? (sheet mode? separate screen? seed-only?)
- [ ] **Add/edit holdings & SIPs UI**: handoff shows display only. How does user add/update them?
- [ ] **Portfolio value editor**: inline tap-to-edit vs a small form?
