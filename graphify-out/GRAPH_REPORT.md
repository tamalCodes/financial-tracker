# Graph Report - .  (2026-06-27)

## Corpus Check
- Corpus is ~18,466 words - fits in a single context window. You may not need a graph.

## Summary
- 163 nodes · 162 edges · 51 communities detected
- Extraction: 73% EXTRACTED · 27% INFERRED · 0% AMBIGUOUS · INFERRED: 43 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Dashboard UI & Handlers|Dashboard UI & Handlers]]
- [[_COMMUNITY_Balance Logic & API Routes|Balance Logic & API Routes]]
- [[_COMMUNITY_Auth Context & Forms|Auth Context & Forms]]
- [[_COMMUNITY_App Shell & PWA Branding|App Shell & PWA Branding]]
- [[_COMMUNITY_Supabase Server & Pages|Supabase Server & Pages]]
- [[_COMMUNITY_Rate Limiting|Rate Limiting]]
- [[_COMMUNITY_MonthDate Utils|Month/Date Utils]]
- [[_COMMUNITY_Expo App Icons|Expo App Icons]]
- [[_COMMUNITY_Expo App Entry|Expo App Entry]]
- [[_COMMUNITY_useLockBodyScroll Hook|useLockBodyScroll Hook]]
- [[_COMMUNITY_Auth Screen|Auth Screen]]
- [[_COMMUNITY_Auth Toggle|Auth Toggle]]
- [[_COMMUNITY_Auth Form|Auth Form]]
- [[_COMMUNITY_Next Middleware|Next Middleware]]
- [[_COMMUNITY_Root Layout|Root Layout]]
- [[_COMMUNITY_Auth Form Submit|Auth Form Submit]]
- [[_COMMUNITY_Currency Format|Currency Format]]
- [[_COMMUNITY_Dashboard Data Hook|Dashboard Data Hook]]
- [[_COMMUNITY_Dashboard State Hook|Dashboard State Hook]]
- [[_COMMUNITY_Service Worker Register|Service Worker Register]]
- [[_COMMUNITY_Vite Entry|Vite Entry]]
- [[_COMMUNITY_Native Auth Submit|Native Auth Submit]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]

## God Nodes (most connected - your core abstractions)
1. `POST()` - 12 edges
2. `DELETE()` - 9 edges
3. `GET()` - 8 edges
4. `PUT()` - 8 edges
5. `createSupabaseServerClient()` - 8 edges
6. `loadDashboardData()` - 8 edges
7. `getUserFromCookies()` - 7 edges
8. `shiftMonthKey()` - 6 edges
9. `Financial Tracker (Vite App Shell)` - 6 edges
10. `useAuth()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Financial Tracker (Vite App Shell)` --conceptually_related_to--> `Rupee Currency App Icon (root public)`  [INFERRED]
  index.html → public/icon.svg
- `Google Fonts (Bricolage Grotesque, Inter)` --semantically_similar_to--> `next/font and Geist Font`  [INFERRED] [semantically similar]
  index.html → next-ver/README.md
- `Rupee Currency App Icon` --semantically_similar_to--> `Rupee Currency App Icon (root public)`  [INFERRED] [semantically similar]
  next-ver/public/icon.svg → public/icon.svg
- `Home()` --calls--> `useAuth()`  [INFERRED]
  next-ver/src/app/page.tsx → src/contexts/AuthContext.tsx
- `PUT()` --calls--> `updateClosingBalance()`  [INFERRED]
  next-ver/src/app/api/credits/route.ts → src/components/Dashboard.tsx

## Hyperedges (group relationships)
- **PWA App Shell (Vite Financial Tracker)** — index_financial_tracker, index_service_worker, index_pwa_manifest, index_main_tsx [INFERRED 0.85]
- **Next.js / Vercel Branding Stack** — readme_nextjs_project, readme_vercel_platform, next_wordmark_logo, vercel_triangle_logo [INFERRED 0.75]

## Communities

### Community 0 - "Dashboard UI & Handlers"
Cohesion: 0.1
Nodes (14): ensureCarryForwardCredits(), ensureCarryForwardExpenses(), formatMonthKey(), getNextMonth(), getPreviousMonth(), handleChangeMonth(), handleCloseStartingBalanceForm(), handleOpenStartingBalanceForm() (+6 more)

