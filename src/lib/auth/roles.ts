/**
 * Rôles et permissions métier.
 * Le rôle est TOUJOURS lu en base (profiles.role), jamais depuis le client.
 */

export const ROLES = ['member', 'chef_pupitre', 'secretaire', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export const ACCOUNT_STATUSES = ['pending', 'active', 'suspended'] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

/** Hiérarchie de lecture : un rôle "supérieur" inclut les niveaux en dessous. */
const RANK: Record<Role, number> = {
	member: 1,
	chef_pupitre: 2,
	secretaire: 3,
	admin: 4
};

export function atLeast(role: Role, min: Role): boolean {
	return RANK[role] >= RANK[min];
}

/** Un compte doit être actif pour tout accès métier (hors pages auth/pending). */
export function isActive(status: AccountStatus | null | undefined): boolean {
	return status === 'active';
}
