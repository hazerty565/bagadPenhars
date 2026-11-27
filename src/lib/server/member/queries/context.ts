import { eq } from 'drizzle-orm';
import type { Transaction } from '$lib/db';
import type { AppRole, AccountStatus } from '$lib/auth/roles';
import { hasRoleOrHigher } from '$lib/auth/roles';
import { profiles } from '$lib/db/schema';
import { MemberQueryError, QueryErrorCode } from './errors';

/**
 * Contexte de rôle et de statut d'un profil, relu dans la transaction.
 *
 * Utilisé par les pages sans fonction dédiée (securite, permissions) pour
 * vérifier que le profil courant atteint le rôle minimum requis avant de
 * rendre la page.
 *
 * Cette fonction reçoit déjà une transaction portant le contexte RLS
 * (app.profile_id), ouverte par l'appelant via runQuery /
 * withUserContext. Le caller applique requireAuth + requireRole avant la
 * transaction (garde serveur).
 *
 * Requêtes : 1 (profil).
 *
 * Erreurs : PROFILE_NOT_FOUND, INSUFFICIENT_ROLE.
 */
export async function getPageContext(
	tx: Transaction,
	profileId: string,
	minRole: AppRole
): Promise<{ role: AppRole; accountStatus: AccountStatus }> {
	const profileRows = await tx
		.select({
			role: profiles.role,
			account_status: profiles.account_status
		})
		.from(profiles)
		.where(eq(profiles.id, profileId))
		.limit(1);

	const profileRow = profileRows[0];
	if (!profileRow) {
		throw new MemberQueryError(QueryErrorCode.PROFILE_NOT_FOUND, 'Profil introuvable.');
	}

	const role = profileRow.role as AppRole;
	const accountStatus = profileRow.account_status as AccountStatus;

	if (!role || !hasRoleOrHigher(role, minRole)) {
		throw new MemberQueryError(
			QueryErrorCode.INSUFFICIENT_ROLE,
			`Le rôle ${minRole} ou supérieur est requis.`
		);
	}

	return { role, accountStatus };
}
