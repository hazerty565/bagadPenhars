import { error } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/member/queries/common';
import { runQuery } from '$lib/server/member/queries/common';
import { getEventForEdit } from '$lib/server/member/queries/events';
import type { AuthLocals } from '$lib/server/member/queries/common';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	requireAuth(locals as unknown as AuthLocals);

	const profileId = locals.profile!.id;
	const eventId = params.id ?? '';
	const db = locals.db!;

	const data = await runQuery(db, profileId, (tx) => getEventForEdit(tx, profileId, eventId));

	if (!data) {
		throw error(404, 'Événement introuvable ou hors périmètre.');
	}

	return { memberPage: { section: 'eventForm', data } };
};
