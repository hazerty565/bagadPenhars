import { eq, sql } from 'drizzle-orm';
import type { Transaction } from '$lib/db';
import { profiles, pupitres } from '$lib/db/schema';
import type { DirectoryProfile, MemberLevel, MemberPupitreId } from '$lib/member/types';
import { MemberQueryError } from './errors';

/**
 * Données de la page annuaire/trombinoscope (§12.3).
 */
export interface DirectoryPageData {
	profiles: DirectoryProfile[];
}

interface DirectoryRow {
	id: string;
	first_name: string;
	last_name: string;
	musician_level: string | null;
	avatar: number;
	avatar_url: string | null;
	pupitres: Array<{ pupitre_id: string }> | string | null;
	bureau_title: string | null;
}

/**
 * Liste des profils de l'annuaire (trombinoscope).
 *
 * Lit exclusivement la vue `app.member_directory` (comptes actifs uniquement,
 * colonne `is_chef` absente, §12.3 et Q-A5). Aucun champ interdit n'est exposé,
 * aucune valeur n'est fabriquée. Tri par `lastName` puis `firstName`.
 *
 * Le `profileId` sert à vérifier que le acteur est bien un compte actif avant
 * de livrer l'annuaire restreint.
 */
export async function listDirectoryProfiles(
	tx: Transaction,
	profileId: string
): Promise<DirectoryPageData> {
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

	// Annuaire restreint : vue `app.member_directory` (accounts actifs uniquement)
	const directoryResult = await tx.execute(sql`
		select id, first_name, last_name, musician_level, avatar, avatar_url, pupitres, bureau_title
		from app.member_directory
		order by last_name, first_name
	`);
	const rows = (directoryResult as unknown as { rows: DirectoryRow[] }).rows ?? [];

	// Résoudre uuid de pupitre → slug (MemberPupitreId) pour l'exposition
	const pupitreRows = await tx.select({ id: pupitres.id, slug: pupitres.slug }).from(pupitres);
	const slugById = new Map<string, string>(pupitreRows.map((row) => [row.id, row.slug]));

	const directoryProfiles: DirectoryProfile[] = rows.map((row) => {
		const rawPupitres = row.pupitres;
		const pupitreUuids: string[] = Array.isArray(rawPupitres)
			? rawPupitres.map((p) => p.pupitre_id).filter((id): id is string => typeof id === 'string')
			: [];

		return {
			id: row.id,
			firstName: row.first_name,
			lastName: row.last_name,
			avatar: row.avatar ?? 1,
			avatarUrl: row.avatar_url ?? null,
			pupitres: pupitreUuids.map((uuid) => ({
				pupitreId: (slugById.get(uuid) ?? uuid) as MemberPupitreId
			})),
			level: (row.musician_level ?? null) as unknown as MemberLevel,
			bureauPosition: row.bureau_title ?? null
		};
	});

	return { profiles: directoryProfiles };
}
