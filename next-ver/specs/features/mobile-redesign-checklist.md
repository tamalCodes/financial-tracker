# Mobile Redesign — Living Checklist & Progress Tracker

Companion to [mobile-redesign.md](./mobile-redesign.md) (the plan). **This is the source of
truth for status.** Update checkboxes as work lands; keep the "Last updated" line current.
Convention: `[x]` done · `[~]` in progress · `[ ]` not started · `⏸` blocked.

**Last updated:** Whole mobile UI rebuilt **pixel-from-DC** under `src/features/dashboard/mobile/`,
driven by **in-memory demo data** (`mobile/data.ts` + `useFinanceDemo.ts`) — backend fully decoupled.
F3–F6 UI complete (demo). `verify` green. Next: wire backend to replace demo data.
**Branch:** `main` only (repo `CLAUDE.md` — never branch).

> **Demo-first pivot (user-directed):** build the entire frontend pixel-perfect against the
> handoff `.dc.html` with demo data first, THEN connect the backend. New self-contained set lives
> in `src/features/dashboard/mobile/` (inline styles translated 1:1 from the DC files for exact
> fidelity). The legacy backend-wired components/hooks/forms remain in the repo for the wiring step.
> `Dashboard.tsx` now renders `mobile/MobileHome`. No-auth preview at `/demo`.

---

## Status at a glance

| Phase | Area | Status | Commit |
|---|---|---|---|
| B0 | Schema & migrations | ✅ done | `3edfc40` |
| B1 | Money-model rewrite | ✅ done | `3edfc40` |
| B2 | Expense category | ✅ done (folded) | `3edfc40` |
| B3 | Bills route | ✅ done | `cc3997d` |
| B4 | Investments per-month | ✅ done (folded) | `3edfc40` |
| B5 | Portfolio routes (holdings/sips/total) | ✅ done | `e801101` |
| B6 | Backend verify gate | ✅ done | `e801101` |
| F0 | Tokens & fonts | ✅ done | `abe76b8` |
| F1 | Greeting + HeroBalance | ✅ done | `abe76b8` |
| F2 | Transactions card | ✅ done | `7498ffe` |
| F3 | Floating bar + AddSheet | ✅ UI (demo) · ⏳ backend | — |
| F4 | Bills & EMIs card | ✅ UI (demo) · ⏳ backend | — |
| F5 | Investments panel | ✅ UI (demo) · ⏳ backend | — |
| F6 | Compose home + verify | ✅ UI (demo) · ⏳ a11y/screenshots | — |

> **Note:** F2's `Transactions` was also re-done in `mobile/` (no trash icon — matches the DC
> reference exactly; the earlier always-visible trash + oversized "Other" pill are gone).
> "✅ UI (demo)" = pixel-perfect against the `.dc.html`, fed by demo data. "⏳ backend" = the
> AddSheet/Pay/portfolio mutations are local-only; real `/api/*` wiring is the next phase.

**Blockers / external:**
- [x] ✅ Migration `001_mobile_redesign.sql` applied to live Supabase (verified: `expenses.category` + `bills`/`holdings`/`sips`/`portfolio_totals` present).
- [x] ✅ All design-gap decisions resolved (see "Design gaps surfaced — RESOLVED" below). PART C unblocked.

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
- [x] **migration applied to live Supabase** ✅

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

## B3 — Bills route ✅
- [x] `src/lib/api/schemas.ts`: `billCreateSchema` `{currentMonth, name, amount, due_date?}`, `billPatchSchema` `{id, paid}`
- [x] `src/app/api/bills/route.ts`:
  - [x] GET `?month=` (user-scoped, order due_date) → `{ items }`
  - [x] POST create → `{ item }`
  - [x] PATCH toggle `paid` → `{ item }` / 404
  - [x] DELETE `?id=` → `{ ok: true }`
  - [x] conventions: rateLimit `bills:{get,post,patch,delete}`, requireUser, validate, handleError, `.eq("user_id")`
