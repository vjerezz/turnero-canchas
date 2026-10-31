begin;
alter table public.court_date_exceptions add column active boolean not null default true;
grant update (active) on public.court_date_exceptions to authenticated;
commit;
