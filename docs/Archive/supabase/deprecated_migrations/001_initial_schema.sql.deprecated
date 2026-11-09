-- ============================================================================
-- Migration: 001_initial_schema.sql
-- Description: Schéma initial complet du Bagad Penhars
--   - Extensions, Types enum (app_role, event_visibility, response_status)
--   - Fonctions d'aide de sécurité (my_role_level, my_pupitre_ids)
--   - Tables du domaine métier avec intégrité référentielle et cascades
--   - Activation de RLS sur 100% des tables publiques avec policies optimisées
--   - Trigger d'invitation et création de profil sur auth.users
--   - Index de performance RLS et données initiales des pupitres
-- ============================================================================

-- 1. Extensions
create extension if not exists "pgcrypto";

-- 2. Types Enum
create type public.app_role as enum ('pending', 'member', 'chef_pupitre', 'secretaire', 'admin');
create type public.event_visibility as enum ('public', 'pupitre', 'interne');
create type public.response_status as enum ('present', 'absent');

-- 3. Fonctions de sécurité d'aide RLS (security definer, search_path vide)
create or replace function public.my_role_level()
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select case p.role
    when 'pending' then 0
    when 'member' then 1
    when 'chef_pupitre' then 2
    when 'secretaire' then 3
    when 'admin' then 4
    else null
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
  phone text,
  role public.app_role not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Protection de la colonne role sur profiles
revoke update on public.profiles from authenticated;
grant update (first_name, last_name, phone) on public.profiles to authenticated;

-- Liaison Membres <-> Pupitres (un membre peut avoir plusieurs pupitres)
create table public.profile_pupitres (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  pupitre_id uuid not null references public.pupitres(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (profile_id, pupitre_id)
);

-- Titres du bureau historisés (honorifiques, sans droits associés)
create table public.bureau_positions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  start_date date not null default current_date,
  end_date date,
  created_at timestamptz not null default now()
);

-- Invitations d'adhérents (durée de validité 7 jours)
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

-- Séries d'événements récurrents
create table public.event_series (
  id uuid primary key default gen_random_uuid(),
  rrule text not null,
  created_at timestamptz not null default now()
);

-- Événements d'agenda & Sondages unifiés
create table public.events (
  id uuid primary key default gen_random_uuid(),
  series_id uuid references public.event_series(id) on delete set null,
  title text not null,
  description text,
  location text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  visibility public.event_visibility not null default 'interne',
  is_poll boolean not null default false,
  author_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_dates_check check (end_at >= start_at)
);

-- Liaison Événements <-> Pupitres (pour visibility = 'pupitre')
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

-- Journal d'audit (écriture réservée au service_role)
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_table text,
  target_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);

-- 5. Activation de la RLS sur 100% des tables
alter table public.pupitres enable row level security;
alter table public.profiles enable row level security;
alter table public.profile_pupitres enable row level security;
alter table public.bureau_positions enable row level security;
alter table public.invitations enable row level security;
alter table public.invitation_pupitres enable row level security;
alter table public.event_series enable row level security;
alter table public.events enable row level security;
alter table public.event_pupitres enable row level security;
alter table public.event_responses enable row level security;
alter table public.documents enable row level security;
alter table public.articles enable row level security;
alter table public.albums enable row level security;
alter table public.media enable row level security;
alter table public.notification_log enable row level security;
alter table public.audit_log enable row level security;

-- 6. Policies RLS optimisées (InitPlan)

-- ----------------------------------------------------------------------------
-- Table: pupitres
-- ----------------------------------------------------------------------------
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
  using (id = (select auth.uid()));

create policy "profiles: lecture secretaire et admin"
  on public.profiles for select
  to authenticated
  using ((select public.my_role_level()) >= 3);

create policy "profiles: mise à jour de soi"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()) and (select public.my_role_level()) >= 1)
  with check (id = (select auth.uid()) and (select public.my_role_level()) >= 1);

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
  using (profile_id = (select auth.uid()));

