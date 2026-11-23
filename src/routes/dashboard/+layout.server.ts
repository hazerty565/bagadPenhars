import { error, redirect } from '@sveltejs/kit';
import { withUserContext } from '$lib/db';
import { buildMemberSnapshot, type SnapshotSection } from '$lib/server/member/snapshot';
import type { AppRole } from '$lib/auth/roles';
import type { LayoutServerLoad } from './$types';

/**
 * Chargement de l'espace adhérents.
 *
 * Le profil vient de la session Better Auth vérifiée dans `hooks.server.ts`.
 * Le statut métier est lu dans `profiles.account_status` : un compte en
 * attente ou suspendu n'accède à aucune donnée. L'instantané est construit
 * sous RLS, dans une transaction portant l'identité du profil.
 *
 * Les sections de données sont chargées sélectivement selon la route courante
 * pour réduire le temps de réponse serveur (TTFB) sur les pages privées.
 */
export const load: LayoutServerLoad = async ({ locals, url }) => {
	const redirectTo = encodeURIComponent(url.pathname + url.search);

	if (!locals.session || !locals.profile) {
		throw redirect(303, `/auth/login?redirectTo=${redirectTo}`);
	}

	const status = locals.profile.account_status;
	if (status === 'pending') {
		throw redirect(303, '/auth/pending');
	}
	if (status === 'suspended') {
		throw redirect(303, `/auth/login?error=suspended`);
	}
	if (!locals.db) {
		throw error(503, 'Base de données indisponible.');
	}

	const profileId = locals.profile.id;

	// Déterminer les sections de données nécessaires selon la route
	const sections = snapshotSectionsForRoute(url.pathname, locals.profile.role);

	const snapshot = await withUserContext(locals.db, profileId, (tx) =>
		buildMemberSnapshot(tx, profileId, sections)
	);

	return { snapshot };
};

/**
 * Retourne la liste des sections de données à charger pour une route donnée.
 * Le rôle détermine si l'admin a accès à toutes les sections.
 */
function snapshotSectionsForRoute(pathname: string, role: AppRole): SnapshotSection[] | undefined {
	const isAdmin = role === 'admin';

	// Les routes admin chargent tout (besoin de toutes les données)
	if (pathname.startsWith('/dashboard/admin')) {
		return undefined; // undefined = toutes les sections
	}

	const sections: SnapshotSection[] = [];

	if (pathname === '/dashboard' || pathname.startsWith('/dashboard/overview')) {
		sections.push('profiles', 'events', 'notifications');
	} else if (pathname.startsWith('/dashboard/agenda')) {
		sections.push('events', 'responses');
	} else if (pathname.startsWith('/dashboard/membres')) {
		sections.push('profiles');
	} else if (pathname.startsWith('/dashboard/documents')) {
		sections.push('documents');
	} else if (pathname.startsWith('/dashboard/notifications')) {
		sections.push('notifications');
	} else if (pathname.startsWith('/dashboard/profil')) {
		sections.push('preferences', 'settings');
	} else if (pathname.startsWith('/dashboard/securite')) {
		sections.push('settings');
	} else if (pathname.startsWith('/dashboard/pupitre')) {
		sections.push('profiles', 'events');
	} else {
		// Route inconnue du dashboard : charger tout par sécurité
		return undefined;
	}

	return sections;
}