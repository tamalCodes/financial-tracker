# Implementation Plan — Finance Dashboard Mobile (cloth handoff → repo-root app)

Source (vendored into repo): [`specs/design-handoff/`](../design-handoff/) — [`README.md`](../design-handoff/README.md) = behavior/token source of truth; `*.dc.html` = visual reference only; `screenshots/` = rendered fidelity refs. (`support.js` prototype runtime intentionally not vendored — handoff says ignore.) Scope per handoff: **mobile UI only** (desktop + QuickActions excluded).

Target app: the repo-root app — Next 16 App Router, React 19, Tailwind v4, Supabase, lucide-react. Existing dashboard lives in `src/features/dashboard/`. (This app was nested under `next-ver/` when this plan was written; it was flattened to the repo root on 2026-07-13.)

> **Execution order is backend-first.** PART A = decisions + model. PART B = backend phases (B0–B6). PART C = frontend phases (F0–F6). Do not start frontend until backend phases verify green. One phase per commit on `main` (no branches — see repo `CLAUDE.md`).
>
> 📋 **Live status & exhaustive checklist:** [mobile-redesign-checklist.md](./mobile-redesign-checklist.md) — the source of truth for what's done / todo. Update it as work lands.

---

# PART A — Decisions & target model

## A0. Fit assessment (what already aligns)

The cloth design already matches house style — minimal token work:

| Cloth spec | Already in app | Action |
|---|---|---|
| Bricolage Grotesque display | `globals.css` body/headings | reuse |
| Geist body font | not loaded | add (`next/font` or Google Fonts) |
| Indigo-only accent | `--color-accent` indigo-500/600 | reuse |
| credit=green / expense=red / investment=purple | `--color-credit/expense/investment` tokens | reuse; **split investment to violet `139,92,246`** (currently aliases indigo) |
| `Intl.NumberFormat('en-IN')` | feature-local formatting helpers | reuse |
| Glass/translucent tints | DESIGN_SYSTEM "color through glass" (D11) | exact match |
| rounded-3xl surfaces / rounded-full pills | radius tokens exist | reuse |
| Bottom-sheet / modal pattern | `AddSheet.tsx`, `EditSheet.tsx` | reuse as sheet references |
| Route/auth/validation patterns | CONVENTIONS §1–§7 (`requireUser`, `rateLimit`, zod `validate`, `handleError`, user_id scoping) | **all new routes follow these verbatim** |

## A1. Gap decisions (owner-confirmed) ✅

### G1 — New money model: cumulative "Left in bank"
- **Drop** starting/closing-balance tracking. `monthly_balances` table **stays in DB, goes unused** (no read/write). Remove `applyBalanceDelta`, `calculateClosingBalance`, `updateClosingBalance`, `createStartingBalance`, self-heal + rollover-seed paths.
- **Per-month tiles** (HeroBalance) reflect *that month only* and reset monthly:
  - `earned_m  = Σ credits(month)`
  - `spent_m   = Σ expenses(month) + Σ (bills paid in month)`   ← paid bills count (G2)
  - `invested_m = Σ investments(month)`   ← per-month *flow* entries, not the portfolio panel (G3)
- **"Left in bank" is cumulative** across all months ≤ current:
  ```
  leftInBank(month) = Σ_{m ≤ month} ( earned_m − spent_m − invested_m )
  ```
  20 this month + 20 next → 40 displayed next month. Tiles still show only the current month.
- **Carry-forward removed** for credits/expenses (`ensureCarryForward*`, `carried_from_month`). Cumulative balance replaces it.

### G2 — Bills & EMIs: new table
- **`bills`** table + **`/api/bills`** route (GET by month · POST · PATCH paid · DELETE).
- Ledger **separate** from expenses — paying a bill creates NO expense row; bills never appear in Recent payments.
- **Paid** bills feed `spent_m` + Left-in-bank (above). Unpaid excluded. **No overdue state** (handoff removed it).

### G3 — Investments: fully manual, recurring model removed — TWO concepts
1. **Monthly investment flow** (drives the "Invested" tile + Left-in-bank): the existing `investments` table, **simplified** to plain per-month rows `{month, description, amount}` — drop `start_month`/`is_active`/`carry_forward` logic, drop soft-delete (hard delete), drop the `lte(start_month)` filter. AddSheet "Invest" mode POSTs here.
2. **Portfolio panel (display-only, manual reference)** — NOT tied to the monthly tiles:
   - **`holdings`** table: `kind ∈ {fd, mutual_fund}`, `name`, `current_value`, + FD-only `rate`/`maturity_date`. Manually edited.
   - **`sips`** table: `name`, `monthly`, `due_date`, `paid_total`. Static, manually edited. **Not cumulative.**
   - **`portfolio_total`**: a single manual user-editable number (its own row), independent of holdings.
