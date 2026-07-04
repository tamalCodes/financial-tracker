# Desktop dashboard (fluid responsiveness)

> **Status: BUILT.**
> Reverse-engineered from `src/features/dashboard/Dashboard.tsx`,
> `features/dashboard/hooks/{useMediaQuery,useTrendData}.ts`,
> `features/dashboard/desktop/{DesktopHome,TrendChart}.tsx`,
> `features/dashboard/mobile/AddButton.tsx` (contextual per-card "+" for desktop actions),
> `features/dashboard/mobile/{Transactions,Bills,Emis,Income,Investments}.tsx` (opt-in `onAdd`),
> `features/dashboard/mobile/useFinance.ts` (`openSheet(mode, opts?)` pre-scoping),
> `src/app/api/trend/route.ts`, `lib/api/trend.ts`, `lib/api/schemas.ts` (trendQuerySchema).
> Related: [dashboard.md](dashboard.md), DATA_MODEL, DECISIONS D13/D14/D16.

## Problem
On desktop/tablet-landscape the app renders `MobileHome` — a single 640px column centered in a
sea of empty space (the whole viewport is wasted). We want **fluid responsiveness**: keep the
phone UI on mobile, and on wide viewports show a **dashboard-style two-column layout** with the
same data plus a **monthly-trend chart**.

Design source: the DESKTOP block in `specs/design-handoff/FinanceDashboard.dc.html` (lines 68–102) —
a 2-col reflow. We extend it with one chart. The mock's graphs were never part of the handoff, so
the chart is a net-new addition.

## Decisions locked (this session)
- **Ambition:** reflow of existing cards **+ charts** (not a full redesign).
- **Graphs:** monthly-trend line **only** — the sole feature needing new backend.
- **Trend metric:** three lines **Earned / Spent / Invested**, colored per DESIGN_SYSTEM
  (green `#10b981` / red `#ef4444` / purple `#8b5cf6`). Indigo stays brand-only.
- **Window:** user-toggle **6 / 12 months** in the UI.
- **Chart lib:** **Recharts** (themed to glass/indigo).
- **Breakpoint:** `min-width: 1024px` → desktop (covers tablet-landscape). Below → unchanged mobile.

## Data model touched
**None.** Read-only, reuses existing tables. The trend endpoint aggregates
`credits` / `expenses` / `investments` per month exactly like the per-month tiles
(earned = Σcredits, spent = Σexpenses **+ paid bills** per D14, invested = Σinvestments).
No `monthly_balances` write (D13). Trend does **not** need Left-in-bank (not plotted).

## API contract — `GET /api/trend?months=N`
- **Request**: query `months` — integer, one of `6 | 12` (default `6`; clamp/validate to those).
- **Response**:
  ```
  { series: [ { month: 'YYYY-MM-01', earned: number, spent: number, invested: number }, ... ] }
  ```
  Oldest→newest, exactly `N` entries ending at the current month. Months with no rows return zeros.
  No `balance` object (D13).
- **Errors**: 400 (bad `months`), 401 (unauth via `requireUser`), 429 (limited), 500 (unexpected — do
  not mask as 400, mirror `dashboard/route.ts`).
- **Rate limit**: prefix `trend:get`, `{ limit: 60, windowMs: 60_000 }` (mirror dashboard).
- **Money-model effect**: read-only; feeds the chart only. Uses the same aggregation as the
  Spent/Earned/Invested tiles so a given month matches the dashboard exactly.
- **Impl**: `lib/api/trend.ts` — loop the existing per-month summary aggregation across the last N
  months (reuse the `MonthSummary` math already in `lib/api/dashboard.ts`). Bounded N (≤12) → cheap.
  Postgres `GROUP BY month` RPC is a later optimization, not v1.

## UI / components
All `"use client"`. Mobile path is **untouched**.

- **`hooks/useMediaQuery.ts`** (new) — SSR-safe: returns `false` on server + first client render,
  syncs via `matchMedia` on mount. Mobile is the safe default → no desktop flash on phones.
- **`Dashboard.tsx`** (edit) — `const isDesktop = useMediaQuery("(min-width: 1024px)")`;
  render `<DesktopHome/>` when true, else `<MobileHome/>` (current behavior).
- **`desktop/DesktopHome.tsx`** (new) — owns `useFinance()` + `usePortfolioData()` + `useTrendData()` +
  `useInfiniteExpenses()`. Mounts the shared sheets (`AddSheet`/`EditSheet`/`BillEditSheet`) + `Toaster`
  once (same as MobileHome). Layout per mock:
  - **Header**: "Overview" icon-badge + greeting/month subline + month pill + avatar (mock 73–85).
  - **Grid** `1.32fr / 1fr`, `max-width ~1360px`, centered. **Scrollable dashboard with a height
    floor**: the root is a `minHeight:100vh` flex-column with `overflowY:auto` (the whole page
    scrolls); header pins to the top of the flow; the grid takes `flex:1` with
    `grid-template-rows: minmax(0,1fr)` so on a tall viewport both columns stretch to the same height
    and their bottoms **align** (the original bug: Recent payments vs Portfolio ended at different
    heights). The grid also carries `min-height:640` so on short viewports (MacBook Air, split-screen)
    the flex fill can't crush the bottom cards to near-zero — the grid keeps its floor and the root
    scrolls to reveal the overflow.
  - **Left col**: `HeroBalance` → `TrendChart` → `Transactions` (**fill**, scrolls).
  - **Right col**: `Bills` → `Emis` → `Income` → `Investments` (**fill**, scrolls).
  - The bottom card in each column gets `flex:1` (wrapper `min-height:260` so it never collapses) and
    scrolls its body internally; the header/tabs pin. Page scroll and per-card internal scroll coexist.
