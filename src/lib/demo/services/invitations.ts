import { demo } from '../store.svelte';
import type { DemoInvitation, DemoPupitreId } from '../types';
import { canInviteAndActivate } from '$lib/auth/roles';
import { DemoPermissionError } from '../permissions';
import { addDays, actorFor, isNonEmpty, nextId } from './helpers';
import { DEMO_TODAY } from '../clock';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface DemoInvitationInput {
	email: string;
	firstName: string;
	lastName: string;
	pupitreIds: DemoPupitreId[];
}

function requireInviter(actorProfileId: string) {
	const actor = actorFor(actorProfileId);
	if (!canInviteAndActivate(actor.role)) {
		throw new DemoPermissionError('Seuls la secrétaire et l’administrateur peuvent inviter.');
	}
	return actor;
}

export function createInvitation(
	actorProfileId: string,
	input: DemoInvitationInput
): DemoInvitation {
	const actor = requireInviter(actorProfileId);
	if (!EMAIL_PATTERN.test(input.email.trim())) {
		throw new DemoPermissionError('L’adresse e-mail est invalide.');
	}
	if (!isNonEmpty(input.firstName) || !isNonEmpty(input.lastName)) {
		throw new DemoPermissionError('Le prénom et le nom sont obligatoires.');
	}
	if (input.pupitreIds.length === 0) {
		throw new DemoPermissionError('Choisissez au moins un pupitre.');
	}
	const email = input.email.trim().toLowerCase();
	if (
		demo.invitations.some(
			(invitation) => invitation.email === email && invitation.status === 'pending'
		)
	) {
		throw new DemoPermissionError('Une invitation en attente existe déjà pour cette adresse.');
	}

	const invitation: DemoInvitation = {
		id: nextId('i', demo.invitations),
		email,
		firstName: input.firstName.trim(),
		lastName: input.lastName.trim(),
		pupitreIds: [...new Set(input.pupitreIds)],
		status: 'pending',
		sentAt: DEMO_TODAY,
		expiresAt: addDays(DEMO_TODAY, 7),
		invitedBy: actor.id
	};

	demo.invitations = [invitation, ...demo.invitations];
	demo.persist();
	return invitation;
}

export function resendInvitation(actorProfileId: string, invitationId: string): void {
	requireInviter(actorProfileId);
	const invitation = demo.invitations.find((item) => item.id === invitationId);
	if (!invitation) throw new DemoPermissionError('Invitation introuvable.');
	if (invitation.status === 'accepted') {
		throw new DemoPermissionError('Cette invitation a déjà été acceptée.');
	}
	invitation.sentAt = DEMO_TODAY;
	invitation.expiresAt = addDays(DEMO_TODAY, 7);
	invitation.status = 'pending';
	demo.persist();
}

export function cancelInvitation(actorProfileId: string, invitationId: string): void {
	requireInviter(actorProfileId);
	const invitation = demo.invitations.find((item) => item.id === invitationId);
	if (!invitation) throw new DemoPermissionError('Invitation introuvable.');
	invitation.status = 'cancelled';
	demo.persist();
}

export function invitationStatusLabel(status: DemoInvitation['status']): string {
	switch (status) {
		case 'pending':
			return 'En attente';
		case 'accepted':
			return 'Acceptée';
		case 'expired':
			return 'Expirée';
		case 'cancelled':
			return 'Annulée';
	}
}
