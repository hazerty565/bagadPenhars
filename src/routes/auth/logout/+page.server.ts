import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

/**
 * Déconnexion.
 *
 * Better Auth invalide la session côté serveur, puis le cookie est effacé.
 * La déconnexion est une action POST : un lien GET ne peut pas la déclencher.
 */
export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.session) {
		throw redirect(303, '/auth/login');
	}
	return {};
};

export const actions: Actions = {
	default: async ({ locals, request }) => {
		if (locals.auth) {
			try {
				await locals.auth.api.signOut({ headers: request.headers });
			} catch (error) {
				console.error('Déconnexion impossible :', error);
			}
		}
		throw redirect(303, '/');
	}
};
