import { fail } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { validateInvitation, markInvitationAccepted } from '$lib/server/data/invitations';
import type { Action, PageServerLoad } from './$types';

// Validation du côté serveur du token et email via les paramètres d'URL
export const load: PageServerLoad = async ({ params }) => {
	const { token, email } = params as { token?: string; email?: string };

	if (!token || !email) {
		return fail(400, { error: 'Token ou e-mail manquant.' });
	}

	const invitation = await validateInvitation(token, email);

	if (!invitation) {
		return fail(400, { error: 'L\'invitation est invalide, expirée ou déjà utilisée.' });
	}

	// Vérifier que le compte existe et est en pending
	// Better Auth gère cela via la session

	return {
		valid: true,
		email: invitation.email,
		token
	};
};

// Action pour accepter l'invitation
export const actions: { accept: Action } = {
	accept: async ({ request }) => {
		const formData = await request.formData();
		const token = formData.get('token') as string;
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;
		const confirmPassword = formData.get('confirmPassword') as string;

		if (!token || !email || !password || !confirmPassword) {
			return fail(400, { error: 'Tous les champs sont requis.' });
		}

		if (password !== confirmPassword) {
			return fail(400, { error: 'Les mots de passe ne correspondent pas.' });
		}

		if (password.length < 6) {
			return fail(400, { error: 'Le mot de passe doit faire au moins 6 caractères.' });
		}

		// Valider l'invitation
		const invitation = await validateInvitation(token, email);

		if (!invitation) {
			return fail(400, { error: 'L\'invitation est invalide, expirée ou déjà utilisée.' });
		}

		try {
			// Accepter l'invitation via Better Auth
			// Cela crée le compte et définit le mot de passe
			await auth.api.signUpEmail({
				body: {
					name: `${invitation.email.split('@')[0]}`,
					email: invitation.email,
					password
				},
				headers: {}
			});

			// Marquer l'invitation comme acceptée
			await markInvitationAccepted(invitation.id);

			return {
				success: true,
				message: 'Votre compte a été créé. Vous pouvez maintenant vous connecter.',
				redirectTo: '/auth/pending'
			};
		} catch (err) {
			console.error("Erreur lors de l'acceptation de l'invitation:", err);
			return fail(500, {
				error: "Impossible d'accepter l'invitation. Veuillez réessayer."
			});
		}
	}
};