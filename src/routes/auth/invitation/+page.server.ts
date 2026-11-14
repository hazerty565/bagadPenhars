import { fail } from '@sveltejs/kit';
import {
	acceptInvitation,
	InvitationError,
	validateInvitationToken
} from '$lib/server/invitations';
import type { Action, PageServerLoad } from './$types';

/**
 * Acceptation d'une invitation.
 *
 * Le lien reçu par e-mail porte le jeton en clair (`?token=...`) et l'adresse
 * (`?email=...`). Le jeton n'est jamais journalisé ; seule son empreinte est
 * stockée en base.
 */

export const load: PageServerLoad = async ({ url, platform }) => {
	const token = url.searchParams.get('token') ?? '';
	const email = url.searchParams.get('email') ?? undefined;

	if (!token) {
		return { valid: false, error: 'Lien incomplet : le jeton est absent.' };
	}

	const invitation = await validateInvitationToken(platform, token, email);
	if (!invitation) {
		return {
			valid: false,
			error: 'Cette invitation est invalide, expirée ou déjà utilisée.'
		};
	}

	return {
		valid: true,
		error: null,
		email: invitation.email,
		firstName: invitation.firstName,
		lastName: invitation.lastName,
		pupitres: invitation.pupitres.map((pupitre) => pupitre.name),
		token
	};
};

export const actions: { accept: Action } = {
	accept: async ({ request, platform }) => {
		const formData = await request.formData();
		const token = String(formData.get('token') ?? '');
		const password = String(formData.get('password') ?? '');
		const confirmPassword = String(formData.get('confirmPassword') ?? '');

		if (!token) {
			return fail(400, { error: 'Jeton manquant.' });
		}
		if (password.length < 8) {
			return fail(400, { error: 'Le mot de passe doit contenir au moins huit caractères.' });
		}
		if (password !== confirmPassword) {
			return fail(400, { error: 'Les deux mots de passe ne correspondent pas.' });
		}

		try {
			const result = await acceptInvitation(platform, token, password);
			return { success: true, email: result.email, firstName: result.firstName };
		} catch (error) {
			if (error instanceof InvitationError) {
				return fail(400, { error: error.message });
			}
			console.error("Erreur lors de l'acceptation de l'invitation :", error);
			return fail(500, {
				error: "Impossible d'accepter l'invitation pour le moment. Réessayez plus tard."
			});
		}
	}
};
