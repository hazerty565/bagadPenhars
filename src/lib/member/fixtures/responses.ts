import type { DemoResponse } from '../types';

const UPDATED = '2026-11-10T18:30:00.000Z';

function response(eventId: string, profileId: string, status: 'present' | 'absent'): DemoResponse {
	return { eventId, profileId, status, updatedAt: UPDATED };
}

/**
 * Réponses fictives : présents, absents et membres sans réponse.
 * Les événements non listés ici laissent volontairement des compteurs à zéro.
 */
export const DEMO_RESPONSES: DemoResponse[] = [
	// Répétition générale du 12 novembre
	response('e01', 'p03', 'present'),
	response('e01', 'p06', 'present'),
	response('e01', 'p07', 'absent'),
	response('e01', 'p08', 'present'),
	response('e01', 'p09', 'present'),
	response('e01', 'p10', 'absent'),
	response('e01', 'p11', 'present'),
	response('e01', 'p14', 'present'),
	response('e01', 'p16', 'present'),
	response('e01', 'p17', 'absent'),
	response('e01', 'p18', 'present'),
	response('e01', 'p21', 'present'),
	response('e01', 'p22', 'present'),
	response('e01', 'p23', 'present'),

	// Répétition bombarde du 13 novembre
	response('e02', 'p06', 'present'),
	response('e02', 'p07', 'present'),
	response('e02', 'p12', 'present'),
	response('e02', 'p14', 'absent'),
	response('e02', 'p22', 'present'),

	// Répétition cornemuse du 14 novembre
	response('e03', 'p07', 'present'),
	response('e03', 'p08', 'present'),
	response('e03', 'p09', 'absent'),
	response('e03', 'p13', 'present'),
	response('e03', 'p18', 'present'),
	response('e03', 'p21', 'present'),

	// Répétition percussion du 15 novembre
	response('e04', 'p10', 'present'),
	response('e04', 'p14', 'present'),
	response('e04', 'p15', 'absent'),
	response('e04', 'p19', 'present'),
	response('e04', 'p24', 'present'),

	// Répétition caisse claire du 16 novembre
	response('e05', 'p09', 'present'),
	response('e05', 'p11', 'present'),
	response('e05', 'p16', 'present'),
	response('e05', 'p20', 'absent'),
	response('e05', 'p23', 'present'),

	// Concert du 21 novembre
	response('e07', 'p01', 'present'),
	response('e07', 'p03', 'present'),
	response('e07', 'p06', 'present'),
	response('e07', 'p08', 'present'),
	response('e07', 'p09', 'present'),
	response('e07', 'p10', 'present'),
	response('e07', 'p12', 'absent'),
	response('e07', 'p14', 'present'),
	response('e07', 'p16', 'absent'),
	response('e07', 'p17', 'present'),
	response('e07', 'p19', 'present'),
	response('e07', 'p21', 'present'),
	response('e07', 'p22', 'present'),

	// Repas du 19 décembre (sondage)
	response('e08', 'p01', 'present'),
	response('e08', 'p03', 'present'),
	response('e08', 'p06', 'present'),
	response('e08', 'p07', 'present'),
	response('e08', 'p09', 'absent'),
	response('e08', 'p11', 'present'),
	response('e08', 'p15', 'present'),
	response('e08', 'p21', 'present'),

	// Fest-noz du 5 décembre
	response('e09', 'p03', 'present'),
	response('e09', 'p06', 'present'),
	response('e09', 'p07', 'present'),
	response('e09', 'p10', 'present'),
	response('e09', 'p18', 'absent'),
	response('e09', 'p22', 'present'),

	// Répétition passée du 4 novembre
	response('e14', 'p03', 'present'),
	response('e14', 'p06', 'present'),
	response('e14', 'p08', 'present'),
	response('e14', 'p09', 'absent'),
	response('e14', 'p10', 'present'),
	response('e14', 'p16', 'present'),
	response('e14', 'p17', 'absent'),

	// Concert annulé du 1er décembre
	response('e15', 'p06', 'present'),
	response('e15', 'p07', 'absent'),
	response('e15', 'p09', 'present'),
	response('e15', 'p14', 'present')
];
