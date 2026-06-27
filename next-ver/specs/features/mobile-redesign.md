# Implementation Plan — Finance Dashboard Mobile (cloth handoff → next-ver)

Source (vendored into repo): [`specs/design-handoff/`](../design-handoff/) — [`README.md`](../design-handoff/README.md) = behavior/token source of truth; `*.dc.html` = visual reference only; `screenshots/` = rendered fidelity refs. (`support.js` prototype runtime intentionally not vendored — handoff says ignore.) Scope per handoff: **mobile UI only** (desktop + QuickActions excluded).

Target app: `next-ver/` — Next 16 App Router, React 19, Tailwind v4, Supabase, lucide-react. Existing dashboard lives in `src/features/dashboard/`.

---

## 0. Fit assessment (what already aligns)

The cloth design is close to our existing house style — minimal token work needed:

| Cloth spec | Already in next-ver | Action |
|---|---|---|
| Bricolage Grotesque display font | `globals.css` body/headings use it | reuse |
| Geist body font | not loaded | add (Google Fonts / self-host) |
| Indigo-only accent | `--color-accent` indigo-500/600 | reuse |
| credit=green / expense=red / investment=purple | `--color-credit/expense/investment` tokens | reuse; investment currently aliases indigo — **split to violet `139,92,246`** to match spec |
| `Intl.NumberFormat('en-IN')` | `utils/format.ts` `formatCurrency` | reuse (note: cloth shows bare `₹` no decimals — our `formatCurrency` already `maximumFractionDigits:0`) |
| Glass/translucent tints | DESIGN_SYSTEM "color through glass" principle | perfect match — cloth IS glass treatment |
| rounded-3xl surfaces, rounded-full pills | radius tokens exist | reuse; cloth cards are 26/28px ≈ `rounded-3xl` |
| Modal/bottom-sheet primitive | `shared/ui/Modal.tsx`, `useLockBodyScroll` | reuse as AddSheet base |

**House-style is already glassy + indigo + semantic colors → the cloth design drops in cleanly.** Main work is layout/composition + the new Bills and Holdings/SIPs structures, not a token rewrite.

---

## 1. Gap analysis — DECIDED (owner-confirmed)

All four resolved. This is now a real money-model change, not a mock reskin. Schema changes required.

### G1 — New money model: cumulative "Left in bank" ✅
- **Drop** starting/closing-balance tracking. `monthly_balances` table **stays in DB but goes unused** (no read/write; remove `applyBalanceDelta`, `calculateClosingBalance`, `updateClosingBalance`, and the self-heal/rollover paths from `lib/api/dashboard.ts` + `lib/api/balances.ts`).
- **Per-month tiles** (HeroBalance) reset each month — they reflect *that month only*:
  - `earned_m = Σcredits(month)`
  - `spent_m  = Σexpenses(month) + Σ(paid bills in month)`  ← paid bills count toward Spent (see G2)
  - `invested_m = Σinvestments(month)`
- **"Left in bank" is cumulative** (keeps piling up across months):
  ```
  leftInBank(month) = Σ_{m ≤ month} ( earned_m − spent_m − invested_m )
  ```
  20 this month + 20 next month → displays 40 next month. The three tiles still show only the current month's figures.
- **Remove carry-forward** for credits/expenses (the `carry_forward` / `carried_from_month` copy logic + `ensureCarryForward*`). Cumulative balance replaces the need for it.
- Implementation: compute `leftInBank` by summing across all months ≤ current (single aggregate query per table, grouped/summed; or fetch all rows ≤ month and reduce in code). No per-month balance row needed.

### G2 — Bills & EMIs: new table ✅
- **New `bills` table:** `{ id, user_id, month (YYYY-MM-01), name, amount, due_date, paid (bool), created_at }`.
- **New `/api/bills` route:** GET (by month) · POST (add) · PATCH (toggle `paid`) · DELETE.
- `paidTotal` = Σ amount where `paid`; rows render unpaid→Pay pill / paid→strikethrough+check (README §5.3). **No overdue state.**
- Pay = PATCH `paid=true`, optimistic.
- **Bills ledger is fully separate from expenses** — paying a bill does NOT create an expense row, and bills do NOT appear in the "Recent payments" (Transactions) list. Bills render only in their own card.
- **BUT paid bills count toward the month's spend:** `spent_m` (Spent tile + Left-in-bank) includes Σ(paid bills in month). Unpaid bills do not count (future obligation). So the HeroBalance Spent total = expenses + paid bills, while Recent payments shows expenses only — the two intentionally differ.

### G3 — Investments: fully manual, recurring model removed ✅
- **Remove the recurring/auto model** from `investments`: drop `is_active`, `carry_forward`, `start_month` carry logic (the `lte(start_month) + is_active + carry_forward` filter in `lib/api/dashboard.ts`). Everything manual now.
- **Three manual datasets** behind the Investments panel:
  - **Holdings — Fixed Deposits:** `{ name, rate, maturity_date, amount }`, manually edited current value.
  - **Holdings — Mutual Funds:** `{ name, current_value }`, manually edited.
  - **Active SIPs:** `{ name, monthly, due_date, paid }` — **static monthly figure, NOT cumulative**.
