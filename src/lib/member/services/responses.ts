import { member } from '../store.svelte';
import type { MemberResponseStatus } from '../types';
import { actorOf, canRespondToEvent, MemberPermissionError } from '../permissions';

/** Enregistre ou modifie la réponse du profil connecté à un événement. */
export async function setResponse(
	_profileId: string,
	eventId: string,
	status: MemberResponseStatus
): Promise<void> {
	const event = member.events.find((item) => item.id === eventId);
	if (!event) throw new MemberPermissionError('Événement introuvable.');
	if (!canRespondToEvent(actorOf(member.profile), event)) {
		throw new MemberPermissionError(
			'Cet événement n’est pas ouvert à votre réponse (visibilité, date ou annulation).'
		);
	}
	if (status !== 'present' && status !== 'absent') {
		throw new MemberPermissionError('Réponse invalide.');
	}

	await member.request('response.set', { eventId, status });
}

export function responseOf(eventId: string, profileId: string): MemberResponseStatus | null {
	return (
		member.responses.find(
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

/** Compteurs agrégés d'un événement, sans exposer les réponses individuelles. */
export function presenceSummary(eventId: string, profileIds: string[]): PresenceSummary {
	const responses = member.responses.filter((response) => response.eventId === eventId);
	const present = responses.filter(
		(response) => response.status === 'present' && profileIds.includes(response.profileId)
	).length;
	const absent = responses.filter(
		(response) => response.status === 'absent' && profileIds.includes(response.profileId)
	).length;
	const total = profileIds.length;
	return { present, absent, noAnswer: Math.max(0, total - present - absent), total };
}
