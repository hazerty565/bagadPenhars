import { member } from '../store.svelte';
import type { AccountStatus, AppRole } from '$lib/auth/roles';
import type { MemberLevel, MemberProfilePupitre, MemberPupitreId } from '../types';
import {
	actorOf,
	canChangeAvatar,
	canChangeRole,
	canEditMemberPupitres,
	canEditOwnProfile,
	canManageMembers,
	MemberPermissionError
} from '../permissions';
import { isNonEmpty } from './helpers';

/**
 * Commandes de profil.
 *
 * L'adresse e-mail est l'identité Better Auth : elle n'est pas modifiable
 * depuis l'espace adhérents. Le serveur refuse de la changer et l'interface
 * l'affiche en lecture seule.
 */

export interface OwnProfileInput {
	firstName: string;
	lastName: string;
	level: MemberLevel;
}

export async function updateOwnProfile(profileId: string, input: OwnProfileInput): Promise<void> {
	const actor = actorOf(member.profile);
	if (!canEditOwnProfile(actor, profileId)) {
		throw new MemberPermissionError('Vous ne pouvez modifier que votre propre profil.');
	}
	if (!isNonEmpty(input.firstName) || !isNonEmpty(input.lastName)) {
		throw new MemberPermissionError('Le prénom et le nom sont obligatoires.');
	}

	await member.request('profile.update', {
		firstName: input.firstName.trim(),
		lastName: input.lastName.trim(),
		level: input.level
	});
}

export async function updateAvatar(profileId: string, avatar: number): Promise<void> {
	const actor = actorOf(member.profile);
	if (!canChangeAvatar(actor, profileId)) {
		throw new MemberPermissionError('Chaque membre ne peut modifier que sa propre photo.');
	}
	if (!Number.isInteger(avatar) || avatar < 1 || avatar > 12) {
		throw new MemberPermissionError('Portrait invalide.');
	}
	await member.request('profile.avatar', { avatar });
}

/** Met à jour les pupitres d'un autre membre (secrétaire ou admin). */
export async function updateMemberPupitres(
	actorProfileId: string,
	targetProfileId: string,
	pupitres: MemberProfilePupitre[]
): Promise<void> {
	const actor = actorOf(member.profile);
	if (!canEditMemberPupitres(actor, targetProfileId)) {
		throw new MemberPermissionError(
			'Seuls la secrétaire et l’administrateur peuvent modifier les pupitres d’un autre membre.'
		);
	}
	const target = member.profiles.find((profile) => profile.id === targetProfileId);
	if (!target) throw new MemberPermissionError('Profil introuvable.');

	const seen = new Set<MemberPupitreId>();
	for (const item of pupitres) {
		if (seen.has(item.pupitreId)) {
			throw new MemberPermissionError('Un pupitre ne peut être affecté qu’une fois.');
		}
		seen.add(item.pupitreId);
	}

	if (target.role === 'chef_pupitre' && !pupitres.some((item) => item.isChef)) {
		throw new MemberPermissionError(
			'Un chef de pupitre doit conserver au moins un pupitre dirigé. Changez d’abord son rôle.'
		);
	}

	await member.request('member.pupitres', { profileId: targetProfileId, pupitres });
}

/** Attribue un rôle applicatif (administrateur uniquement). */
export async function assignRole(
	actorProfileId: string,
	targetProfileId: string,
	role: AppRole
): Promise<void> {
	const actor = actorOf(member.profile);
	if (!canChangeRole(actor)) {
		throw new MemberPermissionError('Seul l’administrateur peut attribuer un rôle.');
	}
	if (actor.id === targetProfileId) {
		throw new MemberPermissionError('Vous ne pouvez pas modifier votre propre rôle.');
	}
	const target = member.profiles.find((profile) => profile.id === targetProfileId);
	if (!target) throw new MemberPermissionError('Profil introuvable.');

	if (role === 'chef_pupitre' && !target.pupitres.some((item) => item.isChef)) {
		if (target.pupitres.length === 0) {
			throw new MemberPermissionError(
				'Affectez d’abord un pupitre à ce membre avant de le nommer chef de pupitre.'
			);
		}
	}

	await member.request('member.role', { profileId: targetProfileId, role });
}

/**
 * Change le statut d'un compte : activation après invitation, suspension ou
 * retour en attente (secrétaire ou administrateur).
 *
 * Un compte créé par invitation reste `pending` tant que le secrétariat ne
 * l'a pas activé : c'est cette transition qui autorise la connexion.
 */
export async function updateMemberStatus(
	actorProfileId: string,
	targetProfileId: string,
	status: AccountStatus
): Promise<void> {
	const actor = actorOf(member.profile);
	if (!canManageMembers(actor)) {
		throw new MemberPermissionError(
			'Seuls la secrétaire et l’administrateur peuvent changer le statut d’un compte.'
		);
	}
	if (actor.id === targetProfileId && status !== 'active') {
		throw new MemberPermissionError('Vous ne pouvez pas désactiver votre propre compte.');
	}
	await member.request('member.status', { profileId: targetProfileId, status });
}

/** Change le niveau musical d'un membre (secrétaire ou admin). */
export async function updateMemberLevel(
	actorProfileId: string,
	targetProfileId: string,
	level: MemberLevel
): Promise<void> {
	const actor = actorOf(member.profile);
	if (!canEditMemberPupitres(actor, targetProfileId) && actor.id !== targetProfileId) {
		throw new MemberPermissionError('Modification non autorisée.');
	}
	await member.request('member.level', { profileId: targetProfileId, level });
}

export async function updateBureauPosition(
	actorProfileId: string,
	targetProfileId: string,
	position: string
): Promise<void> {
	const actor = actorOf(member.profile);
	if (!canChangeRole(actor)) {
		throw new MemberPermissionError('Seul l’administrateur peut modifier les fonctions du bureau.');
	}
	await member.request('member.bureau', { profileId: targetProfileId, position: position.trim() });
}

export async function updatePreferences(
	profileId: string,
	preferences: { global: boolean; reminders: boolean; events: boolean }
): Promise<void> {
	if (member.profile.id !== profileId) {
		throw new MemberPermissionError('Vous ne pouvez modifier que vos propres préférences.');
	}
	await member.request('profile.preferences', preferences);
}
