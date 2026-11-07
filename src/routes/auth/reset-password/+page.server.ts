import { fail } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { resetPasswordSchema } from './schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {};
};

export const actions: Actions = {
	requestReset: async ({ event, request }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;

		const validation = resetPasswordSchema.safeParse({ email });
		if (!validation.success) {
			return fail(400, {
				error: 'Adresse e-mail invalide.',
				email
			});
		}

		try {
			await auth.api.sendResetEmailPassword({
				body: {
					email: validation.data.email,
					// URL de redirection après réinitialisation (front-end)
					callbackURL: `${event.url.origin}/auth/reset-password/callback`
				},
				headers: event.request.headers,
				response: event.response as Response
			});
		} catch (err) {
			// Ne pas révéler si l'email existe ou pas (sécurité)
			return { success: true, message: 'Si ce compte existe, un lien de réinitialisation a été envoyé.' };
		}

		return {
			success: true,
			message: 'Si ce compte existe, un lien de réinitialisation a été envoyé.'
		};
	}
};
