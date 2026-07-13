-- Migration 011 — monthly SIP payment batches.
--
-- A payment updates the reference portfolio atomically.  Optionally it also
-- creates one investment-flow row, which is what deducts money from Left in bank.

begin;

create table if not exists public.sip_payments (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  sip_id          uuid not null references public.sips (id) on delete cascade,
  month           text not null,
  amount          numeric not null check (amount > 0),
  debited_balance boolean not null default true,
  created_at      timestamptz not null default now(),
  unique (sip_id, month)
);
create index if not exists sip_payments_user_month_idx on public.sip_payments (user_id, month);

alter table public.sip_payments enable row level security;
drop policy if exists sip_payments_owner on public.sip_payments;
create policy sip_payments_owner on public.sip_payments for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.record_sip_payments(
  p_month text,
  p_sip_ids uuid[],
  p_debit_balance boolean
)
returns table(total numeric, paid_count integer)
language plpgsql
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_total numeric := 0;
  v_count integer := 0;
  v_sip record;
  v_holding_id uuid;
begin
  if v_user is null then raise exception 'Not authenticated'; end if;
  if p_month !~ '^\\d{4}-\\d{2}-01$' then raise exception 'Invalid month'; end if;
  if coalesce(array_length(p_sip_ids, 1), 0) = 0 then raise exception 'Choose at least one SIP'; end if;

  -- Lock each selected SIP before checking its one-payment-per-month record.
  for v_sip in
    select id, name, monthly from sips
    where user_id = v_user and id = any(p_sip_ids)
    order by id for update
  loop
    if exists (select 1 from sip_payments where sip_id = v_sip.id and month = p_month) then
      raise exception 'One or more selected SIPs are already recorded for this month';
    end if;

    insert into sip_payments (user_id, sip_id, month, amount, debited_balance)
    values (v_user, v_sip.id, p_month, v_sip.monthly, p_debit_balance);
    update sips set paid_total = paid_total + v_sip.monthly where id = v_sip.id;

    -- A SIP whose fund is not yet a holding starts one automatically.
    select id into v_holding_id from holdings
    where user_id = v_user and kind = 'mutual_fund'
      and lower(trim(name)) = lower(trim(v_sip.name))
    order by created_at limit 1 for update;
    if v_holding_id is null then
      insert into holdings (user_id, kind, name, current_value)
      values (v_user, 'mutual_fund', v_sip.name, v_sip.monthly);
    else
      update holdings set current_value = current_value + v_sip.monthly
      where id = v_holding_id;
    end if;

    v_total := v_total + v_sip.monthly;
    v_count := v_count + 1;
  end loop;

  if v_count <> cardinality(p_sip_ids) then
    raise exception 'One or more SIPs were not found';
  end if;

  insert into portfolio_totals (user_id, value) values (v_user, v_total)
  on conflict (user_id) do update set value = portfolio_totals.value + excluded.value;

  if p_debit_balance then
    insert into investments (user_id, month, description, amount)
    values (v_user, p_month, 'SIPs', v_total);
  end if;

  return query select v_total, v_count;
end;
$$;

commit;
