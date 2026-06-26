---
description: Audit the balance invariant across the codebase — delta signs, applyBalanceDelta coverage, recompute paths.
---

Verify the balances logic of the next-ver app holds. Read `specs/DATA_MODEL.md` (invariant),
`specs/CONVENTIONS.md` §4, `src/lib/api/balances.ts`, `src/lib/api/dashboard.ts`, and every
mutating route under `src/app/api/{credits,expenses,investments,balances}`.

Check and report (one line per finding):
1. **Invariant**: `closing = starting + Σcredits − Σexpenses − Σinvestments` in
   `calculateClosingBalance`.
2. **Delta coverage**: every create/update/delete calls `applyBalanceDelta` (or
   `updateClosingBalance`). Flag any mutation that doesn't.
3. **Signs** (CONVENTIONS §4): credit create `+`, expense/investment create `−`; credit PUT
   `new−old`, expense PUT `old−new`; deletes reverse; investment delete is soft + `+amount`.
4. **Month target**: delta applied to the row's own `month`/`start_month`, not always
   `currentMonth`.
5. **Self-heal**: `loadDashboardData` recomputes + rewrites closing on drift.

Then run `npm test` and report pass/fail. End with `VERDICT: PASS` or `VERDICT: FAIL — <list>`.
Read-only audit — do not edit unless asked.