- **⚠ Sub-decision to confirm (assumed NO):** SIP payments / holdings do **not** flow into the monthly "Invested" tile or Left-in-bank — the panel is reference only, mirroring the cloth prototype. If you want SIP payment to reduce Left-in-bank, it should instead be logged as a monthly investment-flow entry.

### G4 — Expense category column
- Add **`category`** enum to `expenses`: `food | shopping | transport | health | groceries | other` (default `other`). Drives the colored pill (Transactions) + AddSheet expense picker (default Food). `tags` may stay or be retired; pill reads `category`.

## A2. Net schema impact
`expenses` +`category` · `investments` simplified · new `bills` · new `holdings` · new `sips` · new `portfolio_total` · `monthly_balances` orphaned. Major rewrite of `lib/api/dashboard.ts`, `lib/api/balances.ts`, `useDashboardData`, all five mutation routes (drop balance-delta calls). No mock data.

---

# PART B — Backend phases (do first, in order)

Each phase: implement → `tsc --noEmit` + lint + vitest → commit on `main`. Conventions are non-negotiable (CONVENTIONS §1–§7; canonical route = `api/credits/route.ts`).

## Phase B0 — Schema & migrations
**Files:** `supabase/schema.sql`, new `supabase/migrations/00x_mobile_redesign.sql`, `src/lib/supabase/database.types.ts`, `specs/DATA_MODEL.md`, `specs/DECISIONS.md` (add D13/D14/D15).
1. `expenses`: `add column category text not null default 'other'` (+ optional CHECK for the 6 values).
2. `investments`: keep table; stop using `start_month`/`is_active`/`carry_forward`. Add `month text` (per-month flow) — backfill `month = start_month`. (Leave legacy columns nullable; document as deprecated.)
3. `create table bills (id, user_id, month text, name text, amount numeric, due_date text, paid boolean default false, created_at timestamptz default now())` + index `(user_id, month)`.
4. `create table holdings (id, user_id, kind text check (kind in ('fd','mutual_fund')), name text, current_value numeric, rate numeric null, maturity_date text null, created_at)` + index `(user_id)`.
5. `create table sips (id, user_id, name text, monthly numeric, due_date text, paid_total numeric default 0, created_at)` + index `(user_id)`.
6. `create table portfolio_totals (user_id uuid primary key references auth.users(id), value numeric not null default 0)`.
7. `monthly_balances`: leave as-is; add a `-- DEPRECATED (unused since mobile redesign)` comment.
8. Update `database.types.ts` + `types/types.ts` (new `Bill`, `Holding`, `Sip`; `Expense.category`; `Investment` loses recurring fields).
9. DATA_MODEL.md: rewrite tables + the new money model; DECISIONS.md: D13 cumulative-balance-replaces-closing, D14 bills-separate-but-counted, D15 investments-manual-two-concepts.

**Acceptance:** migration applies clean; types compile; docs reflect new model.

## Phase B1 — Money-model rewrite (the core)
**Files:** `src/lib/api/dashboard.ts`, `src/lib/api/balances.ts`, `src/app/api/dashboard/route.ts`, `src/app/api/balances/route.ts`.
1. Delete from `balances.ts`: `applyBalanceDelta`, `calculateClosingBalance`, `updateClosingBalance`, `createStartingBalance`. (File may become empty → remove + its imports.)
2. `dashboard.ts` `loadDashboardData(month)` rewrite:
   - Remove carry-forward calls, balance seed/self-heal, investment `lte(start_month)` filter.
   - Fetch current-month: `credits`, `expenses (+category)`, `investments (by month)`, `bills (by month)`.
   - Compute `earned_m`, `spent_m` (= expenses + paid bills), `invested_m`.
   - Compute `leftInBank`: sum `(credits − expenses − paidBills − investments)` across **all months ≤ current** for the user. Implementation: one grouped aggregate per table (or fetch rows ≤ month and reduce). Add a small `cumulativeLeftInBank(supabase, userId, month)` helper.
   - Return `{ leftInBank, earned: earned_m, spent: spent_m, invested: invested_m, credits, expenses, investments, bills }`.
