import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Renvoie l'utilisateur (injecté par hooks) pour afficher les radios RSVP côté client
	// et un exemple d'événement (remplacer par la vraie source de données si besoin)
	const events = [
		{ id: '2026-06-01', title: "Sortie du 01 juin 2026", date: '2026-06-01' }
	];

	return { events, user: locals.user };
};

export const actions: Actions = {
	rsvp: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'Utilisateur non authentifié' });
		}

		const form = await request.formData();
		const eventId = form.get('eventId');
		const choice = form.get('rsvp');

		// Le choix de présence sera associé au profil de session côté serveur.

		return { success: true, eventId, choice };
	}
};
