alter table public.trips
add column if not exists layout_config jsonb not null
  default '{"navigation":[],"surfaces":{"base":[]}}'::jsonb;

alter table public.trips
drop constraint if exists trips_layout_config_object_check;

alter table public.trips
add constraint trips_layout_config_object_check
check (jsonb_typeof(layout_config) = 'object');

comment on column public.trips.layout_config is
  'Navigation order and widget placements for every configurable app surface.';

create table if not exists public.schedule_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  notes text check (notes is null or char_length(notes) <= 1000),
  event_date date not null,
  start_time time,
  end_time time,
  location_name text check (location_name is null or char_length(location_name) <= 160),
  location_address text check (location_address is null or char_length(location_address) <= 300),
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint schedule_items_time_order_check
    check (start_time is null or end_time is null or start_time <= end_time)
);

create index if not exists schedule_items_trip_date_idx
  on public.schedule_items(trip_id, event_date, start_time);

create table if not exists public.trip_playlists (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  url text not null check (char_length(url) between 1 and 1000),
  sort_order integer not null default 0,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists trip_playlists_trip_order_idx
  on public.trip_playlists(trip_id, sort_order, created_at);

insert into public.trip_playlists (trip_id, name, url)
select trips.id, 'Playlista wyjazdu', trips.playlist_url
from public.trips
where trips.playlist_url is not null
  and btrim(trips.playlist_url) <> ''
  and not exists (
    select 1
    from public.trip_playlists
    where trip_playlists.trip_id = trips.id
      and trip_playlists.url = trips.playlist_url
  );

create table if not exists public.game_challenges (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  description text check (description is null or char_length(description) <= 1000),
  points integer not null default 0 check (points between 0 and 100000),
  audience text not null default 'individual'
    check (audience in ('individual', 'team', 'either')),
  is_active boolean not null default true,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists game_challenges_trip_active_idx
  on public.game_challenges(trip_id, is_active, created_at);

create table if not exists public.game_challenge_entries (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.game_challenges(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  team_id uuid references public.teams(id) on delete cascade,
  status text not null default 'claimed'
    check (status in ('claimed', 'completed', 'cancelled')),
  claimed_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint game_challenge_entries_owner_check
    check ((user_id is not null)::integer + (team_id is not null)::integer = 1)
);

create index if not exists game_challenge_entries_challenge_idx
  on public.game_challenge_entries(challenge_id, status);

create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  question text not null check (char_length(question) between 1 and 240),
  status text not null default 'open' check (status in ('draft', 'open', 'closed')),
  closes_on date,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists polls_trip_status_idx
  on public.polls(trip_id, status, created_at);

create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 160),
  sort_order integer not null default 0
);

create index if not exists poll_options_poll_order_idx
  on public.poll_options(poll_id, sort_order);

create table if not exists public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_id uuid not null references public.poll_options(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (poll_id, user_id)
);

create index if not exists poll_votes_option_idx
  on public.poll_votes(option_id);

alter table public.schedule_items enable row level security;
alter table public.trip_playlists enable row level security;
alter table public.game_challenges enable row level security;
alter table public.game_challenge_entries enable row level security;
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;

revoke all on public.schedule_items from anon, authenticated;
revoke all on public.trip_playlists from anon, authenticated;
revoke all on public.game_challenges from anon, authenticated;
revoke all on public.game_challenge_entries from anon, authenticated;
revoke all on public.polls from anon, authenticated;
revoke all on public.poll_options from anon, authenticated;
revoke all on public.poll_votes from anon, authenticated;

grant select, insert, update, delete on public.schedule_items to service_role;
grant select, insert, update, delete on public.trip_playlists to service_role;
grant select, insert, update, delete on public.game_challenges to service_role;
grant select, insert, update, delete on public.game_challenge_entries to service_role;
grant select, insert, update, delete on public.polls to service_role;
grant select, insert, update, delete on public.poll_options to service_role;
grant select, insert, update, delete on public.poll_votes to service_role;
