-- Migration 003 — Row Level Security + signup profile trigger
-- Decision: specs/features/backend-complete-checklist.md §A/§B.
--
-- Adds DB-level ownership (defense-in-depth on top of the query-layer .eq("user_id")).
-- Every table gets RLS with a single owner policy: auth.uid() must equal the row's user_id.
-- The server client (createServerClient) carries the user's auth cookie, so auth.uid()
-- resolves to the logged-in user and existing routes keep working unchanged.
--
-- Opening balance (D-A): at signup there is no session yet, so an anon-client profiles
-- insert would be blocked by RLS. Instead a SECURITY DEFINER trigger seeds profiles from
-- the signup metadata (raw_user_meta_data.opening_balance). The route passes that metadata.
--
-- Additive + idempotent. Safe to re-run.

begin;

-- 1) Owner policies (auth.uid() = user_id) on every per-user table -------------
do $$
declare
  t text;
  owned text[] := array[
    'credits','expenses','investments','bills',
    'holdings','sips','portfolio_totals','profiles','monthly_balances'
  ];
begin
  foreach t in array owned loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I on public.%I;', t || '_owner', t);
    execute format(
      'create policy %I on public.%I for all to authenticated '
      || 'using (auth.uid() = user_id) with check (auth.uid() = user_id);',
      t || '_owner', t
    );
  end loop;
end $$;

-- 2) Seed profiles on signup via SECURITY DEFINER trigger ---------------------
-- Runs as the function owner, bypassing RLS, so it works before the user has a session.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, opening_balance)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'opening_balance')::numeric, 0)
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

commit;
