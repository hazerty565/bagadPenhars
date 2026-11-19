import { serveFile } from '$lib/server/files';
import type { RequestHandler } from './$types';

/**
 * `GET /api/files/[...key]` — diffusion des objets R2.
 *
 * Premier segment = bucket logique (`public` ou `private`), reste = clé R2.
 * Toute la garde et la construction de la réponse vivent dans
 * `src/lib/server/files.ts` : ce fichier de route ne fait que déléguer, pour
 * que la règle reste dans la couche serveur et y soit testable.
 *
 * - `public/...`  : public, aucun guard, cache public ;
 * - `private/...` : session + compte actif + contrôle de visibilité.
 *
 * Aucun objet privé n'a d'URL publique permanente et aucune URL signée n'est
 * produite (Q-2026-11-08-04).
 */
export const GET: RequestHandler = ({ locals, platform, params }) =>
	serveFile(locals, platform, params.key);
