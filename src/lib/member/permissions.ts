import type { AppRole } from '$lib/auth/roles';
import { isAdmin, isSecretaire } from '$lib/auth/roles';
import type { DemoEvent, DemoProfile, DemoPupitreId, DemoResponseStatus } from './types';
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

export class DemoPermissionError extends Error {
	readonly code = 'demo_permission_denied';

	constructor(message = 'Action non autorisée avec le profil actif.') {
		super(message);
		this.name = 'DemoPermissionError';
	}
}

export interface DemoActor {
	id: string;
	role: AppRole;
	pupitres: { pupitreId: DemoPupitreId; isChef: boolean }[];
}

export function actorOf(profile: DemoProfile): DemoActor {
	return { id: profile.id, role: profile.role, pupitres: profile.pupitres };
}

export function chefPupitreIds(actor: DemoActor): DemoPupitreId[] {
	return actor.pupitres.filter((pupitre) => pupitre.isChef).map((pupitre) => pupitre.pupitreId);
}

export function pupitreIdsOf(actor: DemoActor): DemoPupitreId[] {
	return actor.pupitres.map((pupitre) => pupitre.pupitreId);
}

export function isChefOf(actor: DemoActor, pupitreId: DemoPupitreId): boolean {
	return actor.pupitres.some((pupitre) => pupitre.isChef && pupitre.pupitreId === pupitreId);
}

/* -------------------------------------------------------------------------- */
/* Événements                                                                 */
/* -------------------------------------------------------------------------- */

export function canManageAllEvents(actor: DemoActor): boolean {
	return isSecretaire(actor.role);
}

export function canDeleteEvents(actor: DemoActor): boolean {
	return isSecretaire(actor.role);
}

/**
 * Un chef ne crée que des événements ciblant un seul de ses pupitres.
 * Un événement global (aucun pupitre) ou multi-pupitres est refusé.
 */
export function canCreateEvent(actor: DemoActor, pupitreIds: DemoPupitreId[]): boolean {
	if (isSecretaire(actor.role)) return true;
	if (actor.role !== 'chef_pupitre') return false;
	if (pupitreIds.length !== 1) return false;
	return isChefOf(actor, pupitreIds[0]);
}

export function canManageEvent(actor: DemoActor, event: DemoEvent): boolean {
	if (isSecretaire(actor.role)) return true;
	if (actor.role !== 'chef_pupitre') return false;
	if (event.pupitreIds.length !== 1) return false;
	return isChefOf(actor, event.pupitreIds[0]);
}

/** Un chef voit les événements publics et internes, et ceux de ses pupitres. */
export function canViewEvent(actor: DemoActor, event: DemoEvent): boolean {
	if (isSecretaire(actor.role)) return true;
	if (event.visibility !== 'pupitre') return true;
	return event.pupitreIds.some((pupitreId) => pupitreIdsOf(actor).includes(pupitreId));
}

/** Un chef ne consulte les présences que pour ses propres pupitres. */
export function canViewPresenceDetail(actor: DemoActor, event: DemoEvent): boolean {
	if (isSecretaire(actor.role)) return true;
	if (actor.role !== 'chef_pupitre') return false;
	return event.pupitreIds.some((pupitreId) => isChefOf(actor, pupitreId));
}

export function canRespondToEvent(actor: DemoActor, event: DemoEvent): boolean {
	if (!canViewEvent(actor, event)) return false;
	if (event.status === 'cancelled') return false;
	if (isLocked(event.date)) return false;
	return true;
}

export function responseLockMessage(event: DemoEvent): string | null {
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

export function canManageContents(actor: DemoActor): boolean {
	return isSecretaire(actor.role);
}

export function canManageMembers(actor: DemoActor): boolean {
	return isSecretaire(actor.role);
}

export function canChangeRole(actor: DemoActor): boolean {
	return isAdmin(actor.role);
}

export function canManageSettings(actor: DemoActor): boolean {
	return isAdmin(actor.role);
}

export function canViewPermissionMatrix(actor: DemoActor): boolean {
	return isSecretaire(actor.role);
}

/** Le chef dépose pour ses pupitres ; le secrétaire et l’admin pour tous. */
export function canDepositDocument(actor: DemoActor, pupitreId: DemoPupitreId | null): boolean {
	if (isSecretaire(actor.role)) return true;
	if (actor.role !== 'chef_pupitre') return false;
	if (pupitreId === null) return false;
	return isChefOf(actor, pupitreId);
}

export function canDeleteDocument(
	actor: DemoActor,
	documentPupitreId: DemoPupitreId | null
): boolean {
	return canDepositDocument(actor, documentPupitreId);
}

export type DemoNotifyAudience = 'all' | 'pupitre';

export function canNotify(
	actor: DemoActor,
	audience: DemoNotifyAudience,
	pupitreIds: DemoPupitreId[]
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

export function canEditOwnProfile(actor: DemoActor, targetProfileId: string): boolean {
	return actor.id === targetProfileId;
}

/** Le secrétaire et l’admin modifient les pupitres des autres membres. */
export function canEditMemberPupitres(actor: DemoActor, targetProfileId: string): boolean {
	if (actor.id === targetProfileId) return false;
	return isSecretaire(actor.role);
}

export function canChangeAvatar(actor: DemoActor, targetProfileId: string): boolean {
	return actor.id === targetProfileId;
}

export function canSeeAdminSection(actor: DemoActor): boolean {
	return isSecretaire(actor.role);
}

export function canSeePupitreSection(actor: DemoActor): boolean {
	return actor.role === 'chef_pupitre' || isSecretaire(actor.role);
}

/** Un chef ne gère que ses pupitres, y compris dans l’espace pupitre. */
export function scopedPupitreIds(actor: DemoActor): DemoPupitreId[] {
	if (isSecretaire(actor.role)) {
		return ['bombarde', 'cornemuse', 'caisse-claire', 'percussion'];
	}
	return chefPupitreIds(actor);
}

export function statusLabel(status: DemoResponseStatus): string {
	return status === 'present' ? 'Présent' : 'Absent';
}
