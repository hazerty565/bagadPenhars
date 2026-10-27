-- ============================================================================
-- Migration: 003_fixes.sql
-- Description:
--   - Unicité des invitations actives par email + verrou dans le trigger
--     d'inscription (corrige la race condition sur le trigger handle_new_user)
--   - Traçabilité des demandes de suppression de compte : la demande survit
--     à la suppression du profil, avec snapshot d'identité
--
-- IMPORTANT :
--   - Ne modifie ni 001 ni 002 : règle "une migration appliquée n'est jamais
--     modifiée".
--   - Interaction assumée : une seule invitation ACTIVE par email. Pour relancer
--     un invité, la secrétaire supprime l'invitation en attente ou en recrée une
--     après expiration des 7 jours.
-- ============================================================================

begin;

-- 1. Invitations : une seule invitation active (non utilisée) par email.
-- Corrige la race condition : deux inscriptions simultanées avec la même
-- invitation ne peuvent plus créer deux profils. Sert aussi de garde-fou aux
-- doublons d'invitations en attente.
-- Remplace idx_invitations_email, inutilisable par le trigger (filtre lower(email)).
drop index if exists public.idx_invitations_email;

create unique index if not exists invitations_email_active_unique
  on public.invitations (lower(email))
  where used_at is null;

-- 2. Trigger d'inscription : verrouillage de l'invitation consommée.
-- FOR UPDATE : une inscription concurrente bloque sur la ligne, la re-évalue
-- après commit de la première (used_at renseigné) et échoue proprement
-- ("Aucune invitation valide...").
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
  limit 1
  for update;

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

-- 3. Demandes de suppression de compte : la trace survit au compte.
-- La demande est la preuve de traitement (journal RGPD) : le profil est
-- détaché (set null) au lieu d'être supprimé en cascade, et un snapshot
-- d'identité est copié à la création.
alter table public.account_deletion_requests
  add column if not exists snapshot_email text,
  add column if not exists snapshot_name text;

alter table public.account_deletion_requests
  drop constraint if exists account_deletion_requests_profile_id_fkey;

alter table public.account_deletion_requests
  add constraint account_deletion_requests_profile_id_fkey
  foreign key (profile_id) references public.profiles(id) on delete set null;

-- 3b. Snapshot automatique à la création de la demande.
-- Interdit aussi à l'utilisateur de fournir lui-même les valeurs du snapshot.
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

drop trigger if exists account_deletion_requests_fill_snapshot
  on public.account_deletion_requests;
create trigger account_deletion_requests_fill_snapshot
  before insert on public.account_deletion_requests
  for each row execute function public.fill_account_deletion_snapshot();

commit;
