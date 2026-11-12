import { demo } from '../store.svelte';
import type { AppRole } from '$lib/auth/roles';
import type { DemoLevel, DemoProfilePupitre, DemoPupitreId } from '../types';
import {
	canChangeAvatar,
	canChangeRole,
	canEditMemberPupitres,
	canEditOwnProfile,
	DemoPermissionError
} from '../permissions';
import { actorFor, isNonEmpty, nowIso } from './helpers';

export interface OwnProfileInput {
	firstName: string;
	lastName: string;
	email: string;
	level: DemoLevel;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function updateOwnProfile(profileId: string, input: OwnProfileInput): void {
	const actor = actorFor(demo.activeProfileId);
	if (!canEditOwnProfile(actor, profileId)) {
		throw new DemoPermissionError('Vous ne pouvez modifier que votre propre profil.');
	}
	if (!isNonEmpty(input.firstName) || !isNonEmpty(input.lastName)) {
		throw new DemoPermissionError('Le prénom et le nom sont obligatoires.');
	}
	if (!EMAIL_PATTERN.test(input.email.trim())) {
		throw new DemoPermissionError('L’adresse e-mail est invalide.');
	}

	const profile = demo.profiles.find((item) => item.id === profileId);
	if (!profile) throw new DemoPermissionError('Profil introuvable.');

	const duplicate = demo.profiles.some(
		(item) => item.id !== profileId && item.email.toLowerCase() === input.email.trim().toLowerCase()
	);
	if (duplicate) {
		throw new DemoPermissionError(
			'Cette adresse e-mail est déjà utilisée par un autre profil fictif.'
		);
	}

	profile.firstName = input.firstName.trim();
	profile.lastName = input.lastName.trim();
	profile.email = input.email.trim().toLowerCase();
	profile.level = input.level;
	demo.persist();
}

export function updateAvatar(profileId: string, avatar: number): void {
	const actor = actorFor(demo.activeProfileId);
	if (!canChangeAvatar(actor, profileId)) {
		throw new DemoPermissionError('Chaque membre ne peut modifier que sa propre photo.');
	}
	if (!Number.isInteger(avatar) || avatar < 1 || avatar > 12) {
		throw new DemoPermissionError('Portrait invalide.');
	}
	const profile = demo.profiles.find((item) => item.id === profileId);
	if (!profile) throw new DemoPermissionError('Profil introuvable.');
	profile.avatar = avatar;
	demo.persist();
}

/** Met à jour les pupitres d’un autre membre (secrétaire ou admin). */
export function updateMemberPupitres(
	actorProfileId: string,
	targetProfileId: string,
	pupitres: DemoProfilePupitre[]
): void {
	const actor = actorFor(actorProfileId);
	if (!canEditMemberPupitres(actor, targetProfileId)) {
		throw new DemoPermissionError(
			'Seuls la secrétaire et l’administrateur peuvent modifier les pupitres d’un autre membre.'
		);
	}
	const target = demo.profiles.find((profile) => profile.id === targetProfileId);
	if (!target) throw new DemoPermissionError('Profil introuvable.');

	const seen = new Set<DemoPupitreId>();
	for (const item of pupitres) {
		if (seen.has(item.pupitreId)) {
			throw new DemoPermissionError('Un pupitre ne peut être affecté qu’une fois.');
		}
		seen.add(item.pupitreId);
	}

	if (target.role === 'chef_pupitre' && !pupitres.some((item) => item.isChef)) {
		throw new DemoPermissionError(
			'Un chef de pupitre doit conserver au moins un pupitre dirigé. Changez d’abord son rôle.'
		);
	}

	target.pupitres = pupitres;
	demo.persist();
}

/** Attribue un rôle applicatif (administrateur uniquement). */
export function assignRole(actorProfileId: string, targetProfileId: string, role: AppRole): void {
	const actor = actorFor(actorProfileId);
	if (!canChangeRole(actor)) {
		throw new DemoPermissionError('Seul l’administrateur peut attribuer un rôle.');
	}
	if (actor.id === targetProfileId) {
		throw new DemoPermissionError('Vous ne pouvez pas modifier votre propre rôle.');
	}
	const target = demo.profiles.find((profile) => profile.id === targetProfileId);
	if (!target) throw new DemoPermissionError('Profil introuvable.');

	if (role === 'chef_pupitre' && !target.pupitres.some((item) => item.isChef)) {
		if (target.pupitres.length === 0) {
			throw new DemoPermissionError(
				'Affectez d’abord un pupitre à ce membre avant de le nommer chef de pupitre.'
			);
		}
		target.pupitres = target.pupitres.map((item, index) => ({
			...item,
			isChef: index === 0 ? true : item.isChef
		}));
	}

	if (role !== 'chef_pupitre') {
		target.pupitres = target.pupitres.map((item) => ({ ...item, isChef: false }));
	}

	target.role = role;
	demo.persist();
}

/** Change le niveau musical d’un membre (secrétaire ou admin). */
export function updateMemberLevel(
	actorProfileId: string,
	targetProfileId: string,
	level: DemoLevel
): void {
	const actor = actorFor(actorProfileId);
	if (!canEditMemberPupitres(actor, targetProfileId) && actor.id !== targetProfileId) {
		throw new DemoPermissionError('Modification non autorisée.');
	}
	const target = demo.profiles.find((profile) => profile.id === targetProfileId);
	if (!target) throw new DemoPermissionError('Profil introuvable.');
	target.level = level;
	demo.persist();
}

export function updateBureauPosition(
	actorProfileId: string,
	targetProfileId: string,
	position: string
): void {
	const actor = actorFor(actorProfileId);
	if (!canChangeRole(actor)) {
		throw new DemoPermissionError('Seul l’administrateur peut modifier les fonctions du bureau.');
	}
	const target = demo.profiles.find((profile) => profile.id === targetProfileId);
	if (!target) throw new DemoPermissionError('Profil introuvable.');
	target.bureauPosition = position.trim() || null;
	demo.persist();
}

export function updatePreferences(
	profileId: string,
	preferences: { global: boolean; reminders: boolean; events: boolean }
): void {
	const actor = actorFor(demo.activeProfileId);
	if (actor.id !== profileId) {
		throw new DemoPermissionError('Vous ne pouvez modifier que vos propres préférences.');
	}
	const existing = demo.preferences.find((item) => item.profileId === profileId);
	if (existing) {
		existing.global = preferences.global;
		existing.reminders = preferences.reminders;
		existing.events = preferences.events;
	} else {
		demo.preferences.push({ profileId, ...preferences });
	}
	demo.persist();
}

export function touchProfile(profileId: string): string {
	const profile = demo.profiles.find((item) => item.id === profileId);
	if (!profile) return nowIso();
	return profile.joinedAt;
}
