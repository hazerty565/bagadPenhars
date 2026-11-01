-- ============================================================================
-- BAGAD PENHARS — Schéma relationnel consolidé (documentation / DrawSQL)
-- Source : migrations Supabase 001 à 004 du dépôt hazerty565/bagadPenhars
-- Révision consultée : 2026-10-31
--
-- IMPORTANT
-- - Ce fichier est un schéma de référence destiné à l'import/visualisation
--   dans DrawSQL ou un outil ERD. Ce n'est PAS une migration à exécuter tel quel.
-- - Les objets auth.users, storage.buckets et storage.objects appartiennent
--   aux extensions/services Supabase et ne sont pas redéclarés ici.
-- - Les policies RLS, fonctions, triggers, grants et buckets ne sont pas
--   représentés comme tables relationnelles ; ils restent définis dans les
--   migrations originales.
-- - Les colonnes account_deletion_requests.profile_id et snapshot_* reflètent
--   la migration 003 (profile_id nullable, ON DELETE SET NULL).
-- - profiles inclut les champs ajoutés par la migration 004.
-- - Le journal est nommé audit_log dans les migrations actuelles consultées.
--   docs/database.md contient aussi une référence historique à activity_log :
--   vérifier cette divergence avant de renommer quoi que ce soit.
-- ============================================================================

-- ENUMS
CREATE TYPE app_role AS ENUM (
  'pending', 'member', 'chef_pupitre', 'secretaire', 'admin'
);

CREATE TYPE event_visibility AS ENUM (
  'public', 'pupitre', 'interne'
);

CREATE TYPE response_status AS ENUM (
  'present', 'absent'
);

CREATE TYPE musician_level AS ENUM (
  'skolaj', 'bagadig', 'bagad'
);

-- ============================================================================
-- RÉFÉRENTIELS ET PROFILS
-- ============================================================================

CREATE TABLE pupitres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- id est aussi la FK vers auth.users.id (table Supabase Auth externe).
CREATE TABLE profiles (
  id uuid PRIMARY KEY,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  role app_role NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  nickname text,
  birthdate date,
  musician_level musician_level NOT NULL DEFAULT 'skolaj',
  costume_complete boolean NOT NULL DEFAULT false
);

CREATE TABLE profile_pupitres (
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pupitre_id uuid NOT NULL REFERENCES pupitres(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, pupitre_id)
);

CREATE TABLE bureau_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  start_date date NOT NULL DEFAULT current_date,
  end_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- INVITATIONS
-- ============================================================================

CREATE TABLE invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  author_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  used_at timestamptz
);

CREATE TABLE invitation_pupitres (
  invitation_id uuid NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  pupitre_id uuid NOT NULL REFERENCES pupitres(id) ON DELETE CASCADE,
  PRIMARY KEY (invitation_id, pupitre_id)
);

-- ============================================================================
-- AGENDA, ÉVÉNEMENTS ET RÉPONSES
-- Un sondage est modélisé par events.is_poll ; il n'existe pas de table polls.
-- Les événements récurrents ne sont pas inclus en V1.
-- ============================================================================

CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  location text,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  visibility event_visibility NOT NULL DEFAULT 'interne',
  is_poll boolean NOT NULL DEFAULT false,
  author_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT events_dates_check CHECK (end_at >= start_at)
);

CREATE TABLE event_pupitres (
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  pupitre_id uuid NOT NULL REFERENCES pupitres(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, pupitre_id)
);

CREATE TABLE event_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status response_status NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT event_responses_unique UNIQUE (event_id, profile_id)
);

-- ============================================================================
-- DOCUMENTS ET CONTENUS PUBLICS
-- ============================================================================

CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  storage_path text NOT NULL,
  pupitre_id uuid NOT NULL REFERENCES pupitres(id) ON DELETE RESTRICT,
  author_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text NOT NULL,
  published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  author_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  summary text,
  image_url text
);

CREATE TABLE albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  is_public boolean NOT NULL DEFAULT false,
  author_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id uuid NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  caption text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- NOTIFICATIONS ET JOURNAUX
-- ============================================================================

CREATE TABLE notification_preferences (
  profile_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  event_notifications boolean NOT NULL DEFAULT true,
  poll_reminders boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  body text NOT NULL,
  audience jsonb NOT NULL DEFAULT '{}'::jsonb,
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_table text,
  target_id uuid,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- RGPD / SUPPRESSION DE COMPTE
-- profile_id devient nullable dans migration 003 pour conserver la demande
-- après suppression du profil ; snapshot_* est renseigné par trigger.
-- ============================================================================
CREATE TABLE account_deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  processed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  processed_at timestamptz,
  notes text,
  snapshot_email text,
  snapshot_name text
);

-- ============================================================================
-- PRÊTS DE MATÉRIEL / COSTUMES
-- ============================================================================
CREATE TABLE member_loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('materiel', 'costume')),
  item_name text NOT NULL,
  details text,
  loaned_at date NOT NULL DEFAULT current_date,
  returned_at date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- INDEX additionnels explicitement présents dans les migrations consultées
-- (les PK/UNIQUE créent déjà leurs propres index).
-- ============================================================================

CREATE UNIQUE INDEX invitations_email_active_unique
  ON invitations (lower(email))
  WHERE used_at IS NULL;

CREATE INDEX idx_notification_preferences_enabled
  ON notification_preferences(enabled)
  WHERE enabled = true;

CREATE INDEX idx_account_deletion_requests_status
  ON account_deletion_requests(status, requested_at);

CREATE INDEX idx_articles_published_at
  ON articles(published, published_at DESC);

CREATE INDEX idx_member_loans_profile_id
  ON member_loans(profile_id);

CREATE INDEX idx_member_loans_item_type
  ON member_loans(item_type);

-- FIN — 19 tables applicatives, 4 ENUMs.
