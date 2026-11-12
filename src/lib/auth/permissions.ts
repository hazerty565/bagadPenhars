/**
 * Helpers de permissions métier.
 *
 * Toutes les fonctions retournent un booléen. Elles dérivent les droits du
 * rôle applicatif (profiles.role, ENUM app_role) et des affectations de
 * pupitre (profile_pupitres, is_chef), jamais des métadonnées Better Auth ni
 * de valeurs soumises par le client.
 *
 * Hiérarchie : admin > secretaire > chef_pupitre > member.
 */

import type { AppRole } from './roles';
import { hasRoleOrHigher, isAdmin, isSecretaire, isChefPupitre } from './roles';

/**
 * Contexte minimal nécessaire pour évaluer une permission.
 */
export interface PermissionContext {
	role: AppRole | null;
	/** Pupitres dont l'utilisateur est chef (is_chef = true), noms de pupitre. */
	chefPupitres: string[];
	/** Tous les pupitres affectés à l'utilisateur (avec ou without is_chef). */
	assignedPupitres: string[];
}

/**
 * L'utilisateur peut inviter et activer des comptes (secretaire ou admin).
 */
export function canInviteAndActivate(ctx: PermissionContext): boolean {
	return isSecretaire(ctx.role) || isAdmin(ctx.role);
}

/**
 * L'utilisateur peut suspendre un compte (secretaire ou admin).
 */
export function canSuspend(ctx: PermissionContext): boolean {
	return isSecretaire(ctx.role) || isAdmin(ctx.role);
}

/**
 * L'utilisateur peut modifier un rôle applicatif (admin uniquement).
 */
export function canChangeRole(ctx: PermissionContext): boolean {
	return isAdmin(ctx.role);
}

/**
 * L'utilisateur peut gérer tous les événements (interne + public, tous
 * pupitres) : secretaire ou admin.
 */
export function canManageAllEvents(ctx: PermissionContext): boolean {
	return isSecretaire(ctx.role) || isAdmin(ctx.role);
}

/**
 * L'utilisateur peut gérer un événement donné selon son rôle et ses pupitres.
 * - admin / secretaire : tout événement
 * - chef_pupitre : uniquement les événements ciblant un pupitre qu'il dirige
 *   (un seul pupitre, pas d'événement multi-pupitres ni global)
 * - member : jamais
 */
export function canManageEvent(
	ctx: PermissionContext,
	event: {
		visibility: 'public' | 'interne' | 'pupitre';
		pupitreIds: string[]; // pupitres ciblés par l'événement (vide si public/interne non ciblé)
		isMultiPupitreOrGlobal: boolean; // true si plusieurs pupitres ou tous
	}
): boolean {
	if (isAdmin(ctx.role) || isSecretaire(ctx.role)) {
		return true;
	}
	if (isChefPupitre(ctx.role)) {
		// Un chef ne gère que les événements de pupitre qu'il dirige, un seul
		// pupitre, jamais multi-pupitres ni global.
		if (event.isMultiPupitreOrGlobal) return false;
		return event.pupitreIds.some((p) => ctx.chefPupitres.includes(p));
	}
	return false;
}

/**
 * L'utilisateur peut déposer un document pour un pupitre donné.
 * - chef_pupitre : uniquement ses pupitres
 * - secretaire / admin : tous
 * - member : jamais
 */
export function canDepositDocumentForPupitre(ctx: PermissionContext, pupitreId: string): boolean {
	if (isAdmin(ctx.role) || isSecretaire(ctx.role)) return true;
	if (isChefPupitre(ctx.role)) {
		return ctx.chefPupitres.includes(pupitreId);
	}
	return false;
}

/**
 * L'utilisateur peut lire un document actif (tous les membres approuvés).
 */
export function canReadActiveDocument(ctx: PermissionContext): boolean {
	return ctx.role !== null;
}

/**
 * L'utilisateur peut gérer tous les contenus (articles, albums) : secretaire
 * ou admin.
 */
export function canManageAllContents(ctx: PermissionContext): boolean {
	return isSecretaire(ctx.role) || isAdmin(ctx.role);
}

/**
 * L'utilisateur peut notifier plusieurs pupitres : secretaire ou admin.
 */
export function canNotifyMultiplePupitres(ctx: PermissionContext): boolean {
	return isSecretaire(ctx.role) || isAdmin(ctx.role);
}

/**
 * L'utilisateur peut notifier un pupitre donné.
 * - chef_pupitre : uniquement ses pupitres
 * - secretaire / admin : tous
 */
export function canNotifyPupitre(ctx: PermissionContext, pupitreId: string): boolean {
	if (isAdmin(ctx.role) || isSecretaire(ctx.role)) return true;
	if (isChefPupitre(ctx.role)) {
		return ctx.chefPupitres.includes(pupitreId);
	}
	return false;
}

/**
 * L'utilisateur peut modifier son propre profil (hors rôle et pupitres).
 */
export function canEditOwnProfile(
	ctx: PermissionContext,
	targetProfileId: string,
	ownProfileId: string
): boolean {
	if (ctx.role === null) return false;
	return targetProfileId === ownProfileId;
}

/**
 * L'utilisateur peut voir le trombinoscope (membres actifs connectés).
 */
export function canViewTrombinoscope(ctx: PermissionContext): boolean {
	return ctx.role !== null;
}

/**
 * Retourne les pupitres sur lesquels un chef peut agir (intersection avec ses
 * pupitres de chef).
 */
export function chefPupitreScope(ctx: PermissionContext): string[] {
	return ctx.chefPupitres;
}

/**
 * Regroupe les helpers de rôle pour commodité.
 */
export const role = {
	hasRoleOrHigher,
	isAdmin,
	isSecretaire,
	isChefPupitre
};
