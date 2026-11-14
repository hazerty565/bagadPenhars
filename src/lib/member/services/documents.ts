import { demo } from '../store.svelte';
import type { DemoDocument, DemoPupitreId } from '../types';
import { canDeleteDocument, canDepositDocument, DemoPermissionError } from '../permissions';
import { actorFor, isNonEmpty, nextId, nowIso } from './helpers';

export interface DemoDocumentInput {
	title: string;
	description: string;
	pupitreId: DemoPupitreId | null;
	fileName: string;
}

/**
 * Dépôt simulé : seules les métadonnées sont enregistrées, aucun fichier
 * n’est lu, téléversé ni conservé.
 */
export function addDocument(actorProfileId: string, input: DemoDocumentInput): DemoDocument {
	const actor = actorFor(actorProfileId);
	if (!canDepositDocument(actor, input.pupitreId)) {
		throw new DemoPermissionError(
			'Vous ne pouvez déposer un document que pour un pupitre que vous dirigez.'
		);
	}
	if (!isNonEmpty(input.title, 3)) {
		throw new DemoPermissionError('Le titre doit contenir au moins trois caractères.');
	}
	if (!isNonEmpty(input.fileName, 3)) {
		throw new DemoPermissionError('Le nom du fichier est obligatoire.');
	}

	const fileName = input.fileName.trim().toLowerCase().endsWith('.pdf')
		? input.fileName.trim()
		: `${input.fileName.trim()}.pdf`;

	const document: DemoDocument = {
		id: nextId('d', demo.documents),
		title: input.title.trim(),
		description: input.description.trim(),
		pupitreId: input.pupitreId,
		fileName,
		mimeType: 'application/pdf',
		sizeBytes: 180_000 + (input.title.length + fileName.length) * 8192,
		uploadedBy: actor.id,
		uploadedAt: nowIso().slice(0, 10)
	};

	demo.documents = [document, ...demo.documents];
	demo.persist();
	return document;
}

export function deleteDocument(actorProfileId: string, documentId: string): void {
	const actor = actorFor(actorProfileId);
	const document = demo.documents.find((item) => item.id === documentId);
	if (!document) throw new DemoPermissionError('Document introuvable.');
	if (!canDeleteDocument(actor, document.pupitreId)) {
		throw new DemoPermissionError('Vous ne pouvez pas supprimer ce document.');
	}
	demo.documents = demo.documents.filter((item) => item.id !== documentId);
	demo.persist();
}

/** Téléchargement simulé : aucun fichier binaire n’existe. */
export function simulateDownload(document: DemoDocument): string {
	return `Téléchargement simulé de « ${document.fileName} » (${document.sizeBytes} octets fictifs). Aucun fichier réel n’est produit en mode démonstration.`;
}
