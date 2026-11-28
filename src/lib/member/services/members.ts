import { member } from '../store.svelte';
import type { MemberProfile, MemberPupitreId } from '../types';
import type { MemberActor } from '../permissions';
import { chefPupitreIds, isChefOf } from '../permissions';
import { canViewEvent } from '../permissions';
import type { MemberEvent } from '../types';

/** Trombinoscope : tous les membres actifs, enrichis de leurs pupitres. */
export function visibleProfiles(): MemberProfile[] {
	return [...member.profiles].sort((a, b) =>
		`${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, 'fr')
	);
}

/** Membres d'un pupitre (utilise le store ciblé quand disponible). */
export function profilesOfPupitre(pupitreId: MemberPupitreId): MemberProfile[] {
	const src = member.pupitreProfiles.length > 0 ? member.pupitreProfiles : visibleProfiles();
	return src.filter((profile) =>
		profile.pupitres.some((pupitre) => pupitre.pupitreId === pupitreId)
	);
}

/** Chefs actifs d'un pupitre (utilise le store ciblé quand disponible). */
export function activeChefs(pupitreId: MemberPupitreId): MemberProfile[] {
	const src = member.pupitreProfiles.length > 0 ? member.pupitreProfiles : visibleProfiles();
	return src.filter((profile) =>
		profile.pupitres.some((pupitre) => pupitre.pupitreId === pupitreId && pupitre.isChef)
	);
}

/** Membres concernés par un événement (ciblage pupitres ou global). */
export function eventAudience(event: MemberEvent): MemberProfile[] {
	if (event.visibility !== 'pupitre' || event.pupitreIds.length === 0) {
		return visibleProfiles();
	}
	return visibleProfiles().filter((profile) =>
		profile.pupitres.some((pupitre) => event.pupitreIds.includes(pupitre.pupitreId))
	);
}

/** Événements visibles par un acteur, triés du plus proche au plus lointain. */
export function visibleEvents(actor: MemberActor): MemberEvent[] {
	return [...member.events]
		.filter((event) => canViewEvent(actor, event))
		.sort((a, b) => a.date.localeCompare(b.date));
}

/** Événements gérables par un acteur (pour les écrans de gestion). */
export function manageableEvents(actor: MemberActor): MemberEvent[] {
	if (actor.role === 'secretaire' || actor.role === 'admin') return [...member.events];
	const chefs = chefPupitreIds(actor);
	return member.events.filter(
		(event) => event.pupitreIds.length === 1 && chefs.includes(event.pupitreIds[0])
	);
}

/** Vérifie qu’un profil fait partie du périmètre du chef. */
export function isInChefScope(actor: MemberActor, profile: MemberProfile): boolean {
	if (actor.role === 'secretaire' || actor.role === 'admin') return true;
	return profile.pupitres.some((pupitre) => isChefOf(actor, pupitre.pupitreId));
}
