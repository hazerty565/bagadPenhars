/**
 * Guards serveur — à appeler au début de chaque load() et form action sensible.
 * Better Auth gère la session ; ces guards gèrent les droits métier (rôles).
 */
import { redirect, error } from '@sveltejs/kit';
import { isActive, type Role } from './roles';

/** 401 → redirection login si non authentifié. */
export function requireAuth(locals: App.Locals): void {
	if (!locals.user) {
		redirect(302, '/auth/login');
	}
}

/** Authentifié + compte actif requis (pending/suspended → page dédiée). */
export function requireActive(locals: App.Locals): void {
	requireAuth(locals);
	if (!isActive(locals.accountStatus)) {
		redirect(302, '/auth/pending');
	}
}

/** 403 si le rôle ne suffit pas. Ex. requireRole(locals, ['admin']) */
export function requireRole(locals: App.Locals, roles: Role[]): void {
	requireActive(locals);
	if (!locals.role || !roles.includes(locals.role)) {
		error(403, 'Accès refusé');
	}
}

/** Raccourcis par section, cf. Context.MD. */
export const requireChef = (locals: App.Locals) =>
	requireRole(locals, ['chef_pupitre', 'secretaire', 'admin']);
export const requireAdmin = (locals: App.Locals) => requireRole(locals, ['admin']);
