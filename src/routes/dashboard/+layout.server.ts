import { error, redirect } from '@sveltejs/kit';
import { withUserContext } from '$lib/db';
import { buildMemberSnapshot } from '$lib/server/member/snapshot';
import type { LayoutServerLoad } from './$types';

/**
 * Chargement de l'espace adhérents.
 *
 * Le profil vient de la session Better Auth vérifiée dans `hooks.server.ts`.
 * Le statut métier est lu dans `profiles.account_status` : un compte en
 * attente ou suspendu n'accède à aucune donnée. L'instantané est construit
 * sous RLS, dans une transaction portant l'identité du profil.
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
		throw redirect(303, '/auth/login?error=suspended');
	}
	if (!locals.db) {
		throw error(503, 'Base de données indisponible.');
	}

	const profileId = locals.profile.id;
	const snapshot = await withUserContext(locals.db, profileId, (tx) =>
		buildMemberSnapshot(tx, profileId)
	);

	return { snapshot };
};
