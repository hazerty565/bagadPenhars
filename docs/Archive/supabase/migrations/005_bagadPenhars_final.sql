-- ============================================================================
-- Migration: 005_bagadPenhars_final.sql
-- Fresh-install schema for Bagad Penhars.
--
-- This is intentionally a standalone initial migration. The old migrations
-- 001-004 are archived under supabase/deprecated_migrations/ and must not be
-- applied before this file. Apply only to a new Supabase project/database.
-- ============================================================================

begin;

-- 1. Extensions
create extension if not exists "pgcrypto";

-- 2. Types Enum
create type public.account_status as enum ('pending', 'active', 'suspended');
create type public.app_role as enum ('member', 'chef_pupitre', 'secretaire', 'admin');
create type public.event_type as enum ('sortie', 'concert', 'fest-noz', 'festival', 'concours','gala', 'repetition', 'reunion', 'repas');
create type public.event_visibility as enum ('public', 'interne', 'pupitre');
create type public.response_status as enum ('present', 'absent');
create type public.musician_level as enum ('skolaj', 'bagadig', 'bagad');
create type public.contact_form as enum ('Adhesion','Demande d''information','Partenariat','Prestation','Autre');

-- 4. Tables fondamentales

-- Pupitres (bombarde, cornemuse, caisse claire, percussion)
create table public.pupitres (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

-- Profils utilisateurs (clé primaire liée à auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  account_status public.account_status not null default 'pending',
  role public.app_role not null default 'member',
  phone text,
  nickname text,
  birthdate date,
  musician_level public.musician_level not null default 'skolaj',
  costume_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Liaison Membres <-> Pupitres (un membre peut avoir plusieurs pupitres)
create table public.profile_pupitres (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  pupitre_id uuid not null references public.pupitres(id) on delete restrict,
  is_chef boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (profile_id, pupitre_id)
);

-- Les fonctions sont créées après les tables référencées pour que leur corps SQL
-- soit validé avec check_function_bodies activé.
create or replace function public.my_role_level()
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when p.account_status <> 'active' then 0
    else case p.role
      when 'member' then 1
      when 'chef_pupitre' then 2
      when 'secretaire' then 3
      when 'admin' then 4
    end
  end
  from public.profiles p
  where p.id = (select auth.uid())
$$;

create or replace function public.my_pupitre_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select pp.pupitre_id
  from public.profile_pupitres pp
  where pp.profile_id = (select auth.uid())
$$;

create or replace function public.my_managed_pupitre_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select pp.pupitre_id
  from public.profile_pupitres pp
  where pp.profile_id = (select auth.uid())
    and pp.is_chef = true
$$;

-- Titres du bureau historisés (honorifiques, sans droits associés)
create table public.bureau_positions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  start_date date not null default current_date,
  end_date date,
  created_at timestamptz not null default now()
);

-- Invitations d'adhérents (lien Supabase Auth valable 1 heure)
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  first_name text not null,
  last_name text not null,
  author_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  used_at timestamptz
);

-- Pupitres assignés lors de l'invitation
create table public.invitation_pupitres (
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  pupitre_id uuid not null references public.pupitres(id) on delete cascade,
  primary key (invitation_id, pupitre_id)
);

-- Événements d'agenda & Sondages unifiés
create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  location text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  event_type public.event_type not null,
  visibility public.event_visibility not null default 'interne',
  is_poll boolean not null default false,
  author_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_dates_check check (end_at >= start_at)
);

-- Pupitres concernés par les événements ciblés ou associés à un pupitre.
create table public.event_pupitres (
  event_id uuid not null references public.events(id) on delete cascade,
  pupitre_id uuid not null references public.pupitres(id) on delete cascade,
  primary key (event_id, pupitre_id)
);

-- Réponses aux événements et sondages (présence binaire)
create table public.event_responses (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  status public.response_status not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_responses_unique unique (event_id, profile_id)
);

-- Documents / Partitions PDF
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  storage_path text not null,
  pupitre_id uuid not null references public.pupitres(id) on delete restrict,
  author_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Actualités publiques
create table public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  content text not null,
  published boolean not null default false,
  published_at timestamptz,
  summary text,
  image_url text,
  author_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Albums photos
create table public.albums (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  is_public boolean not null default false,
  author_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Médias des albums photos
create table public.media (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.albums(id) on delete cascade,
  storage_path text not null,
  caption text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Journal des envois OneSignal (écriture réservée au service_role)
create table public.notification_log (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references public.profiles(id) on delete set null,
  title text not null,
  body text not null,
  audience jsonb not null default '{}'::jsonb,
  sent_at timestamptz not null default now()
);

-- Journal applicatif (écriture réservée au service_role).
create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_table text,
  target_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);

create table public.notification_preferences (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  enabled boolean not null default true,
  event_notifications boolean not null default true,
  poll_reminders boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'rejected')),
  requested_at timestamptz not null default now(),
  processed_by uuid references public.profiles(id) on delete set null,
  processed_at timestamptz,
  notes text,
  snapshot_email text,
  snapshot_name text,
  constraint account_deletion_processed_fields_check
    check (
      (status = 'pending' and processed_at is null and processed_by is null)
      or (status <> 'pending' and processed_at is not null)
    )
);

