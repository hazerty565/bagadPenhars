/**
 * Accès aux buckets Cloudflare R2.
 *
 * Deux buckets : bagad-public (objets publiés) et bagad-private (objets privés).
 * Aucun objet privé n'est accessible via une URL publique permanente.
 *
 * Les buckets R2 sont injectés par Cloudflare Pages via les bindings d'environnement.
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
	put(key: string, value: any, options?: { httpMetadata?: { contentType?: string } }): Promise<void>;
	get(key: string): Promise<{ body: ReadableStream | null; httpMetadata?: { contentType?: string } } | null>;
	delete(key: string): Promise<void>;
	createSignedGetUrl(key: string, options?: { expiresIn?: number }): Promise<string>;
}

/**
 * Interface des deux buckets R2 disponibles.
 */
export interface R2Bindings {
	bagad_public: R2BucketBinding;
	bagad_private: R2BucketBinding;
}

/**
 * Résout le binding R2 selon le nom du bucket.
 */
export function resolveBucket(bindings: R2Bindings, bucket: R2BucketName): R2BucketBinding {
	return bucket === 'public' ? bindings.bagad_public : bindings.bagad_private;
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

/**
 * Génère une URL signée temporaire pour un objet privé.
 */
export async function getSignedUrl(
	bindings: R2Bindings,
	bucket: R2BucketName,
	key: string,
	expiresInSeconds: number = 300
): Promise<string> {
	const bucketClient = resolveBucket(bindings, bucket);
	return bucketClient.createSignedGetUrl(key, { expiresIn: expiresInSeconds });
}
