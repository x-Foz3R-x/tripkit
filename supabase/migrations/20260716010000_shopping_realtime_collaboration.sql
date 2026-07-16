-- Additive shopping collaboration upgrade. It does not enable RLS or revoke
-- any role currently used by the production application.

begin;

alter table public.shopping_list
add column if not exists claimed_by uuid references public.users(id) on delete set null,
add column if not exists claimed_at timestamptz,
add column if not exists completed_by uuid references public.users(id) on delete set null,
add column if not exists completed_at timestamptz;

create index if not exists shopping_list_trip_open_idx
  on public.shopping_list(trip_id, is_completed, created_at);

create index if not exists shopping_list_claimed_by_idx
  on public.shopping_list(claimed_by)
  where claimed_by is not null;

-- DELETE events need the trip_id from the old row so filtered subscribers can
-- remove the correct item without refreshing the page.
alter table public.shopping_list replica identity full;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'shopping_list'
    ) then
    execute 'alter publication supabase_realtime add table public.shopping_list';
  end if;
end;
$$;

commit;