create table public.member_loans (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  item_type text not null check (item_type in ('materiel', 'costume')),
  item_name text not null,
  details text,
  loaned_at date not null default current_date,
  returned_at date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint member_loans_return_date_check
    check (returned_at is null or returned_at >= loaned_at)
);

-- RLS is enabled on every application table in this migration.
alter table public.pupitres enable row level security;
alter table public.profiles enable row level security;
alter table public.profile_pupitres enable row level security;
alter table public.bureau_positions enable row level security;
alter table public.invitations enable row level security;
alter table public.invitation_pupitres enable row level security;
alter table public.events enable row level security;
alter table public.event_pupitres enable row level security;
alter table public.event_responses enable row level security;
alter table public.documents enable row level security;
alter table public.articles enable row level security;
alter table public.albums enable row level security;
alter table public.media enable row level security;
alter table public.notification_log enable row level security;
alter table public.activity_log enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.account_deletion_requests enable row level security;
alter table public.member_loans enable row level security;

-- Security-definer helpers avoid recursive RLS when policies inspect events.
create or replace function public.can_access_event(target_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select public.my_role_level()), -1) >= 1
    and exists (
      select 1
      from public.events e
      where e.id = target_event_id
        and (
          e.visibility in ('public', 'interne')
          or (
            e.visibility = 'pupitre'
            and (
              (select public.my_role_level()) >= 3
              or exists (
                select 1
                from public.event_pupitres ep
                where ep.event_id = e.id
                  and ep.pupitre_id in (select public.my_pupitre_ids())
              )
            )
          )
        )
    );
$$;

create or replace function public.can_manage_pupitre_event(target_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select public.my_role_level()), -1) = 2
    and exists (
      select 1
      from public.events e
      where e.id = target_event_id
        and e.visibility = 'pupitre'
        and exists (
          select 1
          from public.event_pupitres ep
          where ep.event_id = e.id
            and ep.pupitre_id in (select public.my_managed_pupitre_ids())
        )
        and (
          select count(*)
          from public.event_pupitres ep
          where ep.event_id = e.id
        ) = 1
    );
$$;

revoke all on function public.my_role_level() from public, anon;
revoke all on function public.my_pupitre_ids() from public, anon;
revoke all on function public.my_managed_pupitre_ids() from public, anon;
revoke all on function public.can_access_event(uuid) from public, anon;
revoke all on function public.can_manage_pupitre_event(uuid) from public, anon;
grant execute on function public.my_role_level() to authenticated;
grant execute on function public.my_pupitre_ids() to authenticated;
grant execute on function public.my_managed_pupitre_ids() to authenticated;
grant execute on function public.can_access_event(uuid) to authenticated;
grant execute on function public.can_manage_pupitre_event(uuid) to authenticated;

