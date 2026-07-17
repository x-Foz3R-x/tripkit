-- DEFERRED MIGRATION — DO NOT RUN WHILE THE LEGACY PRODUCTION APP IS IN USE.
--
-- The production version still performs some operations with the anon key.
-- Apply this file manually only after:
--   1. the server-action version of the app has been deployed,
--   2. SUPABASE_SECRET_KEY is configured in production,
--   3. shopping, finances, joining and settings were smoke-tested there,
--   4. the current trip no longer depends on the legacy client.

begin;

alter table public.trips enable row level security;
alter table public.users enable row level security;
alter table public.teams enable row level security;
alter table public.expenses enable row level security;
alter table public.shopping_list enable row level security;

revoke all on table public.trips from anon, authenticated;
revoke all on table public.users from anon, authenticated;
revoke all on table public.teams from anon, authenticated;
revoke all on table public.expenses from anon, authenticated;
revoke all on table public.shopping_list from anon, authenticated;

grant select, insert, update, delete on table public.trips to service_role;
grant select, insert, update, delete on table public.users to service_role;
grant select, insert, update, delete on table public.teams to service_role;
grant select, insert, update, delete on table public.expenses to service_role;
grant select, insert, update, delete on table public.shopping_list to service_role;

comment on table public.trips is
  'Accessed by the Wyjezdnik server after validation of a signed trip session.';
comment on table public.users is
  'Trip participants; accessed by the Wyjezdnik server after session validation.';

commit;

-- Raport po wykonaniu: anon_select/insert/update/delete powinny mieć wartość false,
-- a service_role_all wartość true dla każdego wiersza.
select
  table_name,
  has_table_privilege('anon', format('public.%I', table_name), 'select') as anon_select,
  has_table_privilege('anon', format('public.%I', table_name), 'insert') as anon_insert,
  has_table_privilege('anon', format('public.%I', table_name), 'update') as anon_update,
  has_table_privilege('anon', format('public.%I', table_name), 'delete') as anon_delete,
  has_table_privilege('service_role', format('public.%I', table_name), 'select,insert,update,delete')
    as service_role_all
from unnest(array['trips', 'users', 'teams', 'expenses', 'shopping_list']) as table_name;
