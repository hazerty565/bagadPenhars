import { dev } from '$app/environment';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

/**
 * En production, l’espace membre exige une session Better Auth vérifiée.
 * En développement, aucune session n’est créée : les données sont fictives et
 * le profil actif est choisi dans la coquille de démonstration.
 */
export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!dev && !locals.user) {
		const redirectTo = encodeURIComponent(url.pathname + url.search);
		throw redirect(303, `/auth/login?redirectTo=${redirectTo}`);
	}

	return { user: locals.user };
};
