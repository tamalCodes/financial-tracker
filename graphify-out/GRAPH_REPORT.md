# Graph Report - /Users/tamalcodes/Gh/financial-tracker  (2026-06-27)

## Corpus Check
- 86 files · ~55,095 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 213 nodes · 229 edges · 62 communities detected
- Extraction: 71% EXTRACTED · 29% INFERRED · 0% AMBIGUOUS · INFERRED: 66 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
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
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]

## God Nodes (most connected - your core abstractions)
1. `POST()` - 16 edges
2. `PUT()` - 13 edges
3. `DELETE()` - 13 edges
4. `GET()` - 11 edges
5. `evaluateExpression()` - 11 edges
6. `getUserFromCookies()` - 8 edges
7. `createSupabaseServerClient()` - 8 edges
8. `loadDashboardData()` - 8 edges
9. `requireUser()` - 6 edges
10. `rateLimit()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Financial Tracker (Vite App Shell)` --conceptually_related_to--> `Rupee Currency App Icon (root public)`  [INFERRED]
  index.html → public/icon.svg
- `Google Fonts (Bricolage Grotesque, Inter)` --semantically_similar_to--> `next/font and Geist Font`  [INFERRED] [semantically similar]
  index.html → next-ver/README.md
- `Rupee Currency App Icon` --semantically_similar_to--> `Rupee Currency App Icon (root public)`  [INFERRED] [semantically similar]
  next-ver/public/icon.svg → public/icon.svg
- `Home()` --calls--> `useAuth()`  [INFERRED]
  next-ver/src/app/page.tsx → src/contexts/AuthContext.tsx
- `DashboardPage()` --calls--> `createSupabaseServerClient()`  [INFERRED]
  next-ver/src/app/(app)/dashboard/page.tsx → /Users/tamalcodes/Gh/financial-tracker/next-ver/src/lib/supabase/cookies.ts

## Hyperedges (group relationships)
- **PWA App Shell (Vite Financial Tracker)** — index_financial_tracker, index_service_worker, index_pwa_manifest, index_main_tsx [INFERRED 0.85]
- **Next.js / Vercel Branding Stack** — readme_nextjs_project, readme_vercel_platform, next_wordmark_logo, vercel_triangle_logo [INFERRED 0.75]

## Communities

### Community 0 - "Community 0"
Cohesion: 0.12
Nodes (19): extractAccessToken(), getProjectRef(), getUserFromCookies(), requireUser(), applyBalanceDelta(), calculateClosingBalance(), createStartingBalance(), updateClosingBalance() (+11 more)

### Community 1 - "Community 1"
Cohesion: 0.1
Nodes (14): ensureCarryForwardCredits(), ensureCarryForwardExpenses(), formatMonthKey(), getNextMonth(), getPreviousMonth(), handleChangeMonth(), handleCloseStartingBalanceForm(), handleOpenStartingBalanceForm() (+6 more)

### Community 2 - "Community 2"
Cohesion: 0.16
Nodes (14): Rupee Currency App Icon, Rupee Currency App Icon (root public), Financial Tracker (Vite App Shell), Google Fonts (Bricolage Grotesque, Inter), main.tsx Entry Module, PWA Web App Manifest, Service Worker (sw.js) Registration, Next.js Wordmark Logo (+6 more)

### Community 3 - "Community 3"
Cohesion: 0.22
Nodes (9): handleSubmit(), handleSubmit(), applyUnary(), evalRpn(), evaluateExpression(), normalize(), tokenize(), toRpn() (+1 more)

### Community 4 - "Community 4"
Cohesion: 0.19
Nodes (6): cancelTimers(), decimalsOf(), handleBlur(), resetPhase(), startReveal(), isCalculation()

### Community 5 - "Community 5"
Cohesion: 0.17
Nodes (6): AuthProvider(), useAuth(), CreditForm(), ExpenseForm(), InvestmentForm(), Home()

### Community 6 - "Community 6"
Cohesion: 0.25
Nodes (4): createSupabaseServerClient(), DashboardPage(), LoginPage(), SignupPage()

### Community 7 - "Community 7"
Cohesion: 0.6
Nodes (3): formatMonthKey(), parseMonthKey(), shiftMonthKey()

### Community 8 - "Community 8"
Cohesion: 0.6
Nodes (3): add(), handleKeyDown(), removeAt()

### Community 9 - "Community 9"
Cohesion: 0.4
Nodes (0): 

### Community 10 - "Community 10"
Cohesion: 0.67
Nodes (4): Android Adaptive Icon (Expo Placeholder), Favicon 3D Cube Logo, App Icon (Expo Placeholder), Splash Screen Icon (Expo Placeholder)

### Community 11 - "Community 11"
Cohesion: 0.67
Nodes (1): App()

### Community 12 - "Community 12"
Cohesion: 0.67
Nodes (1): useLockBodyScroll()

### Community 13 - "Community 13"
Cohesion: 1.0
Nodes (0): 

### Community 14 - "Community 14"
Cohesion: 1.0
Nodes (0): 