create or replace function public.create_pupitre_event(
  event_title text,
  event_description text,
  event_location text,
  event_start_at timestamptz,
  event_end_at timestamptz,
  new_event_type public.event_type,
  event_is_poll boolean,
  target_pupitre_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  created_event_id uuid;
begin
  if coalesce((select public.my_role_level()), -1) <> 2 then
    raise exception 'Permission refusée : chef de pupitre requis'
      using errcode = '42501';
  end if;

  if nullif(btrim(event_title), '') is null then
    raise exception 'Le titre de l’événement est obligatoire'
      using errcode = '22023';
  end if;

  if event_start_at is null or event_end_at is null or event_end_at < event_start_at then
    raise exception 'Les dates de l’événement sont invalides'
      using errcode = '22023';
  end if;

  if target_pupitre_id is null
    or target_pupitre_id not in (select public.my_managed_pupitre_ids())
  then
    raise exception 'Le pupitre ciblé doit être dirigé par le chef connecté'
      using errcode = '42501';
  end if;

  insert into public.events (
    title, description, location, start_at, end_at, event_type,
    visibility, is_poll, author_id
  )
  values (
    event_title, event_description, event_location, event_start_at, event_end_at,
    new_event_type,
    'pupitre', event_is_poll, (select auth.uid())
  )
  returning id into created_event_id;

  insert into public.event_pupitres (event_id, pupitre_id)
  values (created_event_id, target_pupitre_id);

  return created_event_id;
end;
$$;

create or replace function public.update_pupitre_event(
  target_event_id uuid,
  event_title text,
  event_description text,
  event_location text,
  event_start_at timestamptz,
  event_end_at timestamptz,
  new_event_type public.event_type,
  event_is_poll boolean,
  target_pupitre_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not coalesce((select public.can_manage_pupitre_event(target_event_id)), false) then
    raise exception 'Permission refusée : événement non gérable'
      using errcode = '42501';
  end if;

  if nullif(btrim(event_title), '') is null then
    raise exception 'Le titre de l’événement est obligatoire'
      using errcode = '22023';
  end if;

  if event_start_at is null or event_end_at is null or event_end_at < event_start_at then
    raise exception 'Les dates de l’événement sont invalides'
      using errcode = '22023';
  end if;

  if target_pupitre_id is null
    or target_pupitre_id not in (select public.my_managed_pupitre_ids())
  then
    raise exception 'Le pupitre ciblé doit être dirigé par le chef connecté'
      using errcode = '42501';
  end if;

  update public.events
  set title = event_title,
      description = event_description,
      location = event_location,
      start_at = event_start_at,
      end_at = event_end_at,
      event_type = new_event_type,
      visibility = 'pupitre',
      is_poll = event_is_poll
  where id = target_event_id;

  delete from public.event_pupitres where event_id = target_event_id;

  insert into public.event_pupitres (event_id, pupitre_id)
  values (target_event_id, target_pupitre_id);
end;
$$;

create or replace function public.delete_pupitre_event(target_event_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not coalesce((select public.can_manage_pupitre_event(target_event_id)), false) then
    raise exception 'Permission refusée : événement non gérable'
      using errcode = '42501';
  end if;

  delete from public.events where id = target_event_id;
end;
$$;

revoke all on function public.create_pupitre_event(
  text, text, text, timestamptz, timestamptz,
  public.event_type, boolean, uuid
) from public, anon;
revoke all on function public.update_pupitre_event(
  uuid, text, text, text, timestamptz, timestamptz,
  public.event_type, boolean, uuid
) from public, anon;
revoke all on function public.delete_pupitre_event(uuid) from public, anon;
grant execute on function public.create_pupitre_event(
  text, text, text, timestamptz, timestamptz,
  public.event_type, boolean, uuid
) to authenticated;
grant execute on function public.update_pupitre_event(
  uuid, text, text, text, timestamptz, timestamptz,
  public.event_type, boolean, uuid
) to authenticated;
grant execute on function public.delete_pupitre_event(uuid) to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.validate_event_pupitre_targets()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.events e
    where e.visibility = 'pupitre'
      and (
        select count(*)
        from public.event_pupitres ep
        where ep.event_id = e.id
      ) <> 1
  ) then
    raise exception
      'Un événement pupitre doit avoir exactement un pupitre cible'
      using errcode = '23514';
  end if;

  if exists (
    select 1
    from public.events e
    join public.event_pupitres ep on ep.event_id = e.id
    where e.visibility in ('public', 'interne')
  ) then
    raise exception
      'Un événement public ou interne ne peut pas avoir de pupitre cible'
      using errcode = '23514';
  end if;

  return null;
end;
$$;

revoke all on function public.validate_event_pupitre_targets()
  from public, anon, authenticated;

create or replace function public.approve_member(target_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce((select public.my_role_level()), -1) < 3 then
    raise exception 'Permission refusée : secrétaire ou admin requis'
      using errcode = '42501';
  end if;

  if not exists (
    select 1
    from auth.users u
    where u.id = target_profile_id
      and u.email_confirmed_at is not null
  ) then
    raise exception 'Adresse e-mail non confirmée'
      using errcode = '42501';
  end if;

  update public.profiles
  set account_status = 'active'
  where id = target_profile_id and account_status = 'pending';

  if not found then
    raise exception 'Profil introuvable ou déjà activé'
      using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.set_profile_role(
  target_profile_id uuid,
  new_role public.app_role
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce((select public.my_role_level()), -1) <> 4 then
    raise exception 'Permission refusée : admin requis'
      using errcode = '42501';
  end if;

  if not exists (
    select 1
    from auth.users u
    where u.id = target_profile_id
      and u.email_confirmed_at is not null
  ) then
    raise exception 'Adresse e-mail non confirmée'
      using errcode = '42501';
  end if;

  update public.profiles
  set role = new_role
  where id = target_profile_id
    and account_status <> 'pending';
  if not found then
    raise exception 'Profil introuvable ou encore en attente'
      using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.set_account_status(
  target_profile_id uuid,
  new_status public.account_status
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce((select public.my_role_level()), -1) <> 4 then
    raise exception 'Permission refusée : admin requis'
      using errcode = '42501';
  end if;

  if new_status not in ('active', 'suspended') then
    raise exception 'Le statut doit être active ou suspended'
      using errcode = '22023';
  end if;

  if new_status = 'active' and not exists (
    select 1
    from auth.users u
    where u.id = target_profile_id
      and u.email_confirmed_at is not null
  ) then
    raise exception 'Adresse e-mail non confirmée'
      using errcode = '42501';
  end if;

  update public.profiles
  set account_status = new_status
  where id = target_profile_id
    and account_status <> 'pending';
  if not found then
    raise exception 'Profil introuvable ou encore en attente'
      using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.update_member_status(
  target_profile_id uuid,
  new_level public.musician_level,
  new_costume_complete boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce((select public.my_role_level()), -1) < 3 then
    raise exception 'Permission refusée : secrétaire ou admin requis'
      using errcode = '42501';
  end if;

  update public.profiles
  set
    musician_level = new_level,
    costume_complete = new_costume_complete,
    updated_at = now()
  where id = target_profile_id;

  if not found then
    raise exception 'Profil introuvable'
      using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.fill_account_deletion_snapshot()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.profile_id is not null then
    select p.first_name || ' ' || p.last_name, u.email
      into new.snapshot_name, new.snapshot_email
      from public.profiles p
      join auth.users u on u.id = p.id
     where p.id = new.profile_id;
  end if;
  return new;
end;
$$;

create trigger account_deletion_requests_fill_snapshot
  before insert on public.account_deletion_requests
  for each row execute function public.fill_account_deletion_snapshot();

revoke all on function public.approve_member(uuid) from public, anon;
revoke all on function public.set_profile_role(uuid, public.app_role) from public, anon;
revoke all on function public.set_account_status(uuid, public.account_status)
  from public, anon;
revoke all on function public.update_member_status(uuid, public.musician_level, boolean)
  from public, anon;
revoke all on function public.fill_account_deletion_snapshot() from public, anon, authenticated;
grant execute on function public.approve_member(uuid) to authenticated;
grant execute on function public.set_profile_role(uuid, public.app_role) to authenticated;
grant execute on function public.set_account_status(uuid, public.account_status)
  to authenticated;
grant execute on function public.update_member_status(uuid, public.musician_level, boolean)
  to authenticated;

-- 6. Policies RLS optimisées (InitPlan)

-- ----------------------------------------------------------------------------
-- Table: pupitres
-- ----------------------------------------------------------------------------
-- The public list contains only instrument section names and slugs.
create policy "pupitres: lecture publique"
  on public.pupitres for select
  to anon, authenticated
  using (true);

create policy "pupitres: écriture admin"
  on public.pupitres for all
  to authenticated
  using ((select public.my_role_level()) = 4)
  with check ((select public.my_role_level()) = 4);

-- ----------------------------------------------------------------------------
-- Table: profiles
-- ----------------------------------------------------------------------------
create policy "profiles: lecture de soi"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()) and (select public.my_role_level()) >= 1);

create policy "profiles: lecture secretaire et admin"
  on public.profiles for select
  to authenticated
  using ((select public.my_role_level()) >= 3);

create policy "profiles: lecture membres actifs"
  on public.profiles for select
  to authenticated
  using (account_status = 'active' and (select public.my_role_level()) >= 1);

create policy "profiles: mise à jour de soi"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()) and (select public.my_role_level()) >= 1)
  with check (id = (select auth.uid()) and (select public.my_role_level()) >= 1);

create policy "profiles: gestion des membres secrétaire et admin"
  on public.profiles for update
  to authenticated
  using ((select public.my_role_level()) >= 3)
  with check ((select public.my_role_level()) >= 3);

create policy "profiles: gestion admin"
  on public.profiles for all
  to authenticated
  using ((select public.my_role_level()) = 4)
  with check ((select public.my_role_level()) = 4);

-- ----------------------------------------------------------------------------
-- Table: profile_pupitres
-- ----------------------------------------------------------------------------
create policy "profile_pupitres: lecture de soi"
  on public.profile_pupitres for select
  to authenticated
  using (
    profile_id = (select auth.uid())
    and (select public.my_role_level()) >= 1
  );

create policy "profile_pupitres: lecture membres actifs"
  on public.profile_pupitres for select
  to authenticated
  using ((select public.my_role_level()) >= 1);

create policy "profile_pupitres: lecture chef sur son pupitre"
  on public.profile_pupitres for select
  to authenticated
  using (
    (select public.my_role_level()) = 2
    and pupitre_id in (select public.my_managed_pupitre_ids())
  );

create policy "profile_pupitres: gestion secretaire et admin"
  on public.profile_pupitres for all
  to authenticated
  using ((select public.my_role_level()) >= 3)
  with check ((select public.my_role_level()) >= 3);

-- ----------------------------------------------------------------------------
-- Table: bureau_positions
-- ----------------------------------------------------------------------------
create policy "bureau_positions: lecture de soi"
  on public.bureau_positions for select
  to authenticated
  using (
    profile_id = (select auth.uid())
    and (select public.my_role_level()) >= 1
    and start_date <= current_date
    and (end_date is null or end_date >= current_date)
  );

create policy "bureau_positions: lecture membres actifs"
  on public.bureau_positions for select
  to authenticated
  using (
    (select public.my_role_level()) >= 1
    and start_date <= current_date
    and (end_date is null or end_date >= current_date)
  );

create policy "bureau_positions: gestion secretaire et admin"
  on public.bureau_positions for all
  to authenticated
  using ((select public.my_role_level()) >= 3)
  with check ((select public.my_role_level()) >= 3);

-- ----------------------------------------------------------------------------
-- Table: invitations & invitation_pupitres
-- ----------------------------------------------------------------------------
create policy "invitations: gestion admin/secretaire"
  on public.invitations for all
  to authenticated
  using ((select public.my_role_level()) >= 3)
  with check ((select public.my_role_level()) >= 3);

create policy "invitation_pupitres: gestion admin/secretaire"
  on public.invitation_pupitres for all
  to authenticated
  using ((select public.my_role_level()) >= 3)
  with check ((select public.my_role_level()) >= 3);

-- ----------------------------------------------------------------------------
-- Table: events
-- ----------------------------------------------------------------------------
create policy "events: lecture publique"
  on public.events for select
  to anon, authenticated
  using (visibility = 'public');

create policy "events: lecture interne membres"
  on public.events for select
  to authenticated
  using (
    visibility = 'interne'
    and (select public.my_role_level()) >= 1
  );

create policy "events: lecture pupitre cible"
  on public.events for select
  to authenticated
  using (
    visibility = 'pupitre'
    and (select public.can_access_event(id))
  );

create policy "events: écriture secrétaire et admin"
  on public.events for all
  to authenticated
  using ((select public.my_role_level()) >= 3)
  with check ((select public.my_role_level()) >= 3);

-- Les chefs passent par les RPC atomiques create/update/delete_pupitre_event.

-- ----------------------------------------------------------------------------
-- Table: event_pupitres
-- ----------------------------------------------------------------------------
create policy "event_pupitres: lecture membres"
  on public.event_pupitres for select
  to authenticated
  using ((select public.can_access_event(event_id)));

create policy "event_pupitres: gestion secretaire et admin"
  on public.event_pupitres for all
  to authenticated
  using ((select public.my_role_level()) >= 3)
  with check ((select public.my_role_level()) >= 3);

-- Les chefs modifient ces liaisons uniquement via les RPC atomiques.

-- ----------------------------------------------------------------------------
-- Table: event_responses
-- ----------------------------------------------------------------------------
create policy "event_responses: lecture soi, chef et secretaire"
  on public.event_responses for select
  to authenticated
  using (
    (select public.my_role_level()) >= 3
    or (
      (select public.my_role_level()) = 2
      and exists (
        select 1
        from public.event_pupitres ep
        where ep.event_id = event_responses.event_id
          and ep.pupitre_id in (select public.my_pupitre_ids())
      )
    )
    or (
      profile_id = (select auth.uid())
      and (select public.my_role_level()) >= 1
      and (select public.can_access_event(event_id))
    )
  );

create policy "event_responses: insertion soi"
  on public.event_responses for insert
  to authenticated
  with check (
    profile_id = (select auth.uid())
    and (select public.my_role_level()) >= 1
    and (select public.can_access_event(event_id))
  );

create policy "event_responses: modification soi ou secretaire"
  on public.event_responses for update
  to authenticated
  using (
    (select public.my_role_level()) >= 3
    or (
      profile_id = (select auth.uid())
      and (select public.my_role_level()) >= 1
      and (select public.can_access_event(event_id))
    )
  )
  with check (
    (
      (select public.my_role_level()) >= 3
      or (
        profile_id = (select auth.uid())
        and (select public.my_role_level()) >= 1
        and (select public.can_access_event(event_id))
      )
    )
    and status in ('present', 'absent')
  );

create view public.event_response_details
with (security_barrier = true)
as
select er.event_id, er.profile_id, p.first_name, p.last_name, er.status
from public.event_responses er
join public.profiles p on p.id = er.profile_id
where
  (select public.my_role_level()) >= 3
  or (
    (select public.my_role_level()) = 2
    and exists (
      select 1
      from public.event_pupitres ep
      where ep.event_id = er.event_id
        and ep.pupitre_id in (select public.my_pupitre_ids())
    )
  )
  or (
    er.profile_id = (select auth.uid())
    and (select public.my_role_level()) >= 1
    and (select public.can_access_event(er.event_id))
  );

comment on view public.event_response_details is
  'Minimal respondent names and statuses filtered by event access.';
revoke all on public.event_response_details from public, anon, authenticated;
grant select on public.event_response_details to authenticated;

create view public.member_directory
with (security_barrier = true, security_invoker = true)
as
select
  p.id as profile_id,
  p.first_name,
  p.last_name,
  'profiles/' || p.id::text || '/avatar.webp' as avatar_path,
  p.musician_level,
  array(
    select sections.name
    from (
      select distinct section.name
      from public.profile_pupitres pp
      join public.pupitres section on section.id = pp.pupitre_id
      where pp.profile_id = p.id
    ) sections
    order by sections.name
  ) as pupitres,
  array(
    select bp.title
    from public.bureau_positions bp
    where bp.profile_id = p.id
      and bp.start_date <= current_date
      and (bp.end_date is null or bp.end_date >= current_date)
    order by bp.title
  ) as bureau_positions
from public.profiles p
where (select public.my_role_level()) >= 1;

comment on view public.member_directory is
  'V1 directory fields only; row access is limited to active profiles by RLS.';

-- ----------------------------------------------------------------------------
-- Table: documents (Partitions PDF)
-- ----------------------------------------------------------------------------
create policy "documents: lecture tous membres"
  on public.documents for select
  to authenticated
  using ((select public.my_role_level()) >= 1);

create policy "documents: écriture chef sur son pupitre"
  on public.documents for all
  to authenticated
  using (
    (select public.my_role_level()) = 2
    and pupitre_id in (select public.my_managed_pupitre_ids())
  )
  with check (
    (select public.my_role_level()) = 2
    and pupitre_id in (select public.my_managed_pupitre_ids())
  );

create policy "documents: écriture secretaire et admin"
  on public.documents for all
  to authenticated
  using ((select public.my_role_level()) >= 3)
  with check ((select public.my_role_level()) >= 3);

-- ----------------------------------------------------------------------------
-- Table: articles
-- ----------------------------------------------------------------------------
create policy "articles: lecture publique des publiés"
  on public.articles for select
  to anon, authenticated
  using (published = true);

create policy "articles: lecture complète secretaire et admin"
  on public.articles for select
  to authenticated
  using ((select public.my_role_level()) >= 3);

create policy "articles: écriture secretaire et admin"
  on public.articles for all
  to authenticated
  using ((select public.my_role_level()) >= 3)
  with check ((select public.my_role_level()) >= 3);

-- ----------------------------------------------------------------------------
-- Table: albums & media
-- ----------------------------------------------------------------------------
create policy "albums: lecture publique"
  on public.albums for select
  to anon, authenticated
  using (is_public = true);

create policy "albums: lecture membres"
  on public.albums for select
  to authenticated
  using ((select public.my_role_level()) >= 1);

create policy "albums: écriture secretaire et admin"
  on public.albums for all
  to authenticated
  using ((select public.my_role_level()) >= 3)
  with check ((select public.my_role_level()) >= 3);

create policy "media: lecture si album accessible"
  on public.media for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.albums a
      where a.id = media.album_id
      and (
        a.is_public = true
        or (select public.my_role_level()) >= 1
      )
    )
  );

