/**
 * Utilitaires côté serveur et client partagés.
 */

/**
 * Génère un jeton aléatoire sécurisé (hex).
 */
export function generateToken(length: number = 32): string {
	const array = new Uint8Array(length);
	crypto.getRandomValues(array);
	return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Empreinte SHA-256 d'une chaîne (pour les jetons d'invitation).
 */
export async function sha256Hex(input: string): Promise<string> {
	const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
	return Array.from(new Uint8Array(hash))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

/**
 * Formate une date pour l'affichage (YYYY-MM-DD).
 */
export function formatDate(date: Date | string): string {
	const d = new Date(date);
	return d.toISOString().slice(0, 10);
}

/**
 * Vérifie si une adresse email est valide (utilisez Zod en priorité).
 */
export function isValidEmail(email: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
