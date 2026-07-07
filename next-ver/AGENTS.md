# AGENTS.md - Financial Tracker (next-ver)

Personal finance PWA: users track monthly **credits** (income), **expenses**, and
**investments**; the app maintains a running **monthly balance** (starting → closing)
per user, per month, with optional carry-forward of recurring items into the next month.
This `next-ver/` folder is the production rewrite (Next.js 16 App Router) of the legacy
Vite app at the repo root - **never touch the root `src/`**.

## Stack
- Next.js **16.1.1** (App Router, RSC) · React **19.2.3**
- Supabase (`@supabase/ssr` 0.8, `@supabase/supabase-js` 2.90) - auth + Postgres
- `jose` 6 (JWT verify) · Tailwind 4 · lucide-react · TypeScript 5

## Directory map
- `src/app/` - App Router pages. `(auth)/` login+signup, `(app)/dashboard`, root `page.tsx`.
- `src/app/api/` - route handlers. `auth/*` (login/signup/logout/me), `credits`, `expenses`, `investments`, `dashboard`, `balances`.
- `src/features/auth/` - `AuthContext` (client), `components/AuthForm`.
- `src/features/dashboard/` - `Dashboard.tsx`, `components/`, `hooks/` (`useDashboardData`, `useDashboardState`), `types/types.ts`, `utils/` (`dates`, `format`).
- `src/features/pwa/`, `src/features/shared/` - service-worker registration, shared hooks.
- `src/lib/supabase/` - `cookies.ts` (SSR client, typed `<Database>`), `auth.ts` (`getUserFromCookies`, `requireUser`), `server.ts` (service-role client), `database.types.ts` (generated/best-effort DB types).
- `src/lib/api/` - `balances.ts` (balance math + `*.test.ts`), `dashboard.ts` (`loadDashboardData`), `rateLimit.ts`, `responses.ts` (`handleError`/`tooManyRequests`), `schemas.ts` (zod request schemas + `validate`).
- `src/middleware.ts` - refreshes the Supabase session on every non-`/api` request.
- `supabase/schema.sql` - reverse-engineered DB schema (verify against live project).
- `.claude/` - `commands/` (slash commands), `agents/` (subagents), `hooks/` + `settings.json` (auto typecheck on edit, graphify on stop, permission allowlist).
- `.codex/` - Codex project hooks and local agent setup at the repo root; root `AGENTS.md` is the Codex entry point.

## Read order for any task
1. **This file** (AGENTS.md).
2. The matching spec in **`specs/features/<feature>.md`** (+ `specs/DATA_MODEL.md` if touching tables, `specs/ARCHITECTURE.md` for request flow, `specs/DECISIONS.md` for *why* before changing odd-looking code).
3. **`specs/CONVENTIONS.md`** - copy-pasteable patterns. Follow exactly.

New feature with no spec yet → start from `specs/SPEC_TEMPLATE.md` (or run `/new-feature`).

## Golden rules
1. **Scope every query by `user_id`**: `.eq("user_id", userId)` on select/update/delete.
2. **Auth-guard every protected route** with `requireUser(supabase)` (CONVENTIONS §1).
3. **Keep balances in sync**: call `applyBalanceDelta` on every credit/expense/investment mutation with the correct sign (credit +, expense/investment −; reverse on delete).
4. **Error shape**: `NextResponse.json({ error }, { status })` - 400 validation, 401 unauth, 404 not found, 429 rate-limited, 500 unexpected.
5. **Validate first**: missing required field → `400 { error: "Missing fields." }` before any DB call.
6. **Rate-limit** new routes with `rateLimit()` (legacy data routes lack it - add it when you touch them).
7. **`@/` imports only** - no deep relative paths across features.
8. **Never touch the legacy Vite app** in the repo-root `src/`.

## How to add a feature
1. Write `specs/features/<name>.md` from `specs/SPEC_TEMPLATE.md` (or run `/new-feature <name>`).
2. Add/extend types in `src/features/<feature>/types/types.ts`.
3. Add the API route(s) under `src/app/api/<name>/` (see below, or run `/new-api-route <name>`).
4. Build UI in `src/features/<feature>/` (`components/`, `hooks/`); client components need `"use client"`.
5. Wire data via a hook like `useDashboardData` (optimistic upsert/remove + `reload`).

## How to add an API route
1. Create `src/app/api/<name>/route.ts`.
2. `rateLimit(request, "<name>:<verb>", { limit, windowMs })` → 429 on `!ok`.
3. Parse body; validate required fields → 400.
4. `const supabase = await createSupabaseServerClient();`
5. Inside `try`: `const { userId } = await requireUser(supabase);` (throws a 401 `NextResponse`).
6. DB op scoped by `userId`; on a mutation call `applyBalanceDelta` with the correct sign.
7. Validate the body with `validate(<schema>, await request.json())` from `@/lib/api/schemas`.
8. Return `NextResponse.json({ item, balance })` (or `{ ok: true, balance }`).
9. `catch (e) { return handleError(e); }` (`handleError(e, 500)` for read routes).

## Verify before done
- `npx tsc --noEmit` and `npm run lint` - must be clean. (A PostToolUse hook auto-runs tsc on every `.ts` edit and blocks on errors.)
- `npm test` - vitest; balance math is covered in `src/lib/api/balances.test.ts`.
- `npm run build` for a full check before shipping.

---
*After editing code, run `graphify update .` from the repo root (a Stop hook also does this automatically).*
