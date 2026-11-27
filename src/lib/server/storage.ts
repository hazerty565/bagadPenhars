import { sql, type SQL } from 'drizzle-orm';
import { imageSize } from 'image-size';
import type { Transaction } from '$lib/db';
import type { R2BucketName } from '$lib/server/blobs';

/**
 * Quota global R2 et contrôles d'en-tête des téléversements (étapes 41 et 42).
 *
 * Deux responsabilités, toutes deux strictement serveur :
 *
 * 1. **Quota** — la table `storage_usage` porte un compteur global (les deux
 *    buckets additionnés, décision Q-2026-11-08-02) : `public_bytes`,
 *    `private_bytes`, `reserved_bytes`, `quota_bytes`, `alert_threshold_bytes`
 *    et `block_threshold_bytes`, tous en `bigint`. La réservation, la
 *    confirmation et la libération passent par les fonctions
 *    `app.reserve_storage_bytes`, `app.finalize_storage_upload` et
 *    `app.release_storage_bytes` (migration `0008_storage_quota_functions`,
 *    étape 56 — la `0006` est le durcissement RLS (décision Q-A7) et la `0007`
 *    corrige la politique `events_delete`).
 *
 *    Ces fonctions existent parce que l'écriture de `storage_usage` est
 *    réservée par RLS à la secrétaire et à l'administrateur, alors qu'un chef
 *    de pupitre dépose légitimement un document pour son pupitre. Elles
 *    verrouillent la ligne (`FOR UPDATE`) : une réservation concurrente ne
 *    peut pas lire un total périmé, donc le quota ne peut pas être dépassé
 *    par deux téléversements simultanés. Elles sont appelées **dans la
 *    transaction** `withUserContext` qui écrit la ligne métier : un échec
 *    annule la réservation et la ligne ensemble, sans fenêtre de dépassement
 *    et sans compteur orphelin.
 *
 * 2. **Contrôles d'en-tête** — type MIME, magic numbers et, pour les images,
 *    dimensions lues dans les seuls premiers octets du fichier. Aucun buffer
 *    complet du fichier n'est conservé, et le contrôle précède toute écriture
 *    R2 (contrat §12.4).
 */

/* -------------------------------------------------------------------------- */
/* Limites du contrat                                                         */
/* -------------------------------------------------------------------------- */

/** PDF : 20 Mio (contrat §8.2 et §12.4). */
export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;
/** Images d'album : 15 Mio (contrat §9.4 et §12.4). */
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
/** Images d'album : 6000 × 6000 au maximum (contrat §12.4). */
export const MAX_IMAGE_DIMENSION = 6000;

/**
 * Octets lus en tête d'image pour la lecture des dimensions.
 *
 * `image-size` ne lit que des en-têtes, mais pour un JPEG les marqueurs de
 * dimensions peuvent suivre un bloc EXIF volumineux : 2 Mio couvrent tous les
 * cas courants sans charger le fichier. Un JPEG dont l'en-tête dépasserait
 * cette fenêtre est refusé en 415 plutôt que validé à l'aveugle.
 */
const IMAGE_HEADER_BYTES = 2 * 1024 * 1024;

const PDF_SIGNATURE = [0x25, 0x50, 0x44, 0x46, 0x2d]; // %PDF-
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const RIFF_SIGNATURE = [0x52, 0x49, 0x46, 0x46]; // RIFF
const WEBP_SIGNATURE = [0x57, 0x45, 0x42, 0x50]; // WEBP

/* -------------------------------------------------------------------------- */
/* Erreurs                                                                    */
/* -------------------------------------------------------------------------- */

/** Quota global atteint : `507 quota_exceeded` (contrat §2.4). */
export class StorageQuotaError extends Error {
	readonly status = 507;
	readonly code = 'quota_exceeded';

	constructor(message = 'Le quota de stockage est atteint : aucun fichier ne peut être déposé.') {
		super(message);
		this.name = 'StorageQuotaError';
	}
}

