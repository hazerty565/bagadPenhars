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

		// Ici vous pouvez persister le choix (choice) pour l'utilisateur (locals.user)
		// vers la BDD ou Supabase. On renvoie seulement un succès minimal pour l'instant.

		return { success: true, eventId, choice };
	}
};
