import { dev } from '$app/environment';

/**
 * L’espace membre est rendu côté client uniquement en développement : la
 * démonstration lit `localStorage` et ne doit pas être pré-rendue. En
 * production, le rendu serveur reste actif.
 */
export const ssr = !dev;

/** Aucune page de l’espace membre n’est pré-rendue. */
export const prerender = false;
