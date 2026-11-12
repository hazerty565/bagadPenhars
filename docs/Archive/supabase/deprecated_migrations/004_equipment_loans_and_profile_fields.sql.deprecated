-- ============================================================================
-- Migration: 004_equipment_loans_and_profile_fields.sql
-- Description:
--   - Ajoute le niveau du musicien (skolaj, bagadig, bagad)
--   - Ajoute les champs du profil : nickname, birthdate, costume_complete
--   - Ajoute la table de suivi simplifié de prêt de matériel et costumes (member_loans)
--   - Configure les droits RLS et permissions
-- ============================================================================

begin;

-- 1. Énumération pour le niveau du musicien
do $$
begin
  if not exists (select 1 from pg_type where typname = 'musician_level') then
    create type public.musician_level as enum ('skolaj', 'bagadig', 'bagad');
  end if;
end $$;

-- 2. Nouveaux champs sur public.profiles
alter table public.profiles
  add column if not exists nickname text,
  add column if not exists birthdate date,
  add column if not exists musician_level public.musician_level not null default 'skolaj',
  add column if not exists costume_complete boolean not null default false;

-- 3. Mise à jour des colonnes modifiables par l'utilisateur connecté sur son profil
grant update (first_name, last_name, phone, nickname, birthdate) on public.profiles to authenticated;

-- 4. Table de suivi des prêts de matériel et costumes par adhérent
create table if not exists public.member_loans (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  item_type text not null check (item_type in ('materiel', 'costume')),
  item_name text not null,
  details text,
  loaned_at date not null default current_date,
  returned_at date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS activée
alter table public.member_loans enable row level security;

-- Index de performance RLS et requêtes
create index if not exists idx_member_loans_profile_id on public.member_loans(profile_id);
create index if not exists idx_member_loans_item_type on public.member_loans(item_type);

-- Policies de lecture :
-- Le membre lit ses propres prêts
create policy "member_loans: lecture de ses propres prêts"
  on public.member_loans for select
  to authenticated
  using (
    profile_id = (select auth.uid())
    and (select public.my_role_level()) >= 1
  );

-- Chef de pupitre : lit les prêts des membres de son pupitre
create policy "member_loans: lecture chef de pupitre"
  on public.member_loans for select
  to authenticated
  using (
    (select public.my_role_level()) = 2
    and exists (
      select 1 from public.profile_pupitres pp
      where pp.profile_id = member_loans.profile_id
      and pp.pupitre_id in (select public.my_pupitre_ids())
    )
  );

-- Secrétaire et admin : lisent tous les prêts
create policy "member_loans: lecture secretaire et admin"
  on public.member_loans for select
  to authenticated
  using (
    (select public.my_role_level()) >= 3
  );

-- Policies d'écriture (INSERT, UPDATE, DELETE) :
-- Réservé aux administrateurs et secrétaires
create policy "member_loans: écriture secretaire et admin"
  on public.member_loans for all
  to authenticated
  using (
    (select public.my_role_level()) >= 3
  )
  with check (
    (select public.my_role_level()) >= 3
  );

-- Fonction pour permettre à l'admin/secrétaire de mettre à jour le statut du costume et le niveau d'un membre
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
  if (select public.my_role_level()) < 3 then
    raise exception 'Droits insuffisants pour modifier le statut du membre';
  end if;

  update public.profiles
  set
    musician_level = new_level,
    costume_complete = new_costume_complete,
    updated_at = now()
  where id = target_profile_id;
end;
$$;

commit;
