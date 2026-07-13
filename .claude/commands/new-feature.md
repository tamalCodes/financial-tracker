---
description: Scaffold a feature spec from SPEC_TEMPLATE, then implement it to CONVENTIONS.
argument-hint: <feature-name> [one-line idea]
---

Build a new feature for the app. `$ARGUMENTS` = feature name (+ optional idea).

## Steps
1. **Read context**: `AGENTS.md`, `specs/CONVENTIONS.md`, `specs/DATA_MODEL.md`,
   `specs/ARCHITECTURE.md`, and `specs/SPEC_TEMPLATE.md`. Skim a sibling spec in
   `specs/features/` closest to this feature.
2. **Write the spec**: create `specs/features/<name>.md` from `SPEC_TEMPLATE.md`. Fill every
   section. Answer from the specs/code — only ask the user about genuinely ambiguous product
   decisions, never about conventions you can derive.
3. **Confirm** the spec with the user before coding (show the API contract + files-to-touch).
4. **Implement** strictly to CONVENTIONS:
   - Types in `src/features/<feature>/types/types.ts`.
   - Route(s) `src/app/api/<name>/route.ts` — use the `/new-api-route` skeleton (rateLimit →
     validate → `requireUser` → user_id-scoped query → `applyBalanceDelta` → JSON; try/catch).
   - UI in `src/features/<feature>/{components,hooks}` (`"use client"` where stateful).
5. **Verify**: `user_id` scoping on every query, balance deltas correct, error shapes match.
6. Run `graphify update .` from the repo root.

The app lives at the repo root.