create policy "media: écriture secretaire et admin"
  on public.media for all
  to authenticated
  using ((select public.my_role_level()) >= 3)
  with check ((select public.my_role_level()) >= 3);

-- ----------------------------------------------------------------------------
-- Table: notification_log
-- ----------------------------------------------------------------------------
create policy "notification_log: lecture auteur ou admin"
  on public.notification_log for select
  to authenticated
  using (
    (
      (select public.my_role_level()) >= 2
      and sender_id = (select auth.uid())
    )
    or (select public.my_role_level()) = 4
  );

-- ----------------------------------------------------------------------------
-- Table: activity_log
-- ----------------------------------------------------------------------------
create policy "activity_log: lecture admin"
  on public.activity_log for select
  to authenticated
  using ((select public.my_role_level()) = 4);

-- ----------------------------------------------------------------------------
-- Table: notification_preferences
-- ----------------------------------------------------------------------------
create policy "notification_preferences: lecture de soi"
  on public.notification_preferences for select
  to authenticated
  using (
    profile_id = (select auth.uid())
    and (select public.my_role_level()) >= 1
  );

create policy "notification_preferences: insertion de soi"
  on public.notification_preferences for insert
  to authenticated
  with check (
    profile_id = (select auth.uid())
    and (select public.my_role_level()) >= 1
  );

