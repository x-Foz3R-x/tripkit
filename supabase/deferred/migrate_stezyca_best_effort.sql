-- Uruchom ręcznie dopiero po:
--   1. wdrożeniu wszystkich migracji z supabase/migrations,
--   2. sprawdzeniu, że w tabeli trips istnieje dokładnie jeden wyjazd "Stężyca 2026".
--
-- Skrypt jest celowo zachowawczy:
--   - najpierw zapisuje pełną migawkę danych do osobnej tabeli,
--   - nie usuwa żadnych rekordów,
--   - nie tworzy fikcyjnych udziałów w starych wydatkach,
--   - pozostawia stary sposób liczenia jako "legacy",
--   - zamyka wyjazd do wglądu.

begin;

create table if not exists public.legacy_trip_migration_backups (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null,
  trip_name text not null,
  reason text not null,
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.legacy_trip_migration_backups enable row level security;
revoke all on public.legacy_trip_migration_backups from anon, authenticated;
grant select, insert on public.legacy_trip_migration_backups to service_role;

do $$
declare
  v_trip_id uuid;
  v_trip_count bigint;
  v_manager_id uuid;
begin
  select count(*)
  into v_trip_count
  from public.trips
  where lower(name) = lower('Stężyca 2026');

  if v_trip_count <> 1 then
    raise exception
      'Oczekiwano dokładnie jednego wyjazdu "Stężyca 2026", znaleziono: %',
      v_trip_count;
  end if;

  select id
  into v_trip_id
  from public.trips
  where lower(name) = lower('Stężyca 2026')
  limit 1;

  if exists (
    select 1
    from public.legacy_trip_migration_backups
    where trip_id = v_trip_id
      and reason = '2026-07-17 best-effort closure'
  ) then
    raise exception 'Migawka dla tego wyjazdu już istnieje. Skrypt nie został uruchomiony ponownie.';
  end if;

  insert into public.legacy_trip_migration_backups (
    trip_id,
    trip_name,
    reason,
    snapshot
  )
  select
    trip.id,
    trip.name,
    '2026-07-17 best-effort closure',
    jsonb_build_object(
      'trip', to_jsonb(trip),
      'users', coalesce((
        select jsonb_agg(to_jsonb(participant) order by participant.created_at)
        from public.users participant
        where participant.trip_id = trip.id
      ), '[]'::jsonb),
      'teams', coalesce((
        select jsonb_agg(to_jsonb(team) order by team.created_at)
        from public.teams team
        where team.trip_id = trip.id
      ), '[]'::jsonb),
      'expenses', coalesce((
        select jsonb_agg(
          to_jsonb(expense) || jsonb_build_object(
            'shares',
            coalesce((
              select jsonb_agg(to_jsonb(share))
              from public.expense_shares share
              where share.expense_id = expense.id
            ), '[]'::jsonb)
          )
          order by expense.created_at
        )
        from public.expenses expense
        where expense.trip_id = trip.id
      ), '[]'::jsonb),
      'shopping_list', coalesce((
        select jsonb_agg(to_jsonb(item) order by item.created_at)
        from public.shopping_list item
        where item.trip_id = trip.id
      ), '[]'::jsonb),
      'schedule_items', coalesce((
        select jsonb_agg(to_jsonb(item) order by item.created_at)
        from public.schedule_items item
        where item.trip_id = trip.id
      ), '[]'::jsonb)
    )
  from public.trips trip
  where trip.id = v_trip_id;

  select participant.id
  into v_manager_id
  from public.users participant
  where participant.trip_id = v_trip_id
    and participant.is_admin = true
  order by participant.created_at, participant.id
  limit 1;

  update public.expenses expense
  set created_by = expense.user_id
  where expense.trip_id = v_trip_id
    and expense.created_by is null;

  update public.trips
  set finance_mode = 'legacy',
      settlement_strategy = 'relational',
      status = 'closed',
      closed_at = coalesce(closed_at, now()),
      closed_by = coalesce(closed_by, v_manager_id),
      packing_presets = coalesce(packing_presets, '["essentials"]'::jsonb),
      updated_at = now()
  where id = v_trip_id;

  insert into public.trip_status_events (trip_id, changed_by, status)
  select v_trip_id, v_manager_id, 'closed'
  where not exists (
    select 1
    from public.trip_status_events event
    where event.trip_id = v_trip_id
      and event.status = 'closed'
  );
end;
$$;

commit;

-- Raport kontrolny. Każdy wynik powinien zostać przejrzany przed wdrożeniem aplikacji.
select
  trip.id,
  trip.name,
  trip.status,
  trip.finance_mode,
  trip.settlement_strategy,
  trip.closed_at,
  (select count(*) from public.users participant where participant.trip_id = trip.id)
    as participants,
  (select count(*) from public.expenses expense where expense.trip_id = trip.id)
    as finance_entries,
  (
    select count(*)
    from public.expenses expense
    where expense.trip_id = trip.id
      and expense.entry_type = 'expense'
      and not exists (
        select 1
        from public.expense_shares share
        where share.expense_id = expense.id
      )
  ) as legacy_expenses_without_explicit_shares,
  (
    select count(*)
    from public.expenses expense
    where expense.trip_id = trip.id
      and expense.created_by is null
  ) as entries_without_author,
  (
    select count(*)
    from public.legacy_trip_migration_backups backup
    where backup.trip_id = trip.id
  ) as backup_snapshots
from public.trips trip
where lower(trip.name) = lower('Stężyca 2026');
