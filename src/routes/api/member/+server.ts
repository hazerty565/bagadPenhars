import { json } from '@sveltejs/kit';
import { withUserContext } from '$lib/db';
import { buildMemberSnapshot } from '$lib/server/member/snapshot';
import type { RequestHandler } from './$types';

/**
 * Instantané de l'espace adhérents.
 *
 * La réponse est construite dans une transaction dont le contexte RLS est
 * celui du profil vérifié : PostgreSQL décide de ce qui est lisible. Aucun
 * identifiant de profil n'est accepté depuis le client.
 */
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.session || !locals.profile) {
		return json({ message: 'Session requise.' }, { status: 401 });
	}
	if (locals.profile.account_status !== 'active') {
		return json({ message: 'Compte inactif.' }, { status: 403 });
	}
	if (!locals.db) {
		return json({ message: 'Base de données indisponible.' }, { status: 503 });
	}

	const profileId = locals.profile.id;
	try {
		const snapshot = await withUserContext(locals.db, profileId, (tx) =>
			buildMemberSnapshot(tx, profileId)
		);
		return json({ snapshot });
	} catch (error) {
		console.error('Lecture de l’espace adhérents impossible :', error);
		return json({ message: 'Impossible de charger l’espace adhérents.' }, { status: 500 });
	}
};
