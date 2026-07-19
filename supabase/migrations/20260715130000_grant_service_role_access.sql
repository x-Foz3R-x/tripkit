-- Wyjezdnik nie korzysta z Supabase Auth. Dostęp do danych po stronie
-- serwera odbywa się przez prywatny klucz mapowany na rolę service_role.
grant usage on schema public to service_role;

grant select, insert, update, delete
on all tables in schema public
to service_role;

grant usage, select
on all sequences in schema public
to service_role;

-- Zachowaj te uprawnienia również dla tabel dodanych w przyszłości.
alter default privileges for role postgres in schema public
grant select, insert, update, delete on tables to service_role;

alter default privileges for role postgres in schema public
grant usage, select on sequences to service_role;
