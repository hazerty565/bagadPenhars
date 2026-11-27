import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { withUserContext } from '$lib/db';
import { documents, media } from '$lib/db/schema';
import { isSecretaire } from '$lib/auth/roles';
import { GuardError, requireAuth } from '$lib/auth/guards';
import {
	getObject,
	type R2Bindings,
	type R2BucketBinding,
	type R2BucketName
} from '$lib/server/blobs';

/**
 * Diffusion des objets R2 pour `GET /api/files/[...key]` (étape 40).
 *
 * Premier segment de la clé = bucket logique (`public` ou `private`), le reste
 * = clé R2 :
 *
 * - `public/...`  : public, aucun guard, cache public, aucun cookie posé ;
 * - `private/...` : session + compte actif, puis contrôle de visibilité :
 *   - `profiles/{profileId}/avatar.{ext}` : le propriétaire uniquement ;
 *   - `documents/{documentId}/{uuid}.pdf` : tout membre actif, sur une ligne
 *     `documents` active ;
 *   - `albums/{albumId}/{uuid}.{ext}` : secrétaire ou administrateur.
 *
 * Aucun objet privé n'a d'URL publique permanente et **aucune URL signée**
 * n'est produite (décision Q-2026-11-08-04) : la garde est ici, l'objet est
 * ensuite streamé depuis le binding R2 de la requête.
 *
 * Une clé privée inaccessible renvoie 403 quand la règle de rôle ou de
 * propriété est explicite, et 404 ailleurs : on ne révèle jamais l'existence
 * d'un objet auquel l'appelant n'a pas droit.
 *
 * Ce module est réservé au serveur : il est appelé par le fichier de route
 * `src/routes/api/files/[...key]/+server.ts`, qui ne fait que déléguer.
 */

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const AVATAR_KEY = new RegExp(`^profiles/(${UUID})/avatar\\.[a-z0-9]+$`, 'i');
const DOCUMENT_KEY = /^documents\/[^/]+\/[^/]+$/;
const ALBUM_MEDIA_KEY = /^albums\/[^/]+\/[^/]+$/;

const PRIVATE_CACHE_CONTROL = 'private, no-store';
const PUBLIC_CACHE_CONTROL = 'public, max-age=3600';

type PrivateScope =
	| { kind: 'avatar'; profileId: string }
	| { kind: 'document' }
	| { kind: 'albumMedia' }
	| { kind: 'unknown' };

function errorResponse(status: number, code: string, message: string): Response {
	return json({ message, code }, { status });
}

function notFound(): Response {
	return errorResponse(404, 'not_found', 'Fichier introuvable.');
}

function storageUnavailable(): Response {
	return errorResponse(503, 'storage_unavailable', 'Stockage indisponible.');
}

/** Refuse les clés qui sortiraient de l'espace de nommage R2 attendu. */
function isSafeKey(key: string): boolean {
	if (key.length === 0 || key.length > 500) return false;
	if (key.startsWith('/') || key.endsWith('/')) return false;
	if (key.includes('//')) return false;
	return key.split('/').every((segment) => segment !== '' && segment !== '.' && segment !== '..');
}

function resolveBindings(platform: App.Platform | undefined): R2Bindings | null {
	const env = platform?.env;
	const publicBucket = env?.R2_PUBLIC as R2BucketBinding | undefined;
	const privateBucket = env?.R2_PRIVATE as R2BucketBinding | undefined;
	if (!publicBucket || !privateBucket) return null;
	return { R2_PUBLIC: publicBucket, R2_PRIVATE: privateBucket };
}

function classifyPrivateKey(key: string): PrivateScope {
	const avatar = key.match(AVATAR_KEY);
	if (avatar) return { kind: 'avatar', profileId: avatar[1] };
	if (DOCUMENT_KEY.test(key)) return { kind: 'document' };
	if (ALBUM_MEDIA_KEY.test(key)) return { kind: 'albumMedia' };
	return { kind: 'unknown' };
}

