import { beforeEach, describe, expect, it } from 'vitest';
import { demo } from '$lib/demo/store.svelte';
import {
	cancelEvent,
	createEvent,
	deleteEvent,
	reactivateEvent,
	updateEvent,
	type DemoEventInput
} from '$lib/demo/services/events';
import { DemoPermissionError } from '$lib/demo/permissions';

/**
 * Les services refusent les mutations non autorisées.
 *
 * Masquer un bouton ne protège rien : ces tests appellent directement les
 * services avec un profil qui n'a pas les droits et attendent un refus.
 */

const input = (overrides: Partial<DemoEventInput> = {}): DemoEventInput => ({
	title: 'Répétition de test',
	description: 'Description de test',
	date: '2026-12-20',
	type: 'repetition',
	visibility: 'pupitre',
	isPoll: false,
	pupitreIds: ['bombarde'],
	location: 'Espace Chaptal',
	...overrides
});

beforeEach(() => {
	demo.reset();
	demo.clearNotice();
});

describe('création d’événement', () => {
	it('un chef crée un événement pour son pupitre et notifie les membres', () => {
		const before = demo.notifications.length;
		const event = createEvent('p03', input());

		expect(demo.events.some((item) => item.id === event.id)).toBe(true);
		expect(event.createdBy).toBe('p03');
		expect(event.pupitreIds).toEqual(['bombarde']);
		expect(demo.notifications.length).toBeGreaterThan(before);
	});

	it('un chef ne crée pas pour un pupitre qu’il ne dirige pas', () => {
		expect(() => createEvent('p03', input({ pupitreIds: ['percussion'] }))).toThrow(
			DemoPermissionError
		);
	});

	it('un chef ne crée pas un événement global ou multi-pupitres', () => {
		expect(() => createEvent('p03', input({ pupitreIds: [] }))).toThrow(DemoPermissionError);
		expect(() => createEvent('p03', input({ pupitreIds: ['bombarde', 'cornemuse'] }))).toThrow(
			DemoPermissionError
		);
	});

	it('un membre ne crée aucun événement', () => {
		expect(() => createEvent('p06', input())).toThrow(DemoPermissionError);
	});

	it('valide les champs obligatoires', () => {
		expect(() => createEvent('p02', input({ title: 'a' }))).toThrow(DemoPermissionError);
		expect(() => createEvent('p02', input({ date: '20/12/2026' }))).toThrow(DemoPermissionError);
		expect(() => createEvent('p02', input({ location: '' }))).toThrow(DemoPermissionError);
		expect(() => createEvent('p02', input({ visibility: 'pupitre', pupitreIds: [] }))).toThrow(
			DemoPermissionError
		);
	});

	it('normalise le titre, le lieu et les pupitres', () => {
		const event = createEvent(
			'p02',
			input({ title: '  Concert  ', location: '  Quimper  ', pupitreIds: ['bombarde', 'bombarde'] })
		);
		expect(event.title).toBe('Concert');
		expect(event.location).toBe('Quimper');
		expect(event.pupitreIds).toEqual(['bombarde']);
	});
});

describe('modification, annulation et suppression', () => {
	it('un chef modifie un événement de son pupitre', () => {
		updateEvent('p03', 'e02', input({ title: 'Répétition modifiée' }));
		expect(demo.events.find((event) => event.id === 'e02')?.title).toBe('Répétition modifiée');
	});

	it('un chef ne modifie pas l’événement d’un autre pupitre', () => {
		expect(() => updateEvent('p03', 'e04', input())).toThrow(DemoPermissionError);
	});

	it('un chef ne déplace pas son événement vers un autre pupitre', () => {
		expect(() => updateEvent('p03', 'e02', input({ pupitreIds: ['percussion'] }))).toThrow(
			DemoPermissionError
		);
	});

	it('annuler puis réactiver un événement met à jour son statut', () => {
		cancelEvent('p03', 'e02');
		expect(demo.events.find((event) => event.id === 'e02')?.status).toBe('cancelled');

		reactivateEvent('p03', 'e02');
		expect(demo.events.find((event) => event.id === 'e02')?.status).toBe('active');
	});

	it('seule la secrétaire ou l’administrateur supprime, et les réponses partent avec', () => {
		expect(() => deleteEvent('p03', 'e02')).toThrow(DemoPermissionError);

		const responsesBefore = demo.responses.filter((response) => response.eventId === 'e02').length;
		expect(responsesBefore).toBeGreaterThan(0);

		deleteEvent('p02', 'e02');
		expect(demo.events.some((event) => event.id === 'e02')).toBe(false);
		expect(demo.responses.some((response) => response.eventId === 'e02')).toBe(false);
	});

	it('refuse un événement inexistant', () => {
		expect(() => updateEvent('p02', 'inconnu', input())).toThrow(DemoPermissionError);
		expect(() => cancelEvent('p02', 'inconnu')).toThrow(DemoPermissionError);
	});
});

describe('cohérence des erreurs', () => {
	it('expose un code stable et un nom explicite', () => {
		const error = new DemoPermissionError();
		expect(error.code).toBe('demo_permission_denied');
		expect(error.name).toBe('DemoPermissionError');
		expect(error).toBeInstanceOf(Error);
	});
});
