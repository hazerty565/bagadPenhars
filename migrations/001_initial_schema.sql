-- =============================================================
-- Bagad Penhars : schéma initial
-- Prérequis : les tables Better Auth (user, session, account,
-- verification) doivent exister avant d'exécuter ce fichier,
-- car profiles.user_id y fait référence.
-- =============================================================

-- Types énumérés
CREATE TYPE pupitre AS ENUM ('bombarde', 'cornemuse', 'caisse_claire', 'percussion');
CREATE TYPE app_role AS ENUM ('pending', 'member', 'chef_pupitre', 'admin');
CREATE TYPE event_type AS ENUM ('repetition', 'sortie', 'reunion', 'externe');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'unknown');
CREATE TYPE document_type AS ENUM ('partition', 'arrangement', 'recording');

-- Profils : un par utilisateur Better Auth
-- Les comptes sont créés uniquement par un admin (pas d'inscription libre).
CREATE TABLE profiles (
  user_id     text PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  name        text NOT NULL,
  pupitre     pupitre NOT NULL,
  role        app_role NOT NULL DEFAULT 'pending',
  phone       text,
  avatar_key  text,                              -- clé du blob dans Netlify Blobs
  invited_by  text REFERENCES profiles(user_id) ON DELETE SET NULL,
  invited_at  timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX profiles_role_idx ON profiles (role);
CREATE INDEX profiles_pupitre_idx ON profiles (pupitre);

-- Événements
CREATE TABLE events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,                     -- français
  description text,                              -- français
  starts_at   timestamptz NOT NULL,
  type        event_type NOT NULL,
  location    text,
  is_public   boolean NOT NULL DEFAULT false,
  created_by  text REFERENCES profiles(user_id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX events_starts_at_idx ON events (starts_at DESC);
CREATE INDEX events_public_idx ON events (starts_at DESC) WHERE is_public;

-- Présences : une seule réponse par personne et par événement
CREATE TABLE attendance (
  user_id    text NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  event_id   uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  status     attendance_status NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, event_id)
);
CREATE INDEX attendance_event_idx ON attendance (event_id);

-- Partitions : fichiers dans Netlify Blobs, métadonnées ici
CREATE TABLE documents (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  blob_key    text NOT NULL UNIQUE,
  pupitre     pupitre,                           -- NULL = partition globale
  type        document_type NOT NULL,
  uploaded_by text REFERENCES profiles(user_id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX documents_pupitre_idx ON documents (pupitre);
CREATE INDEX documents_type_idx ON documents (type);