/**
 * Vérifie qu'une ligne métier autorise la diffusion de la clé privée.
 *
 * La requête passe par `withUserContext` : PostgreSQL applique les politiques
 * RLS du profil connecté, en défense en profondeur du contrôle ci-dessus.
 */
async function hasAuthorizedRow(
	db: NonNullable<App.Locals['db']>,
	profileId: string,
	scope: PrivateScope,
	key: string
): Promise<boolean> {
	if (scope.kind !== 'document' && scope.kind !== 'albumMedia') return true;

	const rows = await withUserContext(db, profileId, (tx) =>
		scope.kind === 'document'
			? tx.select({ id: documents.id }).from(documents).where(eq(documents.file_key, key)).limit(1)
			: tx.select({ id: media.id }).from(media).where(eq(media.file_key, key)).limit(1)
	);
	return rows.length > 0;
}

function binaryResponse(
	object: { body: ReadableStream; mimeType: string; size: number | null },
	cacheControl: string
): Response {
	const headers = new Headers({
		'Content-Type': object.mimeType,
		'Cache-Control': cacheControl,
		'X-Content-Type-Options': 'nosniff'
	});
	if (object.size !== null) headers.set('Content-Length', String(object.size));
	return new Response(object.body, { status: 200, headers });
}

async function servePublic(key: string, platform: App.Platform | undefined): Promise<Response> {
	const bindings = resolveBindings(platform);
	if (!bindings) return storageUnavailable();

	const object = await getObject(bindings, 'public', key);
	if (!object) return notFound();
	return binaryResponse(object, PUBLIC_CACHE_CONTROL);
}

async function servePrivate(
	key: string,
	locals: App.Locals,
	platform: App.Platform | undefined
): Promise<Response> {
	try {
		requireAuth({
			profile: locals.profile,
			role: locals.role,
			accountStatus: locals.accountStatus
		});
	} catch (error) {
		if (error instanceof GuardError) return errorResponse(error.status, error.code, error.message);
		throw error;
	}

	const scope = classifyPrivateKey(key);
	if (scope.kind === 'unknown') return notFound();

	const profileId = locals.profile!.id;
	if (scope.kind === 'avatar' && scope.profileId !== profileId) {
		return errorResponse(
			403,
			'forbidden',
			'Vous ne pouvez consulter que votre propre photo de profil.'
		);
	}
	if (scope.kind === 'albumMedia' && !isSecretaire(locals.role)) {
		return errorResponse(
			403,
			'insufficient_role',
			'Seuls la secrétaire et l’administrateur consultent les médias privés.'
		);
	}

	if (!locals.db) return storageUnavailable();
	if (!(await hasAuthorizedRow(locals.db, profileId, scope, key))) return notFound();

	const bindings = resolveBindings(platform);
	if (!bindings) return storageUnavailable();

	const object = await getObject(bindings, 'private', key);
	if (!object) return notFound();
	return binaryResponse(object, PRIVATE_CACHE_CONTROL);
}

/**
 * Diffuse l'objet R2 désigné par `key` (`public|private/...`).
 *
 * Appelée par `GET /api/files/[...key]` avec `params.key`, `locals` et
 * `platform` de la requête.
 */
export async function serveFile(
	locals: App.Locals,
	platform: App.Platform | undefined,
	key: string
): Promise<Response> {
	if (!isSafeKey(key)) return notFound();

	const separator = key.indexOf('/');
	if (separator <= 0) return notFound();

	const bucket = key.slice(0, separator);
	const objectKey = key.slice(separator + 1);
	if (!isSafeKey(objectKey)) return notFound();

	const logicalBucket: R2BucketName | null =
		bucket === 'public' ? 'public' : bucket === 'private' ? 'private' : null;
	if (!logicalBucket) return notFound();

	return logicalBucket === 'public'
		? servePublic(objectKey, platform)
		: servePrivate(objectKey, locals, platform);
}
