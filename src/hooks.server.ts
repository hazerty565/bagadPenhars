import { dev } from '$app/environment';
import type { Handle, RequestEvent } from '@sveltejs/kit';

/**
 * Hook serveur SvelteKit.
 *
 * - Valide la session Better Auth.
 * - Charge le profil métier depuis Neon (profiles.role, profiles.account_status).
 * - Peuplete event.locals avec profile, role, accountStatus.
 *
 * Les rôles et statuts métier viennent de la base, jamais de user_metadata.
 *
 * En développement, l’espace membre utilise des données fictives : aucune
 * connexion Neon, aucun secret Better Auth et aucun profil réel ne sont
 * nécessaires. Les modules serveur sont donc chargés à la demande, uniquement
 * hors mode démonstration, pour que `vite dev` fonctionne sans base.
 */

async function loadRealSession(event: RequestEvent) {
	try {
		const [{ auth }, { db }, { profiles }] = await Promise.all([
			import('$lib/server/auth'),
			import('$lib/db'),
			import('$lib/db/schema')
		]);
		const { eq } = await import('drizzle-orm');

		const session = await auth.api.getSession({
			headers: event.request.headers
		});

		event.locals.auth = session ? { session } : null;

		if (!session?.user) return;

		const [profile] = await db
			.select()
			.from(profiles)
			.where(eq(profiles.auth_user_id, session.user.id))
			.limit(1);

		if (profile) {
			event.locals.profile = profile;
			event.locals.user = profile;
			event.locals.role = profile.role;
			event.locals.accountStatus = profile.account_status;
		}
	} catch (err) {
		// En cas d'erreur de base, on garde locals vides et on laisse
		// les guards refuser l'accès. L'erreur est journalisée côté serveur.
		console.error('Erreur de chargement du profil:', err);
	}
}

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.auth = null;
	event.locals.profile = null;
	event.locals.user = null;
	event.locals.role = null;
	event.locals.accountStatus = null;

	if (!dev) {
		await loadRealSession(event);
	}

	const htmlLang =
		event.params.lang === 'en' || event.params.lang === 'br' ? event.params.lang : 'fr';

	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', htmlLang)
	});
};
