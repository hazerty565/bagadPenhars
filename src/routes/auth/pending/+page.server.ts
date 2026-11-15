import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/**
 * Compte authentifié mais non encore activé.
 *
 * Le statut vient de `profiles.account_status` (jamais du navigateur) :
 * un compte actif est renvoyé vers l'espace adhérents, une session absente
 * vers la page de connexion.
 */
export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.session || !locals.profile) {
		throw redirect(303, '/auth/login');
	}
	if (locals.profile.account_status === 'active') {
		throw redirect(303, '/dashboard');
	}
	if (locals.profile.account_status === 'suspended') {
		throw redirect(303, '/auth/login?error=suspended');
	}

	return { email: locals.profile.email };
};
