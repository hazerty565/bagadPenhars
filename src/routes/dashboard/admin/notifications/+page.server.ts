import { requireAuth, requireRole } from '$lib/server/member/queries/common';
import { runQuery } from '$lib/server/member/queries/common';
import { listNotificationsPage } from '$lib/server/member/queries/notifications';
import type { AuthLocals } from '$lib/server/member/queries/common';
import type { PageServerLoad } from './$types';

/**
 * Administration des notifications (étape 69 - F6).
 *
 * Section : notifications. Rôle minimum : secretaire.
 * Affiche toutes les notifications (sans filtre RLS par audience, car l'admin
 * voit tout). Note : la query actuelle filtre par RLS — pour une vraie vue
 * admin, il faudrait une query dédiée. Pour l'instant, on réutilise la même
 * query avec le rôle secretaire (la RLS laisse passer secretaire/admin).
 */
export const load: PageServerLoad = async ({ locals }) => {
	requireAuth(locals as unknown as AuthLocals);
	requireRole(locals as unknown as Pick<AuthLocals, 'profile'>, 'secretaire');

	const profileId = locals.profile!.id;
	const db = locals.db!;

	const data = await runQuery(db, profileId, (tx) => listNotificationsPage(tx, profileId));

	return { memberPage: { section: 'notifications', data } };
};
