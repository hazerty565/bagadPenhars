-- Migration 0008 : fonctions de quota R2 (`public.storage_usage`).
--
-- Défaut d'origine (constat P7 de l'audit du 2026-11-20, décision client Q-A7) :
-- `src/lib/server/storage.ts` appelle `app.reserve_storage_bytes`,
-- `app.finalize_storage_upload` et `app.release_storage_bytes` depuis les étapes
-- 41, 42 et 49, et **aucune** de ces trois fonctions n'existe en base. Tout
-- branchement d'upload casserait à la première écriture (507 fabriqué par un
-- appel SQL en erreur), alors que la table et ses seuils existent depuis `0000`.
--
-- Pourquoi des fonctions `SECURITY DEFINER` : l'écriture de `storage_usage` est
-- réservée par RLS à la secrétaire et à l'administrateur
-- (`storage_usage_update`, `0002:949`), alors qu'un chef de pupitre dépose
-- légitimement un document pour son pupitre. Les fonctions prennent le verrou
-- (`FOR UPDATE`) sur la ligne unique du compteur : une réservation concurrente
-- ne peut pas lire un total périmé, donc le quota ne peut pas être dépassé par
-- deux téléversements simultanés. Elles sont appelées **dans** la transaction
-- `withUserContext` qui écrit la ligne métier : un échec annule la réservation
-- et la ligne ensemble, sans fenêtre de dépassement ni compteur orphelin.
--
-- Forme de retour : **une ligne** portant exactement les alias lus par
-- `StorageFunctionRow` (`src/lib/server/storage.ts:118-126`) — `ok`, `pub`,
-- `priv`, `res`, `quota`, `alert_at`, `block_at`. Un alias différent ferait lire
-- `undefined` à `toStorageUsage()`, donc un quota silencieusement faux.
--
-- Signatures imposées par le **code** (le code fait foi, pas la formulation du
-- plan, qui annonçait deux arguments pour la confirmation) :
--   * `app.reserve_storage_bytes(bytes bigint)`                  — `storage.ts:201`
--   * `app.finalize_storage_upload(reserved, actual, bucket)`     — `storage.ts:224`, **3** arguments
--   * `app.release_storage_bytes(bytes bigint)`                   — `storage.ts:241`
--
-- Échec fermé : si la ligne unique du compteur est absente, les fonctions ne
-- renvoient **aucune** ligne (elles n'en inventent pas), et `storage.ts` lève
-- `StorageQuotaError` / une erreur explicite.
--
-- Migration strictement additive : aucune donnée lue ni écrite, `0000` à `0007`
-- non modifiées, `production` non touchée. `DROP ... IF EXISTS` avant chaque
-- `CREATE` rend la migration rejouable sans jamais toucher à un objet existant
-- d'une autre migration ; la signature à 2 arguments de la confirmation est
-- retirée par sécurité, au cas où une version antérieure du plan aurait été
-- appliquée à la main.

DROP FUNCTION IF EXISTS app.reserve_storage_bytes(bigint);--> statement-breakpoint
DROP FUNCTION IF EXISTS app.finalize_storage_upload(bigint, bigint);--> statement-breakpoint
DROP FUNCTION IF EXISTS app.finalize_storage_upload(bigint, bigint, text);--> statement-breakpoint
DROP FUNCTION IF EXISTS app.release_storage_bytes(bigint);--> statement-breakpoint

/* -------------------------------------------------------------------------- */
/* 1. Réservation                                                             */
/* -------------------------------------------------------------------------- */

-- Réserve `p_bytes` octets sur le quota global. La ligne du compteur est
-- verrouillée jusqu'au commit : les téléversements concurrents sont sérialisés
-- et le total lu ne peut pas être périmé.
--
-- * sous le seuil de blocage → `reserved_bytes += p_bytes`, `ok = true` ;
-- * au-delà du seuil          → **aucune écriture**, `ok = false`, état courant ;
-- * compteur absent           → aucune ligne renvoyée (échec fermé).
CREATE FUNCTION app.reserve_storage_bytes(p_bytes bigint)
RETURNS TABLE (
	ok boolean,
	pub bigint,
	priv bigint,
	res bigint,
	quota bigint,
	alert_at bigint,
	block_at bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
	v_id uuid;
	v_public bigint;
	v_private bigint;
	v_reserved bigint;
	v_quota bigint;
	v_alert bigint;
	v_block bigint;
BEGIN
	-- Défense en profondeur : `reserveStorage` valide déjà la taille côté
	-- serveur (`storage.ts:197`). Un appel direct invalide est refusé plutôt
	-- que traduit en `ok = false`, qui ferait croire à un dépassement de quota.
	IF p_bytes IS NULL OR p_bytes <= 0 THEN
		RAISE EXCEPTION 'Taille de réservation invalide.'
			USING ERRCODE = '22023';
	END IF;

	SELECT s.id, s.public_bytes, s.private_bytes, s.reserved_bytes,
		s.quota_bytes, s.alert_threshold_bytes, s.block_threshold_bytes
	INTO v_id, v_public, v_private, v_reserved, v_quota, v_alert, v_block
	FROM public.storage_usage s
	ORDER BY s.updated_at
	LIMIT 1
	FOR UPDATE;

	IF NOT FOUND THEN
		-- Compteur global absent : on n'invente ni ligne ni valeur.
		RETURN;
	END IF;

	-- Seuil de blocage, jamais le quota nominal : `block_threshold_bytes` est
	-- la seule limite opposable (contrat §12.4, `storage.ts:143`).
	IF v_public + v_private + v_reserved + p_bytes > v_block THEN
		RETURN QUERY SELECT false, v_public, v_private, v_reserved, v_quota, v_alert, v_block;
		RETURN;
	END IF;

	UPDATE public.storage_usage s
	SET reserved_bytes = s.reserved_bytes + p_bytes,
		updated_at = now()
	WHERE s.id = v_id
	RETURNING s.public_bytes, s.private_bytes, s.reserved_bytes,
		s.quota_bytes, s.alert_threshold_bytes, s.block_threshold_bytes
	INTO v_public, v_private, v_reserved, v_quota, v_alert, v_block;

	RETURN QUERY SELECT true, v_public, v_private, v_reserved, v_quota, v_alert, v_block;
END
$$;--> statement-breakpoint

REVOKE ALL ON FUNCTION app.reserve_storage_bytes(bigint) FROM PUBLIC;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION app.reserve_storage_bytes(bigint) TO bagad_app;--> statement-breakpoint

/* -------------------------------------------------------------------------- */
/* 2. Confirmation d'un dépôt                                                 */
/* -------------------------------------------------------------------------- */

-- La réservation devient la taille réellement écrite : `reserved_bytes` est
-- décrémenté de `p_reserved` et `p_actual` est ajouté au compteur du bucket
-- indiqué. Un bucket inconnu est refusé (erreur de programmation, pas un
-- dépassement de quota) : accepter `NULL` ou une autre valeur ferait disparaître
-- les octets du total sans rien compter.
--
-- `ok = false` si la réservation a disparu (`reserved_bytes < p_reserved`) :
-- une autre écriture l'a consommée, l'appelant annule tout et aucune donnée
-- n'est modifiée.
CREATE FUNCTION app.finalize_storage_upload(
	p_reserved bigint,
	p_actual bigint,
	p_bucket text
)
RETURNS TABLE (
	ok boolean,
	pub bigint,
	priv bigint,
	res bigint,
	quota bigint,
	alert_at bigint,
	block_at bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
	v_id uuid;
	v_public bigint;
	v_private bigint;
	v_reserved bigint;
	v_quota bigint;
	v_alert bigint;
	v_block bigint;
BEGIN
	IF p_reserved IS NULL OR p_reserved <= 0 THEN
		RAISE EXCEPTION 'Réservation à confirmer invalide.'
			USING ERRCODE = '22023';
	END IF;
	IF p_actual IS NULL OR p_actual < 0 THEN
		RAISE EXCEPTION 'Taille réellement écrite invalide.'
			USING ERRCODE = '22023';
	END IF;
	IF p_bucket IS NULL OR p_bucket NOT IN ('public', 'private') THEN
		RAISE EXCEPTION 'Bucket inconnu : « public » ou « private » attendu.'
			USING ERRCODE = '22023';
	END IF;

	SELECT s.id, s.public_bytes, s.private_bytes, s.reserved_bytes,
		s.quota_bytes, s.alert_threshold_bytes, s.block_threshold_bytes
	INTO v_id, v_public, v_private, v_reserved, v_quota, v_alert, v_block
	FROM public.storage_usage s
	ORDER BY s.updated_at
	LIMIT 1
	FOR UPDATE;

	IF NOT FOUND THEN
		RETURN;
	END IF;

	IF v_reserved < p_reserved THEN
		RETURN QUERY SELECT false, v_public, v_private, v_reserved, v_quota, v_alert, v_block;
		RETURN;
	END IF;

	UPDATE public.storage_usage s
	SET reserved_bytes = s.reserved_bytes - p_reserved,
		public_bytes = s.public_bytes
			+ (CASE WHEN p_bucket = 'public' THEN p_actual ELSE 0::bigint END),
		private_bytes = s.private_bytes
			+ (CASE WHEN p_bucket = 'private' THEN p_actual ELSE 0::bigint END),
		updated_at = now()
	WHERE s.id = v_id
	RETURNING s.public_bytes, s.private_bytes, s.reserved_bytes,
		s.quota_bytes, s.alert_threshold_bytes, s.block_threshold_bytes
	INTO v_public, v_private, v_reserved, v_quota, v_alert, v_block;

	RETURN QUERY SELECT true, v_public, v_private, v_reserved, v_quota, v_alert, v_block;
END
$$;--> statement-breakpoint

REVOKE ALL ON FUNCTION app.finalize_storage_upload(bigint, bigint, text) FROM PUBLIC;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION app.finalize_storage_upload(bigint, bigint, text) TO bagad_app;--> statement-breakpoint

/* -------------------------------------------------------------------------- */
/* 3. Libération d'une réservation                                            */
/* -------------------------------------------------------------------------- */

-- Libère une réservation sans écriture (échec d'un téléversement). Le compteur
-- ne passe jamais sous zéro : une double libération ne peut pas créer de crédit
-- d'octets négatif, donc de dépassement futur.
CREATE FUNCTION app.release_storage_bytes(p_bytes bigint)
RETURNS TABLE (
	ok boolean,
	pub bigint,
	priv bigint,
	res bigint,
	quota bigint,
	alert_at bigint,
	block_at bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
	v_id uuid;
	v_public bigint;
	v_private bigint;
	v_reserved bigint;
	v_quota bigint;
	v_alert bigint;
	v_block bigint;
BEGIN
	IF p_bytes IS NULL OR p_bytes <= 0 THEN
		RAISE EXCEPTION 'Taille à libérer invalide.'
			USING ERRCODE = '22023';
	END IF;

	SELECT s.id, s.public_bytes, s.private_bytes, s.reserved_bytes,
		s.quota_bytes, s.alert_threshold_bytes, s.block_threshold_bytes
	INTO v_id, v_public, v_private, v_reserved, v_quota, v_alert, v_block
	FROM public.storage_usage s
	ORDER BY s.updated_at
	LIMIT 1
	FOR UPDATE;

	IF NOT FOUND THEN
		RETURN;
	END IF;

	UPDATE public.storage_usage s
	SET reserved_bytes = GREATEST(s.reserved_bytes - p_bytes, 0::bigint),
		updated_at = now()
	WHERE s.id = v_id
	RETURNING s.public_bytes, s.private_bytes, s.reserved_bytes,
		s.quota_bytes, s.alert_threshold_bytes, s.block_threshold_bytes
	INTO v_public, v_private, v_reserved, v_quota, v_alert, v_block;

	RETURN QUERY SELECT true, v_public, v_private, v_reserved, v_quota, v_alert, v_block;
END
$$;--> statement-breakpoint

REVOKE ALL ON FUNCTION app.release_storage_bytes(bigint) FROM PUBLIC;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION app.release_storage_bytes(bigint) TO bagad_app;--> statement-breakpoint

-- Aucune table, colonne, politique ni donnée n'est touchée : `0006`
-- (`rls_hardening`) et `0007` (`events_delete_policy_fix`) restent en l'état, et
-- les trois fonctions sont les seuls objets créés par cette migration.
