import { demo } from '../store.svelte';
import type { DemoActor } from '../permissions';
import { actorOf, DemoPermissionError } from '../permissions';
import { demoDateToUtc } from '../clock';
import type { DemoProfile } from '../types';

/** Retourne l’acteur correspondant au profil actif. */
export function currentActor(): DemoActor {
	return actorOf(demo.activeProfile);
}

export function actorFor(profileId: string): DemoActor {
	const profile = demo.profiles.find((item) => item.id === profileId);
	if (!profile) throw new DemoPermissionError('Profil de démonstration inconnu.');
	return actorOf(profile);
}

export function requireProfile(profileId: string): DemoProfile {
	const profile = demo.profiles.find((item) => item.id === profileId);
	if (!profile) throw new DemoPermissionError('Profil de démonstration inconnu.');
	return profile;
}

/** Génère un identifiant unique lisible pour les entités de démonstration. */
export function nextId(prefix: string, existing: { id: string }[]): string {
	let index = existing.length + 1;
	let candidate = `${prefix}${String(index).padStart(2, '0')}`;
	const ids = new Set(existing.map((item) => item.id));
	while (ids.has(candidate)) {
		index += 1;
		candidate = `${prefix}${String(index).padStart(2, '0')}`;
	}
	return candidate;
}

export function nowIso(): string {
	return new Date().toISOString();
}

export function addDays(date: string, days: number): string {
	const value = demoDateToUtc(date);
	value.setUTCDate(value.getUTCDate() + days);
	return value.toISOString().slice(0, 10);
}

export function isNonEmpty(value: string, minimum = 1): boolean {
	return value.trim().length >= minimum;
}

export function slugify(value: string): string {
	return value
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 80);
}
