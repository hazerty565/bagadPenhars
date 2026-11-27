import { requireAuth, requireRole } from '$lib/server/member/queries/common';
import { runQuery } from '$lib/server/member/queries/common';
import { listMediaPage } from '$lib/server/member/queries/media';
import type { AuthLocals } from '$lib/server/member/queries/common';
import type { PageServerLoad } from './$types';

/**
 * Liste des médias (étape 69 - F6).
 *
 * Section : adminMedia. Rôle minimum : secretaire.
 */
export const load: PageServerLoad = async ({ locals }) => {
	requireAuth(locals as unknown as AuthLocals);
	requireRole(locals as unknown as Pick<AuthLocals, 'profile'>, 'secretaire');

	const profileId = locals.profile!.id;
	const db = locals.db!;

	const data = await runQuery(db, profileId, (tx) => listMediaPage(tx, profileId));

	return { memberPage: { section: 'adminMedia', data } };
};
