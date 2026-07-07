-- Migration 010 - Persist last successful login time on profiles.
--
-- `last_login_at` is updated by POST /api/auth/login after Supabase accepts the
-- password. Operators can use it as an audit/control signal alongside
-- app_control.session_epoch, whose value still performs the actual global
-- force-logout.

begin;

alter table public.profiles
  add column if not exists last_login_at timestamptz;

commit;
