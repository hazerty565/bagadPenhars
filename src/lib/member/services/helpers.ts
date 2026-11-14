/**
 * Petits utilitaires partagés par les services de l'espace adhérents.
 *
 * Les identifiants, horodatages et dates viennent désormais du serveur : ces
 * fonctions ne servent plus qu'à la validation de premier niveau côté client
 * (le serveur revalide tout sous RLS).
 */

export function isNonEmpty(value: string, minimum = 1): boolean {
	return value.trim().length >= minimum;
}

export function slugify(value: string): string {
	return value
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 80);
}
