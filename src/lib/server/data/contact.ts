/**
 * Clé publique Turnstile pour le formulaire de contact.
 *
 * Seule la clé publique transite vers le navigateur ; la clé secrète est lue
 * exclusivement dans `$lib/server/turnstile.ts`.
 */

export function turnstileSiteKey(): string | null {
	const key = process.env.TURNSTILE_SITE_KEY;
	return key && key.trim().length > 0 ? key : null;
}

/** Adresse de réception des messages du formulaire de contact. */
export function contactInbox(): string | null {
	const address = process.env.CONTACT_EMAIL;
	return address && address.trim().length > 0 ? address : null;
}
