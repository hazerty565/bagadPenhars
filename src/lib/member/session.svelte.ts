import { actorOf } from './permissions';
import { member } from './store.svelte';

/**
 * Session simulée de la démonstration.
 *
 * Le profil actif est stocké dans le store et persisté avec les données
 * fictives. Aucun cookie, aucune session Better Auth et aucun appel réseau ne
 * sont utilisés : ce module ne prétend pas authentifier l’utilisateur.
 */
export const session = {
	get profile() {
		return member.activeProfile;
	},
	get actor() {
		return actorOf(member.activeProfile);
	},
	switchTo(profileId: string): boolean {
		return member.setActiveProfile(profileId);
	}
};
