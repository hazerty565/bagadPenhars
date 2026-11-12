import type { RequestHandler } from './$types';

/**
 * Endpoint Better Auth centralisé.
 *
 * Toutes les routes d'authentification (connexion, déconnexion, inscription,
 * réinitialisation de mot de passe, vérification d'email) passent par ce
 * handler. Better Auth gère les sessions, les comptes et les jetons.
 *
 * Ce point d'entrée est réservé au serveur. Le module Better Auth est importé
 * à la demande pour que le mode démonstration local fonctionne sans Neon ni
 * secret d'authentification.
 */

const handle: RequestHandler = async ({ request }) => {
	const { auth } = await import('$lib/server/auth');
	return auth.handler(request);
};

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const DELETE = handle;
export const PATCH = handle;
