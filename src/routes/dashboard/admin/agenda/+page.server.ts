import { requireAuth, requireRole } from '$lib/server/member/queries/common';
import { runQuery } from '$lib/server/member/queries/common';
import { listAgendaEvents } from '$lib/server/member/queries/agenda';
import type { AuthLocals } from '$lib/server/member/queries/common';
import type { PageServerLoad } from './$types';

/**
 * Administration de l'agenda (étape 69 - F6).
 *
 * Section : agenda. Rôle minimum : secretaire.
 * Cette route fournit une vue d'administration de l'agenda (identique à la vue membre
 * mais accessible depuis l'interface d'administration).
 */
export const load: PageServerLoad = async ({ locals }) => {
	requireAuth(locals as unknown as AuthLocals);
	requireRole(locals as unknown as Pick<AuthLocals, 'profile'>, 'secretaire');

	const profileId = locals.profile!.id;
	const db = locals.db!;

	const data = await runQuery(db, profileId, (tx) => listAgendaEvents(tx, profileId));

	return { memberPage: { section: 'agenda', data } };
};