create policy "notification_preferences: modification de soi"
  on public.notification_preferences for update
  to authenticated
  using (
    profile_id = (select auth.uid())
    and (select public.my_role_level()) >= 1
  )
  with check (
    profile_id = (select auth.uid())
    and (select public.my_role_level()) >= 1
  );

-- ----------------------------------------------------------------------------
-- Table: account_deletion_requests
-- ----------------------------------------------------------------------------
create policy "account_deletion_requests: lecture de soi"
  on public.account_deletion_requests for select
  to authenticated
  using (
    profile_id = (select auth.uid())
    and (select public.my_role_level()) >= 1
  );

create policy "account_deletion_requests: création de soi"
  on public.account_deletion_requests for insert
  to authenticated
  with check (
    profile_id = (select auth.uid())
    and (select public.my_role_level()) >= 1
    and status = 'pending'
    and processed_by is null
    and processed_at is null
  );

create policy "account_deletion_requests: lecture secrétaire et admin"
  on public.account_deletion_requests for select
  to authenticated
  using ((select public.my_role_level()) >= 3);

create policy "account_deletion_requests: traitement secrétaire et admin"
  on public.account_deletion_requests for update
  to authenticated
  using ((select public.my_role_level()) >= 3)
  with check ((select public.my_role_level()) >= 3);

