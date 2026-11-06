import type { LayoutServerLoad } from './$types';
import { requireAdmin } from '$lib/auth/guards';

export const load: LayoutServerLoad = async ({ locals }) => {
	requireAdmin(locals); // Guard requireAdmin : section admin uniquement
	return { user: locals.user, role: locals.role };
};
