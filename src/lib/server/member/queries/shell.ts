import { eq, sql } from 'drizzle-orm';
import type { Transaction } from '$lib/db';
import type { AccountStatus, AppRole } from '$lib/auth/roles';
import type {
	MemberLevel,
	MemberProfile,
	MemberProfilePupitre,
	MemberPupitreId
} from '$lib/member/types';
import {
	bureauPositions,
	notificationReads,
	notifications,
	profilePupitres,
	profiles,
	pupitres
} from '$lib/db/schema';
import { MemberQueryError } from './errors';

/**
 * Retourne le socle de l'espace adhérents : profil complet du membre +
 * compteur de notifications non lues.
 *
 * Le profil est relu dans la transaction (rôle et statut vérifiés en base,
 * jamais dans les métadonnées de session). Les pupitres sont ceux du profil
 * courant uniquement, avec leur indicatif `isChef`.
 *
 * Requêtes : 1 (profil + bureau) + 1 (pupitres du profil) + 1 (compteur non-lus).
 *
 * Erreurs : `MemberQueryError(PROFILE_NOT_FOUND | ACCOUNT_INACTIVE)`.
 */
export async function getMemberShell(
	tx: Transaction,
	profileId: string
): Promise<{ profile: MemberProfile; unreadCount: number }> {
	// 1. Profil + fonction au bureau, relus en base (rôle et statut vérifiés).
	const profileRows = await tx
		.select({
			id: profiles.id,
			email: profiles.email,
			first_name: profiles.first_name,
			last_name: profiles.last_name,
			role: profiles.role,
			account_status: profiles.account_status,
			avatar: profiles.avatar,
			musician_level: profiles.musician_level,
			created_at: profiles.created_at,
			bureau_title: bureauPositions.title
		})
		.from(profiles)
		.leftJoin(bureauPositions, eq(profiles.bureau_position_id, bureauPositions.id))
		.where(eq(profiles.id, profileId))
		.limit(1);

	const profileRow = profileRows[0];
	if (!profileRow) {
		throw new MemberQueryError('PROFILE_NOT_FOUND', 'Profil introuvable.');
	}

	if (profileRow.account_status !== 'active') {
		throw new MemberQueryError('ACCOUNT_INACTIVE', 'Compte non actif.');
	}

	// 2. Pupitres du profil courant, avec le drapeau is_chef.
	const pupitreRows = await tx
		.select({
			slug: pupitres.slug,
			isChef: profilePupitres.is_chef
		})
		.from(profilePupitres)
		.innerJoin(pupitres, eq(profilePupitres.pupitre_id, pupitres.id))
		.where(eq(profilePupitres.profile_id, profileId));

	const pupitresList: MemberProfilePupitre[] = pupitreRows.map((row) => ({
		pupitreId: row.slug as MemberPupitreId,
		isChef: row.isChef
	}));

	// 3. Compteur de notifications non lues : notifications visibles (RLS appliqué)
	// sans enregistrement de lecture pour ce profil.
	const unreadResult = await tx.execute(sql`
		select count(*) as cnt
		from notifications n
		where not exists (
			select 1 from notification_reads nr
			where nr.notification_id = n.id and nr.profile_id = ${profileId}
		)
	`);
	const unreadCount = Number(
		(unreadResult as unknown as { rows: [{ cnt: string }] }).rows?.[0]?.cnt ?? 0
	);

	const profile: MemberProfile = {
		id: profileRow.id,
		firstName: profileRow.first_name,
		lastName: profileRow.last_name,
		email: profileRow.email,
		role: profileRow.role as AppRole,
		accountStatus: profileRow.account_status as AccountStatus,
		level: profileRow.musician_level as MemberLevel,
		bureauPosition: profileRow.bureau_title ?? null,
		pupitres: pupitresList,
		avatar: profileRow.avatar,
		joinedAt: profileRow.created_at.toString()
	};

	return { profile, unreadCount };
}
