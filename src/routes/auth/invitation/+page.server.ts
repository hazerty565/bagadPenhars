import { fail, redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { profiles } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { createInvitation } from '$lib/server/data/invitations';
import { createProfile } from '$lib/server/data/profiles';
import { requireRole } from '$lib/auth/guards';
import type { Actions, PageServerLoad } from './$types';

const INVITATION_TTL_MS = 60 * 60 * 1000; // 1 heure

export const load: PageServerLoad = async ({ locals }) => {
	// Seul admin ou secretaire peut inviter
	requireRole(locals, 'secretaire');
	return {};
};

export const actions: Actions = {
	invite: async ({ event, locals, request }) => {
		requireRole(locals, 'secretaire');

		const formData = await request.formData();
		const email = formData.get('email') as string;
		const firstName = formData.get('first_name') as string;
		const lastName = formData.get('last_name') as string;
		const pupitreIds = formData.getAll('pupitre_id') as string[];

		if (!email || !firstName || !lastName) {
			return fail(400, {
				error: 'Tous les champs sont requis.',
				email,
				first_name: firstName,
				last_name: lastName
			});
		}

		try {
			// 1. Créer le compte Better Auth immédiatement (email non vérifié)
			const { user } = await auth.api.signUpEmail({
				body: {
					email,
					password: crypto.randomUUID() // mot de passe temporaire, l'invité en définit un nouveau
				},
				headers: event.request.headers,
				response: event.response as Response
			});

			// 2. Créer le profil métier avec account_status = pending, role = member
			await createProfile({
				authUserId: user.id,
				email,
				firstName,
				lastName
			});

			// 3. Créer l'invitation avec jeton empreinté, expirant dans 1 heure
			const token = crypto.randomUUID();
			const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);

			await createInvitation({
				email,
				token,
				expiresAt,
				createdBy: locals.profile!.id,
				pupitreIds
			});

			// 4. Envoyer l'email d'invitation (via Resend - voir src/lib/server/email.ts)
			// Le lien contient le jeton et redirige vers /auth/invitation/accept

			return { success: true, email };
		} catch (err) {
			console.error('Erreur lors de l\'invitation:', err);
			return fail(500, {
				error: 'Impossible de créer l\'invitation. Vérifiez que l\'email n\'est pas déjà utilisé.'
			});
		}
	}
};