/** Fichier refusé avant toute écriture : 400, 413 ou 415. */
export class UploadRejectedError extends Error {
	readonly status: number;
	readonly code: string;

	constructor(status: number, code: string, message: string) {
		super(message);
		this.name = 'UploadRejectedError';
		this.status = status;
		this.code = code;
	}
}

/* -------------------------------------------------------------------------- */
/* Quota                                                                      */
/* -------------------------------------------------------------------------- */

export type StorageLevel = 'ok' | 'warning' | 'critical' | 'blocked';

/** DTO `StorageUsage` du contrat §3. */
export interface StorageUsage {
	usedBytes: number;
	publicBytes: number;
	privateBytes: number;
	reservedBytes: number;
	quotaBytes: number;
	alertThresholdBytes: number;
	blockThresholdBytes: number;
	availableBytes: number;
	level: StorageLevel;
	lastSyncAt: string | null;
}

/**
 * Ligne renvoyée par les trois fonctions SQL de quota.
 *
 * `bigint` revient de PostgreSQL en chaîne : la conversion en nombre est faite
 * ici, seule, pour que les DTO restent des nombres.
 */
interface StorageFunctionRow {
	ok: boolean;
	pub: string | number;
	priv: string | number;
	res: string | number;
	quota: string | number;
	alert_at: string | number;
	block_at: string | number;
}

