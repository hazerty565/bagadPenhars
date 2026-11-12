import { beforeEach, describe, expect, it } from 'vitest';
import { DEMO_STORAGE_KEY, demo } from '$lib/demo/store.svelte';
import { DEFAULT_PROFILE_ID } from '$lib/demo/types';
import { createSeedState } from '$lib/demo/fixtures';

/**
 * Store de démonstration.
 *
 * Hors navigateur (`browser === false`), le store travaille sur le seed en
 * mémoire et n'écrit jamais dans `localStorage`. Les mutations restent visibles
 * jusqu'au rechargement, comme annoncé dans l'interface.
 */

beforeEach(() => {
	demo.reset();
	demo.clearNotice();
});

describe('état et profil actif', () => {
	it('démarre sur le profil par défaut', () => {
		expect(demo.activeProfileId).toBe(DEFAULT_PROFILE_ID);
		expect(demo.activeProfile.id).toBe(DEFAULT_PROFILE_ID);
	});

	it('change de profil uniquement vers un profil existant', () => {
		expect(demo.setActiveProfile('p01')).toBe(true);
		expect(demo.activeProfile.role).toBe('admin');

		expect(demo.setActiveProfile('inconnu')).toBe(false);
		expect(demo.activeProfileId).toBe('p01');
	});

	it('réinitialise l’état complet', () => {
		demo.setActiveProfile('p01');
		demo.profiles[0].firstName = 'Modifié';
		demo.reset();

		expect(demo.activeProfileId).toBe(DEFAULT_PROFILE_ID);
		expect(demo.profiles[0].firstName).not.toBe('Modifié');
		expect(demo.notice?.kind).toBe('info');
	});

	it('applique un état fourni', () => {
		const state = createSeedState();
		state.activeProfileId = 'p02';
		demo.applyState(state);

		expect(demo.activeProfileId).toBe('p02');
		expect(demo.profiles.length).toBe(state.profiles.length);
	});

	it('expose une clé de stockage versionnée', () => {
		expect(DEMO_STORAGE_KEY).toBe('bagadpenhars.demo.v1');
	});
});

describe('messages et persistance', () => {
	it('mémorise puis efface un message', () => {
		demo.notify('success', 'Enregistré.');
		expect(demo.notice).toEqual({ kind: 'success', text: 'Enregistré.' });

		demo.clearNotice();
		expect(demo.notice).toBeNull();
	});

	it('ne persiste pas hors navigateur et ne signale pas d’erreur', () => {
		expect(() => demo.persist()).not.toThrow();
		expect(demo.storageNotice).toBeNull();
	});

	it('désactive la synchronisation entre onglets hors navigateur', () => {
		const stop = demo.startCrossTabSync();
		expect(typeof stop).toBe('function');
		expect(() => stop()).not.toThrow();
	});
});
