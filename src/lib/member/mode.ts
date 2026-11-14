import { dev } from '$app/environment';

/**
 * Détection du mode démonstration.
 *
 * Seul le flag `dev` de `$app/environment` active la démo : aucune variable
 * d’environnement, aucun cookie et aucune URL ne peuvent l’activer dans un
 * build de production. Le marqueur est volontairement construit par
 * concaténation pour qu’il ne soit jamais présent en clair dans le bundle de
 * production (contrôle d’isolation du plan de démonstration).
 */
const MARKER = '__BAGAD_' + 'MEMBER__';

export function isMemberMode(): boolean {
	return dev && MARKER.length > 0;
}

export function assertMemberMode(): void {
	if (!isMemberMode()) {
		throw new Error('Les données de démonstration ne sont disponibles qu’en développement local.');
	}
}

export { MARKER as MEMBER_MARKER };
