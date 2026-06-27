# What's Left

Consolidated open work. Two tracks: design-system migration + agentic-coding readiness.
Full detail/log: [DESIGN_SYSTEM_MIGRATION.md](./DESIGN_SYSTEM_MIGRATION.md).

## Track A — Design system migration
- [ ] 0.1b — accessibility-review (touch targets 44px, glass contrast, focus) — DEFERRED by user
- [ ] 0.1c — design-critique (hierarchy/spacing) — DEFERRED by user
- [ ] 0.3 — mobile-standards section in DESIGN_SYSTEM.md (touch targets, breakpoints, safe-area). Doc only.
- [ ] 1.2 — screen-level drift fixes (VISUAL changes, needs user eye):
  - [ ] kill rings (#3): `ring-slate-900` ×6, `ring-indigo-500` ×1 in Dashboard/forms/auth/TransactionList → border
  - [ ] off-spec indigo shades (#5): ToggleCard `indigo-200/50/100`; Button `hover:bg-slate-800`; Modal `hover:bg-slate-100`; `slate-300`
  - [ ] migrate screens (Dashboard, forms, auth, TransactionList) to tokens (1.1 only did the 6 primitives)
- [ ] 1.3 — verify (react-best-practices + Claude_Preview mobile screenshots)
- [ ] document credit/expense/investment + glass tokens INTO DESIGN_SYSTEM.md (spec still omits them)

Done: 0.1a audit · 0.2 tokens · 1.1 primitives migrated · graphify refreshed.

## Track B — Agentic-coding readiness (closed write→verify→ship loop)
Priority: 🔴 blocks loop · 🟠 important · 🟡 nice

- [ ] 🔴 #1 Verify gate — add `typecheck` (`tsc --noEmit`) + `verify` (typecheck+lint+test+build) scripts
- [ ] 🔴 #2 Test coverage — only 2 test files vs ~60 src. Add component, auth, API-route tests
- [ ] 🔴 #3 Runtime/visual verification — no Playwright/E2E; wire core-flow smoke (login→dashboard→add txn) + screenshot recipe
- [ ] 🟠 #4 CI — `.github/workflows` running `verify` on push/PR
- [ ] 🟠 #5 Dual-app ambiguity — archive/delete legacy Vite root app, OR hard-document "next-ver only"
- [ ] 🟠 #6 Supabase integration — local DB/seed/migration runner so data-touching tests can run
- [ ] 🟡 #7 Permission friction — run fewer-permission-prompts to allowlist common commands

Fastest path to trust: #1 → #3 → #4.
