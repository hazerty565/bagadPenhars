import { eq } from 'drizzle-orm';
import type { Transaction } from '$lib/db';
import type { AppRole, AccountStatus } from '$lib/auth/roles';
import type {
	MemberPupitreId,
	MemberProfile,
	MemberPreferences,
	MemberLevel
} from '$lib/member/types';
import {
	bureauPositions,
	notificationPreferences,
	profilePupitres,
	profiles,
	pupitres
} from '$lib/db/schema';
import { MemberQueryError, QueryErrorCode } from './errors';

/** Données de la page de profil (étape 63). */
export interface ProfilePageData {
	profile: MemberProfile;
	preferences: MemberPreferences | null;
}

/**
 * Retourne les données de la page de profil : le profil de la session courante
 * (soi-même uniquement) et ses préférences de notification.
 *
 * Le profil est relu dans la transaction (rôle et statut vérifiés en base,
 * jamais dans les métadonnées de session). Les préférences sont lues depuis
 * notificationPreferences WHERE profile_id = profileId ; null si aucune ligne.
 *
 * Cette fonction reçoit déjà une transaction portant le contexte RLS
 * (app.profile_id), ouverte par l'appelant via runQuery /
 * withUserContext. Le caller applique requireAuth + requireRole avant la
 * transaction (garde serveur).
 *
 * Requêtes : 1 (profil + bureau) + 1 (pupitres) + 1 (préférences).
 *
 * Erreurs : PROFILE_NOT_FOUND, ACCOUNT_INACTIVE.
 */
export async function getProfilePage(
	tx: Transaction,
	profileId: string
): Promise<ProfilePageData> {
	const profileRows = await tx
		.select({
			id: profiles.id,
			email: profiles.email,
			first_name: profiles.first_name,
			last_name: profiles.last_name,
			avatar_url: profiles.avatar_url,
			avatar: profiles.avatar,
			musician_level: profiles.musician_level,
			bureau_title: bureauPositions.title,
			role: profiles.role,
			account_status: profiles.account_status,
			created_at: profiles.created_at
		})
		.from(profiles)
		.leftJoin(
			bureauPositions,
			eq(profiles.bureau_position_id, bureauPositions.id)
		)
		.where(eq(profiles.id, profileId))
		.limit(1);

	const profileRow = profileRows[0];
	if (!profileRow) {
		throw new MemberQueryError(
			QueryErrorCode.PROFILE_NOT_FOUND,
			'Profil introuvable.'
		);
	}
	if (profileRow.account_status !== 'active') {
		throw new MemberQueryError(
			QueryErrorCode.ACCOUNT_INACTIVE,
			'Compte non actif.'
		);
	}

	const pupitreRows = await tx
		.select({ slug: pupitres.slug, is_chef: profilePupitres.is_chef })
		.from(profilePupitres)
		.innerJoin(pupitres, eq(profilePupitres.pupitre_id, pupitres.id))
		.where(eq(profilePupitres.profile_id, profileId));

	const pupitresList = pupitreRows.map((row) => ({
		pupitreId: row.slug as MemberPupitreId,
		isChef: row.is_chef
	}));

	const profile: MemberProfile = {
		id: profileRow.id,
		firstName: profileRow.first_name,
		lastName: profileRow.last_name,
		email: profileRow.email,
		role: profileRow.role as AppRole,
		accountStatus: profileRow.account_status as AccountStatus,
		level: (profileRow.musician_level ?? 'skolaj') as MemberLevel,
		bureauPosition: profileRow.bureau_title ?? null,
		pupitres: pupitresList,
		avatar: profileRow.avatar,
		joinedAt: profileRow.created_at.toISOString()
	};

	const prefRows = await tx
		.select({
			global_enabled: notificationPreferences.global_enabled,
			events_enabled: notificationPreferences.events_enabled,
			reminders_enabled: notificationPreferences.reminders_enabled,
			no_response_reminder_enabled:
				notificationPreferences.no_response_reminder_enabled
		})
		.from(notificationPreferences)
		.where(eq(notificationPreferences.profile_id, profileId));

	const preferences: MemberPreferences | null = prefRows[0]
		? {
				profileId: profileId,
				global: prefRows[0].global_enabled,
				reminders: prefRows[0].reminders_enabled,
				events: prefRows[0].events_enabled
			}
		: null;

	return { profile, preferences };
}
