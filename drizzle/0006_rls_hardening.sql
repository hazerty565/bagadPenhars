-- Migration 0006 : durcissement RLS issu de l'audit backend du 2026-11-20.
--
-- Décisions client Q-A1 à Q-A5 et Q-A8 appliquées, sans réinterprétation :
--
--   * Q-A1/Q-A4 — le droit de gestion d'un événement découle EXCLUSIVEMENT du
--     pupitre : la branche `created_by` disparaît de `app.can_manage_event`.
--     Un chef ne gère que les événements mono-pupitre d'un pupitre qu'il
--     dirige ; multi-pupitres et événements globaux sont réservés à la
--     secrétaire et à l'administrateur. Perdre le statut de chef fait perdre
--     le droit, même sur un événement qu'il a créé.
--   * Q-A2 — la création est atomique : `app.create_event(...)`
--     (`SECURITY DEFINER`) écrit l'événement ET ses lignes `event_pupitres`
--     dans la même transaction. `events_insert` et `event_pupitres_insert`
--     sont resserrées aux rôles secrétaire/admin : un chef ne passe jamais
--     par une insertion directe.
--   * Q-A3 — les présences nominatives d'un chef sont limitées aux événements
--     ciblant exactement un pupitre qu'il dirige : `app.can_view_presence`
--     réécrite, donc `event_responses_select` resserrée par construction.
--   * Q-A5 — `app.member_directory` joint `bureau_positions` (colonne
--     `bureau_title` en fin de liste) et n'expose plus la clé `isChef`.
--   * Q-A7 — `production` n'est jamais touchée par cette migration ; elle est
--     appliquée d'abord sur la branche Neon `test` (étape 54).
--   * Q-A8 — la table résiduelle `playing_with_neon` est supprimée et ne doit
--     jamais être recréée, en production comprise.
--
-- Cette migration est strictement additive : `CREATE OR REPLACE` partout où
-- PostgreSQL l'autorise, `DROP ... IF EXISTS` avant toute recréation, aucune
-- écriture de données. Les 16 événements existants de la branche `test` (dont
-- les 4 en visibilité `pupitre` créés par des chefs) restent intacts : rien
-- n'est réécrit, aucun `UPDATE`/`DELETE` de données n'est émis (Q-A2, §9.7 b).
--
-- Contexte RLS : le seul réglage de session utilisé est `app.profile_id`, lu
-- exclusivement via `app.current_profile_id()` (Q-A9). Aucun autre nom de
-- réglage n'est lu par les fonctions, les policies ni le trigger ci-dessous.

-- ---------------------------------------------------------------------------
-- 1. Gestion d'événement : droit dérivé du pupitre, plus du créateur (Q-A1)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION app.can_manage_event(p_event uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
	SELECT app.is_active() AND EXISTS (
		SELECT 1
		FROM public.events e
		WHERE e.id = p_event
			AND (
				app.is_role_at_least('secretaire')
				OR (
					app.current_role() = 'chef_pupitre'
					AND (
						SELECT count(*)
						FROM public.event_pupitres ep
						WHERE ep.event_id = e.id
					) = 1
					AND EXISTS (
						SELECT 1
						FROM public.event_pupitres ep
						WHERE ep.event_id = e.id
							AND app.is_chef_of(ep.pupitre_id)
					)
				)
			)
	)
$$;--> statement-breakpoint

