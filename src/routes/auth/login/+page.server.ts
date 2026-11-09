import { fail, redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { loginSchema } from './schema';
import type { Actions, PageServerLoad } from './$types';

/**
 * Chargement de la page de connexion.
 * Redirige vers le dashboard si l'utilisateur est déjà authentifié et actif.
 */
export const load: PageServerLoad = async ({ locals }) => {
	if (locals.profile && locals.accountStatus === 'active') {
		throw redirect(302, '/dashboard');
	}
	return {};
};

/**
 * Action de connexion.
 * Valide les identifiants via Better Auth et établit la session.
 */
export const actions: Actions = {
	login: async ({ request }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		const validation = loginSchema.safeParse({ email, password });
		if (!validation.success) {
			return fail(400, {
				error: 'Email ou mot de passe invalide.',
				email
			});
		}

		try {
			await auth.api.signInEmail({
				body: {
					email: validation.data.email,
					password: validation.data.password
				},
				headers: request.headers
			});
		} catch {
			return fail(401, {
				error: 'Email ou mot de passe invalide.',
				email
			});
		}

		// Après connexion, on vérifie le statut du compte
		// Le hook serveur aura chargé le profil dans locals
		return { success: true };
	}
};
