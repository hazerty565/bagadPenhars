-- Migration 0007 : correction de la politique `events_delete` (défaut révélé par
-- la matrice de l'étape 54, le 2026-11-22).
--
-- Défaut : dans `0006_rls_hardening.sql`, la politique `events_delete` écrivait
-- `WHERE ep.event_id = id` à l'intérieur d'une sous-requête portant sur
-- `public.event_pupitres ep`. Or `event_pupitres` a sa **propre** colonne `id`
-- (clé primaire uuid, `src/lib/db/schema.ts`) : le `id` non qualifié se résout
-- sur la table interne, donc la condition devient `ep.event_id = ep.id`, toujours
-- fausse. Conséquence mesurée : un chef obtenait `0 ligne` à la suppression de
-- son propre événement mono-pupitre (T12 et T12b de la matrice), alors que
-- `app.can_manage_event` lui donnait bien la gestion.
--
-- Correction : la suppression réutilise **le même prédicat** que la gestion
-- (`app.can_manage_event`), qui est déjà qualifié correctement et vérifie
-- `app.is_active()`, le rôle et le périmètre. Une seule source de vérité, plus
-- aucune corrélation ambiguë possible. La règle métier est inchangée (Q-A4) :
-- chef = mono-pupitre d'un pupitre qu'il dirige ; multi-pupitres et global =
-- secrétaire/admin seulement ; aucun droit au simple créateur.
--
-- Migration strictement additive : aucune donnée lue ni écrite, `0000` à `0006`
-- non modifiées.

DROP POLICY IF EXISTS events_delete ON public.events;--> statement-breakpoint

CREATE POLICY events_delete ON public.events
	FOR DELETE TO bagad_app
	USING (app.can_manage_event(id));--> statement-breakpoint

-- `id` n'est plus ambigu : la politique ne contient plus de sous-requête sur
-- `event_pupitres`. `app.can_manage_event` encapsule exactement la règle de
-- l'étape 52.6 (mono-pupitre dirigé, secrétaire/admin, jamais le créateur).