-- ----------------------------------------------------------------------------
-- Table: member_loans
-- ----------------------------------------------------------------------------
create policy "member_loans: lecture de soi"
  on public.member_loans for select
  to authenticated
  using (
    profile_id = (select auth.uid())
    and (select public.my_role_level()) >= 1
  );

create policy "member_loans: lecture chef sur son pupitre"
  on public.member_loans for select
  to authenticated
  using (
    (select public.my_role_level()) = 2
    and exists (
      select 1
      from public.profile_pupitres pp
      where pp.profile_id = member_loans.profile_id
        and pp.pupitre_id in (select public.my_managed_pupitre_ids())
    )
  );

create policy "member_loans: gestion secrétaire et admin"
  on public.member_loans for all
  to authenticated
  using ((select public.my_role_level()) >= 3)
  with check ((select public.my_role_level()) >= 3);

-- 7. Trigger d'inscription sur auth.users (liaison invitation -> profil)
create or replace function public.retire_previous_invitation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.invitations
  set used_at = now()
  where lower(email) = lower(new.email)
    and used_at is null;
  return new;
end;
$$;

create trigger invitations_retire_previous
  before insert on public.invitations
  for each row execute function public.retire_previous_invitation();

create unique index invitations_email_active_unique
  on public.invitations (lower(email))
  where used_at is null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  inv record;
begin
  -- Recherche d'une invitation valide (email correspondant, non expirée et non utilisée)
  select * into inv
  from public.invitations
  where lower(email) = lower(new.email)
    and used_at is null
    and created_at > (now() - interval '1 hour')
  order by created_at desc
  limit 1
  for update;

  if not found then
    raise exception 'Aucune invitation valide ou non expirée trouvée pour l''adresse email %', new.email;
  end if;

  -- Le statut d'accès et le rôle applicatif sont deux données indépendantes.
  insert into public.profiles (id, first_name, last_name, account_status, role)
  values (new.id, inv.first_name, inv.last_name, 'pending', 'member');

  -- Attribution des pupitres rattachés à l'invitation
  insert into public.profile_pupitres (profile_id, pupitre_id)
  select new.id, ip.pupitre_id
  from public.invitation_pupitres ip
  where ip.invitation_id = inv.id;

  -- Marquer l'invitation comme utilisée
  update public.invitations
  set used_at = now()
  where id = inv.id;

  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

create trigger event_responses_set_updated_at
  before update on public.event_responses
  for each row execute function public.set_updated_at();

create trigger articles_set_updated_at
  before update on public.articles
  for each row execute function public.set_updated_at();

