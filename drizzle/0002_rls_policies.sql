-- Migration 0002 : durcissement RLS et rôle applicatif `bagad_app`.
--
-- Le rôle `bagad_app` est créé hors migration (scripts/db-create-app-role.mjs)
-- parce que son mot de passe ne doit jamais figurer dans le dépôt.
-- Cette migration est additive : elle crée le schéma `app`, les fonctions
-- d'aide, les politiques et les privilèges. Elle ne modifie aucune table métier.

CREATE SCHEMA IF NOT EXISTS app;--> statement-breakpoint

REVOKE ALL ON SCHEMA app FROM PUBLIC;--> statement-breakpoint
GRANT USAGE ON SCHEMA app TO bagad_app;--> statement-breakpoint

REVOKE ALL ON SCHEMA public FROM PUBLIC;--> statement-breakpoint
REVOKE ALL ON SCHEMA public FROM bagad_app;--> statement-breakpoint
GRANT USAGE ON SCHEMA public TO bagad_app;--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Contexte de session
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION app.current_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
	SELECT NULLIF(current_setting('app.profile_id', true), '')::uuid
$$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION app.current_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
	SELECT p.role
	FROM public.profiles p
	WHERE p.id = app.current_profile_id()
$$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION app.is_active()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
	SELECT EXISTS (
		SELECT 1
		FROM public.profiles p
		WHERE p.id = app.current_profile_id()
			AND p.account_status = 'active'
	)
