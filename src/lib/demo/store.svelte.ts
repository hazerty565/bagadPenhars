import { browser } from '$app/environment';
import { createSeedState, DEMO_STATE_VERSION, validateDemoState } from './fixtures';
import type {
	DemoAlbum,
	DemoArticle,
	DemoDocument,
	DemoEvent,
	DemoInvitation,
	DemoNotification,
	DemoPreferences,
	DemoProfile,
	DemoResponse,
	DemoSettings,
	DemoState
} from './types';

/**
 * État réactif de la démonstration, persisté dans `localStorage`.
 *
 * Le store ne contient que des données fictives. Aucun secret, aucun jeton et
 * aucune donnée personnelle réelle ne doivent y être ajoutés.
 *
 * Les composants lisent le store ; les services sont les seuls à le muter,
 * après contrôle de permission.
 */

export const DEMO_STORAGE_KEY = 'bagadpenhars.demo.v1';

interface StoredEnvelope {
	version: number;
	state: DemoState;
}

function readStoredState(): { state: DemoState; notice: string | null } {
	if (!browser) return { state: createSeedState(), notice: null };

	let raw: string | null;
	try {
		raw = window.localStorage.getItem(DEMO_STORAGE_KEY);
	} catch {
		return {
			state: createSeedState(),
			notice: 'Le stockage local est indisponible : la démonstration reste en mémoire.'
		};
	}

	if (!raw) return { state: createSeedState(), notice: null };

	try {
		const parsed = JSON.parse(raw) as StoredEnvelope;
		if (parsed?.version !== DEMO_STATE_VERSION || !validateDemoState(parsed.state)) {
			return {
				state: createSeedState(),
				notice:
					'Les données enregistrées étaient illisibles : le jeu de démonstration a été rechargé.'
			};
		}
		return { state: parsed.state, notice: null };
	} catch {
		return {
			state: createSeedState(),
			notice:
				'Les données enregistrées étaient corrompues : le jeu de démonstration a été rechargé.'
		};
	}
}

export type DemoNoticeKind = 'success' | 'error' | 'info';

export interface DemoNotice {
	kind: DemoNoticeKind;
	text: string;
}

class DemoStore {
	version = $state(DEMO_STATE_VERSION);
	activeProfileId = $state<string>('p06');
	profiles = $state<DemoProfile[]>([]);
	events = $state<DemoEvent[]>([]);
	responses = $state<DemoResponse[]>([]);
	notifications = $state<DemoNotification[]>([]);
	documents = $state<DemoDocument[]>([]);
	articles = $state<DemoArticle[]>([]);
	albums = $state<DemoAlbum[]>([]);
	invitations = $state<DemoInvitation[]>([]);
	preferences = $state<DemoPreferences[]>([]);
	settings = $state<DemoSettings>(createSeedState().settings);

	/** Dernier message de retour affiché par l’interface. */
	notice = $state<DemoNotice | null>(null);
	/** Avertissement de stockage (localStorage indisponible ou plein). */
	storageNotice = $state<string | null>(null);

	constructor() {
		const { state, notice } = readStoredState();
		this.applyState(state);
		this.storageNotice = notice;
	}

	get activeProfile(): DemoProfile {
		return this.profiles.find((profile) => profile.id === this.activeProfileId) ?? this.profiles[0];
	}

	getState(): DemoState {
		return {
			version: this.version,
			activeProfileId: this.activeProfileId,
			profiles: this.profiles,
			events: this.events,
			responses: this.responses,
			notifications: this.notifications,
			documents: this.documents,
			articles: this.articles,
			albums: this.albums,
			invitations: this.invitations,
			preferences: this.preferences,
			settings: this.settings
		};
	}

	applyState(state: DemoState): void {
		this.version = state.version;
		this.activeProfileId = state.activeProfileId;
		this.profiles = state.profiles;
		this.events = state.events;
		this.responses = state.responses;
		this.notifications = state.notifications;
		this.documents = state.documents;
		this.articles = state.articles;
		this.albums = state.albums;
		this.invitations = state.invitations;
		this.preferences = state.preferences;
		this.settings = state.settings;
	}

	setActiveProfile(profileId: string): boolean {
		if (!this.profiles.some((profile) => profile.id === profileId)) return false;
		this.activeProfileId = profileId;
		this.persist();
		return true;
	}

	notify(kind: DemoNoticeKind, text: string): void {
		this.notice = { kind, text };
	}

	clearNotice(): void {
		this.notice = null;
	}

	persist(): void {
		if (!browser) return;
		try {
			// `structuredClone` échoue sur les proxys `$state` de Svelte : on
			// sérialise puis relit le JSON pour obtenir un objet simple et sûr.
			const state = JSON.parse(JSON.stringify(this.getState())) as DemoState;
			const envelope: StoredEnvelope = {
				version: DEMO_STATE_VERSION,
				state
			};
			window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(envelope));
			this.storageNotice = null;
		} catch {
			this.storageNotice =
				'La sauvegarde locale a échoué (stockage plein ou désactivé). Les modifications restent visibles jusqu’au rechargement.';
		}
	}

	/** Recharge le seed et prévient les autres onglets. */
	reset(): void {
		const state = createSeedState();
		this.applyState(state);
		this.notice = { kind: 'info', text: 'La démonstration a été réinitialisée.' };
		this.persist();
	}

	/**
	 * Synchronisation entre onglets : un changement de profil ou une mutation
	 * dans un autre onglet recharge l’état local. Retourne la fonction d’arrêt.
	 */
	startCrossTabSync(): () => void {
		if (!browser) return () => undefined;

		const onStorage = (event: StorageEvent) => {
			if (event.key !== DEMO_STORAGE_KEY || !event.newValue) return;
			try {
				const parsed = JSON.parse(event.newValue) as StoredEnvelope;
				if (parsed.version === DEMO_STATE_VERSION && validateDemoState(parsed.state)) {
					this.applyState(parsed.state);
				}
			} catch {
				// Ignore un message d’un autre onglet illisible.
			}
		};

		window.addEventListener('storage', onStorage);
		return () => window.removeEventListener('storage', onStorage);
	}
}

export const demo = new DemoStore();

/** Raccourci pratique pour les services. */
export function persistDemo(): void {
	demo.persist();
}
