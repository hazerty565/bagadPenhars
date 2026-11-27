import { requireAuth, runQuery } from '$lib/server/member/queries/common';
import { listNotificationsPage } from '$lib/server/member/queries/notifications';
import type { AuthLocals } from '$lib/server/member/queries/common';
import type { PageServerLoad } from './$types';

/**
 * Notifications (étape 67 - F5).
 *
 * Section 'notifications' via listNotificationsPage.
 * Rôle minimum : `member` (requireAuth uniquement).
 */
export const load: PageServerLoad = async ({ locals }) => {
	requireAuth(locals as unknown as AuthLocals);

	const profileId = locals.profile!.id;
	const db = locals.db!;

	const data = await runQuery(db, profileId, (tx) => listNotificationsPage(tx, profileId));

	return { memberPage: { section: 'notifications', data } };
};
