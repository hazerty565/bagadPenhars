import { requireAuth, runQuery } from '$lib/server/member/queries/common';
import { getProfilePage } from '$lib/server/member/queries/profile';
import type { AuthLocals } from '$lib/server/member/queries/common';
import type { PageServerLoad } from './$types';

/**
 * Profil (étape 67 - F5).
 *
 * Section 'profile' via getProfilePage.
 * Rôle minimum : `member` (requireAuth uniquement).
 * requireOwnProfile est satisfait par construction : profileId provient de
 * locals.profile.id (session Better Auth), jamais du client.
 */
export const load: PageServerLoad = async ({ locals }) => {
	requireAuth(locals as unknown as AuthLocals);

	const profileId = locals.profile!.id;
	const db = locals.db!;

	const data = await runQuery(db, profileId, (tx) => getProfilePage(tx, profileId));

	return { memberPage: { section: 'profile', data } };
};