create trigger notification_preferences_set_updated_at
  before update on public.notification_preferences
  for each row execute function public.set_updated_at();

create trigger member_loans_set_updated_at
  before update on public.member_loans
  for each row execute function public.set_updated_at();

create constraint trigger events_validate_pupitre_targets
  after insert or update or delete on public.events
  deferrable initially deferred
  for each row execute function public.validate_event_pupitre_targets();

create constraint trigger event_pupitres_validate_targets
  after insert or update or delete on public.event_pupitres
  deferrable initially deferred
  for each row execute function public.validate_event_pupitre_targets();

-- Keep deletion requests after the profile is removed.
create index account_deletion_requests_status_requested_at_idx
  on public.account_deletion_requests(status, requested_at);
create unique index account_deletion_requests_one_pending_profile_idx
  on public.account_deletion_requests(profile_id)
  where profile_id is not null and status = 'pending';

-- Indexes supporting RLS and the common access paths. Primary keys and UNIQUE
-- constraints already provide the leading-column indexes for their tables.
create index profiles_account_status_role_idx
  on public.profiles(account_status, role);
create index bureau_positions_profile_start_idx
  on public.bureau_positions(profile_id, start_date desc);
create index profile_pupitres_pupitre_profile_idx
  on public.profile_pupitres(pupitre_id, profile_id);
create unique index profile_pupitres_one_chef_per_pupitre_idx
  on public.profile_pupitres(pupitre_id)
  where is_chef = true;
create index events_visibility_start_at_idx
  on public.events(visibility, start_at);
create index event_pupitres_pupitre_event_idx
  on public.event_pupitres(pupitre_id, event_id);
create index event_responses_profile_event_idx
  on public.event_responses(profile_id, event_id);
create index documents_pupitre_idx
  on public.documents(pupitre_id);
create index articles_published_at_idx
  on public.articles(published_at desc)
  where published = true;
create index media_album_idx on public.media(album_id);
create index member_loans_profile_idx on public.member_loans(profile_id);

-- Explicit SQL grants complement RLS; neither grants nor policies alone
-- provide access.
grant usage on schema public to anon, authenticated, service_role;

revoke all on
  public.pupitres,
  public.profiles,
  public.profile_pupitres,
  public.bureau_positions,
  public.invitations,
  public.invitation_pupitres,
  public.events,
  public.event_pupitres,
  public.event_responses,
  public.documents,
  public.articles,
  public.albums,
  public.media,
  public.notification_log,
  public.activity_log,
  public.notification_preferences,
  public.account_deletion_requests,
  public.member_loans,
  public.member_directory
from public, anon, authenticated;

grant select on public.pupitres to anon, authenticated;
grant insert, update, delete on public.pupitres to authenticated;

grant select (id, first_name, last_name, musician_level)
  on public.profiles to authenticated;
grant update (first_name, last_name, phone, nickname, birthdate)
  on public.profiles to authenticated;

grant select on public.profile_pupitres, public.bureau_positions
  to authenticated;
grant select on public.member_directory to authenticated;
grant insert, update, delete on public.profile_pupitres, public.bureau_positions
  to authenticated;

grant select, insert, update, delete
  on public.invitations, public.invitation_pupitres
  to authenticated;

grant select, insert, update, delete on public.events, public.event_pupitres
  to authenticated;
grant select on public.events to anon;

grant select, insert on public.event_responses to authenticated;
grant update (status) on public.event_responses to authenticated;

grant select, insert, update, delete on public.documents to authenticated;

grant select on public.articles to anon, authenticated;
grant insert, update, delete on public.articles to authenticated;

grant select on public.albums, public.media to anon, authenticated;
grant insert, update, delete on public.albums, public.media to authenticated;

grant select on public.notification_log, public.activity_log to authenticated;
grant select, insert on public.notification_preferences to authenticated;
grant update (enabled, event_notifications, poll_reminders)
  on public.notification_preferences to authenticated;

grant select, insert on public.account_deletion_requests to authenticated;
grant update (status, processed_by, processed_at, notes)
  on public.account_deletion_requests to authenticated;
grant select, insert, update, delete on public.member_loans to authenticated;

grant all on
  public.pupitres,
  public.profiles,
  public.profile_pupitres,
  public.bureau_positions,
  public.invitations,
  public.invitation_pupitres,
  public.events,
  public.event_pupitres,
  public.event_responses,
  public.documents,
  public.articles,
  public.albums,
  public.media,
  public.notification_log,
  public.activity_log,
  public.notification_preferences,
  public.account_deletion_requests,
  public.member_loans,
  public.event_response_details,
  public.member_directory
to service_role;

-- Public media are intentionally world-readable; private files require RLS.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'bagad-public',
    'bagad-public',
    true,
    20971520,
    array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'bagad-private',
    'bagad-private',
    false,
    20971520,
    array['application/pdf', 'image/webp']
  );

create or replace function public.can_read_profile_avatar(target_profile_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select public.my_role_level()), -1) >= 1
    and exists (
      select 1
      from public.profiles p
      where p.id::text = target_profile_id
        and p.account_status = 'active'
    )
$$;

create or replace function public.can_manage_profile_avatar(target_profile_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select public.my_role_level()), -1) >= 1
    and exists (
      select 1
      from public.profiles p
      where p.id::text = target_profile_id
        and p.id = (select auth.uid())
        and p.account_status = 'active'
    )
$$;

