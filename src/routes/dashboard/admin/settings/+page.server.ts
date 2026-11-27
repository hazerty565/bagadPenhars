import { requireAuth, requireRole } from '$lib/server/member/queries/common';
import { runQuery } from '$lib/server/member/queries/common';
import { getSettingsPage } from '$lib/server/member/queries/settings';
import type { AuthLocals } from '$lib/server/member/queries/common';
import type { PageServerLoad } from './$types';

/**
 * Réglages d'association (étape 69 - F6).
 *
 * Section : adminSettings. Rôle minimum : admin.
 */
export const load: PageServerLoad = async ({ locals }) => {
	requireAuth(locals as unknown as AuthLocals);
	requireRole(locals as unknown as Pick<AuthLocals, 'profile'>, 'admin');

	const profileId = locals.profile!.id;
	const db = locals.db!;

	const data = await runQuery(db, profileId, (tx) => getSettingsPage(tx, profileId));

	return { memberPage: { section: 'adminSettings', data } };
};
