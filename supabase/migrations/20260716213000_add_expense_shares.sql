-- Rozszerza wydatki bez zmiany znaczenia istniejących rekordów.
-- Stare wpisy nadal korzystają z expenses.split_among i równego podziału.
begin;

alter table public.expenses
add column if not exists created_by uuid references public.users(id) on delete set null;

comment on column public.expenses.created_by is
  'Uczestnik, który wpisał wydatek. user_id nadal oznacza osobę, która faktycznie zapłaciła.';

create table if not exists public.expense_shares (
  expense_id uuid not null references public.expenses(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete restrict,
  amount numeric(12, 2) not null check (amount > 0),
  created_at timestamptz not null default now(),
  primary key (expense_id, user_id)
);

comment on table public.expense_shares is
  'Jawne kwoty, które konkretne osoby mają oddać płatnikowi. Brak rekordów oznacza równy podział z expenses.split_among.';

create index if not exists expense_shares_user_idx
  on public.expense_shares(user_id, expense_id);

alter table public.expense_shares enable row level security;
revoke all on public.expense_shares from anon, authenticated;
grant select, insert, update, delete on public.expense_shares to service_role;

create or replace function public.create_expense_entry(
  p_trip_id uuid,
  p_payer_id uuid,
  p_created_by uuid,
  p_amount numeric,
  p_description text,
  p_split_among uuid[],
  p_shares jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_expense_id uuid;
  v_finance_mode text;
  v_share record;
  v_share_sum numeric := 0;
begin
  if p_amount <= 0 or p_amount > 1000000 then
    raise exception 'invalid expense amount';
  end if;

  if char_length(btrim(p_description)) not between 1 and 240 then
    raise exception 'invalid expense description';
  end if;

  if cardinality(p_split_among) < 2 or not (p_payer_id = any(p_split_among)) then
    raise exception 'invalid expense participants';
  end if;

  select trip.finance_mode
  into v_finance_mode
  from public.trips trip
  where trip.id = p_trip_id;

  if not found then
    raise exception 'trip not found';
  end if;

  if v_finance_mode = 'whole' and p_amount <> trunc(p_amount) then
    raise exception 'whole mode requires integer amounts';
  end if;

  if not exists (
    select 1 from public.users participant
    where participant.id = p_payer_id and participant.trip_id = p_trip_id
  ) or not exists (
    select 1 from public.users participant
    where participant.id = p_created_by and participant.trip_id = p_trip_id
  ) then
    raise exception 'payer or author does not belong to trip';
  end if;

  if exists (
    select 1
    from unnest(p_split_among) participant_id
    left join public.users participant
      on participant.id = participant_id and participant.trip_id = p_trip_id
    where participant.id is null
  ) then
    raise exception 'expense participant does not belong to trip';
  end if;

  if jsonb_typeof(p_shares) <> 'array' then
    raise exception 'expense shares must be an array';
  end if;

  for v_share in
    select share.user_id, share.amount
    from jsonb_to_recordset(p_shares) as share(user_id uuid, amount numeric)
  loop
    if v_share.user_id = p_payer_id
      or not (v_share.user_id = any(p_split_among))
      or v_share.amount <= 0
      or (v_finance_mode = 'whole' and v_share.amount <> trunc(v_share.amount))
    then
      raise exception 'invalid expense share';
    end if;

    v_share_sum := v_share_sum + v_share.amount;
  end loop;

  if v_share_sum > p_amount then
    raise exception 'expense shares exceed total amount';
  end if;

  insert into public.expenses (
    trip_id,
    user_id,
    created_by,
    amount,
    description,
    split_among,
    entry_type
  )
  values (
    p_trip_id,
    p_payer_id,
    p_created_by,
    p_amount,
    btrim(p_description),
    p_split_among,
    'expense'
  )
  returning id into v_expense_id;

  insert into public.expense_shares (expense_id, user_id, amount)
  select v_expense_id, share.user_id, share.amount
  from jsonb_to_recordset(p_shares) as share(user_id uuid, amount numeric);

  return v_expense_id;
end;
$$;

revoke all on function public.create_expense_entry(uuid, uuid, uuid, numeric, text, uuid[], jsonb)
  from public, anon, authenticated;
grant execute on function public.create_expense_entry(uuid, uuid, uuid, numeric, text, uuid[], jsonb)
  to service_role;

commit;
