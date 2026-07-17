-- Additive foundation for archived/read-only trips, auditable finance corrections
-- and participant-specific packing lists. Existing trips remain active and all
-- existing expense rows keep their current meaning.

begin;

alter table public.trips
add column if not exists status text,
add column if not exists closed_at timestamptz,
add column if not exists closed_by uuid references public.users(id) on delete set null,
add column if not exists packing_presets jsonb;

update public.trips
set status = 'active'
where status is null;

update public.trips
set packing_presets = '["essentials"]'::jsonb
where packing_presets is null;

alter table public.trips
alter column status set default 'active',
alter column status set not null,
alter column packing_presets set default '["essentials"]'::jsonb,
alter column packing_presets set not null;

alter table public.trips
drop constraint if exists trips_status_check;

alter table public.trips
add constraint trips_status_check
check (status in ('active', 'closed'));

alter table public.trips
drop constraint if exists trips_packing_presets_array_check;

alter table public.trips
add constraint trips_packing_presets_array_check
check (jsonb_typeof(packing_presets) = 'array');

comment on column public.trips.status is
  'active = normal use, closed = read-only archive that can be reopened by a trip manager.';
comment on column public.trips.packing_presets is
  'Stable preset keys selected by a trip manager. Participants may customize their own resulting list.';

create table if not exists public.trip_status_events (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  changed_by uuid references public.users(id) on delete set null,
  status text not null check (status in ('active', 'closed')),
  created_at timestamptz not null default now()
);

create index if not exists trip_status_events_trip_created_idx
  on public.trip_status_events(trip_id, created_at desc);

alter table public.trip_status_events enable row level security;
revoke all on public.trip_status_events from anon, authenticated;
grant select, insert on public.trip_status_events to service_role;

alter table public.expenses
add column if not exists deleted_at timestamptz,
add column if not exists deleted_by uuid references public.users(id) on delete set null;

create index if not exists expenses_trip_visible_idx
  on public.expenses(trip_id, created_at desc)
  where deleted_at is null;

