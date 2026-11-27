import { eq, sql } from 'drizzle-orm';
import type { Transaction } from '$lib/db';
import { events, invitations, profiles } from '$lib/db/schema';
import { MemberQueryError } from './errors';

export interface StorageUsage {
	usedBytes: number;
	publicBytes: number;
	privateBytes: number;
	reservedBytes: number;
	quotaBytes: number;
	alertThresholdBytes: number;
	blockThresholdBytes: number;
	availableBytes: number;
	level: 'ok' | 'warning' | 'critical' | 'blocked';
	lastSyncAt: string | null;
}

export interface AdminOverviewPageData {
	counts: {
		members: number;
		pendingInvitations: number;
		upcomingEvents: number;
	};
	storage: StorageUsage;
}

interface CountRow {
	cnt: string;
}

interface StorageRow {
	public_bytes: string | number;
	private_bytes: string | number;
	reserved_bytes: string | number;
	quota_bytes: string | number;
	alert_threshold_bytes: string | number;
	block_threshold_bytes: string | number;
}

/**
 * Vue d'ensemble de l'administration : compteurs agrégés + stockage.
 *
 * Garde : secrétaire ou admin uniquement (requireRole avant l'appel).
 * Aucune donnée nominative au-delà de ce que la page affiche (compteurs seulement).
 *
 * Requêtes : 1 (profil/statut) + 1 (count membres) + 1 (count invitations) +
 * 1 (count événements à venir) + 1 (stockage) = 5.
 */
export async function getAdminOverviewPage(
	tx: Transaction,
	profileId: string
): Promise<AdminOverviewPageData> {
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

	// Nombre total de membres
	const membersResult = await tx.execute(sql`select count(*) as cnt from profiles`);
	const members = Number((membersResult as unknown as { rows: CountRow[] }).rows?.[0]?.cnt ?? 0);

	// Invitations en attente (ni acceptées, ni annulées)
	const pendingInvitationsResult = await tx.execute(sql`
		select count(*) as cnt from invitations
		where accepted_at is null and cancelled_at is null
	`);
	const pendingInvitations = Number(
		(pendingInvitationsResult as unknown as { rows: CountRow[] }).rows?.[0]?.cnt ?? 0
	);

	// Événements à venir (non annulés, date >= aujourd'hui Europe/Paris)
	const upcomingEventsResult = await tx.execute(sql`
		select count(*) as cnt from events
		where cancelled_at is null
		  and event_date >= (now() AT TIME ZONE 'Europe/Paris')::date
	`);
	const upcomingEvents = Number(
		(upcomingEventsResult as unknown as { rows: CountRow[] }).rows?.[0]?.cnt ?? 0
	);

	// Stockage global
	const storageResult = await tx.execute(sql`
		select
			public_bytes,
			private_bytes,
			reserved_bytes,
			quota_bytes,
			alert_threshold_bytes,
			block_threshold_bytes
		from storage_usage
		order by updated_at desc
		limit 1
	`);
	const storageRow = ((storageResult as unknown as { rows: StorageRow[] }).rows ?? [])[0];

	const publicBytes = Number(storageRow?.public_bytes ?? 0);
	const privateBytes = Number(storageRow?.private_bytes ?? 0);
	const reservedBytes = Number(storageRow?.reserved_bytes ?? 0);
	const quotaBytes = Number(storageRow?.quota_bytes ?? 0);
	const alertThresholdBytes = Number(storageRow?.alert_threshold_bytes ?? 0);
	const blockThresholdBytes = Number(storageRow?.block_threshold_bytes ?? 0);

	const usedBytes = publicBytes + privateBytes;
	const availableBytes = Math.max(blockThresholdBytes - usedBytes - reservedBytes, 0);
	let level: StorageUsage['level'] = 'ok';
	if (usedBytes + reservedBytes >= blockThresholdBytes) {
		level = 'blocked';
	} else if (usedBytes >= alertThresholdBytes) {
		level = 'critical';
	} else if (alertThresholdBytes > 0 && usedBytes >= alertThresholdBytes * 0.8) {
		level = 'warning';
	}

	return {
		counts: {
			members,
			pendingInvitations,
			upcomingEvents
		},
		storage: {
			usedBytes,
			publicBytes,
			privateBytes,
			reservedBytes,
			quotaBytes,
			alertThresholdBytes,
			blockThresholdBytes,
			availableBytes,
			level,
			lastSyncAt: null
		}
	};
}
