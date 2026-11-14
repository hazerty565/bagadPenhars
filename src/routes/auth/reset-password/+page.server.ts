import { fail } from '@sveltejs/kit';
import { resetPasswordSchema } from './schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {};
};

export const actions: Actions = {
	requestReset: async ({ request, locals }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;

		const validation = resetPasswordSchema.safeParse({ email });
		if (!validation.success) {
			return fail(400, {
				error: 'Adresse e-mail invalide.',
				email
			});
		}

		if (!locals.auth) {
			return fail(503, {
				error: 'Le service de réinitialisation est momentanément indisponible.',
				email
			});
		}

		try {
			await locals.auth.api.requestPasswordReset({
				body: {
					email: validation.data.email,
					// URL de redirection après réinitialisation (front-end)
					redirectTo: '/auth/reset-password/callback'
				},
				headers: request.headers
			});
		} catch {
			// Ne pas révéler si l'email existe ou pas (sécurité)
			return {
				success: true,
				message: 'Si ce compte existe, un lien de réinitialisation a été envoyé.'
			};
		}

		return {
			success: true,
			message: 'Si ce compte existe, un lien de réinitialisation a été envoyé.'
		};
	}
};
