import type { LayoutServerLoad } from './$types';
import { requireActive } from '$lib/auth/guards';

export const load: LayoutServerLoad = async ({ locals }) => {
	requireActive(locals); // Guard requireAuth : dashboard réservé aux membres actifs
	return { user: locals.user, role: locals.role };
};