create table if not exists public.expense_revisions (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses(id) on delete cascade,
  trip_id uuid not null references public.trips(id) on delete cascade,
  changed_by uuid references public.users(id) on delete set null,
  action text not null check (action in ('updated', 'deleted', 'restored')),
  previous_data jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists expense_revisions_expense_created_idx
  on public.expense_revisions(expense_id, created_at desc);

alter table public.expense_revisions enable row level security;
revoke all on public.expense_revisions from anon, authenticated;
grant select, insert on public.expense_revisions to service_role;

comment on table public.expense_revisions is
  'Immutable audit trail for manager corrections and soft deletion of finance entries.';

create table if not exists public.packing_item_states (
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  item_key text not null check (char_length(item_key) between 1 and 160),
  is_checked boolean not null default false,
  is_hidden boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (trip_id, user_id, item_key)
);

create index if not exists packing_item_states_user_idx
  on public.packing_item_states(user_id, updated_at desc);

alter table public.packing_item_states enable row level security;
revoke all on public.packing_item_states from anon, authenticated;
grant select, insert, update, delete on public.packing_item_states to service_role;

create table if not exists public.packing_personal_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  label text not null check (char_length(btrim(label)) between 1 and 120),
  category text not null default 'Moje rzeczy'
    check (char_length(btrim(category)) between 1 and 80),
  is_checked boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists packing_personal_items_user_sort_idx
  on public.packing_personal_items(trip_id, user_id, sort_order, created_at);

alter table public.packing_personal_items enable row level security;
revoke all on public.packing_personal_items from anon, authenticated;
grant select, insert, update, delete on public.packing_personal_items to service_role;

create or replace function public.set_trip_status(
  p_trip_id uuid,
  p_changed_by uuid,
  p_status text
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if p_status not in ('active', 'closed') then
    raise exception 'invalid trip status';
  end if;

  if not exists (
    select 1
    from public.users participant
    where participant.id = p_changed_by
      and participant.trip_id = p_trip_id
      and participant.is_admin = true
  ) then
    raise exception 'trip manager required';
  end if;

  update public.trips
  set status = p_status,
      closed_at = case when p_status = 'closed' then now() else null end,
      closed_by = case when p_status = 'closed' then p_changed_by else null end,
      updated_at = now()
  where id = p_trip_id;

  if not found then
    raise exception 'trip not found';
  end if;

  insert into public.trip_status_events (trip_id, changed_by, status)
  values (p_trip_id, p_changed_by, p_status);
end;
$$;

revoke all on function public.set_trip_status(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.set_trip_status(uuid, uuid, text)
  to service_role;

create or replace function public.update_expense_entry(
  p_trip_id uuid,
  p_expense_id uuid,
  p_changed_by uuid,
  p_payer_id uuid,
  p_amount numeric,
  p_description text,
  p_split_among uuid[],
  p_shares jsonb default '[]'::jsonb
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_expense public.expenses%rowtype;
  v_finance_mode text;
  v_previous_shares jsonb;
  v_share record;
  v_share_sum numeric := 0;
begin
  if not exists (
    select 1
    from public.users participant
    where participant.id = p_changed_by
      and participant.trip_id = p_trip_id
      and participant.is_admin = true
  ) then
    raise exception 'trip manager required';
  end if;

  select expense.*
  into v_expense
  from public.expenses expense
  where expense.id = p_expense_id
    and expense.trip_id = p_trip_id
    and expense.deleted_at is null
  for update;

  if not found or v_expense.entry_type <> 'expense' then
    raise exception 'editable expense not found';
  end if;

  select trip.finance_mode
  into v_finance_mode
  from public.trips trip
  where trip.id = p_trip_id
    and trip.status = 'active';

  if not found then
    raise exception 'trip is closed or missing';
  end if;

  if p_amount <= 0 or p_amount > 1000000
    or char_length(btrim(p_description)) not between 1 and 240
    or cardinality(p_split_among) < 2
    or not (p_payer_id = any(p_split_among))
  then
    raise exception 'invalid expense';
  end if;

  if v_finance_mode = 'whole' and p_amount <> trunc(p_amount) then
    raise exception 'whole mode requires integer amounts';
  end if;

  if not exists (
    select 1 from public.users participant
    where participant.id = p_payer_id and participant.trip_id = p_trip_id
  ) or exists (
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

  select coalesce(
    jsonb_agg(jsonb_build_object('user_id', share.user_id, 'amount', share.amount)),
    '[]'::jsonb
  )
  into v_previous_shares
  from public.expense_shares share
  where share.expense_id = p_expense_id;

  insert into public.expense_revisions (
    expense_id,
    trip_id,
    changed_by,
    action,
    previous_data
  )
  values (
    p_expense_id,
    p_trip_id,
    p_changed_by,
    'updated',
    to_jsonb(v_expense) || jsonb_build_object('shares', v_previous_shares)
  );

  update public.expenses
  set user_id = p_payer_id,
      amount = p_amount,
      description = btrim(p_description),
      split_among = p_split_among,
      updated_at = now()
  where id = p_expense_id;

  delete from public.expense_shares
  where expense_id = p_expense_id;

  insert into public.expense_shares (expense_id, user_id, amount)
  select p_expense_id, share.user_id, share.amount
  from jsonb_to_recordset(p_shares) as share(user_id uuid, amount numeric);
end;
$$;

revoke all on function public.update_expense_entry(uuid, uuid, uuid, uuid, numeric, text, uuid[], jsonb)
  from public, anon, authenticated;
grant execute on function public.update_expense_entry(uuid, uuid, uuid, uuid, numeric, text, uuid[], jsonb)
  to service_role;

create or replace function public.soft_delete_expense_entry(
  p_trip_id uuid,
  p_expense_id uuid,
  p_changed_by uuid
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_expense public.expenses%rowtype;
  v_previous_shares jsonb;
begin
  if not exists (
    select 1
    from public.users participant
    where participant.id = p_changed_by
      and participant.trip_id = p_trip_id
      and participant.is_admin = true
  ) then
    raise exception 'trip manager required';
  end if;

  if not exists (
    select 1 from public.trips trip
    where trip.id = p_trip_id and trip.status = 'active'
  ) then
    raise exception 'trip is closed or missing';
  end if;

  select expense.*
  into v_expense
  from public.expenses expense
  where expense.id = p_expense_id
    and expense.trip_id = p_trip_id
    and expense.deleted_at is null
  for update;

  if not found or v_expense.entry_type <> 'expense' then
    raise exception 'deletable expense not found';
  end if;

  select coalesce(
    jsonb_agg(jsonb_build_object('user_id', share.user_id, 'amount', share.amount)),
    '[]'::jsonb
  )
  into v_previous_shares
  from public.expense_shares share
  where share.expense_id = p_expense_id;

  insert into public.expense_revisions (
    expense_id,
    trip_id,
    changed_by,
    action,
    previous_data
  )
  values (
    p_expense_id,
    p_trip_id,
    p_changed_by,
    'deleted',
    to_jsonb(v_expense) || jsonb_build_object('shares', v_previous_shares)
  );

  update public.expenses
  set deleted_at = now(),
      deleted_by = p_changed_by,
      updated_at = now()
  where id = p_expense_id;
end;
$$;

revoke all on function public.soft_delete_expense_entry(uuid, uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.soft_delete_expense_entry(uuid, uuid, uuid)
  to service_role;

commit;
