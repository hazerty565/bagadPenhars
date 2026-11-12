import { beforeEach, describe, expect, it } from 'vitest';
import { demo } from '$lib/demo/store.svelte';
import { presenceSummary, responseOf, setResponse } from '$lib/demo/services/responses';
import { DemoPermissionError } from '$lib/demo/permissions';
import { eventAudience } from '$lib/demo/services/members';

/**
 * Réponses RSVP : présent, absent, sans réponse.
 *
 * Une réponse est unique par membre et par événement, modifiable jusqu'à la
 * clôture (lendemain de l'événement), puis figée. Un événement annulé conserve
 * les réponses en lecture seule.
 */

beforeEach(() => {
	demo.reset();
	demo.clearNotice();
});

describe('enregistrement des réponses', () => {
	it('enregistre puis modifie la réponse sans doublon', () => {
		setResponse('p06', 'e01', 'absent');
		expect(responseOf('e01', 'p06')).toBe('absent');

		setResponse('p06', 'e01', 'present');
		expect(responseOf('e01', 'p06')).toBe('present');

		const mine = demo.responses.filter(
			(response) => response.eventId === 'e01' && response.profileId === 'p06'
		);
		expect(mine).toHaveLength(1);
	});

	it('refuse un statut inconnu', () => {
		expect(() => setResponse('p06', 'e01', 'peut-etre' as never)).toThrow(DemoPermissionError);
	});

	it('refuse un événement introuvable', () => {
		expect(() => setResponse('p06', 'inconnu', 'present')).toThrow(DemoPermissionError);
	});

	it('refuse une réponse après la clôture', () => {
		expect(() => setResponse('p06', 'e14', 'present')).toThrow(DemoPermissionError);
	});

	it('refuse une réponse à un événement annulé', () => {
		expect(() => setResponse('p06', 'e15', 'present')).toThrow(DemoPermissionError);
	});

	it('refuse une réponse à un événement de pupitre non visible', () => {
		// p06 est bombardeur : la répétition percussion (e04) ne le concerne pas.
		expect(() => setResponse('p06', 'e04', 'present')).toThrow(DemoPermissionError);
	});
});

describe('agrégats de présence', () => {
	it('compte présents, absents et sans réponse sur le périmètre de l’événement', () => {
		const event = demo.events.find((item) => item.id === 'e02');
		expect(event).toBeDefined();
		const audience = eventAudience(event!).map((profile) => profile.id);

		setResponse('p06', 'e02', 'present');
		const summary = presenceSummary('e02', audience);

		expect(summary.total).toBe(audience.length);
		expect(summary.present).toBeGreaterThanOrEqual(1);
		expect(summary.present + summary.absent + summary.noAnswer).toBe(summary.total);
	});

	it('ignore les réponses hors périmètre', () => {
		const summary = presenceSummary('e02', ['p06']);
		expect(summary.total).toBe(1);
		expect(summary.noAnswer).toBeLessThanOrEqual(1);
	});
});
