import type { AppRole, AccountStatus } from './roles';
import { hasRoleOrHigher, isChefOfPupitre } from './roles';

/**
 * Guards centralisés d'autorisation.
 *
 * À appliquer dans les layouts, actions et endpoints. Le filtrage du menu est
 * une aide d'interface uniquement et ne remplace jamais un guard.
 *
 * Toute donnée sensible provient de Neon (profiles.role, profiles.account_status),
 * jamais du client ni des métadonnées Better Auth.
 */

// ---------------------------------------------------------------------------
// Types de contexte d'appelant
// ---------------------------------------------------------------------------

export interface Profile {
	id: string;
	auth_user_id: string;
	email: string;
	first_name: string;
	last_name: string;
	role: AppRole | null;
	account_status: AccountStatus | null;
}

export interface CallerContext {
	profile: Profile | null;
	role: AppRole | null;
	accountStatus: AccountStatus | null;
}

// ---------------------------------------------------------------------------
// Erreurs de guard
// ---------------------------------------------------------------------------

export class GuardError extends Error {
	public readonly code: string;
	public readonly status: number;

	constructor(code: string, message: string, status = 403) {
		super(message);
		this.code = code;
		this.status = status;
	}
}

export function anonymousError(): GuardError {
	return new GuardError('unauthenticated', 'Authentification requise.', 401);
}

export function pendingError(): GuardError {
	return new GuardError(
		'account_pending',
		"Votre compte est en attente d'activation par un administrateur.",
		403
	);
}

export function suspendedError(): GuardError {
	return new GuardError('account_suspended', 'Votre compte a été suspendu.', 403);
}

export function insufficientRoleError(required: AppRole): GuardError {
	return new GuardError('insufficient_role', `Le rôle ${required} ou supérieur est requis.`, 403);
}

export function notOwnProfileError(): GuardError {
	return new GuardError(
		'forbidden_own_profile',
		'Vous ne pouvez modifier que votre propre profil.',
		403
	);
}

export function notChefOfPupitreError(): GuardError {
	return new GuardError('not_chef_of_pupitre', "Vous n'êtes pas chef de ce pupitre.", 403);
}

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

/**
 * Exige une session authentifiée et un compte actif.
 */
export function requireAuth(ctx: CallerContext): void {
	if (!ctx.profile) {
		throw anonymousError();
	}
	if (ctx.accountStatus === 'pending') {
		throw pendingError();
	}
	if (ctx.accountStatus === 'suspended') {
		throw suspendedError();
	}
	if (!ctx.role) {
		throw new GuardError('no_role', 'Aucun rôle applicatif affecté.', 403);
	}
}

/**
 * Exige une authentification, un compte actif et un rôle supérieur ou égal.
 */
export function requireRole(ctx: CallerContext, required: AppRole): void {
	requireAuth(ctx);
	if (!hasRoleOrHigher(ctx.role, required)) {
		throw insufficientRoleError(required);
	}
}

/**
 * Exige une authentification, un compte actif, et que l'utilisateur soit chef
 * du pupitre indiqué. userPupitres provient de profile_pupitres (is_chef = true).
 */
export function requirePupitreChef(
	ctx: CallerContext,
	userPupitres: { pupitre: string; is_chef: boolean }[] | null | undefined,
	pupitreName: string
): void {
	requireAuth(ctx);
	if (!isChefOfPupitre(userPupitres, pupitreName)) {
		throw notChefOfPupitreError();
	}
}

/**
 * Exige que le profil visé soit le profil de l'utilisateur connecté.
 */
export function requireOwnProfile(ctx: CallerContext, targetProfileId: string): void {
	requireAuth(ctx);
	if (ctx.profile!.id !== targetProfileId) {
		throw notOwnProfileError();
	}
}

// ---------------------------------------------------------------------------
// Helpers de rôle (reexportés depuis roles.ts)
// ---------------------------------------------------------------------------

export { hasRoleOrHigher, isAdmin, isSecretaire, isChefPupitre, isMember } from './roles';
