import { requireAuth, requireRole } from '$lib/server/member/queries/common';
import { runQuery } from '$lib/server/member/queries/common';
import { listArticlesPage } from '$lib/server/member/queries/articles';
import type { AuthLocals } from '$lib/server/member/queries/common';
import type { PageServerLoad } from './$types';

/**
 * Liste des articles (étape 69 - F6).
 *
 * Section : adminArticles. Rôle minimum : secretaire.
 */
export const load: PageServerLoad = async ({ locals }) => {
	requireAuth(locals as unknown as AuthLocals);
	requireRole(locals as unknown as Pick<AuthLocals, 'profile'>, 'secretaire');

	const profileId = locals.profile!.id;
	const db = locals.db!;

	const data = await runQuery(db, profileId, (tx) => listArticlesPage(tx, profileId));

	return { memberPage: { section: 'adminArticles', data } };
};
