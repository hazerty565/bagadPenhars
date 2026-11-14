import type { MemberInvitation, MemberPupitreId } from '../types';
import { canInviteAndActivate } from '$lib/auth/roles';
import { member } from '../store.svelte';
import { MemberPermissionError } from '../permissions';
import { isNonEmpty } from './helpers';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface MemberInvitationInput {
	email: string;
	firstName: string;
	lastName: string;
	pupitreIds: MemberPupitreId[];
}

function requireInviter() {
	if (!canInviteAndActivate(member.profile.role)) {
		throw new MemberPermissionError('Seuls la secrétaire et l’administrateur peuvent inviter.');
	}
}

export async function createInvitation(
	_actorProfileId: string,
	input: MemberInvitationInput
): Promise<void> {
	requireInviter();
	if (!EMAIL_PATTERN.test(input.email.trim())) {
		throw new MemberPermissionError('L’adresse e-mail est invalide.');
	}
	if (!isNonEmpty(input.firstName) || !isNonEmpty(input.lastName)) {
		throw new MemberPermissionError('Le prénom et le nom sont obligatoires.');
	}
	if (input.pupitreIds.length === 0) {
		throw new MemberPermissionError('Choisissez au moins un pupitre.');
	}

	await member.request('invitation.create', {
		email: input.email.trim().toLowerCase(),
		firstName: input.firstName.trim(),
		lastName: input.lastName.trim(),
		pupitreIds: [...new Set(input.pupitreIds)]
	});
}

export async function resendInvitation(
	_actorProfileId: string,
	invitationId: string
): Promise<void> {
	requireInviter();
	await member.request('invitation.resend', { invitationId });
}

export async function cancelInvitation(
	_actorProfileId: string,
	invitationId: string
): Promise<void> {
	requireInviter();
	await member.request('invitation.cancel', { invitationId });
}

export function invitationStatusLabel(status: MemberInvitation['status']): string {
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
