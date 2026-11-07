import { auth } from '$lib/server/auth';
import type { RequestHandler } from './$types';

/**
 * Endpoint Better Auth centralisé.
 *
 * Toutes les routes d'authentification (connexion, déconnexion, inscription,
 * réinitialisation de mot de passe, vérification d'email) passent par ce
 * handler. Better Auth gère les sessions, les comptes et les jetons.
 *
 * Ce point d'entrée est réservé au serveur.
 */

export const GET: RequestHandler = async ({ event, url }) => {
	return auth.api.handleGet({
		path: url.pathname,
		headers: event.request.headers as Headers
	});
};

export const POST: RequestHandler = async ({ event, url }) => {
	return auth.api.handlePost({
		path: url.pathname,
		headers: event.request.headers as Headers,
		body: event.request.body
	});
};

export const PUT: RequestHandler = async ({ event, url }) => {
	return auth.api.handlePut({
		path: url.pathname,
		headers: event.request.headers as Headers,
		body: event.request.body
	});
};

export const DELETE: RequestHandler = async ({ event, url }) => {
	return auth.api.handleDelete({
		path: url.pathname,
		headers: event.request.headers as Headers,
		body: event.request.body
	});
};
