/**
 * Clé publique Turnstile pour le formulaire de contact.
 * Chargeée côté serveur pour ne jamais exposer la clé secrète au navigateur.
 */

let siteKey: string | null = null;

export async function turnstileSiteKey(): Promise<string> {
	if (!siteKey) {
		// La clé publique est configurée dans les variables d'environnement
		const key = process.env.TURNSTILE_SITE_KEY;
		if (!key) {
			throw new Error('TURNSTILE_SITE_KEY n\'est pas configuré.');
		}
		siteKey = key;
	}
	return siteKey;
}