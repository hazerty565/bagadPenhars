import { requireAuth, runQuery } from '$lib/server/member/queries/common';
import { listDirectoryProfiles } from '$lib/server/member/queries/directory';
import type { AuthLocals } from '$lib/server/member/queries/common';
import type { PageServerLoad } from './$types';

/**
 * Trombinoscope / annuaire (étape 66 - F4).
 *
 * Section 'directory' : liste des profils actifs, strictement §12.3.
 * Rôle minimum : `member` (requireAuth uniquement).
 */
export const load: PageServerLoad = async ({ locals }) => {
	requireAuth(locals as unknown as AuthLocals);

	const profileId = locals.profile!.id;
	const db = locals.db!;

	const data = await runQuery(db, profileId, (tx) => listDirectoryProfiles(tx, profileId));

	return { memberPage: { section: 'directory', data } };
};
