import { desc, eq } from 'drizzle-orm';
import type { Transaction } from '$lib/db';
import { documents, pupitres, profiles } from '$lib/db/schema';
import type { MemberPupitreId } from '$lib/member/types';
import { MemberQueryError } from './errors';

export interface DocumentPageItem {
	id: string;
	title: string;
	description: string;
	pupitreId: MemberPupitreId | null;
	fileName: string;
	mimeType: string;
	sizeBytes: number;
	uploadedBy: string;
	uploadedAt: string;
}

export interface DocumentsPageData {
	documents: DocumentPageItem[];
}

interface DocumentRow {
	id: string;
	title: string;
	description: string | null;
	file_name: string;
	mime_type: string;
	size: number;
	uploaded_by: string;
	pupitre_id: string | null;
	created_at: Date | string | null;
}

interface PupitreMapRow {
	id: string;
	slug: string;
}

function toDateString(value: Date | string | null): string {
	if (!value) return '';
	const iso = typeof value === 'string' ? value : value.toISOString();
	return iso.slice(0, 10);
}

/**
 * Liste des documents actifs pour la page /dashboard/documents (§7.4).
 *
 * Tous les membres actifs lisent tous les documents actifs, tous pupitres
 * confondus. Le filtre `is_active = true` est appliqué ; la RLS
 * (`documents_select`) complète le filtrage.
 *
 * Champs exposés : id, title, description, pupitreId (slug ou null),
 * fileName, mimeType, sizeBytes, uploadedBy, uploadedAt. Aucun champ inventé.
 *
 * Requêtes : 1 (profil/statut) + 1 (map pupitres uuid -> slug) +
 * 1 (documents) = 3 (cible ≤ 3).
 */
export async function listDocumentsPage(
	tx: Transaction,
	profileId: string
): Promise<DocumentsPageData> {
	// Relire le rôle et le statut dans la transaction (défense en profondeur)
	const profileRows = await tx
		.select({
			role: profiles.role,
			account_status: profiles.account_status
		})
		.from(profiles)
		.where(eq(profiles.id, profileId))
		.limit(1);

	if (!profileRows[0]) {
		throw new MemberQueryError('PROFILE_NOT_FOUND', 'Profil introuvable.');
	}

	if (profileRows[0].account_status !== 'active') {
		throw new MemberQueryError('ACCOUNT_INACTIVE', 'Compte non actif.');
	}

	// Map uuid de pupitre -> slug (MemberPupitreId) pour l'exposition
	const pupitreRows = await tx.select({ id: pupitres.id, slug: pupitres.slug }).from(pupitres);
	const slugById = new Map<string, MemberPupitreId>();
	for (const row of pupitreRows) {
		slugById.set(row.id, row.slug as MemberPupitreId);
	}

	// Documents actifs (RLS : tous les membres actifs les lisent)
	const documentRows = await tx
		.select({
			id: documents.id,
			title: documents.title,
			description: documents.description,
			file_name: documents.file_name,
			mime_type: documents.mime_type,
			size: documents.size,
			uploaded_by: documents.uploaded_by,
			pupitre_id: documents.pupitre_id,
			created_at: documents.created_at
		})
		.from(documents)
		.where(eq(documents.is_active, true))
		.orderBy(desc(documents.created_at));

	const documentsList: DocumentPageItem[] = documentRows.map((row) => ({
		id: row.id,
		title: row.title,
		description: row.description ?? '',
		pupitreId: row.pupitre_id ? (slugById.get(row.pupitre_id) ?? null) : null,
		fileName: row.file_name,
		mimeType: row.mime_type,
		sizeBytes: row.size,
		uploadedBy: row.uploaded_by,
		uploadedAt: toDateString(row.created_at)
	}));

	return { documents: documentsList };
}
