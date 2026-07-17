# Spec index — read the matching row BEFORE touching code

Grep this file first. Each row: feature → spec → the code files that spec covers
(the spec's own "Reverse-engineered from" list). Open the spec, then jump straight to
those files. Keep this index + the spec's file list current when code moves (CLAUDE.md rule).

## Feature specs (`specs/features/`)

| Feature | Spec | Key code files |
|---|---|---|
| **Auth** — Supabase email/password + Google/Apple OAuth, cookie-based server auth; signup captures full name + bank balance; successful password login writes `profiles.last_login_at`; greeting shows first name; log out via avatar menu; login/signup support Kharcha light and dark themes | `features/auth.md` | `src/app/api/auth/*`, `src/app/auth/callback/route.ts`, `src/app/{globals,layout}.tsx`, `public/{icon.svg,manifest.json}`, `lib/api/schemas.ts`, `lib/supabase/{auth,cookies}.ts`, `features/auth/{AuthContext,identity}.ts(x)`, `features/auth/components/AuthForm.tsx`, `src/app/(auth)/layout.tsx`, `supabase/config.toml`, `features/dashboard/{mobile/MobileHome,desktop/DesktopHome}.tsx`, `supabase/migrations/{008_profiles_full_name,010_profiles_last_login}.sql`, `src/proxy.ts`, `features/dashboard/mobile/AvatarMenu.tsx` |
| **App Control** — DB-driven kill switch (force-logout all) + cache-purge broadcast (evict legacy SW); flip one SQL flag | `features/app-control.md` | `supabase/migrations/009_app_control.sql`, `lib/api/appControl.ts`, `lib/supabase/auth.ts`, `src/app/api/app-control/route.ts`, `features/pwa/AppControl.tsx`, `src/app/layout.tsx` |
| **Dashboard** — per-month home: Left-in-bank hero + Earned/Spent/Invested tiles | `features/dashboard.md` | `src/app/api/dashboard/route.ts`, `lib/api/{dashboard,emis}.ts`, `features/dashboard/mobile/*`, `features/dashboard/hooks/useDashboardData.ts` |
| **Expenses** — log spend ("Recent payments"), edit/delete | `features/expenses.md` | `src/app/api/expenses/route.ts`, `lib/api/{dashboard,schemas}.ts`, `features/dashboard/mobile/{AddSheet,EditSheet,AmountField,CatPill,Transactions,useFinance}.tsx` |
| **Credits** — record income → Earned tile + Left-in-bank | `features/credits.md` | `src/app/api/credits/route.ts`, `lib/api/dashboard.ts`, `features/dashboard/mobile/{AddSheet,useFinance}.tsx` |
| **Investments** — log per-month investment flow; manage holdings/SIPs; record monthly SIP batch with optional balance debit | `features/investments.md` | `src/app/api/{investments,portfolio-panel,sip-payments}/route.ts`, `lib/api/dashboard.ts`, `features/dashboard/mobile/{AddSheet,Investments,PortfolioManager,SipPaymentSheet,useFinance,usePortfolioData}.tsx`, `supabase/migrations/011_sip_payments.sql` |
| **Bills & EMIs** — separate ledger; two cards. Bills auto-paid on add + paginate; EMIs pay + edit | `features/bills.md` | `src/app/api/{bills,emis}/route.ts`, `lib/api/{schemas,dashboard}.ts`, `features/dashboard/mobile/{AddSheet,Bills,Emis,BillEditSheet,MonthPicker,useFinance,data}.tsx`, `features/dashboard/types/types.ts`, `supabase/migrations/{005_bill_emi,007_bills_autopaid_pagination}.sql` |
| **Desktop dashboard** — fluid responsiveness: phone UI < 1024px, 2-col dashboard ≥ 1024px (aligned columns, scroll-paginated cards, Earned/Spent/Invested trend chart) | `features/desktop-dashboard.md` | `features/dashboard/Dashboard.tsx`, `features/dashboard/hooks/{useMediaQuery,useTrendData,useInfiniteExpenses}.ts`, `features/dashboard/desktop/{DesktopHome,TrendChart}.tsx`, `features/dashboard/mobile/AddButton.tsx` (contextual per-card `+`), `features/dashboard/mobile/{Transactions,Bills,Emis,Income,Investments}.tsx` (`fill`/`onAdd`), `features/dashboard/mobile/useFinance.ts` (`openSheet` pre-scoping), `app/globals.css` (`.subtle-scroll`), `src/app/api/trend/route.ts`, `lib/api/{trend,schemas}.ts` |

## Cross-cutting reference (`specs/`)

| Doc | What it governs |
|---|---|
| `DATA_MODEL.md` | Money model — Left-in-bank cumulative sum, `spent_m`/`earned_m`/`invested_m`, per-month tables |
| `DECISIONS.md` | Numbered decisions (D13–D20…) referenced by feature specs |
| `CONVENTIONS.md` | API route shape, error/400 format, rate-limit + `requireUser` scoping |
| `ARCHITECTURE.md` | App/route/layer structure |
| `DESIGN_SYSTEM.md` | **One warm palette** (cream + charcoal neutrals, **gold** accent) shared by app + auth; glass treatment; primary CTA = charcoal (`--c-cta`), never gold; money semantics (credit=green, expense=red, investment=purple) kept; **light/dark** via `var(--c-*)` tokens in `globals.css` + `features/theme/ThemeContext.tsx` |
| `SPEC_TEMPLATE.md` | Template for a new feature spec |

## Planning / status docs (not "as-built")
`features/{mobile-redesign,mobile-redesign-checklist,mobile-app-strategy,backend-wiring-checklist,backend-complete-checklist,pwa-ship-checklist,remaining}.md`,
`WHATS_LEFT.md`, `DESIGN_CRITIQUE.md`, `DESIGN_SYSTEM_MIGRATION.md`, `PREMIUM_REVAMP_ROADMAP.md` (HNI-grade revamp plan + checklist), `design-handoff/` (DC HTML mocks).
