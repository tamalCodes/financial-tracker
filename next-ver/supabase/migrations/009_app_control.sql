-- Migration 009 — app_control: DB-driven kill switch + cache-purge broadcast
--
-- One singleton row the server reads to answer two questions:
--   session_epoch  — unix seconds. Any session whose JWT `iat` is OLDER than this
--                    is treated as logged out. Bump it to "now" to force-logout
--                    every active user on their next request/app-open.
--   purge_version  — bump to make every client unregister its service worker,
--                    delete all caches, and reload (evicts the legacy caching SW
--                    that some returning users still carry). We cache nothing.
--
-- Operator commands (run in the Supabase SQL editor):
--   -- log out ALL users now:
--   update public.app_control set session_epoch = extract(epoch from now())::bigint,
--     updated_at = now() where id = 1;
--   -- force every client to purge old SW/caches and reload:
--   update public.app_control set purge_version = purge_version + 1,
--     updated_at = now() where id = 1;
--
-- Additive + idempotent. Safe to re-run.

begin;

create table if not exists public.app_control (
  id            smallint primary key default 1,
  session_epoch bigint      not null default 0,
  purge_version integer     not null default 0,
  updated_at    timestamptz not null default now(),
  constraint app_control_singleton check (id = 1)
);

insert into public.app_control (id) values (1) on conflict (id) do nothing;

-- RLS on, NO policies: only the service-role server client (which bypasses RLS)
-- ever reads or writes this row. Browsers reach it only through /api/app-control,
-- so anon/authenticated clients get zero direct access.
alter table public.app_control enable row level security;

commit;