revoke all on function public.can_read_profile_avatar(text) from public, anon;
revoke all on function public.can_manage_profile_avatar(text) from public, anon;
grant execute on function public.can_read_profile_avatar(text) to authenticated;
grant execute on function public.can_manage_profile_avatar(text) to authenticated;

create policy "bagad-public: lecture publique"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'bagad-public');

create policy "bagad-public: ajout secrétaire et admin"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'bagad-public'
    and (storage.foldername(name))[1] in ('articles', 'albums', 'events', 'documents')
    and (select public.my_role_level()) >= 3
  );

create policy "bagad-public: modification secrétaire et admin"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'bagad-public'
    and (storage.foldername(name))[1] in ('articles', 'albums', 'events', 'documents')
    and (select public.my_role_level()) >= 3
  )
  with check (
    bucket_id = 'bagad-public'
    and (storage.foldername(name))[1] in ('articles', 'albums', 'events', 'documents')
    and (select public.my_role_level()) >= 3
  );

create policy "bagad-public: suppression secrétaire et admin"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'bagad-public'
    and (storage.foldername(name))[1] in ('articles', 'albums', 'events', 'documents')
    and (select public.my_role_level()) >= 3
  );

create policy "bagad-private: lecture selon profil ou document"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'bagad-private'
    and (select public.my_role_level()) >= 1
    and (
      (
        (storage.foldername(name))[1] = 'profiles'
        and array_length(storage.foldername(name), 1) = 2
        and storage.filename(name) = 'avatar.webp'
        and (select public.can_read_profile_avatar((storage.foldername(name))[2]))
      )
      or (
        (storage.foldername(name))[1] = 'documents'
        and (
          exists (
            select 1 from public.documents d
            where d.storage_path = name
          )
          or exists (
            select 1
            from public.media m
            join public.albums a on a.id = m.album_id
            where m.storage_path = name
              and a.is_public = false
          )
        )
      )
    )
  );

create policy "bagad-private: ajout selon rôle"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'bagad-private'
    and (
      (
        (storage.foldername(name))[1] = 'profiles'
        and array_length(storage.foldername(name), 1) = 2
        and storage.filename(name) = 'avatar.webp'
        and (select public.can_manage_profile_avatar((storage.foldername(name))[2]))
      )
      or (
        (storage.foldername(name))[1] = 'documents'
        and (
          (select public.my_role_level()) >= 3
          or (
            (select public.my_role_level()) = 2
            and (storage.foldername(name))[2] not in ('albums', '')
            and exists (
              select 1
              from public.pupitres p
              where p.slug = (storage.foldername(name))[2]
                and p.id in (select public.my_managed_pupitre_ids())
            )
          )
        )
      )
    )
  );

create policy "bagad-private: modification propriétaire ou rôle"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'bagad-private'
    and (
      (
        (storage.foldername(name))[1] = 'profiles'
        and array_length(storage.foldername(name), 1) = 2
        and storage.filename(name) = 'avatar.webp'
        and (select public.can_manage_profile_avatar((storage.foldername(name))[2]))
      )
      or (
        (storage.foldername(name))[1] = 'documents'
        and (
          (select public.my_role_level()) >= 3
          or (
            (select public.my_role_level()) = 2
            and (storage.foldername(name))[2] not in ('albums', '')
            and exists (
              select 1
              from public.pupitres p
              where p.slug = (storage.foldername(name))[2]
                and p.id in (select public.my_managed_pupitre_ids())
            )
          )
        )
      )
    )
  )
  with check (
    bucket_id = 'bagad-private'
    and (
      (
        (storage.foldername(name))[1] = 'profiles'
        and array_length(storage.foldername(name), 1) = 2
        and storage.filename(name) = 'avatar.webp'
        and (select public.can_manage_profile_avatar((storage.foldername(name))[2]))
      )
      or (
        (storage.foldername(name))[1] = 'documents'
        and (
          (select public.my_role_level()) >= 3
          or (
            (select public.my_role_level()) = 2
            and (storage.foldername(name))[2] not in ('albums', '')
            and exists (
              select 1
              from public.pupitres p
              where p.slug = (storage.foldername(name))[2]
                and p.id in (select public.my_managed_pupitre_ids())
            )
          )
        )
      )
    )
  );

create policy "bagad-private: suppression propriétaire ou rôle"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'bagad-private'
    and (
      (
        (storage.foldername(name))[1] = 'profiles'
        and array_length(storage.foldername(name), 1) = 2
        and storage.filename(name) = 'avatar.webp'
        and (select public.can_manage_profile_avatar((storage.foldername(name))[2]))
      )
      or (
        (storage.foldername(name))[1] = 'documents'
        and (
          (select public.my_role_level()) >= 3
          or (
            (select public.my_role_level()) = 2
            and (storage.foldername(name))[2] not in ('albums', '')
            and exists (
              select 1
              from public.pupitres p
              where p.slug = (storage.foldername(name))[2]
                and p.id in (select public.my_managed_pupitre_ids())
            )
          )
        )
      )
    )
  );

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.retire_previous_invitation() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- 9. Données initiales des pupitres
insert into public.pupitres (name, slug) values
  ('Bombarde', 'bombarde'),
  ('Cornemuse', 'cornemuse'),
  ('Caisse claire', 'caisse-claire'),
  ('Percussion', 'percussion')
on conflict (slug) do nothing;

commit;
