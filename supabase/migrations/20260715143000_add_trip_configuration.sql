alter table public.trips
add column if not exists destination_name text,
add column if not exists destination_address text,
add column if not exists destination_map_url text,
add column if not exists playlist_url text,
add column if not exists dashboard_widgets jsonb not null
  default '["destination", "dates", "schedule", "packing", "shopping", "finances"]'::jsonb;

alter table public.trips
drop constraint if exists trips_dashboard_widgets_array_check;

alter table public.trips
add constraint trips_dashboard_widgets_array_check
check (jsonb_typeof(dashboard_widgets) = 'array');

comment on column public.trips.dashboard_widgets is
  'Ordered list of widgets visible on the trip dashboard.';
