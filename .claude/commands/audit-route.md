---
description: Audit an API route against CONVENTIONS.md and report violations.
argument-hint: <path-to-route.ts>
---

Read `specs/CONVENTIONS.md`, then audit `$ARGUMENTS` (an API route file). Read-only — do NOT
edit unless the user asks. Report findings, one line each, format:

`<line>: <severity> — <violation>. <fix>.`   (severity: 🔴 must / 🟡 should / 🔵 nit)

Check each rule:
1. **Auth** (§1): uses `requireUser(supabase)` in try/catch; catch re-returns `NextResponse`
   (`if (e instanceof NextResponse) return e`). Flag inlined old `getUserFromCookies` blocks.
2. **Error/response shape** (§2): `NextResponse.json({ error }, { status })`; correct codes
   (400/401/404/429/500); success `{ item, balance }` / `{ ok: true, balance }`.
3. **Rate limit** (§3): `rateLimit(...)` first, 429 + `Retry-After` on `!ok`. Flag if absent.
4. **Balance delta** (§4): `applyBalanceDelta` on every mutation, correct sign; update/delete
   re-fetch existing row before reversing.
5. **user_id scoping** (§5): `.eq("user_id", userId)` on every select/update/delete.
6. **Validation** (§6): required fields → 400 before any DB call; `Number`/`Boolean` coercion.
7. **Style** (§7): `@/` imports, `route.ts` exports, month-key handling.

End with a one-line verdict: `PASS` (no 🔴) or `FAIL: N must-fix`. Suggest `/new-api-route`
patterns for fixes. Scope to the repo root only.
