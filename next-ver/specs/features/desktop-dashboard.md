# Desktop dashboard (fluid responsiveness)

> **Status: BUILT.**
> Reverse-engineered from `src/features/dashboard/Dashboard.tsx`,
> `features/dashboard/hooks/{useMediaQuery,useTrendData}.ts`,
> `features/dashboard/desktop/{DesktopHome,TrendChart}.tsx`,
> `features/dashboard/mobile/FloatingActionBar.tsx` (reused for desktop actions),
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
- **`desktop/DesktopHome.tsx`** (new) — owns `useFinance()` + `usePortfolioData()` + `useTrendData()`.
  Mounts the shared sheets (`AddSheet`/`EditSheet`/`BillEditSheet`) + `Toaster` once (same as MobileHome).
  Layout per mock:
  - **Header**: "Overview" icon-badge + greeting/month subline + month pill + avatar (mock 73–85).
  - **Grid** `1.32fr / 1fr`, `max-width ~1360px`, centered, real padding (fluid, not fixed 1180px).
  - **Left col**: `HeroBalance` → `TrendChart` → `Transactions`.
  - **Right col**: `Bills` → `Emis` → `Income` → `Investments`.
- **Actions**: the **mobile `FloatingActionBar`** is reused verbatim (fixed bottom-center frosted pill,
  three icon-only buttons). The mock's separate `QuickActions` button row was dropped — the user wants
  the identical pill on desktop, not a big-button row.
- **`desktop/TrendChart.tsx`** (new) — Recharts multi-line/area (Earned/Spent/Invested), 6/12 toggle,
  glass card wrapper, tabular-nums tooltip, indigo/green/red/purple theme.
- **`hooks/useTrendData.ts`** (new) — fetches `/api/trend?months=`, owns the 6/12 window state,
  refetches on window + month change. Loading/error states.
- **Reused as-is (no props change):** `HeroBalance`, `Transactions`, `Bills`, `Emis`, `Income`,
  `Investments`, `AddSheet`, `EditSheet`, `BillEditSheet`, `Toaster`.

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
- `src/features/dashboard/desktop/DesktopHome.tsx` — new shell (reuses `mobile/FloatingActionBar`).
- `src/features/dashboard/desktop/TrendChart.tsx` — new (Recharts).
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
