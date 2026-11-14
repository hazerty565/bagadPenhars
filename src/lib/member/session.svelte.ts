import { actorOf } from './permissions';
import { demo } from './store.svelte';

/**
 * Session simulée de la démonstration.
 *
 * Le profil actif est stocké dans le store et persisté avec les données
 * fictives. Aucun cookie, aucune session Better Auth et aucun appel réseau ne
 * sont utilisés : ce module ne prétend pas authentifier l’utilisateur.
 */
export const session = {
	get profile() {
		return demo.activeProfile;
	},
	get actor() {
		return actorOf(demo.activeProfile);
	},
	switchTo(profileId: string): boolean {
		return demo.setActiveProfile(profileId);
	}
};
