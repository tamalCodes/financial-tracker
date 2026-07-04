# <Feature Title>

> Copy this file to `specs/features/<name>.md` and fill every section. Delete this quote block.
> Keep it terse — bullets and tables over prose. Cite real files where a pattern already exists.

## Problem
What user need / gap this solves. 1–3 sentences.

## Data model touched
Tables, columns, new fields. Reference `specs/DATA_MODEL.md`; mark any new/inferred columns.
Note the balance-delta impact (does this mutation change `monthly_balances`?).

## API contract
For each route (`<METHOD> /api/<path>`):
- **Request**: body / query params, required vs optional.
- **Response**: success shape (`{ item }` / `{ ok: true }` / custom). No `balance` object (D13).
- **Errors**: status → meaning (400 validation, 401 unauth, 404 not found, 429 limited, 500).
- **Rate limit**: prefix + `{ limit, windowMs }`.
- **Money-model effect**: which tile(s) / Left-in-bank it feeds — computed on read, never a balance
  write (CONVENTIONS §4, D13).

## UI / components
Pages, components, hooks. New vs reused. Client (`"use client"`) or server? State flow
(which hook owns what, optimistic vs reload).

## Acceptance criteria
- [ ] Bullet, testable, user-visible outcome.
- [ ] user_id scoping enforced on every query.
- [ ] balances stay correct after create/update/delete.
- [ ] rate limit + validation + error shapes per CONVENTIONS.

## Files to touch
`path` — what changes. (routes, types, hooks, components.)

## Out of scope
Explicitly excluded, to prevent scope creep.
