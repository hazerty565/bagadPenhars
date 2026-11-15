import { member } from '../store.svelte';
import type { MemberDocument, MemberPupitreId } from '../types';
import {
	actorOf,
	canDeleteDocument,
	canDepositDocument,
	MemberPermissionError
} from '../permissions';
import { isNonEmpty } from './helpers';

export interface MemberDocumentInput {
	title: string;
	description: string;
	pupitreId: MemberPupitreId | null;
	fileName: string;
}

/**
 * Dépôt de document.
 *
 * Aucun binaire n'est téléversé à ce stade : seules les métadonnées sont
 * enregistrées côté serveur, avec une clé de fichier symbolique.
 */
export async function addDocument(
	_actorProfileId: string,
	input: MemberDocumentInput
): Promise<void> {
	const actor = actorOf(member.profile);
	if (!canDepositDocument(actor, input.pupitreId)) {
		throw new MemberPermissionError(
			'Vous ne pouvez déposer un document que pour un pupitre que vous dirigez.'
		);
	}
	if (!isNonEmpty(input.title, 3)) {
		throw new MemberPermissionError('Le titre doit contenir au moins trois caractères.');
	}
	if (!isNonEmpty(input.fileName, 3)) {
		throw new MemberPermissionError('Le nom du fichier est obligatoire.');
	}

	const fileName = input.fileName.trim().toLowerCase().endsWith('.pdf')
		? input.fileName.trim()
		: `${input.fileName.trim()}.pdf`;

	await member.request('document.create', {
		title: input.title.trim(),
		description: input.description.trim(),
		pupitreId: input.pupitreId,
		fileName
	});
}

export async function deleteDocument(_actorProfileId: string, documentId: string): Promise<void> {
	const document = member.documents.find((item) => item.id === documentId);
	if (!document) throw new MemberPermissionError('Document introuvable.');
	if (!canDeleteDocument(actorOf(member.profile), document.pupitreId)) {
		throw new MemberPermissionError('Vous ne pouvez pas supprimer ce document.');
	}
	await member.request('document.delete', { documentId });
}

/** Message de téléchargement : aucun fichier binaire n'est stocké à ce stade. */
export function simulateDownload(document: MemberDocument): string {
	return `Téléchargement simulé de « ${document.fileName} » (${document.sizeBytes} octets). Aucun fichier réel n’est encore produit.`;
}
