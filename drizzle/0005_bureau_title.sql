-- Migration 0005 : fonction au bureau en texte libre.
--
-- L'interface saisit une fonction du bureau (président, trésorier…)
-- dans un champ libre. La fonction administrative précédente acceptait un
-- UUID de `bureau_positions` ; cette migration ajoute une fonction
-- équivalente qui upserte le titre automatiquement.
--
-- Additive uniquement : rien n'est supprimé ni renommé.

CREATE OR REPLACE FUNCTION app.set_profile_bureau_title(p_profile uuid, p_title text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
	v_title text;
	v_position uuid;
BEGIN
	IF NOT app.is_role_at_least('admin') THEN
		RAISE EXCEPTION 'Action réservée à l''administrateur.' USING ERRCODE = '42501';
	END IF;

	v_title := NULLIF(btrim(COALESCE(p_title, '')), '');
	IF char_length(v_title) > 100 THEN
		RAISE EXCEPTION 'La fonction au bureau est trop longue (100 caractères maximum).';
	END IF;

	IF v_title IS NULL THEN
		UPDATE public.profiles
		SET bureau_position_id = NULL, updated_at = now()
		WHERE id = p_profile;
	ELSE
		INSERT INTO public.bureau_positions (title)
		VALUES (v_title)
		ON CONFLICT (title) DO UPDATE SET title = EXCLUDED.title
		RETURNING id INTO v_position;

		UPDATE public.profiles
		SET bureau_position_id = v_position, updated_at = now()
		WHERE id = p_profile;
	END IF;

	IF NOT FOUND THEN
		RAISE EXCEPTION 'Profil introuvable.';
	END IF;
END
$$;--> statement-breakpoint

GRANT EXECUTE ON FUNCTION app.set_profile_bureau_title(uuid, text) TO bagad_app;--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION app.set_profile_bureau_title(uuid, text) FROM PUBLIC;
