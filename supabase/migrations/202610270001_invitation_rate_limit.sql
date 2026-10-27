-- Serializa la emisión por complejo, incluso ante llamadas RPC simultáneas.
begin;
create function private.enforce_invitation_rate()
returns trigger language plpgsql security definer set search_path = '' as $$
declare issued_at timestamptz;
begin
  perform 1 from public.complexes where id = new.complex_id for update;
  issued_at := clock_timestamp();
  if exists (
    select 1 from public.team_invitations
    where complex_id = new.complex_id
      and created_at > issued_at - interval '1 minute'
  ) then
    raise exception 'Invitation rate limit exceeded' using errcode = 'P0001';
  end if;
  new.created_at := issued_at;
  new.expires_at := issued_at + interval '7 days';
  return new;
end;
$$;
revoke all on function private.enforce_invitation_rate() from public, anon, authenticated, service_role;
create trigger invitations_rate_limit
before insert on public.team_invitations
for each row execute function private.enforce_invitation_rate();
commit;
