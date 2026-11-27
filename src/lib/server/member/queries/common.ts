import { error, redirect } from '@sveltejs/kit';
import type { DB, Transaction } from '$lib/db';
import { withUserContext } from '$lib/db';
import type { AppRole, AccountStatus } from '$lib/auth/roles';
import { hasRoleOrHigher } from '$lib/auth/roles';

/**
 * Contexte minimal des locals requis par les guards de lecture.
 */
export interface AuthLocals {
	session: { user?: { id: string } } | null;
	profile: {
		id: string;
		role: AppRole | null;
		account_status: AccountStatus | null;
	} | null;
	db: DB | null;
}

/**
 * Données de socle coque — à enrichir aux étapes suivantes.
 */
export interface ShellData {
	// Coque vide : remplie par getMemberShell (étape 58, shell.ts).
}

/**
 * Données de page coque — à enrichir aux étapes suivantes.
 */
export interface PageData {
	// Coque vide : remplie par chaque fonction de lecture de page (étapes 59 à 63).
}

/**
 * Vérifie l'authentification et l'état du compte à partir des locals.
 *
 * - db absente → error 503
 * - session ou profil absent → redirect /auth/login
 * - account_status = 'pending' → redirect /auth/pending
 * - account_status = 'suspended' → redirect /auth/login?error=suspended
 * - rôle nul → error 403 (no_role)
 */
export function requireAuth(locals: AuthLocals): void {
	if (!locals.db) {
		throw error(503, 'Base de données indisponible.');
	}
	if (!locals.session || !locals.session.user) {
		throw redirect(303, '/auth/login');
	}
	if (!locals.profile) {
		throw redirect(303, '/auth/login');
	}
	if (!locals.profile.account_status) {
		throw redirect(303, '/auth/login');
	}
	if (locals.profile.account_status === 'pending') {
		throw redirect(303, '/auth/pending');
	}
	if (locals.profile.account_status === 'suspended') {
		throw redirect(303, '/auth/login?error=suspended');
	}
	if (!locals.profile.role) {
		throw error(403, 'Aucun rôle applicatif affecté.');
	}
}

/**
 * Vérifie que le rôle du profil courant est supérieur ou égal au rôle requis.
 * Le rôle est lu depuis locals.profile.role (provenant de profiles.role, jamais du client).
 */
export function requireRole(locals: Pick<AuthLocals, 'profile'>, required: AppRole): void {
	if (!locals.profile) {
		throw error(401, 'Authentification requise.');
	}
	if (!locals.profile.role || !hasRoleOrHigher(locals.profile.role, required)) {
		throw error(403, `Le rôle ${required} ou supérieur est requis.`);
	}
}

/**
 * Exécute une fonction de lecture dans une transaction portant le contexte RLS
 * du profil (`set_config('app.profile_id', ...)`). La fonction reçoit la
 * transaction et le profileId ; elle doit relire le rôle et le statut dans la
 * transaction avant de répondre (défense en profondeur).
 */
export async function runQuery<T>(
	db: DB,
	profileId: string,
	fn: (tx: Transaction, profileId: string) => Promise<T>
): Promise<T> {
	return withUserContext(db, profileId, (tx) => fn(tx, profileId));
}
