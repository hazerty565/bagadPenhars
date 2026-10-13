-- =============================================================
-- Bagad Penhars : schéma initial
-- Prérequis : tables Better Auth (user, session, account,
-- verification) créées avant ce fichier.
-- Dates : stockées en date / timestamptz, affichées en jj/mm/aaaa.
-- =============================================================

-- ---------- Types énumérés ----------
CREATE TYPE pupitre           AS ENUM ('bombarde', 'cornemuse', 'caisse_claire', 'percussion');
CREATE TYPE app_role          AS ENUM ('pending', 'member', 'chef_pupitre', 'admin');
CREATE TYPE bureau_position   AS ENUM ('president', 'secretaire', 'tresorier', 'autre');
CREATE TYPE event_type        AS ENUM ('repetition', 'sortie', 'reunion', 'externe');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'unknown');
CREATE TYPE document_type     AS ENUM ('partition', 'arrangement', 'recording');
CREATE TYPE media_kind        AS ENUM ('photo', 'video', 'audio');

-- ---------- Profils ----------
-- Le nom et l'email viennent de la table "user" (Better Auth).
-- Comptes créés uniquement par un admin.
CREATE TABLE profiles (
  user_id     text PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  role        app_role NOT NULL DEFAULT 'pending',
  phone       text,
  avatar_key  text,                              -- clé de l'objet dans bagad-avatars
  invited_by  text REFERENCES profiles(user_id) ON DELETE SET NULL,
  invited_at  timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX profiles_role_idx ON profiles (role);

-- ---------- Pupitres d'un membre ----------
-- Un musicien peut avoir plusieurs pupitres.
-- Aucune ligne = membre du bureau non musicien.
-- is_chef = chef de ce pupitre (un chef_pupitre doit en avoir au moins un).
CREATE TABLE profile_pupitres (
  user_id    text NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  pupitre    pupitre NOT NULL,
  is_chef    boolean NOT NULL DEFAULT false,
  joined_on  date NOT NULL DEFAULT current_date,
  PRIMARY KEY (user_id, pupitre)
);
CREATE INDEX profile_pupitres_pupitre_idx ON profile_pupitres (pupitre);

-- ---------- Fonctions au bureau (historisées) ----------
-- Indépendantes du pupitre et du rôle applicatif.
CREATE TABLE bureau_positions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     text NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  position    bureau_position NOT NULL,
  started_on  date NOT NULL,
  ended_on    date,
  CONSTRAINT bureau_dates_ok CHECK (ended_on IS NULL OR ended_on >= started_on)
);
-- Un seul titulaire actuel par poste. Supprimer si plusieurs co-titulaires sont possibles.
CREATE UNIQUE INDEX bureau_one_current ON bureau_positions (position) WHERE ended_on IS NULL;
CREATE INDEX bureau_user_idx ON bureau_positions (user_id);

-- ---------- Séries d'événements récurrents ----------
-- Chaque occurrence est une ligne dans events. rrule suit la règle RFC 5545.
CREATE TABLE event_series (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  rrule       text NOT NULL,
  created_by  text REFERENCES profiles(user_id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------- Événements ----------
CREATE TABLE events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id    uuid REFERENCES event_series(id) ON DELETE SET NULL,
  title        text NOT NULL,                  -- français
  description  text,                           -- français
  starts_at    timestamptz NOT NULL,
  ends_at      timestamptz,
  all_day      boolean NOT NULL DEFAULT false,
  type         event_type NOT NULL,
  location     text,
  is_public    boolean NOT NULL DEFAULT false, -- visible sur le site public
  created_by   text REFERENCES profiles(user_id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT event_end_after_start CHECK (ends_at IS NULL OR ends_at > starts_at)
);
CREATE INDEX events_starts_at_idx ON events (starts_at DESC);
CREATE INDEX events_public_idx    ON events (starts_at DESC) WHERE is_public;
CREATE INDEX events_series_idx    ON events (series_id);

-- ---------- Présences : une réponse par personne et par événement ----------
CREATE TABLE attendance (
  user_id     text NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  event_id    uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  status      attendance_status NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, event_id)
);
CREATE INDEX attendance_event_idx ON attendance (event_id);

-- ---------- Partitions (fichiers dans bagad-partitions) ----------
CREATE TABLE documents (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  blob_key    text NOT NULL UNIQUE,            -- clé de l'objet dans bagad-partitions
  pupitre     pupitre,                         -- NULL = partition globale
  type        document_type NOT NULL,
  uploaded_by text REFERENCES profiles(user_id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX documents_pupitre_idx ON documents (pupitre);
CREATE INDEX documents_type_idx    ON documents (type);

-- ---------- Médias publics (bagad-medias, public_read) ----------
CREATE TABLE media_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  kind        media_kind NOT NULL,
  blob_key    text NOT NULL UNIQUE,            -- clé de l'objet dans bagad-medias
  is_public   boolean NOT NULL DEFAULT true,
  created_by  text REFERENCES profiles(user_id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX media_public_idx ON media_items (created_at DESC) WHERE is_public;

-- ---------- Actualités (accueil) ----------
CREATE TABLE news (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,                 -- français
  body          text NOT NULL,                 -- français
  published     boolean NOT NULL DEFAULT false,
  published_at  timestamptz,
  created_by    text REFERENCES profiles(user_id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT news_published_has_date CHECK (NOT published OR published_at IS NOT NULL)
);
CREATE INDEX news_published_idx ON news (published_at DESC) WHERE published;

-- ---------- Journal d'audit ----------
CREATE TABLE audit_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    text REFERENCES profiles(user_id) ON DELETE SET NULL,
  action      text NOT NULL,                   -- ex. 'profile.role_changed'
  target_id   text,
  details     jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_actor_idx   ON audit_log (actor_id);
CREATE INDEX audit_created_idx ON audit_log (created_at DESC);