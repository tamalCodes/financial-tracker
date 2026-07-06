-- Force EVERY client to unregister its service worker, delete all caches, and
-- reload once. Use after a deploy when returning users might still carry a stale
-- (legacy caching) service worker. This app caches nothing; the purge only
-- removes. See specs/features/app-control.md.
--
-- How it works: bumps app_control.purge_version. Each device compares it against
-- the value it last acted on and purges + reloads exactly once when it changes.
--
-- Run in the Supabase SQL editor, or: `npm run ops:purge-caches`.

update public.app_control
set purge_version = purge_version + 1,
    updated_at    = now()
where id = 1;

-- Confirm:
-- select purge_version, updated_at from public.app_control where id = 1;
