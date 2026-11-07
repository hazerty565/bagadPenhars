/**
 * Helpers de rôle et de pupitre.
 *
 * Les rôles et statuts métier sont lus dans profiles.role et
 * profiles.account_status (ENUM PostgreSQL app_role / account_status),
 * jamais dans les métadonnées Better Auth ou le navigateur.
 */

export type AppRole = 'member' | 'chef_pupitre' | 'secretaire' | 'admin';
export type AccountStatus = 'pending' | 'active' | 'suspended';

export const ALL_ROLES: AppRole[] = [
	'member',
	'chef_pupitre',
	'secretaire',
	'admin'
];

export const ALL_STATUSES: AccountStatus[] = ['pending', 'active', 'suspended'];

/**
 * Hiérarchie de rôles : un rôle supérieur inclut les droits des rôles
 * inférieurs. admin > secretaire > chef_pupitre > member.
 */
export const ROLE_HIERARCHY: Record<AppRole, number> = {
	member: 1,
	chef_pupitre: 2,
	secretaire: 3,
	admin: 4
};

export function hasRoleOrHigher(
	userRole: AppRole | null | undefined,
	requiredRole: AppRole
): boolean {
	if (!userRole) return false;
	return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function isAdmin(role: AppRole | null | undefined): boolean {
	return role === 'admin';
}

export function isSecretaire(role: AppRole | null | undefined): boolean {
	return role === 'secretaire' || role === 'admin';
}

export function isChefPupitre(role: AppRole | null | undefined): boolean {
	return role === 'chef_pupitre' || role === 'secretaire' || role === 'admin';
}

export function isMember(role: AppRole | null | undefined): boolean {
	return role === 'member';
}

export function isActive(status: AccountStatus | null | undefined): boolean {
	return status === 'active';
}

export function isPending(status: AccountStatus | null | undefined): boolean {
	return status === 'pending';
}

export function isSuspended(status: AccountStatus | null | undefined): boolean {
	return status === 'suspended';
}

export function canAccessDashboard(
	role: AppRole | null | undefined,
	status: AccountStatus | null | undefined
): boolean {
	return isActive(status) && !!role;
}

export function canInviteAndActivate(role: AppRole | null | undefined): boolean {
	return role === 'secretaire' || role === 'admin';
}

export function canManageAllEvents(role: AppRole | null | undefined): boolean {
	return role === 'secretaire' || role === 'admin';
}

export function canManageAllContents(role: AppRole | null | undefined): boolean {
	return role === 'secretaire' || role === 'admin';
}

export function canManageAllDocuments(role: AppRole | null | undefined): boolean {
	return role === 'secretaire' || role === 'admin';
}

export function canNotifyMultiplePupitres(role: AppRole | null | undefined): boolean {
	return role === 'secretaire' || role === 'admin';
}

/**
 * Pupitres de l'association.
 */
export const PUPITRES = [
	'bombarde',
	'caisse_claire',
	'cornemuse',
	'percussion'
] as const;

export type PupitreName = (typeof PUPITRES)[number];

/**
 * Vérifie si un utilisateur est chef d'un pupitre donné.
 * Les pupitres de l'utilisateur proviennent de la table profile_pupitres
 * avec is_chef = true, jamais d'une valeur soumise par le client.
 */
export function isChefOfPupitre(
	userPupitres: { pupitre: string; is_chef: boolean }[] | null | undefined,
	pupitreName: string
): boolean {
	if (!userPupitres) return false;
	return userPupitres.some(
		(p) => p.pupitre === pupitreName && p.is_chef
	);
}

/**
 * Retourne les noms des pupitres dont l'utilisateur est chef.
 */
export function chefPupitresOf(
	userPupitres: { pupitre: string; is_chef: boolean }[] | null | undefined
): string[] {
	if (!userPupitres) return [];
	return userPupitres.filter((p) => p.is_chef).map((p) => p.pupitre);
}
