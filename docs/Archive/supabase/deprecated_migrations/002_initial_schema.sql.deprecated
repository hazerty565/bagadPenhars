-- ============================================================================
-- Migration: 002_initial_schema.sql
-- Description:
--   - Complète le schéma cible selon docs/database.md et docs/questions.md
--   - Ajoute les préférences de notifications et les demandes de suppression
--   - Ajoute les champs éditoriaux conservés de l'ancien modèle articles
--   - Corrige les opérations de rôle via des fonctions serveur sécurisées
--   - Configure les buckets Supabase Storage et leurs policies
--
-- IMPORTANT :
--   - Ne modifie pas 001_initial_schema.sql.
--   - La base cible démarre vierge : cette migration ne copie pas les anciennes
--     lignes Supabase. Le formulaire de contact reste géré par Netlify Forms.
--   - Les fichiers de partitions doivent utiliser le chemin
--     "<slug-pupitre>/<nom-fichier>.pdf" dans bagad-partitions.
--   - Les photos doivent être converties en WebP côté serveur avant stockage
--     dans bagad-medias.
-- ============================================================================

begin;

-- 1. Préférences OneSignal gérées par chaque membre.
-- Les abonnements/appareils restent gérés par le SDK OneSignal.
create table public.notification_preferences (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  enabled boolean not null default true,
  event_notifications boolean not null default true,
  poll_reminders boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

create policy "notification_preferences: lecture de soi"
  on public.notification_preferences for select
  to authenticated
  using (profile_id = (select auth.uid()));

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

create index idx_notification_preferences_enabled
  on public.notification_preferences(enabled)
  where enabled = true;

-- 2. Demande de suppression de compte.
-- Les durées de conservation et la purge/anonymisation restent à définir.
create table public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'rejected')),
  requested_at timestamptz not null default now(),
  processed_by uuid references public.profiles(id) on delete set null,
  processed_at timestamptz,
  notes text
);

alter table public.account_deletion_requests enable row level security;

create policy "account_deletion_requests: lecture de soi"
  on public.account_deletion_requests for select
  to authenticated
  using (profile_id = (select auth.uid()));

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

create index idx_account_deletion_requests_status
  on public.account_deletion_requests(status, requested_at);

-- 3. Champs éditoriaux conservés depuis l'ancien modèle d'articles.
-- Le corps éditorial cible reste articles.content.
alter table public.articles
  add column summary text,
  add column image_url text;

-- 4. Fonctions contrôlées de gestion des rôles.
-- Les clients ne reçoivent jamais de droit UPDATE direct sur profiles.role.
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

  update public.profiles
  set role = 'member'
  where id = target_profile_id
    and role = 'pending';

  if not found then
    raise exception 'Profil introuvable ou déjà approuvé'
      using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.approve_member(uuid) from public, anon;
grant execute on function public.approve_member(uuid) to authenticated;

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

  update public.profiles
  set role = new_role
  where id = target_profile_id;

  if not found then
    raise exception 'Profil introuvable'
      using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.set_profile_role(uuid, public.app_role) from public, anon;
grant execute on function public.set_profile_role(uuid, public.app_role) to authenticated;

-- 5. Correction de la création d'événements par un chef de pupitre.
-- L'événement doit d'abord exister avant que ses lignes event_pupitres puissent
-- être insérées. Le ciblage est ensuite restreint par les policies de
-- event_pupitres. Les chefs ne peuvent créer que des événements de type pupitre.
drop policy if exists "events: écriture chef de pupitre" on public.events;

create policy "events: insertion chef de pupitre"
  on public.events for insert
  to authenticated
  with check (
    (select public.my_role_level()) = 2
    and visibility = 'pupitre'
    and author_id = (select auth.uid())
  );

create policy "events: modification chef de pupitre"
  on public.events for update
  to authenticated
  using (
    (select public.my_role_level()) = 2
    and visibility = 'pupitre'
    and exists (
      select 1
      from public.event_pupitres ep
      where ep.event_id = events.id
        and ep.pupitre_id in (select public.my_pupitre_ids())
    )
  )
  with check (
    (select public.my_role_level()) = 2
    and visibility = 'pupitre'
    and exists (
      select 1
      from public.event_pupitres ep
      where ep.event_id = events.id
        and ep.pupitre_id in (select public.my_pupitre_ids())
    )
  );

create policy "events: suppression chef de pupitre"
  on public.events for delete
  to authenticated
  using (
    (select public.my_role_level()) = 2
    and visibility = 'pupitre'
    and exists (
      select 1
      from public.event_pupitres ep
      where ep.event_id = events.id
        and ep.pupitre_id in (select public.my_pupitre_ids())
    )
  );