-- La branche `OR e.created_by = app.current_profile_id()` a disparu : aucun
-- droit ne dérive plus du créateur (C1, faille mère de l'audit).

-- ---------------------------------------------------------------------------
-- 2. Création atomique d'événement (Q-A2)
-- ---------------------------------------------------------------------------

-- `p_location` est placée entre `p_visibility` et le tableau de ciblage :
-- l'ordre des paramètres du plan (`p_title`, `p_description`, `p_event_date`,
-- `p_event_type`, `p_is_poll`, `p_visibility`, `p_pupitre_ids`) est conservé
-- tel quel, le nouveau paramètre s'insère avec les autres champs scalaires de
-- l'événement, juste avant la collection (qui reste en dernier), et dans le
-- même ordre que l'`INSERT` ci-dessous (`visibility`, `location`, `is_poll`).
CREATE OR REPLACE FUNCTION app.create_event(
	p_title text,
	p_description text,
	p_event_date date,
	p_event_type public.event_type,
	p_is_poll boolean,
	p_visibility public.event_visibility,
	p_location text,
	p_pupitre_ids uuid[]
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
	v_actor uuid := app.current_profile_id();
	v_pupitres uuid[];
	v_location text;
	v_event_id uuid;
BEGIN
	IF v_actor IS NULL OR NOT app.is_active() THEN
		RAISE EXCEPTION 'Création d''événement réservée à un membre actif.'
			USING ERRCODE = '42501';
	END IF;

	-- `events.location` est `varchar(200) NOT NULL DEFAULT ''` (0001:54). Le
	-- `NULL` est REFUSÉ : le chemin applicatif fournit toujours un lieu de 2 à
	-- 200 caractères (`commands.ts:357`), et accepter `NULL` réécrirait
	-- silencieusement le défaut `''`, c'est-à-dire exactement la perte de
	-- donnée que M02 corrige. Le `COALESCE` reste en défense en profondeur :
	-- la contrainte `NOT NULL` de la colonne ne peut pas être violée.
	IF p_location IS NULL THEN
		RAISE EXCEPTION 'Le lieu de l''événement est obligatoire.'
			USING ERRCODE = '22004';
	END IF;
	v_location := btrim(p_location);
	IF char_length(v_location) > 200 THEN
		RAISE EXCEPTION 'Le lieu de l''événement est trop long (200 caractères maximum).'
			USING ERRCODE = '22001';
	END IF;

	-- Ciblage normalisé : tableau nul = aucun pupitre, doublons neutralisés.
	v_pupitres := ARRAY(
		SELECT DISTINCT p
		FROM unnest(COALESCE(p_pupitre_ids, '{}'::uuid[])) AS p
		WHERE p IS NOT NULL
	);

	IF app.is_role_at_least('secretaire') THEN
		-- Secrétaire / administrateur : `public`, `interne` ou `pupitre`,
		-- 0 à N pupitres — 0 pupitre = événement global (Q-A1).
		IF p_visibility IS NULL THEN
			RAISE EXCEPTION 'La visibilité d''un événement est obligatoire.'
				USING ERRCODE = '42501';
		END IF;
	ELSIF app.current_role() = 'chef_pupitre' THEN
		-- Chef : `interne` uniquement, exactement 1 pupitre qu'il dirige.
		IF p_visibility IS DISTINCT FROM 'interne'::public.event_visibility THEN
			RAISE EXCEPTION 'Un chef de pupitre crée uniquement des événements de visibilité « interne ».'
				USING ERRCODE = '42501';
		END IF;
		IF coalesce(array_length(v_pupitres, 1), 0) <> 1 THEN
			RAISE EXCEPTION 'Un chef de pupitre cible exactement un pupitre.'
				USING ERRCODE = '42501';
		END IF;
		IF NOT app.is_chef_of(v_pupitres[1]) THEN
			RAISE EXCEPTION 'Un chef de pupitre ne peut cibler qu''un pupitre qu''il dirige.'
				USING ERRCODE = '42501';
		END IF;
	ELSE
		RAISE EXCEPTION 'Création d''événement réservée à la secrétaire, à l''administrateur et aux chefs de pupitre.'
			USING ERRCODE = '42501';
	END IF;

	-- Événement et ciblage dans la MÊME transaction : une erreur sur le
	-- ciblage annule l'événement, aucun événement orphelin n'est possible.
	INSERT INTO public.events (
		title,
		description,
		event_date,
		event_type,
		visibility,
		location,
		is_poll,
		created_by
	)
	VALUES (
		p_title,
		p_description,
		p_event_date,
		p_event_type,
		p_visibility,
		COALESCE(v_location, ''),
		COALESCE(p_is_poll, false),
		v_actor
	)
	RETURNING id INTO v_event_id;

	IF coalesce(array_length(v_pupitres, 1), 0) > 0 THEN
		INSERT INTO public.event_pupitres (event_id, pupitre_id)
		SELECT v_event_id, p
		FROM unnest(v_pupitres) AS p;
	END IF;

	RETURN v_event_id;
END
$$;--> statement-breakpoint

REVOKE ALL ON FUNCTION app.create_event(
	text,
	text,
	date,
	public.event_type,
	boolean,
	public.event_visibility,
	text,
	uuid[]
) FROM PUBLIC;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION app.create_event(
	text,
	text,
	date,
	public.event_type,
	boolean,
	public.event_visibility,
	text,
	uuid[]
) TO bagad_app;--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- 3. Insertion directe fermée : un chef passe par `app.create_event` (C2, C3)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS events_insert ON public.events;--> statement-breakpoint
CREATE POLICY events_insert ON public.events
	FOR INSERT TO bagad_app
	WITH CHECK (
		app.is_active()
		AND app.is_role_at_least('secretaire')
	);--> statement-breakpoint

DROP POLICY IF EXISTS event_pupitres_insert ON public.event_pupitres;--> statement-breakpoint
CREATE POLICY event_pupitres_insert ON public.event_pupitres
	FOR INSERT TO bagad_app
	WITH CHECK (
		app.is_active()
		AND app.is_role_at_least('secretaire')
	);--> statement-breakpoint

-- Un chef n'insère plus ni événement ni ciblage : ses écritures passent par la
-- fonction `SECURITY DEFINER` ci-dessus, qui applique la règle Q-A2.

-- Même fermeture en suppression : retirer la dernière ligne `event_pupitres`
-- d'un événement mono-pupitre le transformerait en événement **global**, donc
-- élargirait le ciblage hors du périmètre du chef (étape 52, point 4 : « les
-- lignes `event_pupitres` ne peuvent pas sortir du périmètre du chef »). La
-- suppression d'un événement par un chef reste possible : le ciblage est alors
-- retiré par la cascade de la clé étrangère, pas par une policy.
DROP POLICY IF EXISTS event_pupitres_delete ON public.event_pupitres;--> statement-breakpoint
CREATE POLICY event_pupitres_delete ON public.event_pupitres
	FOR DELETE TO bagad_app
	USING (
		app.is_active()
		AND app.is_role_at_least('secretaire')
	);--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- 4. Mise à jour : `USING` + `WITH CHECK` + trigger de bornes (C4)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS events_update ON public.events;--> statement-breakpoint
CREATE POLICY events_update ON public.events
	FOR UPDATE TO bagad_app
	USING (app.can_manage_event(id))
	WITH CHECK (
		app.can_manage_event(id)
		AND (
			app.is_role_at_least('secretaire')
			OR visibility = 'interne'::public.event_visibility
		)
	);--> statement-breakpoint

-- Le `WITH CHECK` couvre la visibilité *résultante* : un chef ne peut pas
-- produire un état `public` ni `pupitre`. Il ne peut PAS comparer `OLD` et
-- `NEW` (une `WITH CHECK` ne voit que la nouvelle ligne, `USING` que
-- l'ancienne) : l'immutabilité de `created_by` et `is_poll` par un chef est
-- donc portée par un trigger `BEFORE UPDATE` (voir la justification dans la
-- réponse de livraison). Le déplacement du ciblage hors du périmètre est déjà
-- fermé deux fois : `can_manage_event` relit `event_pupitres` sur l'état
-- résultant (un 2ᵉ pupitre rend la nouvelle ligne non gérable), et
-- `event_pupitres_insert`/`_delete` restent réservées aux rôles secrétaire/admin.

CREATE OR REPLACE FUNCTION app.guard_event_update_bounds()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
	-- La connexion propriétaire (migrations, exploitation) n'est pas soumise
	-- aux policies : on la laisse passer, comme le fait déjà
	-- `app.guard_profile_sensitive_columns` (migration 0002).
	IF session_user = 'neondb_owner' THEN
		RETURN NEW;
	END IF;

	IF app.is_role_at_least('secretaire') THEN
		RETURN NEW;
	END IF;

	IF NEW.created_by IS DISTINCT FROM OLD.created_by THEN
		RAISE EXCEPTION 'Le créateur d''un événement n''est pas modifiable.'
			USING ERRCODE = '42501';
	END IF;

	IF NEW.is_poll IS DISTINCT FROM OLD.is_poll THEN
		RAISE EXCEPTION 'Le caractère sondage d''un événement n''est pas modifiable sans les droits de la secrétaire.'
			USING ERRCODE = '42501';
	END IF;

	IF NEW.visibility IS DISTINCT FROM OLD.visibility THEN
		RAISE EXCEPTION 'La visibilité d''un événement n''est pas modifiable sans les droits de la secrétaire.'
			USING ERRCODE = '42501';
	END IF;

	-- SEC-RLS-F03 : `cancelled_by` est l'attribution de l'annulation. Un
	-- non-secrétaire ne peut y écrire que son propre profil (annuler) ou
	-- `NULL` (réactiver) — jamais attribuer l'annulation à un tiers ni
	-- réattribuer une annulation existante. Les deux flux légitimes du code
	-- (`commands.ts:499` = acteur, `commands.ts:513` = `NULL`) passent.
	IF NEW.cancelled_by IS DISTINCT FROM OLD.cancelled_by
		AND NEW.cancelled_by IS NOT NULL
		AND NEW.cancelled_by IS DISTINCT FROM app.current_profile_id() THEN
		RAISE EXCEPTION 'Une annulation ne peut être attribuée qu''à l''acteur lui-même.'
			USING ERRCODE = '42501';
	END IF;

	RETURN NEW;
END
$$;--> statement-breakpoint

DROP TRIGGER IF EXISTS events_guard_update_bounds ON public.events;--> statement-breakpoint
CREATE TRIGGER events_guard_update_bounds
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION app.guard_event_update_bounds();--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- 5. Suppression : mono-pupitre du chef, sinon secrétaire/admin (Q-A4)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS events_delete ON public.events;--> statement-breakpoint
CREATE POLICY events_delete ON public.events
	FOR DELETE TO bagad_app
	USING (
		app.is_active()
		AND (
			app.is_role_at_least('secretaire')
			OR (
				app.current_role() = 'chef_pupitre'
				AND (
					SELECT count(*)
					FROM public.event_pupitres ep
					WHERE ep.event_id = id
				) = 1
				AND EXISTS (
					SELECT 1
					FROM public.event_pupitres ep
					WHERE ep.event_id = id
						AND app.is_chef_of(ep.pupitre_id)
				)
			)
		)
	);--> statement-breakpoint

-- Aucun droit au simple créateur ; multi-pupitres et global restent à la
-- secrétaire et à l'administrateur.

-- ---------------------------------------------------------------------------
-- 6. Présences nominatives : mono-pupitre dirigé seulement (Q-A3, C5)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION app.can_view_presence(p_event uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
	SELECT app.is_active() AND (
		app.is_role_at_least('secretaire')
		OR (
			-- Contrôle de rôle identique à `app.can_manage_event` ci-dessus
			-- (SEC-RLS-E01) : `app.is_chef_of` ne lit que
			-- `profile_pupitres.is_chef` et ne vérifie aucun rôle, donc un
			-- profil rétrogradé en `member` mais encore marqué `is_chef`
			-- passerait sans cette ligne.
			app.current_role() = 'chef_pupitre'
			AND (
				SELECT count(*)
				FROM public.event_pupitres ep
				WHERE ep.event_id = p_event
			) = 1
			AND EXISTS (
				SELECT 1
				FROM public.event_pupitres ep
				WHERE ep.event_id = p_event
					AND app.is_chef_of(ep.pupitre_id)
			)
		)
	)
$$;--> statement-breakpoint

-- Multi-pupitres (au moins 2 lignes) et événement global (0 ligne) sont faux
-- pour un chef : c'est exactement l'écart C5 mesuré par l'audit. Le rôle est
-- désormais vérifié : un membre portant encore `is_chef = true` ne lit rien
-- (SEC-RLS-E01 / T38).

-- ---------------------------------------------------------------------------
-- 7. Réponses : lecture nominative bornée par `can_view_presence` (C5)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS event_responses_select ON public.event_responses;--> statement-breakpoint
CREATE POLICY event_responses_select ON public.event_responses
	FOR SELECT TO bagad_app
	USING (
		profile_id = app.current_profile_id()
		OR app.can_view_presence(event_id)
	);--> statement-breakpoint

-- Un membre lit toujours sa propre réponse ; la liste nominative des autres
-- n'est ouverte qu'aux rôles et périmètres validés par `can_view_presence`.
-- Les agrégats (`responseSummary`) restent servis par
-- `app.event_response_counts`, inchangée.

-- ---------------------------------------------------------------------------
-- 8. Annuaire : titre du bureau joint, plus de clé `isChef` (Q-A5, C8)
-- ---------------------------------------------------------------------------

DROP VIEW IF EXISTS app.member_directory;--> statement-breakpoint
CREATE VIEW app.member_directory
WITH (security_invoker = false)
AS
SELECT
	p.id,
	p.first_name,
	p.last_name,
	p.musician_level,
	p.avatar,
	p.avatar_url,
	COALESCE(
		jsonb_agg(
			jsonb_build_object('pupitre_id', pp.pupitre_id)
			ORDER BY pp.pupitre_id
		) FILTER (WHERE pp.id IS NOT NULL),
		'[]'::jsonb
	) AS pupitres,
	bp.title AS bureau_title
FROM public.profiles p
LEFT JOIN public.profile_pupitres pp ON pp.profile_id = p.id
LEFT JOIN public.bureau_positions bp ON bp.id = p.bureau_position_id
WHERE p.account_status = 'active'
	AND app.is_active()
GROUP BY p.id, p.first_name, p.last_name, p.musician_level, p.avatar, p.avatar_url, bp.title;--> statement-breakpoint

-- `is_chef` n'est plus transporté par le JSON des pupitres : il reste
-- strictement interne au serveur (`app.is_chef_of`, `profile_pupitres`), et
-- n'apparaît ni ici, ni dans l'instantané adhérent (contrat §12.3).
-- `bureau_title` est ajoutée en fin de liste (le titre d'affichage attendu par
-- `bureauPosition`) ; aucun identifiant technique n'est exposé.

GRANT SELECT ON app.member_directory TO bagad_app;--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- 9. Hygiène des privilèges et des tables résiduelles (C6, P8)
-- ---------------------------------------------------------------------------

-- L'annulation d'une invitation passe par `UPDATE cancelled_at` : aucune
-- suppression de ligne. Sans `DELETE`, une tentative échoue par privilège au
-- lieu de « réussir » à 0 ligne (C6).
REVOKE DELETE ON public.invitations FROM bagad_app;--> statement-breakpoint

-- SEC-RLS-F01 : même traitement sur la table enfant. Aucun flux applicatif ne
-- supprime de ligne `invitation_pupitres` (vérifié : aucune occurrence de
-- `delete(invitationPupitres)` dans `src/lib/server/member/commands.ts`) ;
-- l'annulation d'une invitation passe par `UPDATE invitations.cancelled_at`,
-- le ciblage restant attaché à la ligne conservée. Sans le privilège `DELETE`,
-- la policy `invitation_pupitres_delete` (0002) devient inerte : elle est
-- laissée telle quelle, aucune refonte de politique n'est faite ici.
REVOKE DELETE ON public.invitation_pupitres FROM bagad_app;--> statement-breakpoint

-- Table résiduelle hors RLS. Supprimée, jamais recréée (Q-A8).
DROP TABLE IF EXISTS public.playing_with_neon;--> statement-breakpoint
