import { error, redirect } from '@sveltejs/kit';
import { withUserContext } from '$lib/db';
import { getMemberShell } from '$lib/server/member/queries/shell';
import type { LayoutServerLoad } from './$types';

/**
 * Chargement de l'espace adhérents — socle uniquement (étape 64).
 *
 * Le layout ne charge que le socle (profil de session + compteur de
 * notifications non lues). Chaque page charge ses propres données via son
 * propre `+page.server.ts` et sa fonction de lecture ciblée.
 *
 * Le profil vient de la session Better Auth vérifiée dans `hooks.server.ts`.
 * Le statut métier est lu dans `profiles.account_status` : un compte en
 * attente ou suspendu n'accède à aucune donnée. La lecture est faite sous RLS,
 * dans une transaction portant l'identité du profil.
 *
 * Les garde-fous (session, statut, rôle, db) sont appliqués ici côté serveur,
 * conformément à `requireAuth`.
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
	const profileRole = locals.profile.role;
	if (!profileRole) {
		throw error(403, 'Aucun rôle applicatif affecté.');
	}

	const memberShell = await withUserContext(locals.db, profileId, (tx) =>
		getMemberShell(tx, profileId)
	);

	return { memberShell };
};
