import { requireAuth } from '$lib/server/member/queries/common';
import type { AuthLocals } from '$lib/server/member/queries/common';
import type { PageServerLoad } from './$types';

/**
 * Sécurité (étape 67 - F5).
 *
 * Aucune fonction de lecture dédiée : le socle (memberShell du layout)
 * suffit (§7.11 du contrat). Rôle minimum : `member` (requireAuth
 * uniquement). Pas de `memberPage` retournée : aucune section n'est
 * déclarée pour cette page.
 */
export const load: PageServerLoad = async ({ locals }) => {
	requireAuth(locals as unknown as AuthLocals);

	return {};
};
