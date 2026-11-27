import { requireAuth, requireRole } from '$lib/server/member/queries/common';
import { runQuery } from '$lib/server/member/queries/common';
import { getPageContext } from '$lib/server/member/queries/context';
import type { AuthLocals } from '$lib/server/member/queries/common';
import type { PageServerLoad } from './$types';

/**
 * Permissions d'administration (étape 69 - F6).
 *
 * Aucune section dédiée : le socle (memberShell du layout) suffit.
 * Vérifie le rôle `admin` dans la transaction via getPageContext.
 * Rôle minimum : admin.
 */
export const load: PageServerLoad = async ({ locals }) => {
	requireAuth(locals as unknown as AuthLocals);
	requireRole(locals as unknown as Pick<AuthLocals, 'profile'>, 'admin');

	const profileId = locals.profile!.id;
	const db = locals.db!;

	await runQuery(db, profileId, (tx) => getPageContext(tx, profileId, 'admin'));

	return {};
};
