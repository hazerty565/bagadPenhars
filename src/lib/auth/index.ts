/**
 * Point d'entrée unique pour l'authentification et l'autorisation métier.
 *
 * Réexport les guards, les helpers de rôle/pupitre et les helpers de
 * permission. Le filtrage du menu est une aide d'interface uniquement et ne
 * remplace jamais un guard.
 */

export type { AppRole, AccountStatus } from './roles';
export {
	ALL_ROLES,
	ALL_STATUSES,
	ROLE_HIERARCHY,
	hasRoleOrHigher,
	isAdmin,
	isSecretaire,
	isChefPupitre,
	isMember,
	isActive,
	isPending,
	isSuspended,
	canAccessDashboard,
	canInviteAndActivate,
	canManageAllEvents,
	canManageAllContents,
	canManageAllDocuments,
	canNotifyMultiplePupitres,
	PUPITRES,
	type PupitreName,
	isChefOfPupitre,
	chefPupitresOf
} from './roles';

export type { Profile, CallerContext } from './guards';
export {
	GuardError,
	anonymousError,
	pendingError,
	suspendedError,
	insufficientRoleError,
	notOwnProfileError,
	notChefOfPupitreError,
	requireAuth,
	requireRole,
	requirePupitreChef,
	requireOwnProfile
} from './guards';

export type { PermissionContext } from './permissions';
export {
	canSuspend,
	canChangeRole,
	canManageEvent,
	canDepositDocumentForPupitre,
	canReadActiveDocument,
	canNotifyPupitre,
	canEditOwnProfile,
	canViewTrombinoscope,
	chefPupitreScope,
	role
} from './permissions';