- **Portfolio value = manual field** (owner-chosen): a single user-editable number, independent of the holdings rows. Stored as its own value (e.g. a `portfolio_total` row/setting), edited manually.
- Schema: add `kind` enum (`fd` | `mutual_fund` | `sip`) + nullable `rate` / `maturity_date` / `current_value` / `due_date` / `monthly` / `paid` columns to `investments` (or split into `holdings` + `sips` tables — decide at build, single-table-with-kind is simpler). `/api/investments` reworked for full manual CRUD per kind.

### G4 — Expense category column ✅
- **Add `category` enum column** to `expenses`: `food | shopping | transport | health | groceries | other` (default `other`).
- Drives the colored category pill (Transactions rows) + the AddSheet expense category picker (6 toggles, default Food). `tags?: string[]` can stay or be retired — pill now reads `category`, not tags.

> **Net scope:** schema changes on `expenses` (+category), `investments` (+kind/manual cols), new `bills` table, new `portfolio_total` storage; `monthly_balances` orphaned (kept, unused). Major rework of `lib/api/dashboard.ts`, `lib/api/balances.ts`, `useDashboardData`. No mock data — all real.

---

## 2. Token / global setup (Phase 0)

1. Load **Geist** font (Google Fonts link or `next/font`) alongside Bricolage. Add `--font-body`.
2. In `globals.css`: split `--color-investment` to violet `rgb(139,92,246)` family (text `#6d28d9`, deep `#5b21b6`) to match spec (currently aliases indigo).
3. Add category color tokens (Food `245,158,11`/`#b45309`, Shopping `139,92,246`/`#6d28d9`, Transport `14,165,233`/`#0369a1`, Health `16,185,129`/`#047857`, Groceries `20,184,166`/`#0f766e`, Other `100,116,139`/`#475569`).
4. Add the glass-tile helper pattern (gradient `linear-gradient(135deg, rgba(rgb,A), rgba(rgb,B))` + matching border + `inset 0 1px 0 rgba(255,255,255,0.6)`) — encode as a small util/className recipe (matches DESIGN_SYSTEM Glass §2).
5. Document additions in `specs/DESIGN_SYSTEM.md` (it currently omits credit/expense/investment + glass — already flagged in WHATS_LEFT).

All measurements (radii, shadows, alphas, font sizes) are in README §5 + §8 — treat as exact.

---

## 2b. Schema & data layer (Phase 0.5 — do before wiring)

Supabase (no migration files in repo today — schema is in `supabase/schema.sql`; add migrations there).

1. **`expenses`** — add `category` enum/text column (`food|shopping|transport|health|groceries|other`, default `other`).
2. **`investments`** — add `kind` (`fd|mutual_fund|sip`) + nullable `rate`, `maturity_date`, `current_value`, `due_date`, `monthly`, `paid`. Drop reliance on `is_active`/`carry_forward`/`start_month` (leave columns or drop — manual model ignores them). *(Or: new `holdings` + `sips` tables; single-table-with-`kind` preferred for less surface.)*
3. **`bills`** (new) — `{ id, user_id, month, name, amount, due_date, paid bool default false, created_at }`.
4. **`portfolio_total`** — store the manual hero number per user (small `settings`-style row, or a single-column table `{ user_id, value }`).
5. **`monthly_balances`** — **leave as-is, orphan it.** Stop all reads/writes. Note in DATA_MODEL.md that it's deprecated/unused.
6. Update `lib/supabase/database.types.ts`, `lib/api/schemas.ts` (zod), and DATA_MODEL.md to match.

Money-model rewrite (`lib/api/dashboard.ts`):
- Remove: `calculateClosingBalance`, `applyBalanceDelta`, `updateClosingBalance`, `ensureCarryForward*`, rollover seeding.
- Add: `leftInBank(userId, month)` = Σ over months ≤ month of (`earned_m − spent_m − invested_m`), where `spent_m = Σexpenses(m) + Σ(paid bills in m)`. Per-month tiles = single-month sums (Spent tile also includes paid bills).

---

## 3. Component build order (Phase 1 — leaf → composite)

Build under `src/features/dashboard/components/` (mobile variants). Each maps to README §5.

