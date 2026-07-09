# Project instructions - financial-tracker

## Codex instruction locations
- Global Codex instructions live at `/Users/tamalcodes/.codex/AGENTS.md`.
- Repo Codex instructions live in this `AGENTS.md`.
- More specific `AGENTS.md` files, such as `next-ver/AGENTS.md`, add local rules for their subtree.
- This repo is already configured for Codex through `.codex/hooks.json` and `.codex/hooks/inject-spec-index.sh`.
- Keep Claude-facing rules in `CLAUDE.md` and Codex-facing rules in `AGENTS.md`; mirror only rules that should apply to both tools.

## Git workflow
- **Never create a new branch. Work on `main` only.** Commit directly to `main`. Do not branch, even for plans, features, or fixes.
- **Do not commit or push without explicit user approval in the current turn.**
- Show the exact changed files and intended commit message first.
- Wait for the user to say to commit and push before running `git commit` or `git push`.

## Source of truth
- This codebase is the single source of truth.
- Never store plans, specs, or artifacts in scratchpad, Codex memory, or external/desktop locations.
- Write project artifacts into the repo, for example under `next-ver/specs/`.

## Spec-first (read before coding)
- **Before writing or searching code, consult `next-ver/specs/` first.**
- Start at `next-ver/specs/INDEX.md`, grep it, match the task to a feature row, open that spec, then jump straight to the code files it lists ("Reverse-engineered from").
- This is faster than blind code search.
- A `UserPromptSubmit` hook (`.codex/hooks/inject-spec-index.sh`) auto-injects the index each prompt when Codex hooks are active, so the map is always in context.
- Keep `INDEX.md` current: when a feature's files move or a new spec is added, update the matching index row in the same change.

## Keep specs current
- Specs in `next-ver/specs/` document the app **as built**, not as planned. They drift stale fast.
- **After shipping any feature (or a batch of related feature commits), update the affected spec files in the same or immediately following change.** A feature is not "done" until its spec reflects it.
- On each spec touch, update the "Reverse-engineered from …" file list and any changed API contracts / data model / UI behavior so the doc matches current code.
- Periodically re-audit: compare each spec's git last-modified date against recent `feat` commits.
- If features postdate the spec, the spec is backdated; reconcile it.
- New feature with no matching spec: create one from `next-ver/specs/SPEC_TEMPLATE.md`.