-- 6. Stockage Supabase.
-- Partitions : privé, PDF uniquement.
insert into storage.buckets (id, name, public, allowed_mime_types)
values ('bagad-partitions', 'bagad-partitions', false, array['application/pdf'])
on conflict (id) do update
set public = excluded.public,
    allowed_mime_types = excluded.allowed_mime_types;

-- Médias publiés : bucket public WebP uniquement. La conversion JPG/JPEG vers
-- WebP et la limite de 20 Mo des fichiers source doivent être appliquées
-- dans le flux serveur d'import, avant l'envoi dans ce bucket.
insert into storage.buckets (id, name, public, allowed_mime_types)
values ('bagad-medias', 'bagad-medias', true, array['image/webp'])
on conflict (id) do update
set public = excluded.public,
    allowed_mime_types = excluded.allowed_mime_types;

-- Lecture des partitions : tous les membres approuvés, tous pupitres confondus.
drop policy if exists "bagad-partitions: lecture membres" on storage.objects;
create policy "bagad-partitions: lecture membres"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'bagad-partitions'
    and (select public.my_role_level()) >= 1
  );

-- Écriture des partitions : secrétaire/admin, ou chef dans le dossier de son pupitre.
drop policy if exists "bagad-partitions: insertion autorisée" on storage.objects;
create policy "bagad-partitions: insertion autorisée"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'bagad-partitions'
    and (
      (select public.my_role_level()) >= 3
      or (
        (select public.my_role_level()) = 2
        and exists (
          select 1
          from public.pupitres p
          where p.slug = (storage.foldername(name))[1]
            and p.id in (select public.my_pupitre_ids())
        )
      )
    )
  );

drop policy if exists "bagad-partitions: modification autorisée" on storage.objects;
create policy "bagad-partitions: modification autorisée"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'bagad-partitions'
    and (
      (select public.my_role_level()) >= 3
      or (
        (select public.my_role_level()) = 2
        and exists (
          select 1
          from public.pupitres p
          where p.slug = (storage.foldername(name))[1]
            and p.id in (select public.my_pupitre_ids())
        )
      )
    )
  )
  with check (
    bucket_id = 'bagad-partitions'
    and (
      (select public.my_role_level()) >= 3
      or (
        (select public.my_role_level()) = 2
        and exists (
          select 1
          from public.pupitres p
          where p.slug = (storage.foldername(name))[1]
            and p.id in (select public.my_pupitre_ids())
        )
      )
    )
  );

drop policy if exists "bagad-partitions: suppression autorisée" on storage.objects;
create policy "bagad-partitions: suppression autorisée"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'bagad-partitions'
    and (
      (select public.my_role_level()) >= 3
      or (
        (select public.my_role_level()) = 2
        and exists (
          select 1
          from public.pupitres p
          where p.slug = (storage.foldername(name))[1]
            and p.id in (select public.my_pupitre_ids())
        )
      )
    )
  );

-- Médias publiés : lecture publique, écriture secrétaire/admin.
drop policy if exists "bagad-medias: lecture publique" on storage.objects;
create policy "bagad-medias: lecture publique"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'bagad-medias');

drop policy if exists "bagad-medias: insertion secrétaire et admin" on storage.objects;
create policy "bagad-medias: insertion secrétaire et admin"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'bagad-medias'
    and (select public.my_role_level()) >= 3
  );

drop policy if exists "bagad-medias: modification secrétaire et admin" on storage.objects;
create policy "bagad-medias: modification secrétaire et admin"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'bagad-medias'
    and (select public.my_role_level()) >= 3
  )
  with check (
    bucket_id = 'bagad-medias'
    and (select public.my_role_level()) >= 3
  );

drop policy if exists "bagad-medias: suppression secrétaire et admin" on storage.objects;
create policy "bagad-medias: suppression secrétaire et admin"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'bagad-medias'
    and (select public.my_role_level()) >= 3
  );

-- 7. Index et timestamps.
create index if not exists idx_articles_published_at
  on public.articles(published, published_at desc);

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

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

drop trigger if exists event_responses_set_updated_at on public.event_responses;
create trigger event_responses_set_updated_at
  before update on public.event_responses
  for each row execute function public.set_updated_at();

drop trigger if exists articles_set_updated_at on public.articles;
create trigger articles_set_updated_at
  before update on public.articles
  for each row execute function public.set_updated_at();

drop trigger if exists notification_preferences_set_updated_at on public.notification_preferences;
create trigger notification_preferences_set_updated_at
  before update on public.notification_preferences
  for each row execute function public.set_updated_at();

commit;
