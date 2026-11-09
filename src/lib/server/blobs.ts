/**
 * Accès aux buckets Cloudflare R2.
 *
 * Deux buckets : bagad-public (objets publiés) et bagad-private (objets privés).
 * Bindings figés : `R2_PUBLIC` et `R2_PRIVATE` (décision Q-2026-11-08-04).
 *
 * Aucun objet privé n'est accessible via une URL publique permanente : ils sont
 * servis par `/api/files/[...key]` après contrôle serveur. Un binding R2 Workers
 * n'expose pas d'API de signature d'URL ; `getSignedUrl` a donc été supprimé.
 *
 * Ce module fournit des helpers typés pour manipuler les objets R2.
 */

export type R2BucketName = 'public' | 'private';

export interface R2ObjectMetadata {
	key: string;
	size: number;
	mimeType: string;
	bucket: R2BucketName;
}

/**
 * Interface minimale d'un bucket R2 (correspond aux bindings Cloudflare).
 */
export interface R2BucketBinding {
	put(
		key: string,
		value: ArrayBuffer | ReadableStream | Blob,
		options?: { httpMetadata?: { contentType?: string } }
	): Promise<void>;
	get(key: string): Promise<{
		body: ReadableStream | null;
		httpMetadata?: { contentType?: string };
	} | null>;
	delete(key: string): Promise<void>;
}

/**
 * Interface des deux buckets R2 disponibles.
 */
export interface R2Bindings {
	R2_PUBLIC: R2BucketBinding;
	R2_PRIVATE: R2BucketBinding;
}

/**
 * Résout le binding R2 selon le nom du bucket.
 */
export function resolveBucket(bindings: R2Bindings, bucket: R2BucketName): R2BucketBinding {
	return bucket === 'public' ? bindings.R2_PUBLIC : bindings.R2_PRIVATE;
}

/**
 * Téléverse un objet dans le bucket spécifié.
 */
export async function uploadObject(
	bindings: R2Bindings,
	bucket: R2BucketName,
	key: string,
	body: ArrayBuffer | ReadableStream | Blob,
	mimeType: string
): Promise<R2ObjectMetadata> {
	const bucketClient = resolveBucket(bindings, bucket);

	await bucketClient.put(key, body, {
		httpMetadata: { contentType: mimeType }
	});

	const size = body instanceof Blob ? body.size : body instanceof ArrayBuffer ? body.byteLength : 0;

	return { key, size, mimeType, bucket };
}

/**
 * Récupère un objet depuis le bucket spécifié.
 */
export async function getObject(
	bindings: R2Bindings,
	bucket: R2BucketName,
	key: string
): Promise<{ body: ReadableStream; mimeType: string } | null> {
	const bucketClient = resolveBucket(bindings, bucket);

	const object = await bucketClient.get(key);
	if (!object || !object.body) return null;

	return {
		body: object.body,
		mimeType: object.httpMetadata?.contentType || 'application/octet-stream'
	};
}

/**
 * Supprime un objet depuis le bucket spécifié.
 */
export async function deleteObject(
	bindings: R2Bindings,
	bucket: R2BucketName,
	key: string
): Promise<void> {
	const bucketClient = resolveBucket(bindings, bucket);
	await bucketClient.delete(key);
}
