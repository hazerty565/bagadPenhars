import type { LayoutServerLoad } from './$types';
import { requireChef } from '$lib/auth/guards';

export const load: LayoutServerLoad = async ({ locals }) => {
	requireChef(locals); // Guard requireChef : gestion pupitre
	return { user: locals.user, role: locals.role };
};
