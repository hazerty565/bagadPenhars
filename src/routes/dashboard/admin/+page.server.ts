import { requireAuth, requireRole } from '$lib/server/member/queries/common';
import { runQuery } from '$lib/server/member/queries/common';
import { getAdminOverviewPage } from '$lib/server/member/queries/adminOverview';
import type { AuthLocals } from '$lib/server/member/queries/common';
import type { PageServerLoad } from './$types';

/**
 * Vue d'ensemble de l'administration (étape 69 - F6).
 *
 * Section : adminOverview. Rôle minimum : secretaire.
 */
export const load: PageServerLoad = async ({ locals }) => {
	requireAuth(locals as unknown as AuthLocals);
	requireRole(locals as unknown as Pick<AuthLocals, 'profile'>, 'secretaire');

	const profileId = locals.profile!.id;
	const db = locals.db!;

	const data = await runQuery(db, profileId, (tx) => getAdminOverviewPage(tx, profileId));

	return { memberPage: { section: 'adminOverview', data } };
};
