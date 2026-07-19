-- Nie zmienia sposobu liczenia istniejących wyjazdów.
-- Nowe wyjazdy domyślnie korzystają z prostego rozliczania w pełnych złotych.
alter table public.trips
add column if not exists finance_mode text;

update public.trips
set finance_mode = 'legacy'
where finance_mode is null;

alter table public.trips
alter column finance_mode set default 'whole',
alter column finance_mode set not null;

alter table public.trips
drop constraint if exists trips_finance_mode_check;

alter table public.trips
add constraint trips_finance_mode_check
check (finance_mode in ('legacy', 'whole', 'precise'));

comment on column public.trips.finance_mode is
  'legacy = dotychczasowy algorytm, whole = pełne złotówki, precise = dokładne grosze';