### Community 15 - "Community 15"
Cohesion: 1.0
Nodes (0): 

### Community 16 - "Community 16"
Cohesion: 1.0
Nodes (0): 

### Community 17 - "Community 17"
Cohesion: 1.0
Nodes (0): 

### Community 18 - "Community 18"
Cohesion: 1.0
Nodes (0): 

### Community 19 - "Community 19"
Cohesion: 1.0
Nodes (0): 

### Community 20 - "Community 20"
Cohesion: 1.0
Nodes (0): 

### Community 21 - "Community 21"
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
Nodes (0): 

### Community 49 - "Community 49"
Cohesion: 1.0
Nodes (0): 

### Community 50 - "Community 50"
Cohesion: 1.0
Nodes (0): 

### Community 51 - "Community 51"
Cohesion: 1.0
Nodes (0): 

### Community 52 - "Community 52"
Cohesion: 1.0
Nodes (0): 

### Community 53 - "Community 53"
Cohesion: 1.0
Nodes (0): 

### Community 54 - "Community 54"
Cohesion: 1.0
Nodes (0): 

### Community 55 - "Community 55"
Cohesion: 1.0
Nodes (0): 

### Community 56 - "Community 56"
Cohesion: 1.0
Nodes (0): 

### Community 57 - "Community 57"
Cohesion: 1.0
Nodes (0): 

### Community 58 - "Community 58"
Cohesion: 1.0
Nodes (0): 

### Community 59 - "Community 59"
Cohesion: 1.0
Nodes (1): Document/File Icon

### Community 60 - "Community 60"
Cohesion: 1.0
Nodes (1): Globe Icon

### Community 61 - "Community 61"
Cohesion: 1.0
Nodes (1): Browser Window Icon

## Knowledge Gaps
- **9 isolated node(s):** `main.tsx Entry Module`, `create-next-app`, `Rupee Currency App Icon`, `Document/File Icon`, `Vercel Triangle Logo` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 13`** (2 nodes): `AuthScreen.tsx`, `AuthScreen()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (2 nodes): `AuthToggle.tsx`, `AuthToggle()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 15`** (2 nodes): `AuthForm.tsx`, `AuthForm()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (2 nodes): `middleware()`, `middleware.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (2 nodes): `RootLayout()`, `layout.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (2 nodes): `handleSubmit()`, `AuthForm.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (2 nodes): `Field()`, `Field.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (2 nodes): `Button()`, `Button.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (2 nodes): `onKey()`, `Modal.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (2 nodes): `formatCurrency()`, `format.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (2 nodes): `useDashboardData.ts`, `useDashboardData()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (2 nodes): `useDashboardState.ts`, `useDashboardState()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (2 nodes): `ServiceWorkerRegister.tsx`, `ServiceWorkerRegister()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (2 nodes): `App.tsx`, `main.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (2 nodes): `handleSubmit()`, `Auth.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (1 nodes): `tailwind.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (1 nodes): `eslint.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (1 nodes): `vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (1 nodes): `postcss.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (1 nodes): `tailwind.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (1 nodes): `nativewind-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (1 nodes): `metro.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (1 nodes): `babel.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (1 nodes): `SocialButton.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (1 nodes): `FormField.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (1 nodes): `postcss.config.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (1 nodes): `next-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (1 nodes): `tailwind.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (1 nodes): `vitest.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (1 nodes): `eslint.config.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (1 nodes): `next.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (1 nodes): `sw.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (1 nodes): `ToggleCard.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (1 nodes): `types.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (1 nodes): `expression.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (1 nodes): `BalancePanel.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (1 nodes): `StartingBalanceModal.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (1 nodes): `TransactionSection.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (1 nodes): `TransactionList.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (1 nodes): `MonthHeader.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (1 nodes): `database.types.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (1 nodes): `server.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (1 nodes): `sw.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (1 nodes): `vite-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 57`** (1 nodes): `TransactionList.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 58`** (1 nodes): `supabase.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 59`** (1 nodes): `Document/File Icon`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 60`** (1 nodes): `Globe Icon`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 61`** (1 nodes): `Browser Window Icon`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `evaluateExpression()` connect `Community 3` to `Community 1`, `Community 4`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Why does `handleUpdateStartingBalance()` connect `Community 1` to `Community 3`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Why does `updateClosingBalance()` connect `Community 1` to `Community 0`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `POST()` (e.g. with `rateLimit()` and `createSupabaseServerClient()`) actually correct?**
  _`POST()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **Are the 10 inferred relationships involving `PUT()` (e.g. with `rateLimit()` and `tooManyRequests()`) actually correct?**
  _`PUT()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **Are the 10 inferred relationships involving `DELETE()` (e.g. with `rateLimit()` and `tooManyRequests()`) actually correct?**
  _`DELETE()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **Are the 9 inferred relationships involving `GET()` (e.g. with `rateLimit()` and `getUserFromCookies()`) actually correct?**
  _`GET()` has 9 INFERRED edges - model-reasoned connections that need verification._