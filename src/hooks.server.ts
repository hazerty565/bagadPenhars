/**
 * hooks.server.ts — exécuté à CHAQUE requête.
 * Better Auth lit la session depuis les cookies ; le rôle est lu en BDD
 * (profiles.role + account_status), jamais depuis le client.
 */
import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { auth } from '$lib/server/auth';

/** Charge session + profil (rôle, statut) dans locals. */
const session: Handle = async ({ event, resolve }) => {
	// Session Better Auth (null si visiteur anonyme)
	const session = await auth.api.getSession({ headers: event.request.headers });

	event.locals.user = session?.user ?? null;
	event.locals.session = session?.session ?? null;

	// TODO (couche DB Drizzle/Neon) : charger le profil métier en base :
	// const profile = await getProfile(session.user.id); // public.profiles
	// Rôle et statut TOUJOURS lus en BDD, jamais depuis user_metadata.
	event.locals.role = null; // profile?.role ?? null
	event.locals.accountStatus = null; // profile?.account_status ?? null

	return resolve(event);
};

export const handle = sequence(session);
