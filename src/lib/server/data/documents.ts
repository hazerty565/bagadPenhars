import { db } from '$lib/server/db';
import {
	documents,
	pupitres,
	profiles
} from '$lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Accès aux données des documents (partitions et fichiers internes).
 *
 * Chaque fonction établit le contexte RLS via set_config(..., true) avant les
 * requêtes métier, dans la même transaction lorsque plusieurs requêtes sont
 * nécessaires. L'identité de l'acteur provient de la session Better Auth
 * (validée par le guard), jamais du client.
 */

/**
 * Contexte d'acteur requis par les fonctions de données.
 */
export interface Actor {
	profileId: string;
	role: string;
}

/**
 * Établit le contexte RLS pour l'acteur donné dans le cadre d'une transaction.
 */
export async function setRLSContextInTx(tx: typeof db, actor: Actor) {
	await tx.execute`SELECT set_config('app.user_id', ${actor.profileId}, true)`;
	await tx.execute`SELECT set_config('app.user_role', ${actor.role}, true)`;
}

/**
 * Liste des documents actifs, optionnellement filtrés par pupitre.
 * L'appelant vérifie les permissions (guard) avant l'appel.
 */
export async function listDocuments(actor: Actor, options?: {
	pupitreId?: string;
	activeOnly?: boolean;
}) {
	const pupitreId = options?.pupitreId;
	const activeOnly = options?.activeOnly ?? true;

	return db.transaction(async (tx) => {
		await setRLSContextInTx(tx, actor);

		let q = tx
			.select({
				id: documents.id,
				title: documents.title,
				description: documents.description,
				file_key: documents.file_key,
				bucket: documents.bucket,
				mime_type: documents.mime_type,
				size: documents.size,
				uploaded_by: documents.uploaded_by,
				pupitre_id: documents.pupitre_id,
				is_active: documents.is_active,
				created_at: documents.created_at,
				updated_at: documents.updated_at
			})
			.from(documents);

		if (activeOnly) {
			q = q.where(eq(documents.is_active, true));
		}

		if (pupitreId) {
			q = q.where(eq(documents.pupitre_id, pupitreId));
		}

		return q;
	});
}

/**
 * Récupère un document par son identifiant.
 * L'appelant vérifie les permissions (guard) avant l'appel.
 */
export async function getDocumentById(documentId: string) {
	const [document] = await db
		.select()
		.from(documents)
		.where(eq(documents.id, documentId))
		.limit(1);
	return document ?? null;
}

/**
 * Crée un document (métadonnées uniquement; l'objet R2 est géré séparément).
 * L'acteur doit être autorisé à déposer pour le pupitre visé (guard).
 */
export async function createDocument(actor: Actor, data: {
	title: string;
	description?: string;
	fileKey: string;
	bucket: string;
	mimeType: string;
	size: number;
	pupitreId?: string;
}) {
	return db.transaction(async (tx) => {
		await setRLSContextInTx(tx, actor);

		const [document] = await tx
			.insert(documents)
			.values({
				title: data.title,
				description: data.description ?? null,
				file_key: data.fileKey,
				bucket: data.bucket,
				mime_type: data.mimeType,
				size: data.size,
				uploaded_by: actor.profileId,
				pupitre_id: data.pupitreId ?? null,
				is_active: true
			})
			.returning();

		return document;
	});
}

/**
 * Met à jour un document. L'acteur doit être autorisé (guard).
 */
export async function updateDocument(
	actor: Actor,
	documentId: string,
	data: {
		title?: string;
		description?: string;
		is_active?: boolean;
		pupitreId?: string;
	}
) {
	return db.transaction(async (tx) => {
		await setRLSContextInTx(tx, actor);

		const updates: Record<string, unknown> = {};
		if (data.title !== undefined) updates.title = data.title;
		if (data.description !== undefined) updates.description = data.description;
		if (data.is_active !== undefined) updates.is_active = data.is_active;
		if (data.pupitreId !== undefined) updates.pupitre_id = data.pupitreId;
		updates.updated_at = new Date();

		const [document] = await tx
			.update(documents)
			.set(updates)
			.where(eq(documents.id, documentId))
			.returning();

		return document;
	});
}

/**
 * Désactive (suppression logique) un document. L'acteur doit être autorisé
 * (guard).
 */
export async function deactivateDocument(actor: Actor, documentId: string) {
	return updateDocument(actor, documentId, { is_active: false });
}

/**
 * Récupère les pupitres associés à un document (pour l'affichage).
 */
export async function getDocumentPupitre(documentId: string) {
	const [document] = await db
		.select({
			pupitre_id: documents.pupitre_id,
			pupitre_name: pupitres.name
		})
		.from(documents)
		.leftJoin(pupitres, eq(documents.pupitre_id, pupitres.id))
		.where(eq(documents.id, documentId))
		.limit(1);
	return document ?? null;
}

/**
 * Vérifie si un document appartient à un pupitre donné (utilisé par les
 * guards de chef de pupitre).
 */
export async function documentBelongsToPupitre(documentId: string, pupitreId: string) {
	const [document] = await db
		.select({ id: documents.id })
		.from(documents)
		.where(
			and(eq(documents.id, documentId), eq(documents.pupitre_id, pupitreId))
		)
		.limit(1);
	return !!document;
}

/**
 * Récupère les profils uploaders pour enrichir un document.
 */
export async function getDocumentUploader(uploadedBy: string) {
	const [profile] = await db
		.select({
			id: profiles.id,
			first_name: profiles.first_name,
			last_name: profiles.last_name,
			email: profiles.email
		})
		.from(profiles)
		.where(eq(profiles.id, uploadedBy))
		.limit(1);
	return profile ?? null;
}
