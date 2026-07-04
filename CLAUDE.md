# Project instructions — financial-tracker

## Git workflow
- **Never create a new branch. Work on `main` only.** Commit directly to `main`. Do not branch, even for plans, features, or fixes.

## Source of truth
- This codebase is the single source of truth. Never store plans, specs, or artifacts in scratchpad, Claude memory, or external/desktop locations — write them into the repo (e.g. `next-ver/specs/`).

## Keep specs current
- Specs in `next-ver/specs/` document the app **as built**, not as planned. They drift stale fast.
- **After shipping any feature (or a batch of related feature commits), update the affected spec files in the same or immediately following change.** A feature is not "done" until its spec reflects it.
- On each spec touch, update the "Reverse-engineered from …" file list and any changed API contracts / data model / UI behavior so the doc matches current code.
- Periodically re-audit: compare each spec's git last-modified date against recent `feat` commits. If features postdate the spec, the spec is backdated — reconcile it.
- New feature with no matching spec → create one from `next-ver/specs/SPEC_TEMPLATE.md`.