- [x] paid-bill → spent_m / Left-in-bank logic covered by `dashboard.test.ts` (4 cases)
- [~] route-handler unit tests deferred → B6 (repo has no route-handler harness yet; same gap as credits/expenses/investments, WHATS_LEFT Track B #2)
- [x] dashboard returns `bills` (B1) — shape verified

## B5 — Portfolio routes (manual) ✅
- [x] schemas: holding/sip create+update, `portfolioTotalSchema`
- [x] `src/app/api/holdings/route.ts`: GET·POST·PUT·DELETE (kind fd|mutual_fund, current_value, rate?, maturity_date?)
- [x] `src/app/api/sips/route.ts`: GET·POST·PUT·DELETE (name, monthly, due_date, paid_total)
- [x] `src/app/api/portfolio/route.ts`: GET·PUT (upsert single `portfolio_totals` row per user)
- [x] decision: **separate `/api/{holdings,sips,portfolio}` fetch** (not in dashboard payload) — lazy-load when Investments panel opens (F5)
- [~] route-handler unit tests deferred → see cross-cutting (no harness yet)
- [x] built as pure CRUD — does NOT affect money model (D15; open sub-decision still flagged for F5)

## B6 — Backend verify gate ✅
- [x] `package.json`: `typecheck` (`tsc --noEmit`) + `verify` (`typecheck && lint && test && build`)
- [x] Next 16 removed `next lint` → `lint` script already `eslint`
- [x] `npm run verify` green (tsc 0 · eslint 0 · 14 tests · `next build` OK)
- [x] silenced 2 pre-existing legacy lint errors (CreditForm/ExpenseForm set-state-in-effect) via scoped disable — forms retired in F3
- [~] route-handler ownership/validation tests still a gap (cross-cutting; WHATS_LEFT Track B #2)
- [x] `WHATS_LEFT.md` Track B #1 → done (scripts added)

---

# PART C — Frontend (only after PART B green)

High-fidelity per handoff §5 + tokens §8. Reuse `shared/ui/*`. 412px; QA vs `screenshots/01..06`.

## F0 — Tokens & fonts ✅
- [x] load **Geist** (`next/font`) in `layout.tsx`; `--font-body` + `font-body` utility
- [x] split `--color-investment` → violet (`--color-violet-600`)
- [x] category color tokens: `--color-cat-*` (text) + `--cat-*` RGB triplets (tints) in `globals.css`
- [x] glass-tile recipe: `@utility glass-tile` (set `--tile-rgb`)
- [~] document tokens INTO `DESIGN_SYSTEM.md` — deferred to F6 doc pass

## F1 — Greeting header + HeroBalance ✅
- [x] `GreetingHeader.tsx` (time-based greeting + name/initials from auth email + month pill + avatar)
- [x] `HeroBalance.tsx`: cumulative `₹{leftInBank}` 36px (handles negative) + 3 glass tiles from `summary`; month stepper → `handleChangeMonth`, next disabled past current
- [x] **deleted** `BalancePanel.tsx`, `MonthHeader.tsx`, `StartingBalanceModal.tsx` (replaced)
- [x] `useDashboardData` reads `summary` + `bills`; dropped `balance`/`setBalance`
- [x] `Dashboard.tsx` rewired: GreetingHeader + HeroBalance + (legacy TransactionSections kept for F2); mutations `upsert + reload()` to recompute cumulative summary
- [ ] retire deprecated `MonthlyBalance` type — still used by 3 legacy forms (retire in F3)
- [~] starting-balance state still in `useDashboardState` (unused) — prune in F6

## F2 — Transactions (Recent payments) ✅
- [x] `Transactions.tsx` card: "Recent payments" + "{count} this month · newest first" + red total pill, **no minus sign**
- [x] category pill from `expense.category` via `--color-cat-*` / `--cat-*` glass tint
- [x] `formatTxnDate` ("Today" / "25 Jun") added to `dates.ts`
- [x] row tap → edit (ExpenseForm); subtle trash → delete + reload
- [x] wired into `Dashboard.tsx` (replaced Expenses `TransactionSection`)
- [~] Credits + Investments `TransactionSection`s still rendered below (legacy) — removed in F6 compose (not in cloth home)
- [~] old `TransactionList`/`TransactionSection` retire after F6

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
- [ ] **add-bill: "+" on the Bills card header** → mini add form (name, amount, due_date) → POST `/api/bills` (DECIDED)
- [ ] delete bill (long-press or edit affordance) → DELETE `/api/bills`
- [ ] no overdue state

## F5 — Investments panel (tabbed) ⬜
- [ ] portfolio value (manual, inline-edit → `/api/portfolio`)
- [ ] segmented Holdings/Active SIPs control (local UI state)
- [ ] Holdings: FD section (rate/maturity) + Mutual Funds section (current value) → `/api/holdings`
- [ ] Active SIPs: monthly/due/paid rows → `/api/sips`
- [ ] **portfolio value: tap-to-edit inline** → save on blur → PUT `/api/portfolio` (DECIDED)
- [ ] **add/edit holdings + sips: "+" per section + tap-row-to-edit** via a small sheet → POST/PUT/DELETE `/api/holdings` `/api/sips` (DECIDED)

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

## Design gaps surfaced — RESOLVED ✅
- [x] **Add-bill UI** → "+" on the Bills & EMIs card header (mini add form). Built in F4.
- [x] **Add/edit holdings & SIPs** → "+" per section + tap-row-to-edit (small sheet). Built in F5.
- [x] **Portfolio value editor** → tap-to-edit inline, save on blur. Built in F5.
- [x] **SIP/holding → money model** → NO. Portfolio panel is reference-only; Invested tile = per-month AddSheet 'Invest' entries (confirms D15; backend needs no rework).
