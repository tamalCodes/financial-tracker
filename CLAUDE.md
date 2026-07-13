# Project instructions — financial-tracker

## Git workflow
- **Never create a new branch. Work on `main` only.** Commit directly to `main`. Do not branch, even for plans, features, or fixes.

## Source of truth
- This codebase is the single source of truth. Never store plans, specs, or artifacts in scratchpad, Claude memory, or external/desktop locations — write them into the repo (e.g. `specs/`).

## Supabase migrations (apply these yourself, don't hand them back)
- The Supabase CLI is installed and the project is already linked (`supabase/.temp/linked-project.json`, project ref `zbjqcdkjgycxqqfazscl`), authenticated via the user's stored CLI login. So a pending migration can be applied without asking the user to do it.
- All commands run from the repo root (the dir holding `supabase/`).
- Whenever you add a `supabase/migrations/NNN_*.sql` file, apply it as part of the same task:
  1. `supabase migration list` — shows Local vs Remote; any migration with a Local number but blank Remote is pending.
  2. `supabase db push` — applies every pending migration to the remote database. Migrations are written idempotently (`create table if not exists`, `create or replace function`, `drop policy if exists`), so re-running is safe.
  3. `supabase migration list` again — confirm the new number now appears under both Local and Remote.
- Also mirror the change into `supabase/schema.sql` (the canonical full-schema snapshot) in the same commit, then commit both the migration and the schema update to `main`.
- If a command fails with an auth/login error, the stored CLI token has expired — ask the user to run `supabase login` (and, if needed, `supabase link`) in their terminal, then retry. Never ask the user to paste tokens or DB passwords into chat.

## Spec-first (read before coding)
- **Before writing or searching code, consult `specs/` first.** Start at `specs/INDEX.md` — grep it, match the task to a feature row, open that spec, then jump straight to the code files it lists ("Reverse-engineered from"). This is faster than blind code search.
- A `UserPromptSubmit` hook (`.claude/hooks/inject-spec-index.sh`) auto-injects the index each prompt, so the map is always in context.
- Keep `INDEX.md` current: when a feature's files move or a new spec is added, update the matching index row in the same change.

## Keep specs current
- Specs in `specs/` document the app **as built**, not as planned. They drift stale fast.
- **After shipping any feature (or a batch of related feature commits), update the affected spec files in the same or immediately following change.** A feature is not "done" until its spec reflects it.
- On each spec touch, update the "Reverse-engineered from …" file list and any changed API contracts / data model / UI behavior so the doc matches current code.
- Periodically re-audit: compare each spec's git last-modified date against recent `feat` commits. If features postdate the spec, the spec is backdated — reconcile it.
- New feature with no matching spec → create one from `specs/SPEC_TEMPLATE.md`.
