import { member } from '../store.svelte';
import type {
	MemberEvent,
	MemberEventType,
	MemberEventVisibility,
	MemberPupitreId
} from '../types';
import {
	actorOf,
	canCreateEvent,
	canDeleteEvents,
	canManageEvent,
	MemberPermissionError
} from '../permissions';
import { isNonEmpty } from './helpers';

/**
 * Commandes de l'agenda.
 *
 * Les contrôles ci-dessous sont un premier filtre d'interface : le serveur
 * revalide la permission et PostgreSQL applique ses politiques RLS. Chaque
 * commande renvoie l'instantané à jour, que le store applique.
 */

export interface MemberEventInput {
	title: string;
	description: string;
	date: string;
	type: MemberEventType;
	visibility: MemberEventVisibility;
	isPoll: boolean;
	pupitreIds: MemberPupitreId[];
	location: string;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function validateInput(input: MemberEventInput): void {
	if (!isNonEmpty(input.title, 3)) {
		throw new MemberPermissionError('Le titre doit contenir au moins trois caractères.');
	}
	if (!DATE_PATTERN.test(input.date)) {
		throw new MemberPermissionError('La date de l’événement est invalide.');
	}
	if (input.visibility === 'pupitre' && input.pupitreIds.length === 0) {
		throw new MemberPermissionError('Un événement de pupitre doit cibler au moins un pupitre.');
	}
	if (!isNonEmpty(input.location, 2)) {
		throw new MemberPermissionError('Le lieu est obligatoire.');
	}
}

function normalizeInput(input: MemberEventInput): MemberEventInput {
	return {
		...input,
		title: input.title.trim(),
		description: input.description.trim(),
		location: input.location.trim(),
		pupitreIds: input.visibility === 'pupitre' ? [...new Set(input.pupitreIds)] : []
	};
}

function currentActor() {
	return actorOf(member.profile);
}

export async function createEvent(
	_actorProfileId: string,
	rawInput: MemberEventInput
): Promise<{ id: string }> {
	const input = normalizeInput(rawInput);
	validateInput(input);
	if (!canCreateEvent(currentActor(), input.pupitreIds)) {
		throw new MemberPermissionError(
			'Vous ne pouvez créer que des événements ciblant un seul de vos pupitres.'
		);
	}

	return member.request<{ id: string }>('event.create', { input });
}

export async function updateEvent(
	_actorProfileId: string,
	eventId: string,
	rawInput: MemberEventInput
): Promise<void> {
	const existing = member.events.find((event) => event.id === eventId);
	if (!existing) throw new MemberPermissionError('Événement introuvable.');
	if (!canManageEvent(currentActor(), existing)) {
		throw new MemberPermissionError('Vous ne pouvez modifier que les événements de vos pupitres.');
	}

	const input = normalizeInput(rawInput);
	validateInput(input);
	if (!canCreateEvent(currentActor(), input.pupitreIds)) {
		throw new MemberPermissionError(
			'Un chef ne peut pas déplacer un événement vers un autre pupitre ou le rendre multi-pupitres.'
		);
	}

	await member.request('event.update', { eventId, input });
}

export async function cancelEvent(_actorProfileId: string, eventId: string): Promise<void> {
	const event = member.events.find((item) => item.id === eventId);
	if (!event) throw new MemberPermissionError('Événement introuvable.');
	if (!canManageEvent(currentActor(), event)) {
		throw new MemberPermissionError('Vous ne pouvez annuler que les événements de vos pupitres.');
	}
	await member.request('event.cancel', { eventId });
}

export async function reactivateEvent(_actorProfileId: string, eventId: string): Promise<void> {
	const event = member.events.find((item) => item.id === eventId);
	if (!event) throw new MemberPermissionError('Événement introuvable.');
	if (!canManageEvent(currentActor(), event)) {
		throw new MemberPermissionError('Vous ne pouvez modifier que les événements de vos pupitres.');
	}
	await member.request('event.reactivate', { eventId });
}

export async function deleteEvent(_actorProfileId: string, eventId: string): Promise<void> {
	if (!canDeleteEvents(currentActor())) {
		throw new MemberPermissionError(
			'Seuls la secrétaire et l’administrateur peuvent supprimer un événement.'
		);
	}
	await member.request('event.delete', { eventId });
}

/** Lecture locale d'un événement du dernier instantané. */
export function findEvent(eventId: string): MemberEvent | null {
	return member.events.find((event) => event.id === eventId) ?? null;
}
