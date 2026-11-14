import type { RequestHandler } from './$types';

/**
 * Endpoint Better Auth centralisé.
 *
 * Toutes les routes d'authentification (connexion, déconnexion, inscription,
 * réinitialisation de mot de passe, vérification d'email) passent par ce
 * handler. Better Auth gère les sessions, les comptes et les jetons.
 *
 * L'instance est créée par le hook serveur avec la connexion PostgreSQL de la
 * requête (Hyperdrive en production, `DATABASE_URL_APP` en local).
 */

const handle: RequestHandler = async ({ request, locals }) => {
	if (!locals.auth) {
		return new Response("Service d'authentification indisponible.", { status: 503 });
	}
	return locals.auth.handler(request);
};

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const DELETE = handle;
export const PATCH = handle;