create policy "profile_pupitres: lecture chef sur son pupitre"
  on public.profile_pupitres for select
  to authenticated
  using (
    (select public.my_role_level()) = 2
    and pupitre_id in (select public.my_pupitre_ids())
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
  using (profile_id = (select auth.uid()));

create policy "bureau_positions: gestion secretaire et admin"
  on public.bureau_positions for all
  to authenticated
  using ((select public.my_role_level()) >= 3)
  with check ((select public.my_role_level()) >= 3);

-- ----------------------------------------------------------------------------
-- Table: invitations & invitation_pupitres
-- ----------------------------------------------------------------------------
create policy "invitations: gestion secretaire et admin"
  on public.invitations for all
  to authenticated
  using ((select public.my_role_level()) >= 3)
  with check ((select public.my_role_level()) >= 3);

create policy "invitation_pupitres: gestion secretaire et admin"
  on public.invitation_pupitres for all
  to authenticated
  using ((select public.my_role_level()) >= 3)
  with check ((select public.my_role_level()) >= 3);

-- ----------------------------------------------------------------------------
-- Table: event_series
-- ----------------------------------------------------------------------------
create policy "event_series: lecture membres"
  on public.event_series for select
  to authenticated
  using ((select public.my_role_level()) >= 1);

create policy "event_series: gestion secretaire et admin"
  on public.event_series for all
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

create policy "events: lecture pupitre ciblé"
  on public.events for select
  to authenticated
  using (
    visibility = 'pupitre'
    and (
      (select public.my_role_level()) >= 3
      or (
        (select public.my_role_level()) >= 1
        and exists (
          select 1 from public.event_pupitres ep
          where ep.event_id = events.id
          and ep.pupitre_id in (select public.my_pupitre_ids())
        )
      )
    )
  );

create policy "events: écriture secrétaire et admin"
  on public.events for all
  to authenticated
  using ((select public.my_role_level()) >= 3)
  with check ((select public.my_role_level()) >= 3);

create policy "events: écriture chef de pupitre"
  on public.events for all
  to authenticated
  using (
    (select public.my_role_level()) = 2
    and visibility = 'pupitre'
    and exists (
      select 1 from public.event_pupitres ep
      where ep.event_id = events.id
      and ep.pupitre_id in (select public.my_pupitre_ids())
    )
  )
  with check (
    (select public.my_role_level()) = 2
    and visibility = 'pupitre'
    and exists (
      select 1 from public.event_pupitres ep
      where ep.event_id = events.id
      and ep.pupitre_id in (select public.my_pupitre_ids())
    )
  );

-- ----------------------------------------------------------------------------
-- Table: event_pupitres
-- ----------------------------------------------------------------------------
create policy "event_pupitres: lecture membres"
  on public.event_pupitres for select
  to authenticated
  using ((select public.my_role_level()) >= 1);

create policy "event_pupitres: gestion secretaire et admin"
  on public.event_pupitres for all
  to authenticated
  using ((select public.my_role_level()) >= 3)
  with check ((select public.my_role_level()) >= 3);

create policy "event_pupitres: gestion chef de pupitre"
  on public.event_pupitres for all
  to authenticated
  using (
    (select public.my_role_level()) = 2
    and pupitre_id in (select public.my_pupitre_ids())
  )
  with check (
    (select public.my_role_level()) = 2
    and pupitre_id in (select public.my_pupitre_ids())
  );

-- ----------------------------------------------------------------------------
-- Table: event_responses
-- ----------------------------------------------------------------------------
create policy "event_responses: lecture soi, chef et secretaire"
  on public.event_responses for select
  to authenticated
  using (
    profile_id = (select auth.uid())
    or (select public.my_role_level()) >= 3
    or (
      (select public.my_role_level()) = 2
      and exists (
        select 1 from public.event_pupitres ep
        where ep.event_id = event_responses.event_id
        and ep.pupitre_id in (select public.my_pupitre_ids())
      )
    )
  );

create policy "event_responses: insertion soi"
  on public.event_responses for insert
  to authenticated
  with check (
    profile_id = (select auth.uid())
    and (select public.my_role_level()) >= 1
  );

create policy "event_responses: modification soi ou secretaire"
  on public.event_responses for update
  to authenticated
  using (
    (profile_id = (select auth.uid()) and (select public.my_role_level()) >= 1)
    or (select public.my_role_level()) >= 3
  )
  with check (
    (profile_id = (select auth.uid()) and (select public.my_role_level()) >= 1)
    or (select public.my_role_level()) >= 3
  );

create policy "event_responses: suppression soi ou admin"
  on public.event_responses for delete
  to authenticated
  using (
    (profile_id = (select auth.uid()) and (select public.my_role_level()) >= 1)
    or (select public.my_role_level()) = 4
  );

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
    and pupitre_id in (select public.my_pupitre_ids())
  )
  with check (
    (select public.my_role_level()) = 2
    and pupitre_id in (select public.my_pupitre_ids())
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
    sender_id = (select auth.uid())
    or (select public.my_role_level()) = 4
  );

-- ----------------------------------------------------------------------------
-- Table: audit_log
-- ----------------------------------------------------------------------------
create policy "audit_log: lecture admin"
  on public.audit_log for select
  to authenticated
  using ((select public.my_role_level()) = 4);

-- 7. Trigger d'inscription sur auth.users (liaison invitation -> profil)
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
    and created_at > (now() - interval '7 days')
  order by created_at desc
  limit 1;

  if not found then
    raise exception 'Aucune invitation valide ou non expirée trouvée pour l''adresse email %', new.email;
  end if;

  -- Création du profil initial en statut pending
  insert into public.profiles (id, first_name, last_name, role)
  values (new.id, inv.first_name, inv.last_name, 'pending');

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

-- 8. Index de performance indispensables pour les jointures et filtres RLS
create index idx_profiles_role on public.profiles(role);
create index idx_profile_pupitres on public.profile_pupitres(profile_id, pupitre_id);
create index idx_event_pupitres on public.event_pupitres(event_id, pupitre_id);
create index idx_events_lookup on public.events(visibility, is_poll);
create index idx_events_dates on public.events(start_at, end_at);
create index idx_event_responses on public.event_responses(event_id, profile_id);
create index idx_invitations_email on public.invitations(email);
create index idx_documents_pupitre on public.documents(pupitre_id);
create index idx_articles_published on public.articles(published);
create index idx_media_album on public.media(album_id);

-- 9. Données initiales des pupitres
insert into public.pupitres (name, slug) values
  ('Bombarde', 'bombarde'),
  ('Cornemuse', 'cornemuse'),
  ('Caisse claire', 'caisse-claire'),
  ('Percussion', 'percussion')
on conflict (slug) do nothing;
