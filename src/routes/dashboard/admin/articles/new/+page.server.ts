import { requireAuth, requireRole } from '$lib/server/member/queries/common';
import { runQuery } from '$lib/server/member/queries/common';
import { getPageContext } from '$lib/server/member/queries/events';
import type { AuthLocals } from '$lib/server/member/queries/common';
import type { PageServerLoad } from './$types';

/**
 * Création d'article — formulaire (étape 69 - F6).
 *
 * Section : eventForm. Rôle minimum : secretaire.
 * Canonical route pour la création d'événement depuis l'admin.
 * (Doublonne /dashboard/agenda/nouveau qui demande chef_pupitre).
 */
export const load: PageServerLoad = async ({ locals }) => {
	requireAuth(locals as unknown as AuthLocals);
	requireRole(locals as unknown as Pick<AuthLocals, 'profile'>, 'secretaire');

	const profileId = locals.profile!.id;
	const db = locals.db!;

	const data = await runQuery(db, profileId, (tx) => getPageContext(tx, profileId));

	return { memberPage: { section: 'eventForm', data } };
};
