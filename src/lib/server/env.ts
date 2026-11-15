import { env as privateEnv } from '$env/dynamic/private';

/**
 * Lecture d'une variable d'environnement serveur.
 *
 * Trois contextes :
 * - Cloudflare (production/preview) : les bindings `platform.env` alimentent
 *   `$env/dynamic/private` à chaque requête ;
 * - développement SvelteKit : `.env` alimente `$env/dynamic/private`
 *   (Vite 8 n'injecte plus les fichiers `.env` dans `process.env`) ;
 * - Node brut (scripts autonomes) : `process.env`, en repli.
 *
 * Seuls les noms sont acceptés en paramètre : aucune valeur ne quitte le
 * serveur par cette voie.
 */
export function serverEnv(key: string): string | undefined {
	const fromPrivate = privateEnv[key];
	if (typeof fromPrivate === 'string' && fromPrivate.length > 0) return fromPrivate;
	const fromProcess = process.env[key];
	return fromProcess && fromProcess.length > 0 ? fromProcess : undefined;
}