1. **GreetingHeader** *(new)* — "Good evening" + name + month pill + 40px AK avatar. README §4. Name/avatar from auth user.
2. **HeroBalance** *(reskin of `BalancePanel`)* — "Left in bank" `₹{net}` 36px + 3 glass stat tiles (Earned/Spent/Invested). Keep month stepper wired to existing `handleChangeMonth`. README §5.1. (G1 mapping.)
3. **Transactions** *(reskin of `TransactionSection`+`TransactionList` for expenses)* — "Recent payments", count subtitle, red total pill, rows = merchant + category pill + date + amount, **no minus sign**. README §5.2. (G4 mapping.)
4. **BillsEmis** *(new)* — unpaid row (line icon + name + Due date + amount + Pay pill) / paid row (green check + strikethrough + "Paid" label), "Paid this month" total recomputes. **No overdue state** (spec removed it — the `overdue` field in `support.js` is dead; ignore). README §5.3. (G2.)
5. **Investments** *(new tabbed panel)* — portfolio value + segmented Holdings/Active SIPs control (local UI state). Holdings = FD + Mutual Funds sections; SIPs = monthly/due/paid rows. README §5.4. (G3.)
6. **FloatingActionBar** *(new)* — fixed bottom-centered frosted pill, 3 circular icon buttons (Expense red / Income green / Invest purple), `backdrop-filter: blur(18px) saturate(1.8)`, safe-area aware. README §5.5.
7. **AddSheet** *(unify existing `ExpenseForm`/`CreditForm`/`InvestmentForm` into one bottom sheet, 3 modes)* — grabber, mode title, amount field (strip non-digits, `inputmode=numeric`), expense-only category picker, mode-dependent 2nd field (Note/Source/Fund), indigo submit. Mode matrix README §6. Reuse `Modal`/`useLockBodyScroll`/`AmountInput` patterns. Backdrop tap closes, sheet tap stops propagation.

Icons: lucide-react already installed — map per README §9 (arrow-up/down, trending-up, chevrons, credit-card/zap/home/car/wifi/flame, check).

---

## 4. Compose home screen (Phase 2)

Rework `Dashboard.tsx` (or a new mobile `Dashboard` view) to stack, top→bottom (README §4): GreetingHeader → HeroBalance → Transactions → BillsEmis → Investments, with `flex-col gap-16px`, outer padding `4px 16px`, **104px bottom padding** so last card clears the floating bar. Screen bg `#f1f5f9` (`bg-slate-100`). Then overlay FloatingActionBar (fixed) + AddSheet (conditional).

- Keep existing month nav (`useDashboardState`), data fetching (`useDashboardData`), optimistic upsert/remove helpers — they already do exactly what cloth's "optimistic UI on Pay/add" calls for.
- Floating-bar button → open AddSheet in matching mode + reset form (reuse the three existing form `onSuccess`→`upsert*` flows behind one sheet).

---

## 5. Wire state / money model (Phase 3)

- HeroBalance: `leftInBank(month)` cumulative (G1) for the big number; the 3 tiles = current-month `Σcredits/Σexpenses/Σinvestments`. No starting/closing balance.
- Transactions: real `expenses` list, newest first, category pill from new `category` column (G4).
- AddSheet save: route by mode to `/api/expenses` (with `category`) | `/api/credits` | `/api/investments`. Optimistic add already supported by `useDashboardData` upsert helpers.
- BillsEmis: new `/api/bills` (G2). Pay = optimistic PATCH `paid=true`; `paidTotal` recomputes.
- Investments tabs: Holdings (FD + Mutual Funds) + Active SIPs from reworked `investments` (G3, manual CRUD per `kind`). Portfolio number = manual `portfolio_total`, inline-editable.

---

## 6. Verify (Phase 4)

- `npx tsc --noEmit` + lint + `vitest` (note: verify scripts not yet defined — WHATS_LEFT Track B #1; add `typecheck`/`verify` if convenient).
- Visual QA at 412px viewport vs `screenshots/01..06` and README §5/§8 exact values.
- Accessibility: 44px touch targets on floating buttons + Pay pills (WHATS_LEFT 0.1b).

---

## 7. Suggested PR slicing

- **PR0** — schema migrations + types + zod + DATA_MODEL/DESIGN_SYSTEM doc updates (Phase 0 + 0.5): `category`, `investments` manual cols, `bills` table, `portfolio_total`, orphan `monthly_balances`, tokens + Geist.
- **PR1** — money-model rewrite in `lib/api/dashboard.ts` + `balances.ts` (cumulative `leftInBank`, remove closing/carry-forward) + `useDashboardData`. Tests for the new sums.
- **PR2** — GreetingHeader + HeroBalance (cumulative number + 3 per-month tiles).
- **PR3** — Transactions card (category pill) + FloatingActionBar + AddSheet unify (3 modes, category picker, `/api/expenses` category).
- **PR4** — BillsEmis card + `/api/bills` route (add/pay/delete, optimistic).
- **PR5** — Investments tabbed panel (Holdings FD/MF + Active SIPs, manual CRUD) + manual portfolio_total editor.

---

## 8. Bill / spend relationship (DECIDED)
- `bills` ledger is **separate** from `expenses` — paying a bill creates no expense row; bills never show in Recent payments.
- Paid bills **are attached to monthly spend**: `spent_m = Σexpenses(m) + Σ(paid bills in m)`; this flows into the Spent tile and the cumulative Left-in-bank. Unpaid bills excluded.

All gaps (G1–G4) decided — no blockers to start PR0.
