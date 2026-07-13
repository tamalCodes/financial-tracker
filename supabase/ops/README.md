# Operator commands — app_control

DB-driven levers for the whole user base. Backed by the singleton `app_control`
row (migration `009_app_control.sql`). Full design: `specs/features/app-control.md`.

Everything here is **non-destructive** — it deletes no user data. Worst case a
user re-logs-in or their browser rebuilds from network.

## Log out all users

Invalidates every existing session. Users are bounced to login and can sign
back in immediately (their credentials are unchanged).

- One command: `npm run ops:logout-all`
- Or run [`logout-all-users.sql`](./logout-all-users.sql) in the Supabase SQL editor.

When it takes effect:
- **Server**: next API request from an old session → `401` (instant).
- **Client**: next app load or PWA foreground → auto sign-out (seconds).

## Force a cache purge

Makes every device unregister its service worker, delete all caches, and reload
once. Use after a deploy if returning users might carry a stale service worker.

- One command: `npm run ops:purge-caches`
- Or run [`force-cache-purge.sql`](./force-cache-purge.sql) in the SQL editor.

## How the npm scripts reach prod

[`run.sh`](./run.sh) reads `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` from
`.env` (repo root) and PATCHes the row over the REST API with the service-role key
(bypasses RLS). No extra login needed. These hit **production** — the row is the
same one the linked remote project serves.

## Confirm current state

```sql
select session_epoch,
       to_timestamp(session_epoch) as logout_effective_from,
       purge_version,
       updated_at
from public.app_control where id = 1;
```

`session_epoch = 0` and `purge_version = 0` is the neutral/armed state: nothing
killed, no purge outstanding.
