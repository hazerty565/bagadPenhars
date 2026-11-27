import { desc, eq } from 'drizzle-orm';
import type { Transaction } from '$lib/db';
import {
	notificationPupitres,
	notificationProfiles,
	notificationReads,
	notifications,
	pupitres,
	profiles
} from '$lib/db/schema';
import type { MemberNotificationAudience } from '$lib/member/types';
import { MemberQueryError } from './errors';

export interface NotificationPageItem {
	id: string;
	title: string;
	body: string;
	createdAt: string;
	audience: MemberNotificationAudience;
	/** Pupitres (slugs) ou profils (IDs) ciblés selon `audience`. */
	audienceIds: string[];
	sentBy: string;
	/** `[profileId]` si lue par le profil courant, `[]` sinon. */
	readBy: string[];
}

export interface NotificationsPageData {
	notifications: NotificationPageItem[];
}

function toDateTimeString(value: Date | string | null): string {
	if (!value) return '';
	return typeof value === 'string' ? value : value.toISOString();
}

/**
 * Notifications visibles pour le profil connecté (§7.5, §11.1).
 *
 * La RLS (`notifications_select`, fonction `app.can_view_notification`) filtre
 * déjà par audience : `all`, `pupitre` (pupitres dont le membre a accès),
 * `profiles` (profil directement ciblé), ou notification envoyée par soi.
 *
 * Pour chaque notification :
 * - `audienceIds` = pupitres ciblés (slugs) ou profils ciblés (IDs) selon l'audience,
 *   `[]` pour `all`.
 * - `readBy` = `[profileId]` si le profil courant a une lecture, `[]` sinon.
 *   Jamais l'identifiant d'un autre profil.
 *
 * Tri : `created_at` décroissant.
 *
 * Requêtes : 1 (profil/statut) + 1 (notifications) +
 * 1 (cibles pupitres) + 1 (cibles profils) + 1 (lectures) = 5 (cible ≤ 5).
 */
export async function listNotificationsPage(
	tx: Transaction,
	profileId: string
): Promise<NotificationsPageData> {
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

	// Notifications visibles pour ce profil (RLS appliqué), triées récentes d'abord
	const notificationRows = await tx
		.select({
			id: notifications.id,
			title: notifications.title,
			body: notifications.body,
			audience: notifications.audience,
			sent_by: notifications.sent_by,
			created_at: notifications.created_at
		})
		.from(notifications)
		.orderBy(desc(notifications.created_at));

	const notificationIds = notificationRows.map((row) => row.id);

	// Cibles pupitres : notification_id -> slug de pupitre
	const pupitreTargetRows = await tx
		.select({
			notificationId: notificationPupitres.notification_id,
			pupitreId: pupitres.slug
		})
		.from(notificationPupitres)
		.innerJoin(pupitres, eq(notificationPupitres.pupitre_id, pupitres.id));

	const pupitreTargets = new Map<string, string[]>();
	for (const row of pupitreTargetRows) {
		const list = pupitreTargets.get(row.notificationId) ?? [];
		list.push(row.pupitreId);
		pupitreTargets.set(row.notificationId, list);
	}

	// Cibles profils : notification_id -> IDs de profils
	const profileTargetRows = await tx
		.select({
			notificationId: notificationProfiles.notification_id,
			profileId: notificationProfiles.profile_id
		})
		.from(notificationProfiles);

	const profileTargets = new Map<string, string[]>();
	for (const row of profileTargetRows) {
		const list = profileTargets.get(row.notificationId) ?? [];
		list.push(row.profileId);
		profileTargets.set(row.notificationId, list);
	}

	// Lectures du profil courant sur ces notifications
	const readRows = notificationIds.length
		? await tx
				.select({
					notificationId: notificationReads.notification_id
				})
				.from(notificationReads)
				.where(eq(notificationReads.profile_id, profileId))
		: [];

	const readSet = new Set(
		readRows.map((row) => row.notificationId).filter((id): id is string => typeof id === 'string')
	);

	const notificationsData: NotificationPageItem[] = notificationRows.map((row) => {
		let audienceIds: string[];
		if (row.audience === 'pupitre') {
			audienceIds = pupitreTargets.get(row.id) ?? [];
		} else if (row.audience === 'profiles') {
			audienceIds = profileTargets.get(row.id) ?? [];
		} else {
			audienceIds = [];
		}

		return {
			id: row.id,
			title: row.title,
			body: row.body,
			createdAt: toDateTimeString(row.created_at),
			audience: row.audience,
			audienceIds,
			sentBy: row.sent_by,
			readBy: readSet.has(row.id) ? [profileId] : []
		};
	});

	return { notifications: notificationsData };
}
