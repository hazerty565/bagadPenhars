import { asc, eq, inArray, sql } from 'drizzle-orm';
import type { Transaction } from '$lib/db';
import { albums, media, profiles, storageUsage } from '$lib/db/schema';
import { MemberQueryError } from './errors';
import type { MemberAlbum, MemberMedia } from '$lib/member/types';
import type { StorageUsage } from '$lib/server/storage';

export interface MediaPageData {
	albums: MemberAlbum[];
	storage: StorageUsage;
}

/**
 * Liste les albums avec leurs médias et l'usage de stockage (page admin media).
 *
 * Garde : secrétaire ou admin uniquement (requireRole avant l'appel).
 * Retourne tous les albums et leurs médias rattachés, plus la lecture seule de
 * `storage_usage` (usage R2 global, calculé côté serveur).
 *
 * Cette fonction reçoit déjà une transaction portant le contexte RLS
 * (app.profile_id), ouverte par l'appelant via runQuery /
 * withUserContext. Le caller applique requireAuth + requireRole avant la
 * transaction (garde serveur).
 *
 * Requêtes : 1 (profil/statut) + 1 (albums) + 1 (médias) + 1 (storage_usage)
 * = 4. Lecture seule (aucune écriture sur storage_usage).
 *
 * Erreurs : PROFILE_NOT_FOUND, ACCOUNT_INACTIVE, STORAGE_USAGE_NOT_FOUND.
 */
export async function listMediaPage(tx: Transaction, profileId: string): Promise<MediaPageData> {
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

	// Albums (tous, publiés et brouillons — page admin)
	const albumRows = await tx
		.select({
			id: albums.id,
			title: albums.title,
			description: albums.description,
			album_date: albums.album_date,
			is_published: albums.is_published
		})
		.from(albums)
		.orderBy(asc(albums.title));

	const albumIds = albumRows.map((row) => row.id);

	// Médias rattachés aux albums (lecture seule)
	let mediaRows: Array<{
		id: string;
		album_id: string | null;
		file_key: string;
		public_url: string | null;
		alt: string;
		caption: string;
		position: number;
	}> = [];

	if (albumIds.length > 0) {
		mediaRows = await tx
			.select({
				id: media.id,
				album_id: media.album_id,
				file_key: media.file_key,
				public_url: media.public_url,
				alt: media.alt,
				caption: media.caption,
				position: media.position
			})
			.from(media)
			.where(inArray(media.album_id, albumIds))
			.orderBy(asc(media.position));
	}

	const mediaByAlbum = new Map<string, MemberMedia[]>();
	for (const row of mediaRows) {
		if (!row.album_id) continue;
		const photos = mediaByAlbum.get(row.album_id) ?? [];
		photos.push({
			id: row.id,
			albumId: row.album_id,
			src: row.public_url ?? `/api/files/public/${row.file_key}`,
			alt: row.alt,
			caption: row.caption,
			order: row.position
		});
		mediaByAlbum.set(row.album_id, photos);
	}

	const albumsData: MemberAlbum[] = albumRows.map((row) => ({
		id: row.id,
		title: row.title,
		description: row.description ?? '',
		date: String(row.album_date).slice(0, 10),
		published: row.is_published,
		photos: (mediaByAlbum.get(row.id) ?? []).sort((a, b) => a.order - b.order)
	}));

	// Usage de stockage : lecture seule de storage_usage (ligne unique globale)
	const storageRows = await tx
		.select({
			public_bytes: storageUsage.public_bytes,
			private_bytes: storageUsage.private_bytes,
			reserved_bytes: storageUsage.reserved_bytes,
			quota_bytes: storageUsage.quota_bytes,
			alert_threshold_bytes: storageUsage.alert_threshold_bytes,
			block_threshold_bytes: storageUsage.block_threshold_bytes,
			last_sync_at: storageUsage.last_sync_at
		})
		.from(storageUsage)
		.limit(1);

	const storageRow = storageRows[0];
	if (!storageRow) {
		throw new MemberQueryError('STORAGE_USAGE_NOT_FOUND', 'Aucune ligne de stockage trouvée.');
	}

	const publicBytes = Number(storageRow.public_bytes ?? 0);
	const privateBytes = Number(storageRow.private_bytes ?? 0);
	const reservedBytes = Number(storageRow.reserved_bytes ?? 0);
	const quotaBytes = Number(storageRow.quota_bytes ?? 0);
	const alertThresholdBytes = Number(storageRow.alert_threshold_bytes ?? 0);
	const blockThresholdBytes = Number(storageRow.block_threshold_bytes ?? 0);
	const usedBytes = publicBytes + privateBytes;

	let level: StorageUsage['level'] = 'ok';
	if (usedBytes + reservedBytes >= blockThresholdBytes) {
		level = 'blocked';
	} else if (usedBytes >= alertThresholdBytes) {
		level = 'critical';
	} else if (alertThresholdBytes > 0 && usedBytes >= alertThresholdBytes * 0.8) {
		level = 'warning';
	}

	const storage: StorageUsage = {
		usedBytes,
		publicBytes,
		privateBytes,
		reservedBytes,
		quotaBytes,
		alertThresholdBytes,
		blockThresholdBytes,
		availableBytes: Math.max(blockThresholdBytes - usedBytes - reservedBytes, 0),
		level,
		lastSyncAt: storageRow.last_sync_at?.toISOString() ?? null
	};

	return { albums: albumsData, storage };
}
