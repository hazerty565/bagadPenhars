import { requireAuth } from '$lib/server/member/queries/common';
import { runQuery } from '$lib/server/member/queries/common';
import { listAgendaEvents } from '$lib/server/member/queries/agenda';
import type { AuthLocals } from '$lib/server/member/queries/common';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	requireAuth(locals as unknown as AuthLocals);

	const profileId = locals.profile!.id;
	const db = locals.db!;

	const data = await runQuery(db, profileId, (tx) => listAgendaEvents(tx, profileId));

	return { memberPage: { section: 'agenda', data } };
};
