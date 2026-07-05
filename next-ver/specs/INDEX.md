# Spec index — read the matching row BEFORE touching code

Grep this file first. Each row: feature → spec → the code files that spec covers
(the spec's own "Reverse-engineered from" list). Open the spec, then jump straight to
those files. Keep this index + the spec's file list current when code moves (CLAUDE.md rule).

## Feature specs (`specs/features/`)

| Feature | Spec | Key code files |
|---|---|---|
| **Auth** — email/password via Supabase, cookie-based server auth; log out via avatar menu | `features/auth.md` | `src/app/api/auth/*`, `lib/supabase/{auth,cookies}.ts`, `features/auth/AuthContext.tsx`, `src/middleware.ts`, `features/dashboard/mobile/AvatarMenu.tsx` |
| **Dashboard** — per-month home: Left-in-bank hero + Earned/Spent/Invested tiles | `features/dashboard.md` | `src/app/api/dashboard/route.ts`, `lib/api/{dashboard,emis}.ts`, `features/dashboard/mobile/*`, `features/dashboard/hooks/useDashboardData.ts` |
| **Expenses** — log spend ("Recent payments"), edit/delete | `features/expenses.md` | `src/app/api/expenses/route.ts`, `lib/api/{dashboard,schemas}.ts`, `features/dashboard/mobile/{AddSheet,EditSheet,AmountField,CatPill,Transactions,useFinance}.tsx` |
| **Credits** — record income → Earned tile + Left-in-bank | `features/credits.md` | `src/app/api/credits/route.ts`, `lib/api/dashboard.ts`, `features/dashboard/mobile/{AddSheet,useFinance}.tsx` |
| **Investments** — log per-month investment flow → Invested tile | `features/investments.md` | `src/app/api/{investments,portfolio-panel}/route.ts`, `lib/api/dashboard.ts`, `features/dashboard/mobile/{AddSheet,Investments,useFinance,usePortfolioData}.tsx` |
| **Bills & EMIs** — separate ledger; two cards. Bills auto-paid on add + paginate; EMIs pay + edit | `features/bills.md` | `src/app/api/{bills,emis}/route.ts`, `lib/api/{schemas,dashboard}.ts`, `features/dashboard/mobile/{AddSheet,Bills,Emis,BillEditSheet,MonthPicker,useFinance,data}.tsx`, `features/dashboard/types/types.ts`, `supabase/migrations/{005_bill_emi,007_bills_autopaid_pagination}.sql` |
| **Desktop dashboard** — fluid responsiveness: phone UI < 1024px, 2-col dashboard ≥ 1024px (aligned columns, scroll-paginated cards, Earned/Spent/Invested trend chart) | `features/desktop-dashboard.md` | `features/dashboard/Dashboard.tsx`, `features/dashboard/hooks/{useMediaQuery,useTrendData,useInfiniteExpenses}.ts`, `features/dashboard/desktop/{DesktopHome,TrendChart}.tsx`, `features/dashboard/mobile/AddButton.tsx` (contextual per-card `+`), `features/dashboard/mobile/{Transactions,Bills,Emis,Income,Investments}.tsx` (`fill`/`onAdd`), `features/dashboard/mobile/useFinance.ts` (`openSheet` pre-scoping), `app/globals.css` (`.subtle-scroll`), `src/app/api/trend/route.ts`, `lib/api/{trend,schemas}.ts` |

## Cross-cutting reference (`specs/`)

| Doc | What it governs |
|---|---|
| `DATA_MODEL.md` | Money model — Left-in-bank cumulative sum, `spent_m`/`earned_m`/`invested_m`, per-month tables |
| `DECISIONS.md` | Numbered decisions (D13–D20…) referenced by feature specs |
| `CONVENTIONS.md` | API route shape, error/400 format, rate-limit + `requireUser` scoping |
| `ARCHITECTURE.md` | App/route/layer structure |
| `DESIGN_SYSTEM.md` | Indigo-only accent, glass treatment, color semantics (credit=green, expense=red, investment=purple); **dark mode** via `var(--c-*)` tokens in `globals.css` + `features/theme/ThemeContext.tsx` |
| `SPEC_TEMPLATE.md` | Template for a new feature spec |

## Planning / status docs (not "as-built")
`features/{mobile-redesign,mobile-redesign-checklist,mobile-app-strategy,backend-wiring-checklist,backend-complete-checklist,pwa-ship-checklist,remaining}.md`,
`WHATS_LEFT.md`, `DESIGN_CRITIQUE.md`, `DESIGN_SYSTEM_MIGRATION.md`, `design-handoff/` (DC HTML mocks).
