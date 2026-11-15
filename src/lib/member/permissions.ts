import type { AppRole } from '$lib/auth/roles';
import { isAdmin, isSecretaire } from '$lib/auth/roles';
import type { MemberEvent, MemberProfile, MemberPupitreId, MemberResponseStatus } from './types';
import { isLocked } from './clock';

/**
 * Permissions de la démonstration.
 *
 * Source de vérité unique, utilisée à la fois par l’interface (afficher ou
 * désactiver une action) et par les services (refuser la mutation). Masquer un
 * bouton n’est jamais considéré comme une protection.
 *
 * Les fonctions sont pures et ne lisent aucun état global.
 */

export class MemberPermissionError extends Error {
	readonly code = 'permission_denied';

	constructor(message = 'Action non autorisée avec le profil actif.') {
		super(message);
		this.name = 'MemberPermissionError';
	}
}

export interface MemberActor {
	id: string;
	role: AppRole;
	pupitres: { pupitreId: MemberPupitreId; isChef: boolean }[];
}

export function actorOf(profile: MemberProfile): MemberActor {
	return { id: profile.id, role: profile.role, pupitres: profile.pupitres };
}

export function chefPupitreIds(actor: MemberActor): MemberPupitreId[] {
	return actor.pupitres.filter((pupitre) => pupitre.isChef).map((pupitre) => pupitre.pupitreId);
}

export function pupitreIdsOf(actor: MemberActor): MemberPupitreId[] {
	return actor.pupitres.map((pupitre) => pupitre.pupitreId);
}

export function isChefOf(actor: MemberActor, pupitreId: MemberPupitreId): boolean {
	return actor.pupitres.some((pupitre) => pupitre.isChef && pupitre.pupitreId === pupitreId);
}

/* -------------------------------------------------------------------------- */
/* Événements                                                                 */
/* -------------------------------------------------------------------------- */

export function canManageAllEvents(actor: MemberActor): boolean {
	return isSecretaire(actor.role);
}

export function canDeleteEvents(actor: MemberActor): boolean {
	return isSecretaire(actor.role);
}

/**
 * Un chef ne crée que des événements ciblant un seul de ses pupitres.
 * Un événement global (aucun pupitre) ou multi-pupitres est refusé.
 */
export function canCreateEvent(actor: MemberActor, pupitreIds: MemberPupitreId[]): boolean {
	if (isSecretaire(actor.role)) return true;
	if (actor.role !== 'chef_pupitre') return false;
	if (pupitreIds.length !== 1) return false;
	return isChefOf(actor, pupitreIds[0]);
}

export function canManageEvent(actor: MemberActor, event: MemberEvent): boolean {
	if (isSecretaire(actor.role)) return true;
	if (actor.role !== 'chef_pupitre') return false;
	if (event.pupitreIds.length !== 1) return false;
	return isChefOf(actor, event.pupitreIds[0]);
}

/** Un chef voit les événements publics et internes, et ceux de ses pupitres. */
export function canViewEvent(actor: MemberActor, event: MemberEvent): boolean {
	if (isSecretaire(actor.role)) return true;
	if (event.visibility !== 'pupitre') return true;
	return event.pupitreIds.some((pupitreId) => pupitreIdsOf(actor).includes(pupitreId));
}

/** Un chef ne consulte les présences que pour ses propres pupitres. */
export function canViewPresenceDetail(actor: MemberActor, event: MemberEvent): boolean {
	if (isSecretaire(actor.role)) return true;
	if (actor.role !== 'chef_pupitre') return false;
	return event.pupitreIds.some((pupitreId) => isChefOf(actor, pupitreId));
}

export function canRespondToEvent(actor: MemberActor, event: MemberEvent): boolean {
	if (!canViewEvent(actor, event)) return false;
	if (event.status === 'cancelled') return false;
	if (isLocked(event.date)) return false;
	return true;
}

export function responseLockMessage(event: MemberEvent): string | null {
	if (event.status === 'cancelled') {
		return 'Cet événement est annulé : les réponses sont conservées en lecture seule.';
	}
	if (isLocked(event.date)) {
		return 'Les réponses sont closes depuis le lendemain de l’événement.';
	}
	return null;
}

/* -------------------------------------------------------------------------- */
/* Contenus, documents, notifications                                         */
/* -------------------------------------------------------------------------- */

export function canManageContents(actor: MemberActor): boolean {
	return isSecretaire(actor.role);
}

export function canManageMembers(actor: MemberActor): boolean {
	return isSecretaire(actor.role);
}

export function canChangeRole(actor: MemberActor): boolean {
	return isAdmin(actor.role);
}

export function canManageSettings(actor: MemberActor): boolean {
	return isAdmin(actor.role);
}

export function canViewPermissionMatrix(actor: MemberActor): boolean {
	return isSecretaire(actor.role);
}

/** Le chef dépose pour ses pupitres ; le secrétaire et l’admin pour tous. */
export function canDepositDocument(actor: MemberActor, pupitreId: MemberPupitreId | null): boolean {
	if (isSecretaire(actor.role)) return true;
	if (actor.role !== 'chef_pupitre') return false;
	if (pupitreId === null) return false;
	return isChefOf(actor, pupitreId);
}

export function canDeleteDocument(
	actor: MemberActor,
	documentPupitreId: MemberPupitreId | null
): boolean {
	return canDepositDocument(actor, documentPupitreId);
}

export type MemberNotifyAudience = 'all' | 'pupitre';

export function canNotify(
	actor: MemberActor,
	audience: MemberNotifyAudience,
	pupitreIds: MemberPupitreId[]
): boolean {
	if (isSecretaire(actor.role)) return true;
	if (actor.role !== 'chef_pupitre') return false;
	if (audience === 'all') return false;
	if (pupitreIds.length === 0) return false;
	return pupitreIds.every((pupitreId) => isChefOf(actor, pupitreId));
}

/* -------------------------------------------------------------------------- */
/* Profils                                                                    */
/* -------------------------------------------------------------------------- */

export function canEditOwnProfile(actor: MemberActor, targetProfileId: string): boolean {
	return actor.id === targetProfileId;
}

/** Le secrétaire et l’admin modifient les pupitres des autres membres. */
export function canEditMemberPupitres(actor: MemberActor, targetProfileId: string): boolean {
	if (actor.id === targetProfileId) return false;
	return isSecretaire(actor.role);
}

export function canChangeAvatar(actor: MemberActor, targetProfileId: string): boolean {
	return actor.id === targetProfileId;
}

export function canSeeAdminSection(actor: MemberActor): boolean {
	return isSecretaire(actor.role);
}

export function canSeePupitreSection(actor: MemberActor): boolean {
	return actor.role === 'chef_pupitre' || isSecretaire(actor.role);
}

/** Un chef ne gère que ses pupitres, y compris dans l’espace pupitre. */
export function scopedPupitreIds(actor: MemberActor): MemberPupitreId[] {
	if (isSecretaire(actor.role)) {
		return ['bombarde', 'cornemuse', 'caisse-claire', 'percussion'];
	}
	return chefPupitreIds(actor);
}

export function statusLabel(status: MemberResponseStatus): string {
	return status === 'present' ? 'Présent' : 'Absent';
}