### Community 1 - "Balance Logic & API Routes"
Cohesion: 0.15
Nodes (12): extractAccessToken(), getProjectRef(), getUserFromCookies(), applyBalanceDelta(), calculateClosingBalance(), createStartingBalance(), updateClosingBalance(), handleDeleteCredit() (+4 more)

### Community 2 - "Auth Context & Forms"
Cohesion: 0.13
Nodes (6): AuthProvider(), useAuth(), CreditForm(), ExpenseForm(), InvestmentForm(), Home()

### Community 3 - "App Shell & PWA Branding"
Cohesion: 0.16
Nodes (14): Rupee Currency App Icon, Rupee Currency App Icon (root public), Financial Tracker (Vite App Shell), Google Fonts (Bricolage Grotesque, Inter), main.tsx Entry Module, PWA Web App Manifest, Service Worker (sw.js) Registration, Next.js Wordmark Logo (+6 more)

### Community 4 - "Supabase Server & Pages"
Cohesion: 0.25
Nodes (4): createSupabaseServerClient(), DashboardPage(), LoginPage(), SignupPage()

### Community 5 - "Rate Limiting"
Cohesion: 0.47
Nodes (3): getClientId(), rateLimit(), GET()

### Community 6 - "Month/Date Utils"
Cohesion: 0.6
Nodes (3): formatMonthKey(), parseMonthKey(), shiftMonthKey()

### Community 7 - "Expo App Icons"
Cohesion: 0.67
Nodes (4): Android Adaptive Icon (Expo Placeholder), Favicon 3D Cube Logo, App Icon (Expo Placeholder), Splash Screen Icon (Expo Placeholder)

### Community 8 - "Expo App Entry"
Cohesion: 0.67
Nodes (1): App()

### Community 9 - "useLockBodyScroll Hook"
Cohesion: 0.67
Nodes (1): useLockBodyScroll()

### Community 10 - "Auth Screen"
Cohesion: 1.0
Nodes (0): 

### Community 11 - "Auth Toggle"
Cohesion: 1.0
Nodes (0): 

### Community 12 - "Auth Form"
Cohesion: 1.0
Nodes (0): 

### Community 13 - "Next Middleware"
Cohesion: 1.0
Nodes (0): 

### Community 14 - "Root Layout"
Cohesion: 1.0
Nodes (0): 

### Community 15 - "Auth Form Submit"
Cohesion: 1.0
Nodes (0): 

### Community 16 - "Currency Format"
Cohesion: 1.0
Nodes (0): 

### Community 17 - "Dashboard Data Hook"
Cohesion: 1.0
Nodes (0): 

### Community 18 - "Dashboard State Hook"
Cohesion: 1.0
Nodes (0): 

### Community 19 - "Service Worker Register"
Cohesion: 1.0
Nodes (0): 

### Community 20 - "Vite Entry"
Cohesion: 1.0
Nodes (0): 

### Community 21 - "Native Auth Submit"
Cohesion: 1.0
Nodes (0): 

### Community 22 - "Community 22"
Cohesion: 1.0
Nodes (0): 

### Community 23 - "Community 23"
Cohesion: 1.0
Nodes (0): 

### Community 24 - "Community 24"
Cohesion: 1.0
Nodes (0): 

### Community 25 - "Community 25"
Cohesion: 1.0
Nodes (0): 

### Community 26 - "Community 26"
Cohesion: 1.0
Nodes (0): 

### Community 27 - "Community 27"
Cohesion: 1.0
Nodes (0): 

### Community 28 - "Community 28"
Cohesion: 1.0
Nodes (0): 

### Community 29 - "Community 29"
Cohesion: 1.0
Nodes (0): 

### Community 30 - "Community 30"
Cohesion: 1.0
Nodes (0): 

### Community 31 - "Community 31"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "Community 32"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "Community 33"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "Community 34"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "Community 35"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "Community 36"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "Community 37"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "Community 38"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "Community 39"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "Community 40"
Cohesion: 1.0
Nodes (0): 