$$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION app.is_role_at_least(p_required public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
	SELECT EXISTS (
		SELECT 1
		FROM public.profiles p
		WHERE p.id = app.current_profile_id()
			AND p.account_status = 'active'
			AND CASE p_required
				WHEN 'member' THEN true
				WHEN 'chef_pupitre' THEN p.role IN ('chef_pupitre', 'secretaire', 'admin')
				WHEN 'secretaire' THEN p.role IN ('secretaire', 'admin')
				WHEN 'admin' THEN p.role = 'admin'
				ELSE false
			END
	)
$$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION app.today_paris()
RETURNS date
LANGUAGE sql
STABLE
SET search_path = pg_catalog
AS $$
	SELECT (now() AT TIME ZONE 'Europe/Paris')::date
$$;--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Pupitres et ciblage
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION app.has_pupitre(p_pupitre uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
	SELECT app.is_active() AND EXISTS (
		SELECT 1
		FROM public.profile_pupitres pp
		WHERE pp.profile_id = app.current_profile_id()
			AND pp.pupitre_id = p_pupitre
	)
$$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION app.is_chef_of(p_pupitre uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
	SELECT app.is_active() AND EXISTS (
		SELECT 1
		FROM public.profile_pupitres pp
		WHERE pp.profile_id = app.current_profile_id()
			AND pp.pupitre_id = p_pupitre
			AND pp.is_chef = true
	)
$$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION app.can_target_profile(p_profile uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
	SELECT app.is_active() AND (
		p_profile = app.current_profile_id()
		OR app.is_role_at_least('secretaire')
		OR EXISTS (
			SELECT 1
			FROM public.profile_pupitres pp
			WHERE pp.profile_id = p_profile
				AND app.is_chef_of(pp.pupitre_id)
		)
	)
$$;--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Événements et présences
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
				OR e.created_by = app.current_profile_id()
				OR (
					app.current_role() = 'chef_pupitre'
					AND (SELECT count(*) FROM public.event_pupitres ep WHERE ep.event_id = e.id) = 1
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

CREATE OR REPLACE FUNCTION app.can_view_event(p_event uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
	SELECT EXISTS (
		SELECT 1
		FROM public.events e
		WHERE e.id = p_event
			AND (
				e.visibility = 'public'
				OR (
					app.is_active()
					AND (
						e.visibility = 'interne'
						OR app.is_role_at_least('secretaire')
						OR e.created_by = app.current_profile_id()
						OR EXISTS (
							SELECT 1
							FROM public.event_pupitres ep
							WHERE ep.event_id = e.id
								AND app.has_pupitre(ep.pupitre_id)
						)
					)
				)
			)
	)
$$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION app.can_respond_event(p_event uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
	SELECT app.is_active()
		AND app.can_view_event(p_event)
		AND EXISTS (
			SELECT 1
			FROM public.events e
			WHERE e.id = p_event
				AND e.cancelled_at IS NULL
				AND e.event_date >= app.today_paris()
		)
$$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION app.can_view_presence(p_event uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
	SELECT app.is_active() AND (
		app.is_role_at_least('secretaire')
		OR EXISTS (
			SELECT 1
			FROM public.event_pupitres ep
			WHERE ep.event_id = p_event
				AND app.is_chef_of(ep.pupitre_id)
		)
	)
$$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION app.event_response_counts(p_event uuid)
RETURNS TABLE (status public.response_status, total bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
	SELECT r.status, count(*)::bigint
	FROM public.event_responses r
	WHERE r.event_id = p_event
		AND app.can_view_event(p_event)
	GROUP BY r.status
$$;--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION app.can_view_notification(p_notification uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
	SELECT app.is_active() AND EXISTS (
		SELECT 1
		FROM public.notifications n
		WHERE n.id = p_notification
			AND (
				n.audience = 'all'
				OR n.sent_by = app.current_profile_id()
				OR app.is_role_at_least('secretaire')
				OR (
					n.audience = 'pupitre'
					AND EXISTS (
						SELECT 1
						FROM public.notification_pupitres np
						WHERE np.notification_id = n.id
							AND app.has_pupitre(np.pupitre_id)
					)
				)
				OR (
					n.audience = 'profiles'
					AND EXISTS (
						SELECT 1
						FROM public.notification_profiles np
						WHERE np.notification_id = n.id
							AND np.profile_id = app.current_profile_id()
					)
				)
			)
	)
$$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION app.can_manage_notification(p_notification uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
	SELECT app.is_active() AND EXISTS (
		SELECT 1
		FROM public.notifications n
		WHERE n.id = p_notification
			AND (
				app.is_role_at_least('secretaire')
				OR (
					n.sent_by = app.current_profile_id()
					AND n.audience = 'pupitre'
					AND app.current_role() = 'chef_pupitre'
				)
			)
	)
$$;--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Annuaire membres (vue restreinte aux colonnes du trombinoscope)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW app.member_directory
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
			jsonb_build_object('pupitre_id', pp.pupitre_id, 'is_chef', pp.is_chef)
			ORDER BY pp.pupitre_id
		) FILTER (WHERE pp.id IS NOT NULL),
		'[]'::jsonb
	) AS pupitres
FROM public.profiles p
LEFT JOIN public.profile_pupitres pp ON pp.profile_id = p.id
WHERE p.account_status = 'active'
	AND app.is_active()
GROUP BY p.id, p.first_name, p.last_name, p.musician_level, p.avatar, p.avatar_url;--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Mutations privilégiées (contrôlées dans la fonction, pas par le client)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION app.set_profile_role(p_profile uuid, p_role public.app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
	IF NOT app.is_role_at_least('admin') THEN
		RAISE EXCEPTION 'Action réservée à l''administrateur.' USING ERRCODE = '42501';
	END IF;
	UPDATE public.profiles
	SET role = p_role, updated_at = now()
	WHERE id = p_profile;
	IF NOT FOUND THEN
		RAISE EXCEPTION 'Profil introuvable.';
	END IF;
END
$$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION app.set_profile_account_status(
	p_profile uuid,
	p_status public.account_status
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
	IF NOT app.is_role_at_least('secretaire') THEN
		RAISE EXCEPTION 'Action réservée à la secrétaire et à l''administrateur.' USING ERRCODE = '42501';
	END IF;
	UPDATE public.profiles
	SET account_status = p_status, updated_at = now()
	WHERE id = p_profile;
	IF NOT FOUND THEN
		RAISE EXCEPTION 'Profil introuvable.';
	END IF;
END
$$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION app.set_profile_bureau_position(
	p_profile uuid,
	p_position uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
	IF NOT app.is_role_at_least('admin') THEN
		RAISE EXCEPTION 'Action réservée à l''administrateur.' USING ERRCODE = '42501';
	END IF;
	UPDATE public.profiles
	SET bureau_position_id = p_position, updated_at = now()
	WHERE id = p_profile;
	IF NOT FOUND THEN
		RAISE EXCEPTION 'Profil introuvable.';
	END IF;
END
$$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION app.guard_profile_sensitive_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
	IF session_user = 'neondb_owner' THEN
		RETURN NEW;
	END IF;

	IF NEW.auth_user_id IS DISTINCT FROM OLD.auth_user_id
		OR NEW.email IS DISTINCT FROM OLD.email
		OR NEW.email_confirmed IS DISTINCT FROM OLD.email_confirmed
		OR NEW.role IS DISTINCT FROM OLD.role
		OR NEW.bureau_position_id IS DISTINCT FROM OLD.bureau_position_id THEN
		IF NOT app.is_role_at_least('admin') THEN
			RAISE EXCEPTION 'Modification réservée à l''administrateur.' USING ERRCODE = '42501';
		END IF;
	END IF;

	IF NEW.account_status IS DISTINCT FROM OLD.account_status THEN
		IF NOT app.is_role_at_least('secretaire') THEN
			RAISE EXCEPTION 'Modification réservée à la secrétaire et à l''administrateur.' USING ERRCODE = '42501';
		END IF;
	END IF;

	RETURN NEW;
END
$$;--> statement-breakpoint

DROP TRIGGER IF EXISTS profiles_guard_sensitive ON public.profiles;--> statement-breakpoint
CREATE TRIGGER profiles_guard_sensitive
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION app.guard_profile_sensitive_columns();--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Privilèges du rôle applicatif
-- ---------------------------------------------------------------------------

-- Better Auth : identité et sessions. Ces tables ne sont pas soumises à RLS,
-- car la connexion doit pouvoir résoudre un utilisateur avant l'ouverture de
-- session. Elles restent inaccessibles aux autres rôles PostgreSQL.
GRANT SELECT, INSERT, UPDATE, DELETE ON public."user" TO bagad_app;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON public.account TO bagad_app;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON public.session TO bagad_app;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON public.verification TO bagad_app;--> statement-breakpoint

GRANT SELECT ON public.pupitres TO bagad_app;--> statement-breakpoint
GRANT SELECT ON public.bureau_positions TO bagad_app;--> statement-breakpoint

GRANT SELECT ON public.profiles TO bagad_app;--> statement-breakpoint
GRANT UPDATE (
	first_name,
	last_name,
	phone,
	address,
	musician_level,
	avatar,
	avatar_url,
	updated_at
) ON public.profiles TO bagad_app;--> statement-breakpoint

GRANT SELECT ON public.profile_pupitres TO bagad_app;--> statement-breakpoint
GRANT INSERT, UPDATE, DELETE ON public.profile_pupitres TO bagad_app;--> statement-breakpoint

GRANT SELECT, INSERT, UPDATE, DELETE ON public.invitations TO bagad_app;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invitation_pupitres TO bagad_app;--> statement-breakpoint

GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO bagad_app;--> statement-breakpoint
GRANT SELECT, INSERT, DELETE ON public.event_pupitres TO bagad_app;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON public.event_responses TO bagad_app;--> statement-breakpoint

GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO bagad_app;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON public.articles TO bagad_app;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON public.albums TO bagad_app;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media TO bagad_app;--> statement-breakpoint

GRANT SELECT, INSERT, UPDATE ON public.notification_preferences TO bagad_app;--> statement-breakpoint
GRANT SELECT ON public.notification_log TO bagad_app;--> statement-breakpoint
GRANT SELECT, INSERT, DELETE ON public.notifications TO bagad_app;--> statement-breakpoint
GRANT SELECT, INSERT, DELETE ON public.notification_pupitres TO bagad_app;--> statement-breakpoint
GRANT SELECT, INSERT, DELETE ON public.notification_profiles TO bagad_app;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_reads TO bagad_app;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO bagad_app;--> statement-breakpoint

GRANT SELECT, UPDATE ON public.app_settings TO bagad_app;--> statement-breakpoint
GRANT SELECT, UPDATE ON public.storage_usage TO bagad_app;--> statement-breakpoint
GRANT SELECT, INSERT ON public.activity_log TO bagad_app;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON public.member_loans TO bagad_app;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON public.account_deletion_requests TO bagad_app;--> statement-breakpoint

GRANT SELECT ON app.member_directory TO bagad_app;--> statement-breakpoint
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA app TO bagad_app;--> statement-breakpoint
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA app FROM PUBLIC;--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Activation de RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.profile_pupitres ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.invitation_pupitres ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.event_pupitres ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.event_responses ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.notification_pupitres ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.notification_profiles ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.storage_usage ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.member_loans ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.pupitres ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.bureau_positions ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Politiques : profils et annuaire
-- ---------------------------------------------------------------------------

CREATE POLICY profiles_select ON public.profiles
	FOR SELECT TO bagad_app
	USING (id = app.current_profile_id() OR app.is_role_at_least('secretaire'));--> statement-breakpoint

CREATE POLICY profiles_update ON public.profiles
	FOR UPDATE TO bagad_app
	USING (
		(id = app.current_profile_id() AND app.is_active())
		OR app.is_role_at_least('secretaire')
	)
	WITH CHECK (
		(id = app.current_profile_id() AND app.is_active())
		OR app.is_role_at_least('secretaire')
	);--> statement-breakpoint

CREATE POLICY bureau_positions_select ON public.bureau_positions
	FOR SELECT TO bagad_app
	USING (app.is_active());--> statement-breakpoint

CREATE POLICY pupitres_select ON public.pupitres
	FOR SELECT TO bagad_app
	USING (true);--> statement-breakpoint

CREATE POLICY profile_pupitres_select ON public.profile_pupitres
	FOR SELECT TO bagad_app
	USING (profile_id = app.current_profile_id() OR app.is_active());--> statement-breakpoint

CREATE POLICY profile_pupitres_insert ON public.profile_pupitres
	FOR INSERT TO bagad_app
	WITH CHECK (app.is_role_at_least('secretaire'));--> statement-breakpoint

CREATE POLICY profile_pupitres_update ON public.profile_pupitres
	FOR UPDATE TO bagad_app
	USING (app.is_role_at_least('secretaire'))
	WITH CHECK (app.is_role_at_least('secretaire'));--> statement-breakpoint

CREATE POLICY profile_pupitres_delete ON public.profile_pupitres
	FOR DELETE TO bagad_app
	USING (app.is_role_at_least('secretaire'));--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Politiques : invitations
-- ---------------------------------------------------------------------------

CREATE POLICY invitations_select ON public.invitations
	FOR SELECT TO bagad_app
	USING (app.is_role_at_least('secretaire'));--> statement-breakpoint

CREATE POLICY invitations_insert ON public.invitations
	FOR INSERT TO bagad_app
	WITH CHECK (app.is_role_at_least('secretaire'));--> statement-breakpoint

CREATE POLICY invitations_update ON public.invitations
	FOR UPDATE TO bagad_app
	USING (app.is_role_at_least('secretaire'))
	WITH CHECK (app.is_role_at_least('secretaire'));--> statement-breakpoint

CREATE POLICY invitation_pupitres_select ON public.invitation_pupitres
	FOR SELECT TO bagad_app
	USING (app.is_role_at_least('secretaire'));--> statement-breakpoint

CREATE POLICY invitation_pupitres_insert ON public.invitation_pupitres
	FOR INSERT TO bagad_app
	WITH CHECK (app.is_role_at_least('secretaire'));--> statement-breakpoint

CREATE POLICY invitation_pupitres_update ON public.invitation_pupitres
	FOR UPDATE TO bagad_app
	USING (app.is_role_at_least('secretaire'))
	WITH CHECK (app.is_role_at_least('secretaire'));--> statement-breakpoint

CREATE POLICY invitation_pupitres_delete ON public.invitation_pupitres
	FOR DELETE TO bagad_app
	USING (app.is_role_at_least('secretaire'));--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Politiques : événements et réponses
-- ---------------------------------------------------------------------------

CREATE POLICY events_select ON public.events
	FOR SELECT TO bagad_app
	USING (app.can_view_event(id));--> statement-breakpoint

CREATE POLICY events_insert ON public.events
	FOR INSERT TO bagad_app
	WITH CHECK (
		app.is_active()
		AND (
			app.is_role_at_least('secretaire')
			OR (
				app.current_role() = 'chef_pupitre'
				AND created_by = app.current_profile_id()
			)
		)
	);--> statement-breakpoint

CREATE POLICY events_update ON public.events
	FOR UPDATE TO bagad_app
	USING (app.can_manage_event(id))
	WITH CHECK (app.can_manage_event(id));--> statement-breakpoint

CREATE POLICY events_delete ON public.events
	FOR DELETE TO bagad_app
	USING (app.is_role_at_least('secretaire'));--> statement-breakpoint

CREATE POLICY event_pupitres_select ON public.event_pupitres
	FOR SELECT TO bagad_app
	USING (app.can_view_event(event_id));--> statement-breakpoint

CREATE POLICY event_pupitres_insert ON public.event_pupitres
	FOR INSERT TO bagad_app
	WITH CHECK (
		app.can_manage_event(event_id)
		AND (
			app.is_role_at_least('secretaire')
			OR app.is_chef_of(pupitre_id)
		)
	);--> statement-breakpoint

CREATE POLICY event_pupitres_delete ON public.event_pupitres
	FOR DELETE TO bagad_app
	USING (
		app.can_manage_event(event_id)
		AND (
			app.is_role_at_least('secretaire')
			OR app.is_chef_of(pupitre_id)
		)
	);--> statement-breakpoint

CREATE POLICY event_responses_select ON public.event_responses
	FOR SELECT TO bagad_app
	USING (
		profile_id = app.current_profile_id()
		OR app.can_view_presence(event_id)
	);--> statement-breakpoint

CREATE POLICY event_responses_insert ON public.event_responses
	FOR INSERT TO bagad_app
	WITH CHECK (
		profile_id = app.current_profile_id()
		AND app.can_respond_event(event_id)
	);--> statement-breakpoint

CREATE POLICY event_responses_update ON public.event_responses
	FOR UPDATE TO bagad_app
	USING (
		profile_id = app.current_profile_id()
		AND app.can_respond_event(event_id)
	)
	WITH CHECK (
		profile_id = app.current_profile_id()
		AND app.can_respond_event(event_id)
	);--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Politiques : documents, articles, albums, médias
-- ---------------------------------------------------------------------------

CREATE POLICY documents_select ON public.documents
	FOR SELECT TO bagad_app
	USING (
		(app.is_active() AND is_active = true)
		OR app.is_role_at_least('secretaire')
		OR uploaded_by = app.current_profile_id()
	);--> statement-breakpoint

CREATE POLICY documents_insert ON public.documents
	FOR INSERT TO bagad_app
	WITH CHECK (
		app.is_role_at_least('secretaire')
		OR (
			app.current_role() = 'chef_pupitre'
			AND pupitre_id IS NOT NULL
			AND app.is_chef_of(pupitre_id)
			AND uploaded_by = app.current_profile_id()
		)
	);--> statement-breakpoint

CREATE POLICY documents_update ON public.documents
	FOR UPDATE TO bagad_app
	USING (
		app.is_role_at_least('secretaire')
		OR (
			app.current_role() = 'chef_pupitre'
			AND pupitre_id IS NOT NULL
			AND app.is_chef_of(pupitre_id)
		)
	)
	WITH CHECK (
		app.is_role_at_least('secretaire')
		OR (
			app.current_role() = 'chef_pupitre'
			AND pupitre_id IS NOT NULL
			AND app.is_chef_of(pupitre_id)
		)
	);--> statement-breakpoint

CREATE POLICY documents_delete ON public.documents
	FOR DELETE TO bagad_app
	USING (
		app.is_role_at_least('secretaire')
		OR (
			app.current_role() = 'chef_pupitre'
			AND pupitre_id IS NOT NULL
			AND app.is_chef_of(pupitre_id)
		)
	);--> statement-breakpoint

CREATE POLICY articles_select ON public.articles
	FOR SELECT TO bagad_app
	USING (
		is_published = true
		OR app.is_role_at_least('secretaire')
		OR author_id = app.current_profile_id()
	);--> statement-breakpoint

CREATE POLICY articles_insert ON public.articles
	FOR INSERT TO bagad_app
	WITH CHECK (app.is_role_at_least('secretaire'));--> statement-breakpoint

CREATE POLICY articles_update ON public.articles
	FOR UPDATE TO bagad_app
	USING (app.is_role_at_least('secretaire'))
	WITH CHECK (app.is_role_at_least('secretaire'));--> statement-breakpoint

CREATE POLICY articles_delete ON public.articles
	FOR DELETE TO bagad_app
	USING (app.is_role_at_least('secretaire'));--> statement-breakpoint

CREATE POLICY albums_select ON public.albums
	FOR SELECT TO bagad_app
	USING (is_published = true OR app.is_role_at_least('secretaire'));--> statement-breakpoint

CREATE POLICY albums_insert ON public.albums
	FOR INSERT TO bagad_app
	WITH CHECK (app.is_role_at_least('secretaire'));--> statement-breakpoint

CREATE POLICY albums_update ON public.albums
	FOR UPDATE TO bagad_app
	USING (app.is_role_at_least('secretaire'))
	WITH CHECK (app.is_role_at_least('secretaire'));--> statement-breakpoint

CREATE POLICY albums_delete ON public.albums
	FOR DELETE TO bagad_app
	USING (app.is_role_at_least('secretaire'));--> statement-breakpoint

CREATE POLICY media_select ON public.media
	FOR SELECT TO bagad_app
	USING (
		(bucket = 'public' AND public_url IS NOT NULL)
		OR app.is_role_at_least('secretaire')
		OR uploaded_by = app.current_profile_id()
	);--> statement-breakpoint

CREATE POLICY media_insert ON public.media
	FOR INSERT TO bagad_app
	WITH CHECK (app.is_role_at_least('secretaire'));--> statement-breakpoint

CREATE POLICY media_update ON public.media
	FOR UPDATE TO bagad_app
	USING (app.is_role_at_least('secretaire'))
	WITH CHECK (app.is_role_at_least('secretaire'));--> statement-breakpoint

CREATE POLICY media_delete ON public.media
	FOR DELETE TO bagad_app
	USING (app.is_role_at_least('secretaire'));--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Politiques : notifications
-- ---------------------------------------------------------------------------

CREATE POLICY notification_preferences_select ON public.notification_preferences
	FOR SELECT TO bagad_app
	USING (profile_id = app.current_profile_id());--> statement-breakpoint

CREATE POLICY notification_preferences_insert ON public.notification_preferences
	FOR INSERT TO bagad_app
	WITH CHECK (profile_id = app.current_profile_id() AND app.is_active());--> statement-breakpoint

CREATE POLICY notification_preferences_update ON public.notification_preferences
	FOR UPDATE TO bagad_app
	USING (profile_id = app.current_profile_id() AND app.is_active())
	WITH CHECK (profile_id = app.current_profile_id() AND app.is_active());--> statement-breakpoint

CREATE POLICY notification_log_select ON public.notification_log
	FOR SELECT TO bagad_app
	USING (
		recipient_profile_id = app.current_profile_id()
		OR app.can_target_profile(recipient_profile_id)
	);--> statement-breakpoint

CREATE POLICY notifications_select ON public.notifications
	FOR SELECT TO bagad_app
	USING (app.can_view_notification(id));--> statement-breakpoint

CREATE POLICY notifications_insert ON public.notifications
	FOR INSERT TO bagad_app
	WITH CHECK (
		app.is_active()
		AND sent_by = app.current_profile_id()
		AND (
			app.is_role_at_least('secretaire')
			OR (app.current_role() = 'chef_pupitre' AND audience = 'pupitre')
		)
	);--> statement-breakpoint

CREATE POLICY notifications_delete ON public.notifications
	FOR DELETE TO bagad_app
	USING (
		sent_by = app.current_profile_id()
		OR app.is_role_at_least('secretaire')
	);--> statement-breakpoint

CREATE POLICY notification_pupitres_select ON public.notification_pupitres
	FOR SELECT TO bagad_app
	USING (app.can_view_notification(notification_id));--> statement-breakpoint

CREATE POLICY notification_pupitres_insert ON public.notification_pupitres
	FOR INSERT TO bagad_app
	WITH CHECK (
		app.can_manage_notification(notification_id)
		AND (
			app.is_role_at_least('secretaire')
			OR app.is_chef_of(pupitre_id)
		)
	);--> statement-breakpoint

CREATE POLICY notification_pupitres_delete ON public.notification_pupitres
	FOR DELETE TO bagad_app
	USING (
		app.can_manage_notification(notification_id)
		AND (
			app.is_role_at_least('secretaire')
			OR app.is_chef_of(pupitre_id)
		)
	);--> statement-breakpoint

CREATE POLICY notification_profiles_select ON public.notification_profiles
	FOR SELECT TO bagad_app
	USING (app.can_view_notification(notification_id));--> statement-breakpoint

CREATE POLICY notification_profiles_insert ON public.notification_profiles
	FOR INSERT TO bagad_app
	WITH CHECK (
		app.is_role_at_least('secretaire')
		AND app.can_manage_notification(notification_id)
	);--> statement-breakpoint

CREATE POLICY notification_profiles_delete ON public.notification_profiles
	FOR DELETE TO bagad_app
	USING (app.is_role_at_least('secretaire'));--> statement-breakpoint

CREATE POLICY notification_reads_select ON public.notification_reads
	FOR SELECT TO bagad_app
	USING (profile_id = app.current_profile_id());--> statement-breakpoint

CREATE POLICY notification_reads_insert ON public.notification_reads
	FOR INSERT TO bagad_app
	WITH CHECK (profile_id = app.current_profile_id() AND app.is_active());--> statement-breakpoint

CREATE POLICY notification_reads_update ON public.notification_reads
	FOR UPDATE TO bagad_app
	USING (profile_id = app.current_profile_id())
	WITH CHECK (profile_id = app.current_profile_id());--> statement-breakpoint

CREATE POLICY notification_reads_delete ON public.notification_reads
	FOR DELETE TO bagad_app
	USING (profile_id = app.current_profile_id());--> statement-breakpoint

CREATE POLICY push_subscriptions_select ON public.push_subscriptions
	FOR SELECT TO bagad_app
	USING (
		profile_id = app.current_profile_id()
		OR app.can_target_profile(profile_id)
	);--> statement-breakpoint

CREATE POLICY push_subscriptions_insert ON public.push_subscriptions
	FOR INSERT TO bagad_app
	WITH CHECK (profile_id = app.current_profile_id() AND app.is_active());--> statement-breakpoint

CREATE POLICY push_subscriptions_update ON public.push_subscriptions
	FOR UPDATE TO bagad_app
	USING (profile_id = app.current_profile_id())
	WITH CHECK (profile_id = app.current_profile_id());--> statement-breakpoint

CREATE POLICY push_subscriptions_delete ON public.push_subscriptions
	FOR DELETE TO bagad_app
	USING (profile_id = app.current_profile_id());--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Politiques : réglages, stockage, journal, prêts, suppression de compte
-- ---------------------------------------------------------------------------

CREATE POLICY app_settings_select ON public.app_settings
	FOR SELECT TO bagad_app
	USING (app.is_active());--> statement-breakpoint

CREATE POLICY app_settings_update ON public.app_settings
	FOR UPDATE TO bagad_app
	USING (app.is_role_at_least('admin'))
	WITH CHECK (app.is_role_at_least('admin'));--> statement-breakpoint

CREATE POLICY storage_usage_select ON public.storage_usage
	FOR SELECT TO bagad_app
	USING (app.is_role_at_least('secretaire'));--> statement-breakpoint

CREATE POLICY storage_usage_update ON public.storage_usage
	FOR UPDATE TO bagad_app
	USING (app.is_role_at_least('secretaire'))
	WITH CHECK (app.is_role_at_least('secretaire'));--> statement-breakpoint

CREATE POLICY activity_log_select ON public.activity_log
	FOR SELECT TO bagad_app
	USING (app.is_role_at_least('admin'));--> statement-breakpoint

CREATE POLICY activity_log_insert ON public.activity_log
	FOR INSERT TO bagad_app
	WITH CHECK (
		actor_profile_id = app.current_profile_id()
		AND app.is_active()
	);--> statement-breakpoint

CREATE POLICY member_loans_select ON public.member_loans
	FOR SELECT TO bagad_app
	USING (
		profile_id = app.current_profile_id()
		OR app.can_target_profile(profile_id)
	);--> statement-breakpoint

CREATE POLICY member_loans_insert ON public.member_loans
	FOR INSERT TO bagad_app
	WITH CHECK (app.is_role_at_least('secretaire'));--> statement-breakpoint

CREATE POLICY member_loans_update ON public.member_loans
	FOR UPDATE TO bagad_app
	USING (app.is_role_at_least('secretaire'))
	WITH CHECK (app.is_role_at_least('secretaire'));--> statement-breakpoint

CREATE POLICY member_loans_delete ON public.member_loans
	FOR DELETE TO bagad_app
	USING (app.is_role_at_least('secretaire'));--> statement-breakpoint

CREATE POLICY account_deletion_requests_select ON public.account_deletion_requests
	FOR SELECT TO bagad_app
	USING (
		profile_id = app.current_profile_id()
		OR app.is_role_at_least('admin')
	);--> statement-breakpoint

CREATE POLICY account_deletion_requests_insert ON public.account_deletion_requests
	FOR INSERT TO bagad_app
	WITH CHECK (
		profile_id = app.current_profile_id()
		AND app.is_active()
	);--> statement-breakpoint

CREATE POLICY account_deletion_requests_update ON public.account_deletion_requests
	FOR UPDATE TO bagad_app
	USING (app.is_role_at_least('admin'))
	WITH CHECK (app.is_role_at_least('admin'));--> statement-breakpoint
