-- F04: identidad en auth.users; alcance y roles en membresías.
begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create type public.team_role as enum ('owner', 'admin');

create table public.complexes (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 100),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) between 2 and 80),
  created_at timestamptz not null default now()
);

create table public.memberships (
  complex_id uuid not null references public.complexes(id),
  user_id uuid not null references auth.users(id),
  role public.team_role not null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  primary key (complex_id, user_id)
);
create index memberships_user_active on public.memberships(user_id, complex_id) where revoked_at is null;
create unique index memberships_one_owner on public.memberships(complex_id) where role = 'owner' and revoked_at is null;

create table public.team_invitations (
  id uuid primary key default gen_random_uuid(),
  complex_id uuid not null references public.complexes(id),
  email text not null check (email = lower(trim(email)) and length(email) between 3 and 254 and position('@' in email) > 1),
  invited_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id),
  revoked_at timestamptz,
  check (expires_at > created_at),
  check ((accepted_at is null) = (accepted_by is null))
);
create index invitations_complex on public.team_invitations(complex_id);
-- La credencial nunca se expone en consultas de equipo ni en el esquema API.
create table private.invitation_credentials (
  invitation_id uuid primary key references public.team_invitations(id),
  token_hash bytea not null unique
);
create table private.onboarding_audit (
  complex_id uuid primary key references public.complexes(id),
  owner_id uuid not null references auth.users(id),
  operator_reference text not null check (length(trim(operator_reference)) between 3 and 200),
  created_at timestamptz not null default now()
);

alter table public.complexes enable row level security;
alter table public.memberships enable row level security;
alter table public.team_invitations enable row level security;
alter table private.invitation_credentials enable row level security;
alter table private.onboarding_audit enable row level security;

-- Evita recursión RLS. Usa siempre auth.uid(), nunca un user_id del cliente.
create function private.has_membership(target uuid, required_role public.team_role default null)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.memberships m
    where m.complex_id = target and m.user_id = (select auth.uid())
      and m.revoked_at is null and (required_role is null or m.role = required_role)
  );
$$;
revoke all on function private.has_membership(uuid, public.team_role) from public;
grant execute on function private.has_membership(uuid, public.team_role) to authenticated;

create policy complexes_member_read on public.complexes for select to authenticated
  using (private.has_membership(id));
create policy memberships_scoped_read on public.memberships for select to authenticated
  using ((user_id = (select auth.uid()) and revoked_at is null) or private.has_membership(complex_id, 'owner'));
create policy invitations_owner_read on public.team_invitations for select to authenticated
  using (private.has_membership(complex_id, 'owner'));

-- Sin escrituras directas, incluso con IDs válidos: todas pasan por RPC acotadas.
revoke all on public.complexes, public.memberships, public.team_invitations from public, anon, authenticated;
grant select on public.complexes, public.memberships, public.team_invitations to authenticated;
revoke all on private.invitation_credentials, private.onboarding_audit from public, anon, authenticated;