- **Fill / scroll-pagination**: `Transactions` and `Investments` gain an optional `fill` prop. In fill
  mode the card fills its column, the header pins, and the list body scrolls with a subtle scrollbar
  (`.subtle-scroll` in globals.css). `Transactions` replaces its Prev/Next pager with **append-on-scroll**
  (`onLoadMore` fires when the body nears its bottom). Mobile keeps the pager (no `fill`).
- **Actions (contextual per-card `+`)**: desktop drops the global `FloatingActionBar` (the fixed
  bottom-center pill occluded Recent payments + the cards below it). Instead each card header carries a
  small glass `+` (`mobile/AddButton.tsx`), scoped to that card and coloured to its semantic:
  Recent payments → expense (red), Bills → one-off bill (indigo), EMIs → EMI (indigo), Income →
  income (green), Portfolio value → investment (purple). Each card gained an **opt-in `onAdd` prop**;
  only `DesktopHome` passes it, so **mobile is pixel-unchanged** (still uses the FAB). Bills/EMI adds go
  through `openSheet("expense", { isBill, billKind })` — a new pre-scoping arg on `useFinance.openSheet`
  that opens `AddSheet` straight to the right toggle. `FloatingActionBar.tsx` stays (mobile only).
  - The **EMIs card always renders on desktop** (unlike mobile, which hides it at zero EMIs) so its `+`
    is always reachable; with no EMIs the body shows an empty-state line ("No EMIs yet — tap + to add
    one") and the header **hides the `₹paid / ₹total` pair** (would otherwise read a meaningless
    `₹0 / ₹0`) — `PaidTotal` renders only when `cards.length > 0`. Mobile still guards
    `emiCards.length > 0`, so the empty state never shows there.
- **`desktop/TrendChart.tsx`** (new) — Recharts multi-line/area (Earned/Spent/Invested), 6/12 toggle,
  glass card wrapper, tabular-nums tooltip, indigo/green/red/purple theme.
- **`hooks/useTrendData.ts`** (new) — fetches `/api/trend?months=`, owns the 6/12 window state,
  refetches on window + month change. Loading/error states.
- **`hooks/useInfiniteExpenses.ts`** (new) — desktop-only scroll pagination for Recent payments:
  fetches `/api/expenses?page=` in batches of 12 and appends via `loadMore()`. Resets on month change;
  reloads when the expense count shifts (add/delete). Maps `Expense → TxView` like `useFinance`.
- **Reused as-is (no props change):** `HeroBalance`, `AddSheet`, `EditSheet`, `BillEditSheet`,
  `Toaster`. **Extended (opt-in `fill`):** `Transactions`, `Investments`. **Extended (opt-in `onAdd`):**
  `Transactions`, `Bills`, `Emis`, `Income`, `Investments`.

## Acceptance criteria
- [ ] Viewport < 1024px renders the **current mobile UI, pixel-unchanged**.
- [ ] Viewport ≥ 1024px renders the two-column desktop layout using the shared cards + data hooks.
- [ ] No desktop flash on phones (SSR-safe media query); no hydration mismatch.
- [ ] Resizing across 1024px swaps layouts without reload or data refetch storms.
- [ ] Trend chart shows Earned/Spent/Invested, correct colors, 6/12 toggle works.
- [ ] A trend month's Earned/Spent/Invested equals that month's dashboard tiles (same aggregation).
- [ ] `/api/trend` is `requireUser`-scoped, validates `months`, rate-limited, correct error shapes.
- [ ] Add/edit sheets + toaster work on desktop (open, save, optimistic refresh).

## Files to touch
- `src/features/dashboard/Dashboard.tsx` — branch mobile vs desktop.
- `src/features/dashboard/hooks/useMediaQuery.ts` — new, SSR-safe.
- `src/features/dashboard/hooks/useTrendData.ts` — new.
- `src/features/dashboard/hooks/useInfiniteExpenses.ts` — new (desktop scroll pagination).
- `src/features/dashboard/desktop/DesktopHome.tsx` — new shell; wires per-card `onAdd`, no FAB.
- `src/features/dashboard/desktop/TrendChart.tsx` — new (Recharts).
- `src/features/dashboard/mobile/AddButton.tsx` — new; contextual glass `+`, 4 semantic variants.
- `src/features/dashboard/mobile/Transactions.tsx` — add `fill` mode + `onAdd`.
- `src/features/dashboard/mobile/Investments.tsx` — add `fill` mode + `onAdd`.
- `src/features/dashboard/mobile/{Bills,Emis,Income}.tsx` — add `onAdd`.
- `src/features/dashboard/mobile/useFinance.ts` — `openSheet(mode, opts?)` pre-scoping for bill/EMI.
- `src/app/globals.css` — `.subtle-scroll` thin translucent scrollbar utility.
- `src/app/api/trend/route.ts` — new GET.
- `src/lib/api/trend.ts` — new aggregation.
- `src/lib/api/schemas.ts` — trend query/response schema.
- `package.json` — add `recharts`.
- `specs/INDEX.md` + `specs/features/dashboard.md` — index row + cross-link (after build).

## Out of scope
- Any change to the mobile UI or its components.
- Charts other than the monthly trend (no category donut, no portfolio charts) — deferred.
- Left-in-bank trend line / cumulative series.
- Trend Postgres RPC optimization (JS loop is v1).
- Desktop-specific modal styling for the add/edit sheets (reuse the bottom-sheet as-is v1).
- Persisting the 6/12 window across sessions.
