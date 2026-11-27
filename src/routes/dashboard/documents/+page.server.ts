import { requireAuth, runQuery } from '$lib/server/member/queries/common';
import { listDocumentsPage } from '$lib/server/member/queries/documents';
import type { AuthLocals } from '$lib/server/member/queries/common';
import type { PageServerLoad } from './$types';

/**
 * Documents (étape 66 - F4).
 *
 * Section 'documents' via listDocumentsPage.
 * Rôle minimum : `member` (requireAuth uniquement).
 */
export const load: PageServerLoad = async ({ locals }) => {
	requireAuth(locals as unknown as AuthLocals);

	const profileId = locals.profile!.id;
	const db = locals.db!;

	const data = await runQuery(db, profileId, (tx) => listDocumentsPage(tx, profileId));

	return { memberPage: { section: 'documents', data } };
};
