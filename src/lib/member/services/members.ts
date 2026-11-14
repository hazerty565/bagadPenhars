import { demo } from '../store.svelte';
import type { DemoProfile, DemoPupitreId } from '../types';
import type { DemoActor } from '../permissions';
import { chefPupitreIds, isChefOf } from '../permissions';
import { canViewEvent } from '../permissions';
import type { DemoEvent } from '../types';

/** Trombinoscope : tous les membres actifs, enrichis de leurs pupitres. */
export function visibleProfiles(): DemoProfile[] {
	return [...demo.profiles].sort((a, b) =>
		`${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, 'fr')
	);
}

export function profilesOfPupitre(pupitreId: DemoPupitreId): DemoProfile[] {
	return visibleProfiles().filter((profile) =>
		profile.pupitres.some((pupitre) => pupitre.pupitreId === pupitreId)
	);
}

export function activeChefs(pupitreId: DemoPupitreId): DemoProfile[] {
	return visibleProfiles().filter((profile) =>
		profile.pupitres.some((pupitre) => pupitre.pupitreId === pupitreId && pupitre.isChef)
	);
}

/** Membres concernés par un événement (ciblage pupitres ou global). */
export function eventAudience(event: DemoEvent): DemoProfile[] {
	if (event.visibility !== 'pupitre' || event.pupitreIds.length === 0) {
		return visibleProfiles();
	}
	return visibleProfiles().filter((profile) =>
		profile.pupitres.some((pupitre) => event.pupitreIds.includes(pupitre.pupitreId))
	);
}

/** Événements visibles par un acteur, triés du plus proche au plus lointain. */
export function visibleEvents(actor: DemoActor): DemoEvent[] {
	return [...demo.events]
		.filter((event) => canViewEvent(actor, event))
		.sort((a, b) => a.date.localeCompare(b.date));
}

/** Événements gérables par un acteur (pour les écrans de gestion). */
export function manageableEvents(actor: DemoActor): DemoEvent[] {
	if (actor.role === 'secretaire' || actor.role === 'admin') return [...demo.events];
	const chefs = chefPupitreIds(actor);
	return demo.events.filter(
		(event) => event.pupitreIds.length === 1 && chefs.includes(event.pupitreIds[0])
	);
}

/** Vérifie qu’un profil fait partie du périmètre du chef. */
export function isInChefScope(actor: DemoActor, profile: DemoProfile): boolean {
	if (actor.role === 'secretaire' || actor.role === 'admin') return true;
	return profile.pupitres.some((pupitre) => isChefOf(actor, pupitre.pupitreId));
}
