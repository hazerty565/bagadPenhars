import { requireAuth, requireRole } from '$lib/server/member/queries/common';
import { runQuery } from '$lib/server/member/queries/common';
import { listAdminMembersPage } from '$lib/server/member/queries/adminMembers';
import type { AuthLocals } from '$lib/server/member/queries/common';
import type { PageServerLoad } from './$types';

/**
 * Administration des membres (étape 69 - F6).
 *
 * Section : adminMembers. Rôle minimum : secretaire.
 */
export const load: PageServerLoad = async ({ locals }) => {
	requireAuth(locals as unknown as AuthLocals);
	requireRole(locals as unknown as Pick<AuthLocals, 'profile'>, 'secretaire');

	const profileId = locals.profile!.id;
	const db = locals.db!;

	const data = await runQuery(db, profileId, (tx) => listAdminMembersPage(tx, profileId));

	return { memberPage: { section: 'adminMembers', data } };
};
