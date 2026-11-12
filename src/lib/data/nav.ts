import type { RouteId } from '$app/types';

export type PublicNavKey =
	| 'home'
	| 'bagad'
	| 'formation'
	| 'agenda'
	| 'articles'
	| 'media'
	| 'partenaires'
	| 'contact';

export interface PublicNavItem {
	key: PublicNavKey;
	route: RouteId;
}

/**
 * Navigation publique du site.
 *
 * `route` contient l'identifiant de route SvelteKit (groupe `(public)` inclus)
 * afin de pouvoir utiliser `resolve()` de `$app/paths` pour construire les
 * liens. Le paramètre `lang` est commun à toutes ces routes.
 */
export const PUBLIC_NAV = [
	{ key: 'home', route: '/(public)/[lang=lang]' },
	{ key: 'bagad', route: '/(public)/[lang=lang]/bagad' },
	{ key: 'formation', route: '/(public)/[lang=lang]/formation' },
	{ key: 'agenda', route: '/(public)/[lang=lang]/agenda' },
	{ key: 'articles', route: '/(public)/[lang=lang]/articles' },
	{ key: 'media', route: '/(public)/[lang=lang]/media' },
	{ key: 'partenaires', route: '/(public)/[lang=lang]/partenaires' },
	{ key: 'contact', route: '/(public)/[lang=lang]/contact' }
] as const satisfies readonly PublicNavItem[];
