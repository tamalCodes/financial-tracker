-- Force-log-out EVERY user. They stay logged out until they sign in again.
--
-- How it works: this stamps app_control.session_epoch with "now". Any session
-- (JWT) minted BEFORE this moment is then rejected on its next API request
-- (server-side, via requireUser) and the client logs itself out on its next
-- load / PWA foreground. See specs/features/app-control.md.
--
-- Safe + non-destructive: it deletes nothing. Users simply re-login. Re-running
-- it just re-stamps "now" (also logs out anyone who signed in since). To "undo",
-- there's nothing to undo — already-issued post-epoch sessions stay valid.
--
-- Run in the Supabase SQL editor, or: `npm run ops:logout-all`.

update public.app_control
set session_epoch = extract(epoch from now())::bigint,
    updated_at    = now()
where id = 1;

-- Confirm:
-- select session_epoch, to_timestamp(session_epoch) as effective_from, updated_at
-- from public.app_control where id = 1;
