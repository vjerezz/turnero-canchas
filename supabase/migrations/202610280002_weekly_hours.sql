begin;
alter table public.courts add column hours_version integer not null default 0;
create table public.court_weekly_hours (
  complex_id uuid not null,
  court_id uuid not null,
  weekday integer not null check (weekday between 0 and 6),
  opens_minute integer not null check (opens_minute between 0 and 1439),
  closes_minute integer not null,
  primary key (court_id, weekday),
  foreign key (complex_id, court_id) references public.courts(complex_id, id),
  check (closes_minute > opens_minute and closes_minute <= opens_minute + 1440)
);
alter table public.court_weekly_hours enable row level security;
create policy hours_member_read on public.court_weekly_hours for select to authenticated
  using (private.has_membership(complex_id));
revoke all on public.court_weekly_hours from public, anon, authenticated;
grant select on public.court_weekly_hours to authenticated;

create function public.replace_court_weekly_hours(target_complex uuid, target_court uuid, expected_version integer, windows jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare current_version integer;
begin
  if not private.has_membership(target_complex) then
    raise exception 'Access denied' using errcode = '42501';
  end if;
  select hours_version into current_version from public.courts
    where id = target_court and complex_id = target_complex for update;
  if not found then raise exception 'Access denied' using errcode = '42501'; end if;
  if expected_version is null or expected_version <> current_version then
    raise exception 'Schedule changed' using errcode = '40001';
  end if;
  if windows is null or jsonb_typeof(windows) <> 'array' then
    raise exception 'Invalid schedule' using errcode = '22023';
  end if;
  if jsonb_array_length(windows) > 7 then
    raise exception 'Invalid schedule' using errcode = '22023';
  end if;
  delete from public.court_weekly_hours where court_id = target_court and complex_id = target_complex;
  insert into public.court_weekly_hours(complex_id, court_id, weekday, opens_minute, closes_minute)
    select target_complex, target_court, weekday, opens_minute, closes_minute
    from jsonb_to_recordset(windows) as x(weekday integer, opens_minute integer, closes_minute integer);
  if exists (
    select 1 from public.court_weekly_hours a
    join public.court_weekly_hours b on b.court_id = a.court_id
    cross join (values (-10080), (0), (10080)) as shift(minutes)
    where a.court_id = target_court and (a.weekday <> b.weekday or shift.minutes <> 0)
      and a.weekday * 1440 + a.opens_minute < b.weekday * 1440 + b.closes_minute + shift.minutes
      and b.weekday * 1440 + b.opens_minute + shift.minutes < a.weekday * 1440 + a.closes_minute
  ) then raise exception 'Overlapping weekly hours' using errcode = '23P01'; end if;
  update public.courts set hours_version = hours_version + 1 where id = target_court;
end;
$$;
revoke all on function public.replace_court_weekly_hours(uuid, uuid, integer, jsonb) from public, anon;
grant execute on function public.replace_court_weekly_hours(uuid, uuid, integer, jsonb) to authenticated;
commit;
