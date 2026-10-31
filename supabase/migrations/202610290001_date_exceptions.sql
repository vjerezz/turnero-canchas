begin;
create table public.court_date_exceptions (
  complex_id uuid not null,
  court_id uuid not null,
  service_date date not null check (service_date between date '0001-01-01' and date '9999-12-31'),
  closed boolean not null,
  opens_minute integer,
  closes_minute integer,
  primary key (court_id, service_date),
  foreign key (complex_id, court_id) references public.courts(complex_id, id),
  check ((closed and opens_minute is null and closes_minute is null) or
    (not closed and opens_minute is not null and closes_minute is not null
      and opens_minute between 0 and 1439 and closes_minute > opens_minute
      and closes_minute <= opens_minute + 1440))
);
alter table public.court_date_exceptions enable row level security;
create policy exceptions_read on public.court_date_exceptions for select to authenticated
  using (private.has_membership(complex_id));
create policy exceptions_insert on public.court_date_exceptions for insert to authenticated
  with check (private.has_membership(complex_id));
create policy exceptions_update on public.court_date_exceptions for update to authenticated
  using (private.has_membership(complex_id)) with check (private.has_membership(complex_id));
revoke all on public.court_date_exceptions from public, anon, authenticated;
grant select on public.court_date_exceptions to authenticated;
grant insert (complex_id, court_id, service_date, closed, opens_minute, closes_minute) on public.court_date_exceptions to authenticated;
grant update (closed, opens_minute, closes_minute) on public.court_date_exceptions to authenticated;
commit;
