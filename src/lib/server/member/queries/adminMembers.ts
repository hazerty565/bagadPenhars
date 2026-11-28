import { asc, eq, sql } from 'drizzle-orm';
import type { Transaction } from '$lib/db';
import { bureauPositions, profilePupitres, profiles, pupitres } from '$lib/db/schema';
import type { AppRole, AccountStatus } from '$lib/auth/roles';
import type { MemberLevel, MemberPupitreId } from '$lib/member/types';
import { MemberQueryError } from './errors';

export interface MemberAdminSummary {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	role: AppRole;
	accountStatus: AccountStatus;
	emailConfirmed: boolean;
	level: MemberLevel | null;
	bureauPosition: string | null;
	bureauPositionId: string | null;
	pupitres: Array<{ pupitreId: MemberPupitreId; name: string; isChef: boolean }>;
	avatar: number;
	joinedAt: string;
}

export interface AdminMembersPageData {
	members: MemberAdminSummary[];
	membersCount: number;
}

interface MemberPupitreRow {
	profile_id: string;
	pupitre_id: string;
	is_chef: boolean;
	slug: string;
	name: string;
}

/**
 * Liste tous les membres pour l'écran d'administration des membres.
 *
 * Garde : secrétaire ou admin uniquement (requireRole avant l'appel).
 * Champs étendus : niveau, titre de bureau, bureauPositionId (édition du titre),
 * pupitres avec isChef (autorisé ici uniquement, décision Q-2026-11-25-01).
 * membersCount = nombre total de profils.
 *
 * Requêtes : 1 (profil/statut) + 1 (count) + 1 (membres + bureau) +
 * 1 (pupitres des membres) = 4.
 */
export async function listAdminMembersPage(
	tx: Transaction,
	profileId: string
): Promise<AdminMembersPageData> {
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
	const countResult = await tx.execute(sql`
		select count(*) as cnt from profiles
	`);
	const membersCount = Number(
		(countResult as unknown as { rows: [{ cnt: string }] }).rows?.[0]?.cnt ?? 0
	);

	// Membres avec leur titre de bureau (jointure bureau_positions)
	const memberRows = await tx
		.select({
			id: profiles.id,
			first_name: profiles.first_name,
			last_name: profiles.last_name,
			email: profiles.email,
			role: profiles.role,
			account_status: profiles.account_status,
			email_confirmed: profiles.email_confirmed,
			musician_level: profiles.musician_level,
			bureau_position_id: profiles.bureau_position_id,
			bureau_title: bureauPositions.title,
			avatar: profiles.avatar,
			created_at: profiles.created_at
		})
		.from(profiles)
		.leftJoin(bureauPositions, eq(profiles.bureau_position_id, bureauPositions.id))
		.orderBy(asc(profiles.last_name), asc(profiles.first_name));

	// Pupitres de tous les membres (pour le groupement par profil)
	const pupilRows = await tx
		.select({
			profile_id: profilePupitres.profile_id,
			pupitre_id: profilePupitres.pupitre_id,
			is_chef: profilePupitres.is_chef,
			slug: pupitres.slug,
			name: pupitres.name
		})
		.from(profilePupitres)
		.innerJoin(pupitres, eq(profilePupitres.pupitre_id, pupitres.id));

	const pupilByProfile = new Map<string, MemberPupitreRow[]>();
	for (const row of pupilRows) {
		const list = pupilByProfile.get(row.profile_id) ?? [];
		list.push(row);
		pupilByProfile.set(row.profile_id, list);
	}

	const members: MemberAdminSummary[] = memberRows.map((row) => {
		const pupitresList = (pupilByProfile.get(row.id) ?? []).map((p) => ({
			pupitreId: p.slug as MemberPupitreId,
			name: p.name,
			isChef: p.is_chef === true
		}));

		return {
			id: row.id,
			firstName: row.first_name,
			lastName: row.last_name,
			email: row.email,
			role: row.role,
			accountStatus: row.account_status,
			emailConfirmed: row.email_confirmed,
			level: (row.musician_level ?? null) as MemberLevel | null,
			bureauPosition: row.bureau_title ?? null,
			bureauPositionId: row.bureau_position_id,
			pupitres: pupitresList,
			avatar: row.avatar ?? 1,
			joinedAt: toISOString(row.created_at)
		};
	});

	return { members, membersCount };
}

function toISOString(value: Date | string | null | undefined): string {
	if (!value) return '';
	const d = typeof value === 'string' ? new Date(value) : value;
	return isNaN(d.getTime()) ? '' : d.toISOString();
}
