import { requireAuth } from '$lib/server/member/queries/common';
import { runQuery } from '$lib/server/member/queries/common';
import { getOverviewPage } from '$lib/server/member/queries/overview';
import type { AuthLocals } from '$lib/server/member/queries/common';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	requireAuth(locals as unknown as AuthLocals);

	const profileId = locals.profile!.id;
	const db = locals.db!;

	const data = await runQuery(db, profileId, (tx) => getOverviewPage(tx, profileId));

	return { memberPage: { section: 'overview', data } };
};
