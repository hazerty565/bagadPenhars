import { demo } from '../store.svelte';
import type { DemoEvent, DemoEventType, DemoEventVisibility, DemoPupitreId } from '../types';
import {
	canCreateEvent,
	canDeleteEvents,
	canManageEvent,
	DemoPermissionError
} from '../permissions';
import { actorFor, isNonEmpty, nextId, nowIso } from './helpers';

export interface DemoEventInput {
	title: string;
	description: string;
	date: string;
	type: DemoEventType;
	visibility: DemoEventVisibility;
	isPoll: boolean;
	pupitreIds: DemoPupitreId[];
	location: string;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function validateInput(input: DemoEventInput): void {
	if (!isNonEmpty(input.title, 3)) {
		throw new DemoPermissionError('Le titre doit contenir au moins trois caractères.');
	}
	if (!DATE_PATTERN.test(input.date)) {
		throw new DemoPermissionError('La date de l’événement est invalide.');
	}
	if (input.visibility === 'pupitre' && input.pupitreIds.length === 0) {
		throw new DemoPermissionError('Un événement de pupitre doit cibler au moins un pupitre.');
	}
	if (!isNonEmpty(input.location, 2)) {
		throw new DemoPermissionError('Le lieu est obligatoire.');
	}
}

function normalizeInput(input: DemoEventInput): DemoEventInput {
	return {
		...input,
		title: input.title.trim(),
		description: input.description.trim(),
		location: input.location.trim(),
		pupitreIds: input.visibility === 'pupitre' ? [...new Set(input.pupitreIds)] : []
	};
}

function notifyCreation(event: DemoEvent, authorId: string): void {
	if (!demo.settings.notifyOnEventCreate) return;
	const author = demo.profiles.find((profile) => profile.id === authorId);
	demo.notifications.unshift({
		id: nextId('n', demo.notifications),
		title: `Nouvel événement : ${event.title}`,
		body: `${author?.firstName ?? 'Un membre'} a créé un événement le ${event.date}. Consultez l’agenda pour répondre.`,
		createdAt: nowIso(),
		audience: event.visibility === 'pupitre' ? 'pupitre' : 'all',
		audienceIds: event.visibility === 'pupitre' ? event.pupitreIds : [],
		sentBy: authorId,
		readBy: [authorId]
	});
}

export function createEvent(actorProfileId: string, rawInput: DemoEventInput): DemoEvent {
	const actor = actorFor(actorProfileId);
	const input = normalizeInput(rawInput);
	validateInput(input);
	if (!canCreateEvent(actor, input.pupitreIds)) {
		throw new DemoPermissionError(
			'Vous ne pouvez créer que des événements ciblant un seul de vos pupitres.'
		);
	}

	const event: DemoEvent = {
		id: nextId('e', demo.events),
		title: input.title,
		description: input.description,
		date: input.date,
		type: input.type,
		visibility: input.visibility,
		isPoll: input.isPoll,
		status: 'active',
		pupitreIds: input.pupitreIds,
		createdBy: actor.id,
		location: input.location
	};

	demo.events = [...demo.events, event];
	notifyCreation(event, actor.id);
	demo.persist();
	return event;
}

export function updateEvent(
	actorProfileId: string,
	eventId: string,
	rawInput: DemoEventInput
): void {
	const actor = actorFor(actorProfileId);
	const existing = demo.events.find((event) => event.id === eventId);
	if (!existing) throw new DemoPermissionError('Événement introuvable.');
	if (!canManageEvent(actor, existing)) {
		throw new DemoPermissionError('Vous ne pouvez modifier que les événements de vos pupitres.');
	}

	const input = normalizeInput(rawInput);
	validateInput(input);
	if (!canCreateEvent(actor, input.pupitreIds)) {
		throw new DemoPermissionError(
			'Un chef ne peut pas déplacer un événement vers un autre pupitre ou le rendre multi-pupitres.'
		);
	}

	Object.assign(existing, {
		title: input.title,
		description: input.description,
		date: input.date,
		type: input.type,
		visibility: input.visibility,
		isPoll: input.isPoll,
		pupitreIds: input.pupitreIds,
		location: input.location
	});
	demo.persist();
}

export function cancelEvent(actorProfileId: string, eventId: string): void {
	const actor = actorFor(actorProfileId);
	const event = demo.events.find((item) => item.id === eventId);
	if (!event) throw new DemoPermissionError('Événement introuvable.');
	if (!canManageEvent(actor, event)) {
		throw new DemoPermissionError('Vous ne pouvez annuler que les événements de vos pupitres.');
	}
	event.status = 'cancelled';
	demo.persist();
}

export function reactivateEvent(actorProfileId: string, eventId: string): void {
	const actor = actorFor(actorProfileId);
	const event = demo.events.find((item) => item.id === eventId);
	if (!event) throw new DemoPermissionError('Événement introuvable.');
	if (!canManageEvent(actor, event)) {
		throw new DemoPermissionError('Vous ne pouvez modifier que les événements de vos pupitres.');
	}
	event.status = 'active';
	demo.persist();
}

export function deleteEvent(actorProfileId: string, eventId: string): void {
	const actor = actorFor(actorProfileId);
	if (!canDeleteEvents(actor)) {
		throw new DemoPermissionError(
			'Seuls la secrétaire et l’administrateur peuvent supprimer un événement.'
		);
	}
	demo.events = demo.events.filter((event) => event.id !== eventId);
	demo.responses = demo.responses.filter((response) => response.eventId !== eventId);
	demo.persist();
}