function toNumber(value: string | number | null | undefined): number {
	const parsed = Number(value ?? 0);
	return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Niveau du quota.
 *
 * Le contrat (§10.2) fixe `critical` au seuil d'alerte et `blocked` au seuil de
 * blocage ; `warning` est placé à 80 % du seuil d'alerte pour prévenir avant
 * la zone critique.
 */
function levelOf(
	usedBytes: number,
	reservedBytes: number,
	usage: StorageFunctionRow
): StorageLevel {
	const alertThreshold = toNumber(usage.alert_at);
	const blockThreshold = toNumber(usage.block_at);
	if (usedBytes + reservedBytes >= blockThreshold) return 'blocked';
	if (usedBytes >= alertThreshold) return 'critical';
	if (alertThreshold > 0 && usedBytes >= alertThreshold * 0.8) return 'warning';
	return 'ok';
}

function toStorageUsage(row: StorageFunctionRow): StorageUsage {
	const publicBytes = toNumber(row.pub);
	const privateBytes = toNumber(row.priv);
	const reservedBytes = toNumber(row.res);
	const quotaBytes = toNumber(row.quota);
	const alertThresholdBytes = toNumber(row.alert_at);
	const blockThresholdBytes = toNumber(row.block_at);
	const usedBytes = publicBytes + privateBytes;

	return {
		usedBytes,
		publicBytes,
		privateBytes,
		reservedBytes,
		quotaBytes,
		alertThresholdBytes,
		blockThresholdBytes,
		availableBytes: Math.max(blockThresholdBytes - usedBytes - reservedBytes, 0),
		level: levelOf(usedBytes, reservedBytes, row),
		lastSyncAt: null
	};
}

async function callStorageFunction(
	tx: Transaction,
	query: SQL
): Promise<StorageFunctionRow | null> {
	// `drizzle-orm` 0.45.4 déclare
	// `execute<TRow extends Record<string, unknown>>(...)` : le paramètre de
	// type doit satisfaire une signature d'index, ce qu'une `interface` ne fait
	// pas (limitation connue de TypeScript, une interface sans index signature
	// n'est pas assignable à `Record<string, unknown>`). On intersecte donc le
	// type métier avec `Record<string, unknown>` **au point d'appel seulement**,
	// ce qui satisfait la contrainte sans élargir le type public : la valeur
	// retournée reste `StorageFunctionRow | null`, précis et non indexé.
	const result = await tx.execute<StorageFunctionRow & Record<string, unknown>>(query);
	return result.rows[0] ?? null;
}

/**
 * Réserve `bytes` octets sur le quota global.
 *
 * Le `UPDATE` conditionnel de la fonction SQL ne s'écrit que si
 * `public_bytes + private_bytes + reserved_bytes + bytes` reste sous le seuil
 * de blocage ; il verrouille la ligne jusqu'au commit, ce qui sérialise les
 * téléversements concurrents. Lève `StorageQuotaError` (507) sinon.
 */
export async function reserveStorage(tx: Transaction, bytes: number): Promise<StorageUsage> {
	if (!Number.isFinite(bytes) || bytes <= 0) {
		throw new UploadRejectedError(400, 'validation_error', 'Taille de fichier invalide.');
	}

	const row = await callStorageFunction(tx, sql`select * from app.reserve_storage_bytes(${bytes})`);
	if (!row) {
		throw new StorageQuotaError(
			'Le quota de stockage n’a pas pu être réservé (compteur global absent).'
		);
	}
	if (!row.ok) throw new StorageQuotaError();
	return toStorageUsage(row);
}

/**
 * Confirme un dépôt : la réservation devient de la taille réellement écrite
 * dans le bucket indiqué. Lève `StorageQuotaError` si la réservation a
 * disparu (course avec une autre écriture) — l'appelant annule alors tout.
 */
export async function finalizeUpload(
	tx: Transaction,
	reservedBytes: number,
	actualBytes: number,
	bucket: R2BucketName
): Promise<StorageUsage> {
	const row = await callStorageFunction(
		tx,
		sql`select * from app.finalize_storage_upload(${reservedBytes}, ${actualBytes}, ${bucket})`
	);
	if (!row) throw new StorageQuotaError('La confirmation de quota a échoué.');
	if (!row.ok) {
		throw new StorageQuotaError('La réservation de quota a été consommée par une autre écriture.');
	}
	return toStorageUsage(row);
}

/**
 * Libère une réservation sans écriture (échec d'un téléversement).
 *
 * Dans le flux de `POST /api/member/upload`, le rollback de la transaction
 * suffit : la réservation n'a jamais été confirmée. Cette fonction existe pour
 * les appelants qui doivent annuler une réservation **commitée**.
 */
export async function releaseReservation(tx: Transaction, bytes: number): Promise<StorageUsage> {
	const row = await callStorageFunction(tx, sql`select * from app.release_storage_bytes(${bytes})`);
	if (!row) throw new Error('La libération de quota a échoué : compteur global absent.');
	return toStorageUsage(row);
}

/* -------------------------------------------------------------------------- */
/* Contrôles d'en-tête                                                        */
/* -------------------------------------------------------------------------- */

export interface PdfUpload {
	size: number;
	mimeType: 'application/pdf';
}

export type ImageMimeType = 'image/jpeg' | 'image/png' | 'image/webp';
export type ImageExtension = 'jpg' | 'png' | 'webp';

export interface ImageUpload {
	size: number;
	mimeType: ImageMimeType;
	extension: ImageExtension;
	width: number;
	height: number;
}

const IMAGE_FORMATS: Record<string, { mimeType: ImageMimeType; extension: ImageExtension }> = {
	jpeg: { mimeType: 'image/jpeg', extension: 'jpg' },
	png: { mimeType: 'image/png', extension: 'png' },
	webp: { mimeType: 'image/webp', extension: 'webp' }
};

function startsWith(bytes: Uint8Array, signature: number[], offset = 0): boolean {
	if (bytes.length < offset + signature.length) return false;
	return signature.every((value, index) => bytes[offset + index] === value);
}

function detectImageFormat(header: Uint8Array): ImageMimeType | null {
	if (startsWith(header, JPEG_SIGNATURE)) return IMAGE_FORMATS.jpeg.mimeType;
	if (startsWith(header, PNG_SIGNATURE)) return IMAGE_FORMATS.png.mimeType;
	if (startsWith(header, RIFF_SIGNATURE) && startsWith(header, WEBP_SIGNATURE, 8)) {
		return IMAGE_FORMATS.webp.mimeType;
	}
	return null;
}

function normaliseType(declared: string): string {
	return (declared.split(';')[0] ?? '').trim().toLowerCase();
}

function readSize(size: number, max: number, label: string): void {
	if (!Number.isFinite(size) || size <= 0) {
		throw new UploadRejectedError(400, 'validation_error', `Le fichier ${label} est vide.`);
	}
	if (size > max) {
		throw new UploadRejectedError(
			413,
			'file_too_large',
			`Le fichier ${label} dépasse la limite de ${Math.round(max / (1024 * 1024))} Mo.`
		);
	}
}

/**
 * Valide un dépôt PDF **avant** toute écriture : taille (413), type MIME
 * déclaré et signature `%PDF-` (415). Le seul type accepté est le PDF ; une
 * vidéo ou un `.docx` sont refusés en 415.
 */
export async function inspectPdfUpload(file: Blob, declaredType: string): Promise<PdfUpload> {
	readSize(file.size, MAX_DOCUMENT_BYTES, 'PDF');

	const declared = normaliseType(declaredType);
	if (declared && declared !== 'application/pdf' && declared !== 'application/octet-stream') {
		throw new UploadRejectedError(
			415,
			'unsupported_type',
			'Seuls les fichiers PDF sont acceptés pour un document.'
		);
	}

	const header = new Uint8Array(await file.slice(0, PDF_SIGNATURE.length).arrayBuffer());
	if (!startsWith(header, PDF_SIGNATURE)) {
		throw new UploadRejectedError(
			415,
			'unsupported_type',
			'Le fichier déposé n’est pas un PDF (signature absente).'
		);
	}

	return { size: file.size, mimeType: 'application/pdf' };
}

/**
 * Valide un dépôt d'image **avant** toute écriture : taille (413), type MIME
 * déclaré, signature JPEG/PNG/WebP et dimensions ≤ 6000 × 6000 (415).
 *
 * Les dimensions sont lues dans les seuls premiers octets du fichier via
 * `image-size` (import de la racine, jamais `image-size/fromFile`, dont le
 * sous-chemin Node est interdit dans un Worker). Une `TypeError` du paquet
 * (format non reconnu) devient un 415.
 */
export async function inspectImageUpload(file: Blob, declaredType: string): Promise<ImageUpload> {
	readSize(file.size, MAX_IMAGE_BYTES, 'image');

	const header = new Uint8Array(
		await file.slice(0, Math.min(file.size, IMAGE_HEADER_BYTES)).arrayBuffer()
	);

	const detected = detectImageFormat(header);
	if (!detected) {
		throw new UploadRejectedError(
			415,
			'unsupported_type',
			'Seules les images JPG, PNG et WebP sont acceptées.'
		);
	}

	const declared = normaliseType(declaredType);
	if (declared && declared !== 'application/octet-stream' && declared !== detected) {
		throw new UploadRejectedError(
			415,
			'unsupported_type',
			'Le type annoncé ne correspond pas au contenu du fichier.'
		);
	}

	let width: number;
	let height: number;
	try {
		const dimensions = imageSize(header);
		width = dimensions.width;
		height = dimensions.height;
	} catch {
		throw new UploadRejectedError(
			415,
			'unsupported_type',
			'Les dimensions de l’image n’ont pas pu être lues.'
		);
	}

	if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
		throw new UploadRejectedError(
			415,
			'unsupported_type',
			'Les dimensions de l’image sont invalides.'
		);
	}
	if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
		throw new UploadRejectedError(
			415,
			'unsupported_type',
			`L’image dépasse ${MAX_IMAGE_DIMENSION} × ${MAX_IMAGE_DIMENSION} pixels.`
		);
	}

	const format = Object.values(IMAGE_FORMATS).find((entry) => entry.mimeType === detected);
	if (!format) {
		throw new UploadRejectedError(415, 'unsupported_type', 'Format d’image non pris en charge.');
	}

	return {
		size: file.size,
		mimeType: format.mimeType,
		extension: format.extension,
		width,
		height
	};
}
