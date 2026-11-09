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

const handle: RequestHandler = ({ request }) => auth.handler(request);

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const DELETE = handle;
export const PATCH = handle;
