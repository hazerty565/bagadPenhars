import { eq, sql } from 'drizzle-orm';
import type { Transaction } from '$lib/db';
import { appSettings, profiles } from '$lib/db/schema';
import type { MemberSettings } from '$lib/member/types';
import { MemberQueryError } from './errors';

export interface SettingsPageData {
	settings: MemberSettings;
}

interface SettingsRow {
	association_name: string;
	contact_email: string;
	contact_address: string | null;
	website: string | null;
	notify_on_event_create: boolean;
	notify_reminder_days: number;
}

interface StorageRow {
	public_bytes: string | number;
	private_bytes: string | number;
	quota_bytes: string | number;
	alert_threshold_bytes: string | number;
}

/**
 * Retourne les réglages d'association et l'état du quota de stockage.
 *
 * Garde : admin uniquement (requireRole avant l'appel).
 * Données depuis `app_settings` (ligne unique) + `storageUsage` (quota global).
 *
 * Requêtes : 1 (profil/statut) + 1 (app_settings) + 1 (storage_usage) = 3.
 */
export async function getSettingsPage(
	tx: Transaction,
	profileId: string
): Promise<SettingsPageData> {
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

	const settingsRows = await tx
		.select({
			association_name: appSettings.association_name,
			contact_email: appSettings.contact_email,
			contact_address: appSettings.contact_address,
			website: appSettings.website,
			notify_on_event_create: appSettings.notify_on_event_create,
			notify_reminder_days: appSettings.notify_reminder_days
		})
		.from(appSettings)
		.where(eq(appSettings.id, 1))
		.limit(1);

	if (!settingsRows[0]) {
		throw new MemberQueryError('PROFILE_NOT_FOUND', 'Aucun réglage d’association trouvé.');
	}

	const storageResult = await tx.execute(sql`
		select
			public_bytes,
			private_bytes,
			quota_bytes,
			alert_threshold_bytes
		from storage_usage
		order by updated_at desc
		limit 1
	`);
	const storageRow = ((storageResult as unknown as { rows: StorageRow[] }).rows ?? [])[0];

	const publicBytes = Number(storageRow?.public_bytes ?? 0);
	const privateBytes = Number(storageRow?.private_bytes ?? 0);
	const quotaBytes = Number(storageRow?.quota_bytes ?? 0);
	const alertThresholdBytes = Number(storageRow?.alert_threshold_bytes ?? 0);

	return {
		settings: {
			associationName: settingsRows[0].association_name,
			email: settingsRows[0].contact_email,
			address: settingsRows[0].contact_address ?? '',
			website: settingsRows[0].website ?? '',
			storageUsedBytes: publicBytes + privateBytes,
			storageQuotaBytes: quotaBytes,
			storageAlertBytes: alertThresholdBytes,
			notifyOnEventCreate: settingsRows[0].notify_on_event_create,
			notifyReminderDays: settingsRows[0].notify_reminder_days
		}
	};
}
