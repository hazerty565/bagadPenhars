import { describe, expect, it } from 'vitest';
import { DEMO_STATE_VERSION, createSeedState, validateDemoState } from '$lib/demo/fixtures';
import { DEMO_PROFILES } from '$lib/demo/fixtures/profiles';
import { DEMO_EVENTS } from '$lib/demo/fixtures/events';
import { DEMO_TODAY } from '$lib/demo/clock';
import type { DemoState } from '$lib/demo/types';

/**
 * Garde-fous sur les données fictives.
 *
 * La démonstration ne doit contenir aucune donnée personnelle réelle et son
 * état doit rester référentiellement cohérent : un état incohérent est remplacé
 * par le seed au chargement du store.
 */

function seed(): DemoState {
	return createSeedState();
}

describe('fixtures de démonstration', () => {
	it('produit un état valide et versionné', () => {
		const state = seed();
		expect(state.version).toBe(DEMO_STATE_VERSION);
		expect(validateDemoState(state)).toBe(true);
	});

	it('ne contient que des adresses du domaine réservé example.com', () => {
		for (const profile of DEMO_PROFILES) {
			expect(profile.email.endsWith('@example.com')).toBe(true);
		}
	});

	it('ne contient que des comptes actifs', () => {
		for (const profile of DEMO_PROFILES) {
			expect(profile.accountStatus).toBe('active');
		}
	});

	it('utilise une date de démonstration figée', () => {
		expect(DEMO_TODAY).toBe('2026-11-11');
	});

	it('clone les fixtures : muter le seed ne modifie pas les sources', () => {
		const state = seed();
		const target = state.profiles.find((profile) => profile.id === state.activeProfileId);
		expect(target).toBeDefined();
		target!.firstName = 'Modifié';

		const original = DEMO_PROFILES.find((profile) => profile.id === target!.id);
		expect(original?.firstName).not.toBe('Modifié');
	});

	it('référence uniquement des profils et événements existants', () => {
		const state = seed();
		const profileIds = new Set(state.profiles.map((profile) => profile.id));
		const eventIds = new Set(state.events.map((event) => event.id));

		for (const response of state.responses) {
			expect(eventIds.has(response.eventId)).toBe(true);
			expect(profileIds.has(response.profileId)).toBe(true);
		}
		for (const event of state.events) {
			expect(profileIds.has(event.createdBy)).toBe(true);
		}
	});

	it('refuse un état incohérent', () => {
		const badVersion = seed();
		badVersion.version = DEMO_STATE_VERSION + 1;
		expect(validateDemoState(badVersion)).toBe(false);

		const unknownActive = seed();
		unknownActive.activeProfileId = 'inconnu';
		expect(validateDemoState(unknownActive)).toBe(false);

		const duplicated = seed();
		duplicated.profiles.push({ ...duplicated.profiles[0] });
		expect(validateDemoState(duplicated)).toBe(false);

		const danglingResponse = seed();
		danglingResponse.responses.push({
			eventId: 'inconnu',
			profileId: 'p06',
			status: 'present',
			updatedAt: ''
		});
		expect(validateDemoState(danglingResponse)).toBe(false);
	});

	it('décrit au moins un événement par rôle métier', () => {
		expect(DEMO_EVENTS.some((event) => event.status === 'cancelled')).toBe(true);
		expect(DEMO_EVENTS.some((event) => event.date < DEMO_TODAY)).toBe(true);
		expect(DEMO_EVENTS.some((event) => event.date > DEMO_TODAY)).toBe(true);
		expect(DEMO_EVENTS.some((event) => event.visibility === 'pupitre')).toBe(true);
	});
});
