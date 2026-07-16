-- Strategia przelewów jest niezależna od sposobu zaokrąglania kwot.
-- Istniejące wyjazdy zachowują relacyjne rozliczenia, aby nie zmienić
-- przyzwyczajeń uczestników w trakcie trwającego wyjazdu.

alter table public.trips
add column if not exists settlement_strategy text;

update public.trips
set settlement_strategy = 'relational'
where settlement_strategy is null;

alter table public.trips
alter column settlement_strategy set default 'relational',
alter column settlement_strategy set not null;

alter table public.trips
drop constraint if exists trips_settlement_strategy_check;

alter table public.trips
add constraint trips_settlement_strategy_check
check (settlement_strategy in ('relational', 'optimized'));

comment on column public.trips.settlement_strategy is
  'Sposób proponowania przelewów: relational zachowuje bezpośrednie relacje, optimized ogranicza liczbę przelewów.';