3. `/api/dashboard` GET: new payload shape. `/api/balances` route: **remove** (no starting balance) — or keep as 410/deleted; update `dashboard.md` spec.
4. Strip `applyBalanceDelta` calls from credits/expenses/investments routes (done fully in B2/B4, but ensure dashboard compiles now).

**Acceptance (vitest):** `leftInBank` cumulates correctly across 3 seeded months; `spent_m` includes paid bills only; per-month tiles isolated to their month; no reference to `monthly_balances` remains in read path.

## Phase B2 — Expenses: category + de-balance
**Files:** `src/app/api/expenses/route.ts`, `src/lib/api/schemas.ts`.
1. `schemas.ts`: add `category` enum to `mutationCreateSchema`/`mutationUpdateSchema` (`z.enum([...]).default('other')`). Drop carry-forward fields if retiring (keep optional for now).
2. `expenses/route.ts`: POST/PUT accept+store `category`; **remove `applyBalanceDelta`** calls (POST/PUT/DELETE no longer touch balances). Keep `requireUser`, `rateLimit`, `handleError`, user_id scoping, `select` includes `category`.

**Acceptance:** POST with category persists + returns it; no balance writes; pill data present in dashboard payload.

## Phase B3 — Bills domain
**Files:** new `src/app/api/bills/route.ts`, `schemas.ts` (`billCreateSchema`, `billPatchSchema`), `dashboard.ts` (already fetches bills in B1).
1. Route: GET `?month=` (user-scoped, by month, order due_date) · POST `{currentMonth,name,amount}` (due_date column retained but no longer sent by the mobile AddSheet) · PATCH `{id,paid}` (toggle) · DELETE `?id=`. All follow CONVENTIONS (try/catch, `requireUser`, `rateLimit` `bills:{get,post,patch,delete}` 30–60/60s, `validate`, `handleError`, `.eq("user_id")`).
2. Response shapes per CONVENTIONS §2 (`{item}` / `{ok:true}`). No balance object (balances gone).

**Acceptance (vitest):** pay toggles `paid`; `paidTotal` recomputes; paid bill raises `spent_m` in dashboard; unpaid does not; ownership enforced.

## Phase B4 — Investments: simplify to per-month flow
**Files:** `src/app/api/investments/route.ts`, `schemas.ts`.
1. POST `{currentMonth, description, amount}` → plain row `{month, description, amount}`. Hard DELETE (drop soft-delete). Optional PUT for edit. **Remove** `applyBalanceDelta`, `start_month`/`is_active`/`carry_forward` handling.
2. `select`: `"id, description, amount, month, created_at"`.

**Acceptance:** invested flow per month feeds `invested_m`; delete removes row; no recurring/soft-delete logic remains.

## Phase B5 — Portfolio (holdings · sips · portfolio_total)
**Files:** new `src/app/api/holdings/route.ts`, `src/app/api/sips/route.ts`, `src/app/api/portfolio/route.ts` (or one `/api/portfolio` with sub-actions), `schemas.ts`, `dashboard.ts` (or a separate `loadPortfolio`).
1. `holdings`: GET (all, user-scoped) · POST `{kind,name,current_value,rate?,maturity_date?}` · PUT (edit current_value etc.) · DELETE. 
2. `sips`: GET · POST `{name,monthly,due_date,paid_total?}` · PUT · DELETE.
3. `portfolio_total`: GET · PUT `{value}` (upsert single row per user).
4. Manual CRUD only; no money-model coupling (per A1 G3 sub-decision).

**Acceptance:** holdings/sips/portfolio_total CRUD scoped per user; portfolio number persists; panel data fetchable.

## Phase B6 — Backend verify gate
1. Add `package.json` scripts: `typecheck` (`tsc --noEmit`), `verify` (typecheck && lint && test && build) — closes WHATS_LEFT Track B #1.
2. Vitest coverage: money model (B1), bills→spend (B3), per-route ownership/validation. Target the new logic, not the deleted paths.
3. Run `verify` green before any frontend work. Update `WHATS_LEFT.md`.

---

# PART C — Frontend phases (only after PART B green)

High-fidelity per handoff §5 + tokens §8 (exact radii/shadows/alphas). Reuse the live sheet/card patterns. 412px design viewport; QA vs `screenshots/01..06`. **As built the shell is fluid** (`MobileHome`): `width:100%, maxWidth:640` — it fills the device edge-to-edge (only the 16px content padding as side gutter) instead of capping at 412px, which left large empty side rails on phones whose viewport is wider than 412 (PWA fix).

