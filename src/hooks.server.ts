import type { Handle } from '@sveltejs/kit';
import { eq, sql } from 'drizzle-orm';
import { connectDatabase, resolveDatabaseUrl, withUserContext } from '$lib/db';
import { createAuth } from '$lib/server/auth';
import { profiles } from '$lib/db/schema';

/**
 * Hook serveur SvelteKit.
 *
 * Pour chaque requête :
 * 1. ouvre une connexion PostgreSQL avec le rôle applicatif `bagad_app`
 *    (Hyperdrive sur Cloudflare, `DATABASE_URL_APP` en local) ;
 * 2. crée l'instance Better Auth liée à cette connexion ;
 * 3. vérifie la session Better Auth ;
 * 4. résout `profiles.id` puis charge la ligne de profil dans une transaction
 *    dont le contexte RLS est établi par `set_config('app.profile_id', ..., true)`.
 *
 * Le contexte est local à la transaction : aucune identité ne subsiste sur la
 * connexion rendue au pool Hyperdrive. Les rôles et statuts métier viennent
 * toujours de `profiles`, jamais des métadonnées Better Auth.
 *
 * La connexion est fermée après `resolve()` : un Worker Cloudflare ne doit pas
 * partager d'objet d'E/S entre requêtes.
 */

async function resolveProfile(db: NonNullable<App.Locals['db']>, authUserId: string) {
	const lookup = await db.execute(
		sql`select app.profile_id_for_auth_user(${authUserId}) as profile_id`
	);
	const profileId = (lookup.rows?.[0] as { profile_id: string | null } | undefined)?.profile_id;
	if (!profileId) return null;

	const rows = await withUserContext(db, profileId, (tx) =>
		tx
			.select({
				id: profiles.id,
				auth_user_id: profiles.auth_user_id,
				email: profiles.email,
				first_name: profiles.first_name,
				last_name: profiles.last_name,
				role: profiles.role,
				account_status: profiles.account_status
			})
			.from(profiles)
			.where(eq(profiles.id, profileId))
			.limit(1)
	);

	return rows[0] ?? null;
}

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.db = null;
	event.locals.auth = null;
	event.locals.session = null;
	event.locals.profile = null;
	event.locals.user = null;
	event.locals.role = null;
	event.locals.accountStatus = null;

	let client: Awaited<ReturnType<typeof connectDatabase>>['client'] | null = null;

	const connectionString = resolveDatabaseUrl(event.platform);
	if (connectionString) {
		try {
			const connection = await connectDatabase(connectionString);
			client = connection.client;
			event.locals.db = connection.db;
			event.locals.auth = createAuth(connection.db, event.platform?.env);

			const session = await event.locals.auth.api.getSession({
				headers: event.request.headers
			});

			if (session?.user) {
				event.locals.session = session;
				event.locals.profile = await resolveProfile(connection.db, session.user.id);
				if (event.locals.profile) {
					event.locals.user = event.locals.profile;
					event.locals.role = event.locals.profile.role;
					event.locals.accountStatus = event.locals.profile.account_status;
				}
			}
		} catch (error) {
			// Une erreur de base ne doit pas casser les pages publiques : les
			// guards de l'espace adhérents refuseront l'accès faute de profil.
			console.error('Erreur de chargement de la session ou du profil :', error);
		}
	}

	const htmlLang =
		event.params.lang === 'en' || event.params.lang === 'br' ? event.params.lang : 'fr';

	try {
		return await resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%lang%', htmlLang)
		});
	} finally {
		if (client) await client.end().catch(() => undefined);
	}
};
