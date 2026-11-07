import type { Handle } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { db } from '$lib/db';
import { profiles } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Hook serveur SvelteKit.
 *
 * - Valide la session Better Auth.
 * - Charge le profil métier depuis Neon (profiles.role, profiles.account_status).
 * - Peuplete event.locals avec profile, role, accountStatus.
 *
 * Les rôles et statuts métier viennent de la base, jamais de user_metadata.
 */

export const handle: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	event.locals.auth = session ? { session } : null;
	event.locals.profile = null;
	event.locals.role = null;
	event.locals.accountStatus = null;

	if (session?.user) {
		try {
			const [profile] = await db
				.select()
				.from(profiles)
				.where(eq(profiles.auth_user_id, session.user.id))
				.limit(1);

			if (profile) {
				event.locals.profile = profile;
				event.locals.role = profile.role;
				event.locals.accountStatus = profile.account_status;
			}
		} catch (err) {
			// En cas d'erreur de base, on garde locals vides et on laisse
			// les guards refuser l'accès. L'erreur est journalisée côté serveur.
			console.error('Erreur de chargement du profil:', err);
		}
	}

	return resolve(event);
};
