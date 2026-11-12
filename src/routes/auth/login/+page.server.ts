import { fail, redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { loginSchema } from './schema';
import type { Actions, PageServerLoad } from './$types';

/**
 * Message unique pour toutes les erreurs d'identification.
 *
 * Il ne doit jamais permettre de distinguer une adresse inconnue d'un mot de
 * passe erroné.
 */
const GENERIC_ERROR = 'Adresse e-mail ou mot de passe invalide.';

/**
 * Better Auth refuse la connexion d'un compte dont l'adresse n'est pas encore
 * confirmée (`requireEmailVerification`). Le code d'erreur est stable, on le
 * reconnaît sans dépendre du type interne de la bibliothèque.
 */
function isEmailNotVerified(error: unknown): boolean {
	if (typeof error !== 'object' || error === null) return false;

	const candidate = error as { body?: { code?: unknown }; code?: unknown };
	return (candidate.body?.code ?? candidate.code) === 'EMAIL_NOT_VERIFIED';
}

/**
 * Chargement de la page de connexion.
 * Redirige vers le dashboard si l'utilisateur est déjà authentifié et actif.
 */
export const load: PageServerLoad = async ({ locals }) => {
	if (locals.profile && locals.accountStatus === 'active') {
		throw redirect(303, '/dashboard');
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
		const email = String(formData.get('email') ?? '');
		const password = String(formData.get('password') ?? '');

		const validation = loginSchema.safeParse({ email, password });
		if (!validation.success) {
			return fail(400, { error: GENERIC_ERROR, email });
		}

		try {
			await auth.api.signInEmail({
				body: {
					email: validation.data.email,
					password: validation.data.password
				},
				headers: request.headers
			});
		} catch (error) {
			// Better Auth vérifie le mot de passe avant de signaler une adresse
			// non confirmée : ce message n'ouvre donc pas d'énumération de comptes.
			if (isEmailNotVerified(error)) {
				return fail(403, {
					error:
						'Votre adresse e-mail n’est pas encore confirmée. Ouvrez le lien reçu par invitation, puis reconnectez-vous.',
					email: validation.data.email
				});
			}

			return fail(401, { error: GENERIC_ERROR, email: validation.data.email });
		}

		// La session (cookie) est posée par le plugin Better Auth pour SvelteKit
		// avant la redirection. Le contrôle du statut du compte appartient aux
		// guards de l'espace adhérents.
		throw redirect(303, '/dashboard');
	}
};
