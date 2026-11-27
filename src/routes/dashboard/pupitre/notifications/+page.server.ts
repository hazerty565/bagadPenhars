import { error } from '@sveltejs/kit';
import { requireAuth, requireRole, runQuery } from '$lib/server/member/queries/common';
import { getPupitrePage } from '$lib/server/member/queries/pupitre';
import type { AuthLocals } from '$lib/server/member/queries/common';
import type { PageServerLoad } from './$types';

/**
 * Espace pupitre — notifications (étape 66 - F4).
 *
 * Section 'pupitre' via getPupitrePage(section: 'notifications').
 * Rôle minimum : `chef_pupitre`.
 * Le pupitre visé provient du query param `?pupitreId=...`.
 */
export const load: PageServerLoad = async ({ locals, url }) => {
	requireAuth(locals as unknown as AuthLocals);
	requireRole(locals as unknown as AuthLocals, 'chef_pupitre');

	const profileId = locals.profile!.id;
	const db = locals.db!;

	const pupitreId = url.searchParams.get('pupitreId');
	if (!pupitreId) {
		throw error(400, 'Le paramètre pupitreId est requis.');
	}

	const data = await runQuery(db, profileId, (tx) =>
		getPupitrePage(tx, profileId, { pupitreId, section: 'notifications' })
	);

	return { memberPage: { section: 'pupitre', data } };
};
