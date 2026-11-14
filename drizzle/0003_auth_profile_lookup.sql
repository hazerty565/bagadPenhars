-- Migration 0003 : résolution du profil à partir de l'identité Better Auth.
--
-- Cette fonction permet au hook serveur de passer de `session.user.id` au
-- `profiles.id` avant d'ouvrir la transaction RLS. Elle n'expose que la clé
-- primaire du profil correspondant à un identifiant Better Auth authentifié.

CREATE OR REPLACE FUNCTION app.profile_id_for_auth_user(p_auth_user_id text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
	SELECT p.id
	FROM public.profiles p
	WHERE p.auth_user_id = p_auth_user_id
	LIMIT 1
$$;--> statement-breakpoint

GRANT EXECUTE ON FUNCTION app.profile_id_for_auth_user(text) TO bagad_app;--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION app.profile_id_for_auth_user(text) FROM PUBLIC;--> statement-breakpoint
