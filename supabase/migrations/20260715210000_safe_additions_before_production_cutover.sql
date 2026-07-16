-- Safe, additive changes for the current production transition.
-- This migration intentionally DOES NOT enable RLS or revoke anon/authenticated
-- access on legacy tables, because the currently deployed app still relies on it.

begin;

-- Store only one rolling timestamp. No activity history is retained.
alter table public.users
add column if not exists last_seen_at timestamptz;

comment on column public.users.last_seen_at is
  'Most recent time the participant opened or returned to a page of this trip.';

create index if not exists users_trip_last_seen_idx
  on public.users(trip_id, last_seen_at desc);

-- Record which administrator accepted a completed challenge.
alter table public.game_challenge_entries
add column if not exists completed_by uuid references public.users(id) on delete set null;

-- One active/completed claim per person or team for a given challenge.
create unique index if not exists game_challenge_entries_active_user_unique
  on public.game_challenge_entries(challenge_id, user_id)
  where user_id is not null and status in ('claimed', 'completed');

create unique index if not exists game_challenge_entries_active_team_unique
  on public.game_challenge_entries(challenge_id, team_id)
  where team_id is not null and status in ('claimed', 'completed');

-- Complete a challenge and award its points in one database transaction.
create or replace function public.complete_game_challenge(
  p_entry_id uuid,
  p_trip_id uuid,
  p_completed_by uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_entry public.game_challenge_entries%rowtype;
  v_challenge public.game_challenges%rowtype;
  v_team_id uuid;
begin
  select entry.*
  into v_entry
  from public.game_challenge_entries entry
  where entry.id = p_entry_id
  for update;

  if not found or v_entry.status <> 'claimed' then
    raise exception 'challenge entry is not claimable';
  end if;

  select challenge.*
  into v_challenge
  from public.game_challenges challenge
  where challenge.id = v_entry.challenge_id
    and challenge.trip_id = p_trip_id
    and challenge.is_active = true;

  if not found then
    raise exception 'challenge not found for trip';
  end if;

  v_team_id := v_entry.team_id;

  if v_team_id is null and v_entry.user_id is not null then
    select participant.team_id
    into v_team_id
    from public.users participant
    where participant.id = v_entry.user_id
      and participant.trip_id = p_trip_id;
  end if;

  if v_team_id is not null then
    update public.teams
    set score = coalesce(score, 0) + v_challenge.points,
        updated_at = now()
    where id = v_team_id
      and trip_id = p_trip_id;

    if not found then
      raise exception 'team not found for trip';
    end if;
  end if;

  update public.game_challenge_entries
  set status = 'completed',
      completed_at = now(),
      completed_by = p_completed_by
  where id = p_entry_id;

  return jsonb_build_object(
    'entry_id', p_entry_id,
    'team_id', v_team_id,
    'points', v_challenge.points
  );
end;
$$;

-- This affects only the new challenge-completion function. It does not change
-- table access used by the legacy production app.
revoke all on function public.complete_game_challenge(uuid, uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.complete_game_challenge(uuid, uuid, uuid)
  to service_role;

commit;
