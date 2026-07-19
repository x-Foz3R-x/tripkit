-- Trwałe usuwanie wyjazdu jest świadomą operacją Zarządcy. Funkcja usuwa
-- wszystkie aktualnie używane dane wyjazdu w jednej transakcji. Jeżeli
-- którakolwiek operacja zawiedzie, PostgreSQL wycofa całość.
begin;

create or replace function public.delete_trip_permanently(
  p_trip_id uuid,
  p_deleted_by uuid,
  p_confirmation_name text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trip_name text;
begin
  select trip.name
  into v_trip_name
  from public.trips trip
  where trip.id = p_trip_id
  for update;

  if not found then
    raise exception 'trip not found';
  end if;

  if p_confirmation_name is distinct from v_trip_name then
    raise exception 'trip name confirmation does not match';
  end if;

  if not exists (
    select 1
    from public.users participant
    where participant.id = p_deleted_by
      and participant.trip_id = p_trip_id
      and participant.is_admin = true
  ) then
    raise exception 'trip manager required';
  end if;

  delete from public.poll_votes
  where poll_id in (select id from public.polls where trip_id = p_trip_id);

  delete from public.poll_options
  where poll_id in (select id from public.polls where trip_id = p_trip_id);

  delete from public.polls where trip_id = p_trip_id;

  delete from public.game_challenge_entries
  where challenge_id in (
    select id from public.game_challenges where trip_id = p_trip_id
  );

  delete from public.game_challenges where trip_id = p_trip_id;

  delete from public.expense_shares
  where expense_id in (select id from public.expenses where trip_id = p_trip_id);

  delete from public.expense_revisions where trip_id = p_trip_id;
  delete from public.expenses where trip_id = p_trip_id;
  delete from public.packing_item_states where trip_id = p_trip_id;
  delete from public.packing_personal_items where trip_id = p_trip_id;
  delete from public.shopping_list where trip_id = p_trip_id;
  delete from public.schedule_items where trip_id = p_trip_id;
  delete from public.trip_playlists where trip_id = p_trip_id;
  delete from public.trip_status_events where trip_id = p_trip_id;

  -- Tabela istnieje tylko w instalacjach, w których wykonano zachowawczą
  -- migrację starego wyjazdu. Jej migawka także należy do usuwanego wyjazdu.
  if to_regclass('public.legacy_trip_migration_backups') is not null then
    execute 'delete from public.legacy_trip_migration_backups where trip_id = $1'
    using p_trip_id;
  end if;

  -- Uczestnicy wskazują drużyny, dlatego kolejność jest celowa.
  delete from public.users where trip_id = p_trip_id;
  delete from public.teams where trip_id = p_trip_id;
  delete from public.trips where id = p_trip_id;

  if not found then
    raise exception 'trip deletion failed';
  end if;
end;
$$;

revoke all on function public.delete_trip_permanently(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.delete_trip_permanently(uuid, uuid, text)
  to service_role;

commit;
