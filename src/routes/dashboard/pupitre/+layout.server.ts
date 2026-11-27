import { requireAuth } from '$lib/server/member/queries/common';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	requireAuth(locals);
	return { user: locals.user };
};
