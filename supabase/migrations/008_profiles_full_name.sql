-- Migration 008 — Full name on profiles (D-A)
-- The greeting shows the user's first name (and the avatar their initials), captured
-- once at signup alongside the opening balance. full_name also rides in the JWT
-- user_metadata, so /me reads the display name without hitting this table — profiles
-- keeps a durable copy for server-side use.
--
-- Additive + non-destructive. Safe to re-run (idempotent guards).

begin;

alter table public.profiles
  add column if not exists full_name text;

-- Re-seed the signup trigger to also persist full_name from raw_user_meta_data.
-- Runs as the function owner (SECURITY DEFINER), bypassing RLS pre-session.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, opening_balance, full_name)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'opening_balance')::numeric, 0),
    nullif(trim(new.raw_user_meta_data->>'full_name'), '')
  )
  on conflict (user_id) do update
    set full_name = coalesce(excluded.full_name, public.profiles.full_name);
  return new;
end;
$$;

commit;