## Phase F0 — Tokens & fonts
- Load **Geist** (`next/font`), add `--font-body`. Split `--color-investment` → violet. Add category color tokens (Food `245,158,11`/`#b45309`, Shopping `139,92,246`/`#6d28d9`, Transport `14,165,233`/`#0369a1`, Health `16,185,129`/`#047857`, Groceries `20,184,166`/`#0f766e`, Other `100,116,139`/`#475569`). Add glass-tile recipe util. Document in DESIGN_SYSTEM.md (currently omits credit/expense/investment + glass — WHATS_LEFT).

## Phase F1 — Greeting header + HeroBalance
- GreetingHeader (greeting + name + month pill + AK avatar; name/avatar from auth user). HeroBalance: cumulative `₹{leftInBank}` (36px) + 3 glass tiles (Earned/Spent/Invested = per-month). Month stepper → existing `handleChangeMonth`. Handoff §4, §5.1.

## Phase F2 — Transactions (Recent payments)
- Reskin expenses list: count subtitle, red total pill, rows = merchant + **category pill** (from `category`) + date + amount, **no minus sign**. Handoff §5.2.

## Phase F3 — Floating action bar + AddSheet (unify 3 forms)
- FloatingActionBar: fixed bottom-centered frosted pill, 3 circular buttons (Expense/Income/Invest), safe-area aware. Handoff §5.5.
- AddSheet: one bottom sheet, 3 modes (mode matrix §6) — grabber, amount field (strip non-digits, `inputmode=numeric`, reuse AmountInput), expense-only category picker (6 pills, default Food), mode-dependent 2nd field (Note/Source/Fund), indigo submit. Routes: expense→`/api/expenses` (+category), income→`/api/credits`, invest→`/api/investments`. Replaces `ExpenseForm`/`CreditForm`/`InvestmentForm`. Handoff §5.6.

## Phase F4 — Bills & EMIs card
- Unpaid row (line icon + name + amount + Pay pill) / paid row (green check + strikethrough + "Paid"). Sub-label renders only when present: EMI rows show "Installment n of m"; one-off bills have **no due date** (AddSheet no longer collects one; `due_date` column retained but unused). "Paid this month" total recomputes. Optimistic Pay → PATCH. **No overdue.** `/api/bills`. Handoff §5.3.
- AddSheet expense mode carries an Expense / Bill / EMI toggle. Bill = name + amount only (no due date). EMI = total loan + months + monthly amount. Once Total and Months are both filled, the Monthly field auto-computes `total ÷ months` and plays the AmountField AI think→reveal animation (debounced ~650ms); user can still override it. `AmountField.revealValue(n)` drives this programmatic reveal.

## Phase F5 — Investments panel (tabbed)
- Portfolio value (manual, inline-editable → `/api/portfolio`) + segmented Holdings/Active SIPs control (local UI state). Holdings = FD + Mutual Funds sections (`/api/holdings`); SIPs = monthly/due/paid rows (`/api/sips`). Manual add/edit. Handoff §5.4.

## Phase F6 — Compose home + verify
- Rework `Dashboard.tsx` (mobile): stack GreetingHeader → HeroBalance → Transactions → BillsEmis → Investments (`flex-col gap-16px`, padding `4px 16px`, **104px** bottom), bg `#f1f5f9`; overlay FloatingActionBar + AddSheet. Keep `useDashboardState` month nav + `useDashboardData` (reworked for new payload + bills/portfolio). Centering shell is **fluid** (`width:100%, maxWidth:640`), not a fixed 412px column — see PART C intro.
- Verify: `npm run verify` + react-best-practices + Claude_Preview mobile screenshots vs handoff. Accessibility: 44px touch targets (WHATS_LEFT 0.1b).

---

## §8. Bill / spend relationship (DECIDED)
- `bills` ledger is **separate** from `expenses` — paying a bill creates no expense row; bills never show in Recent payments.
- Paid bills **attach to monthly spend**: `spent_m = Σexpenses(m) + Σ(paid bills in m)`; flows into the Spent tile + cumulative Left-in-bank. Unpaid excluded.

## Open sub-decision (non-blocking, confirm before B5/F5)
- Do SIP payments / holdings feed the monthly "Invested" tile + Left-in-bank? **Assumed NO** — portfolio panel is manual reference only (matches cloth). Say the word to wire SIP payments into the monthly investment flow instead.