-- Alta asistida: solo operador con credencial de servicio; sin endpoint público.
create function public.bootstrap_complex(complex_name text, complex_slug text, owner_id uuid, operator_reference text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare new_id uuid;
begin
  if not exists (select 1 from auth.users u where u.id = owner_id and u.email_confirmed_at is not null) then
    raise exception 'Owner must have a verified account' using errcode = '22023';
  end if;
  insert into public.complexes(name, slug) values (trim(complex_name), complex_slug) returning id into new_id;
  insert into public.memberships(complex_id, user_id, role) values (new_id, owner_id, 'owner');
  insert into private.onboarding_audit(complex_id, owner_id, operator_reference) values (new_id, owner_id, operator_reference);
  return new_id;
end;
$$;
revoke all on function public.bootstrap_complex(text, text, uuid, text) from public, anon, authenticated;
grant execute on function public.bootstrap_complex(text, text, uuid, text) to service_role;

create function public.invite_administrator(target_complex uuid, recipient_email text)
returns table(invitation_id uuid, invitation_token text)
language plpgsql security definer set search_path = '' as $$
declare new_id uuid; token text; normalized_email text;
begin
  -- Serializa emisión/revocación/aceptación por complejo.
  perform 1 from public.complexes where id = target_complex for update;
  if not private.has_membership(target_complex, 'owner') then
    raise exception 'Access denied' using errcode = '42501';
  end if;
  normalized_email := lower(trim(recipient_email));
  update public.team_invitations set revoked_at = now()
    where complex_id = target_complex and email = normalized_email and accepted_at is null and revoked_at is null;
  token := gen_random_uuid()::text || gen_random_uuid()::text;
  insert into public.team_invitations(complex_id, email, invited_by)
    values (target_complex, normalized_email, auth.uid()) returning id into new_id;
  insert into private.invitation_credentials values (new_id, sha256(convert_to(token, 'UTF8')));
  return query select new_id, token;
end;
$$;

create function public.accept_team_invitation(invitation_token text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare invitation public.team_invitations; recipient text; target uuid;
begin
  if auth.uid() is null or length(invitation_token) <> 72 then
    raise exception 'Invalid invitation' using errcode = '42501';
  end if;
  select i.complex_id into target from public.team_invitations i
    join private.invitation_credentials c on c.invitation_id = i.id
    where c.token_hash = sha256(convert_to(invitation_token, 'UTF8'));
  perform 1 from public.complexes where id = target for update;
  select i.* into invitation from public.team_invitations i
    join private.invitation_credentials c on c.invitation_id = i.id
    where c.token_hash = sha256(convert_to(invitation_token, 'UTF8')) for update of i;
  select lower(trim(u.email)) into recipient from auth.users u where u.id = auth.uid() and u.email_confirmed_at is not null;
  if invitation.id is null or recipient is null or recipient <> invitation.email
    or invitation.revoked_at is not null then
    raise exception 'Invalid invitation' using errcode = '42501';
  end if;
  -- Reintento idempotente: no reactiva membresías revocadas después de aceptar.
  if invitation.accepted_at is not null then
    if invitation.accepted_by = auth.uid() and private.has_membership(invitation.complex_id) then
      return invitation.complex_id;
    end if;
    raise exception 'Invalid invitation' using errcode = '42501';
  end if;
  if invitation.expires_at <= now() then
    raise exception 'Invalid invitation' using errcode = '42501';
  end if;
  insert into public.memberships(complex_id, user_id, role)
    values (invitation.complex_id, auth.uid(), 'admin')
    on conflict (complex_id, user_id) do update set revoked_at = null
    where memberships.role = 'admin';
  update public.team_invitations set accepted_at = now(), accepted_by = auth.uid() where id = invitation.id;
  return invitation.complex_id;
end;
$$;

create function public.revoke_administrator(target_complex uuid, target_user uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.complexes where id = target_complex for update;
  if not private.has_membership(target_complex, 'owner') then
    raise exception 'Access denied' using errcode = '42501';
  end if;
  update public.memberships set revoked_at = coalesce(revoked_at, now())
    where complex_id = target_complex and user_id = target_user and role = 'admin';
end;
$$;

create function public.revoke_team_invitation(target_complex uuid, target_invitation uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.complexes where id = target_complex for update;
  if not private.has_membership(target_complex, 'owner') then
    raise exception 'Access denied' using errcode = '42501';
  end if;
  update public.team_invitations set revoked_at = coalesce(revoked_at, now())
    where complex_id = target_complex and id = target_invitation and accepted_at is null;
end;
$$;

revoke all on function public.invite_administrator(uuid, text), public.accept_team_invitation(text),
  public.revoke_administrator(uuid, uuid), public.revoke_team_invitation(uuid, uuid) from public, anon;
grant execute on function public.invite_administrator(uuid, text), public.accept_team_invitation(text),
  public.revoke_administrator(uuid, uuid), public.revoke_team_invitation(uuid, uuid) to authenticated;
commit;
