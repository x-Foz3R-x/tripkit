-- Kody PIN są identyfikatorami, nie wartościami do obliczeń. Typ text zachowuje
-- zera wiodące i pozwala przechowywać jawny, zawsze czterocyfrowy PIN uczestnika.
alter table public.users
alter column user_pin type text
using case
  when user_pin is null then null
  else lpad(user_pin::text, 4, '0')
end;

alter table public.trips
alter column join_pin type text
using lpad(join_pin::text, 6, '0');

alter table public.users
drop constraint if exists users_user_pin_format_check;

alter table public.users
add constraint users_user_pin_format_check
check (
  user_pin is null
  or user_pin ~ '^[0-9]{4}$'
);

alter table public.trips
drop constraint if exists trips_join_pin_format_check;

alter table public.trips
add constraint trips_join_pin_format_check
check (join_pin ~ '^[0-9]{6}$');
