---
description: Bring an API route up to the current CONVENTIONS (requireUser, rateLimit, shared responses, zod). 
argument-hint: <path-to-route.ts>
---

Migrate `$ARGUMENTS` to the current project conventions. Read `specs/CONVENTIONS.md` and the
reference route `src/app/api/credits/route.ts` first. Apply, preserving behavior + balance signs:

1. **Auth**: replace any inlined `getUserFromCookies` → fallback → 401 block with
   `const { userId } = await requireUser(supabase);` inside a try block.
2. **Errors**: import `handleError`, `tooManyRequests` from `@/lib/api/responses` (delete local
   copies). `catch (e) { return handleError(e); }` — use `handleError(e, 500)` for read routes.
3. **Rate limit**: add `rateLimit(request, "<resource>:<verb>", { limit, windowMs })` first;
   429 via `tooManyRequests` on `!ok`. Mutations limit 30, reads 60, per 60_000ms.
4. **Validation**: replace hand-rolled `if (!x)` body checks with `validate(<schema>, await
   request.json())` from `@/lib/api/schemas` (add a schema there if none fits). Keep inline
   checks for query params (`?id=`, `?month=`).
5. **Scope**: confirm `.eq("user_id", userId)` on every query; update/delete re-fetch first → 404.
6. **Balance**: `applyBalanceDelta` on mutations, correct sign.

After editing: `npx tsc --noEmit` and `npm run lint` must pass (the PostToolUse hook also runs
tsc). Then `npm test`. Run `graphify update .` from repo root. Report a before/after diff summary.
