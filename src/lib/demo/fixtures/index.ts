import type { DemoState } from '../types';
import { DEFAULT_PROFILE_ID } from '../types';
import { DEMO_ALBUMS } from './albums';
import { DEMO_ARTICLES } from './articles';
import { DEMO_DOCUMENTS } from './documents';
import { DEMO_EVENTS } from './events';
import { DEMO_INVITATIONS } from './invitations';
import { DEMO_NOTIFICATIONS } from './notifications';
import { DEMO_PROFILES } from './profiles';
import { DEMO_PREFERENCES, DEMO_SETTINGS } from './settings';
import { DEMO_RESPONSES } from './responses';

export const DEMO_STATE_VERSION = 1;

/**
 * Construit un état de démonstration neuf. Le clonage profond évite qu’une
 * mutation du store ne modifie les fixtures importées.
 */
export function createSeedState(): DemoState {
	return structuredClone({
		version: DEMO_STATE_VERSION,
		activeProfileId: DEFAULT_PROFILE_ID,
		profiles: DEMO_PROFILES,
		events: DEMO_EVENTS,
		responses: DEMO_RESPONSES,
		notifications: DEMO_NOTIFICATIONS,
		documents: DEMO_DOCUMENTS,
		articles: DEMO_ARTICLES,
		albums: DEMO_ALBUMS,
		invitations: DEMO_INVITATIONS,
		preferences: DEMO_PREFERENCES,
		settings: DEMO_SETTINGS
	});
}

/**
 * Contrôle d’intégrité référentielle du seed. Utilisé par les tests et au
 * chargement du store : un état incohérent est remplacé par le seed.
 */
export function validateDemoState(state: DemoState): boolean {
	if (!state || typeof state !== 'object') return false;
	if (state.version !== DEMO_STATE_VERSION) return false;
	if (!Array.isArray(state.profiles) || state.profiles.length === 0) return false;

	const profileIds = new Set(state.profiles.map((profile) => profile.id));
	const eventIds = new Set(state.events.map((event) => event.id));
	const albumIds = new Set(state.albums.map((album) => album.id));
	const pupitreIds = new Set(['bombarde', 'cornemuse', 'caisse-claire', 'percussion']);

	if (!profileIds.has(state.activeProfileId)) return false;

	const unique = <T>(items: T[], key: (item: T) => string) =>
		new Set(items.map(key)).size === items.length;

	if (!unique(state.profiles, (profile) => profile.id)) return false;
	if (!unique(state.events, (event) => event.id)) return false;
	if (!unique(state.documents, (document) => document.id)) return false;
	if (!unique(state.articles, (article) => article.id)) return false;
	if (!unique(state.invitations, (invitation) => invitation.id)) return false;
	if (!unique(state.notifications, (notification) => notification.id)) return false;

	for (const event of state.events) {
		if (!profileIds.has(event.createdBy)) return false;
		if (event.pupitreIds.some((id) => !pupitreIds.has(id))) return false;
	}

	for (const response of state.responses) {
		if (!eventIds.has(response.eventId)) return false;
		if (!profileIds.has(response.profileId)) return false;
		if (response.status !== 'present' && response.status !== 'absent') return false;
	}

	for (const album of state.albums) {
		for (const photo of album.photos) {
			if (photo.albumId !== album.id) return false;
		}
	}

	for (const media of state.albums.flatMap((album) => album.photos)) {
		if (!albumIds.has(media.albumId)) return false;
	}

	for (const document of state.documents) {
		if (document.pupitreId !== null && !pupitreIds.has(document.pupitreId)) return false;
	}

	for (const invitation of state.invitations) {
		if (invitation.pupitreIds.some((id) => !pupitreIds.has(id))) return false;
	}

	return true;
}