### Community 41 - "Community 41"
Cohesion: 1.0
Nodes (0): 

### Community 42 - "Community 42"
Cohesion: 1.0
Nodes (0): 

### Community 43 - "Community 43"
Cohesion: 1.0
Nodes (0): 

### Community 44 - "Community 44"
Cohesion: 1.0
Nodes (0): 

### Community 45 - "Community 45"
Cohesion: 1.0
Nodes (0): 

### Community 46 - "Community 46"
Cohesion: 1.0
Nodes (0): 

### Community 47 - "Community 47"
Cohesion: 1.0
Nodes (0): 

### Community 48 - "Community 48"
Cohesion: 1.0
Nodes (1): Document/File Icon

### Community 49 - "Community 49"
Cohesion: 1.0
Nodes (1): Globe Icon

### Community 50 - "Community 50"
Cohesion: 1.0
Nodes (1): Browser Window Icon

## Knowledge Gaps
- **9 isolated node(s):** `main.tsx Entry Module`, `create-next-app`, `Rupee Currency App Icon`, `Document/File Icon`, `Vercel Triangle Logo` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Auth Screen`** (2 nodes): `AuthScreen.tsx`, `AuthScreen()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Auth Toggle`** (2 nodes): `AuthToggle.tsx`, `AuthToggle()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Auth Form`** (2 nodes): `AuthForm.tsx`, `AuthForm()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Next Middleware`** (2 nodes): `middleware()`, `middleware.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Root Layout`** (2 nodes): `RootLayout()`, `layout.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Auth Form Submit`** (2 nodes): `handleSubmit()`, `AuthForm.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Currency Format`** (2 nodes): `formatCurrency()`, `format.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Dashboard Data Hook`** (2 nodes): `useDashboardData.ts`, `useDashboardData()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Dashboard State Hook`** (2 nodes): `useDashboardState.ts`, `useDashboardState()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Service Worker Register`** (2 nodes): `ServiceWorkerRegister.tsx`, `ServiceWorkerRegister()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vite Entry`** (2 nodes): `App.tsx`, `main.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Native Auth Submit`** (2 nodes): `handleSubmit()`, `Auth.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (1 nodes): `tailwind.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (1 nodes): `eslint.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (1 nodes): `vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (1 nodes): `postcss.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (1 nodes): `tailwind.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (1 nodes): `nativewind-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (1 nodes): `metro.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (1 nodes): `babel.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (1 nodes): `SocialButton.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (1 nodes): `FormField.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (1 nodes): `postcss.config.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (1 nodes): `tailwind.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (1 nodes): `eslint.config.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (1 nodes): `next.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (1 nodes): `sw.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (1 nodes): `types.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (1 nodes): `BalancePanel.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (1 nodes): `StartingBalanceModal.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (1 nodes): `TransactionSection.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (1 nodes): `TransactionList.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (1 nodes): `MonthHeader.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (1 nodes): `server.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (1 nodes): `sw.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (1 nodes): `vite-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (1 nodes): `TransactionList.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (1 nodes): `supabase.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (1 nodes): `Document/File Icon`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (1 nodes): `Globe Icon`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (1 nodes): `Browser Window Icon`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createSupabaseServerClient()` connect `Supabase Server & Pages` to `Balance Logic & API Routes`, `Rate Limiting`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `DELETE()` connect `Balance Logic & API Routes` to `Supabase Server & Pages`, `Rate Limiting`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `loadDashboardData()` connect `Dashboard UI & Handlers` to `Balance Logic & API Routes`, `Rate Limiting`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `POST()` (e.g. with `rateLimit()` and `createSupabaseServerClient()`) actually correct?**
  _`POST()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `DELETE()` (e.g. with `GET()` and `createSupabaseServerClient()`) actually correct?**
  _`DELETE()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `GET()` (e.g. with `rateLimit()` and `getUserFromCookies()`) actually correct?**
  _`GET()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `PUT()` (e.g. with `createSupabaseServerClient()` and `getUserFromCookies()`) actually correct?**
  _`PUT()` has 5 INFERRED edges - model-reasoned connections that need verification._