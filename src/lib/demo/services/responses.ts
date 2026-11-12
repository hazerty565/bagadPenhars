import { demo } from '../store.svelte';
import type { DemoResponseStatus } from '../types';
import { canRespondToEvent, DemoPermissionError } from '../permissions';
import { actorFor, nowIso } from './helpers';

/** Enregistre ou modifie la réponse d’un membre à un événement. */
export function setResponse(profileId: string, eventId: string, status: DemoResponseStatus): void {
	const actor = actorFor(profileId);
	const event = demo.events.find((item) => item.id === eventId);
	if (!event) throw new DemoPermissionError('Événement introuvable.');
	if (!canRespondToEvent(actor, event)) {
		throw new DemoPermissionError(
			'Cet événement n’est pas ouvert à votre réponse (visibilité, date ou annulation).'
		);
	}
	if (status !== 'present' && status !== 'absent') {
		throw new DemoPermissionError('Réponse invalide.');
	}

	const existing = demo.responses.find(
		(response) => response.eventId === eventId && response.profileId === profileId
	);

	if (existing) {
		existing.status = status;
		existing.updatedAt = nowIso();
	} else {
		demo.responses.push({
			eventId,
			profileId,
			status,
			updatedAt: nowIso()
		});
	}
	demo.persist();
}

export function responseOf(eventId: string, profileId: string): DemoResponseStatus | null {
	return (
		demo.responses.find(
			(response) => response.eventId === eventId && response.profileId === profileId
		)?.status ?? null
	);
}

export interface PresenceSummary {
	present: number;
	absent: number;
	noAnswer: number;
	total: number;
}

/** Compteurs agrégés d’un événement, sans exposer les réponses individuelles. */
export function presenceSummary(eventId: string, profileIds: string[]): PresenceSummary {
	const responses = demo.responses.filter((response) => response.eventId === eventId);
	const present = responses.filter(
		(response) => response.status === 'present' && profileIds.includes(response.profileId)
	).length;
	const absent = responses.filter(
		(response) => response.status === 'absent' && profileIds.includes(response.profileId)
	).length;
	const total = profileIds.length;
	return { present, absent, noAnswer: Math.max(0, total - present - absent), total };
}

export function respondingProfiles(eventId: string): string[] {
	return demo.responses
		.filter((response) => response.eventId === eventId)
		.map((response) => response.profileId);
}
