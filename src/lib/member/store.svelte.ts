import type {
	MemberAlbum,
	MemberArticle,
	MemberDocument,
	MemberEvent,
	MemberInvitation,
	MemberNotification,
	MemberPreferences,
	MemberProfile,
	MemberResponse,
	MemberSettings,
	MemberSnapshot
} from './types';

/**
 * Instantané serveur de l'espace adhérents.
 *
 * Le client ne construit plus aucun état métier : chaque `load` serveur et
 * chaque mutation renvoient une photographie filtrée par PostgreSQL (RLS) et
 * par le rôle du profil connecté. Le store ne fait que la conserver pour
 * l'affichage.
 *
 * Aucune donnée n'est persistée dans le navigateur : le rechargement d'une
 * page recharge l'instantané depuis `/api/member` ou depuis le `load` du
 * layout, et la déconnexion vide l'état.
 */

export type MemberNoticeKind = 'success' | 'error' | 'info';

export interface MemberNotice {
	kind: MemberNoticeKind;
	text: string;
}

/** Erreur renvoyée par l'API membre, porteuse du statut HTTP. */
export class MemberApiError extends Error {
	readonly status: number;
	readonly code: string | null;

	constructor(message: string, status = 500, code: string | null = null) {
		super(message);
		this.name = 'MemberApiError';
		this.status = status;
		this.code = code;
	}
}

const EMPTY_PROFILE: MemberProfile = {
	id: '',
	firstName: '',
	lastName: '',
	email: '',
	role: 'member',
	accountStatus: 'pending',
	level: 'bagad',
	bureauPosition: null,
	pupitres: [],
	avatar: 1,
	joinedAt: ''
};

const EMPTY_SETTINGS: MemberSettings = {
	associationName: 'Bagad Penhars',
	email: '',
	address: '',
	website: '',
	storageUsedBytes: 0,
	storageQuotaBytes: 0,
	storageAlertBytes: 0,
	notifyOnEventCreate: true,
	notifyReminderDays: 3
};

class MemberStore {
	/** Dernier instantané reçu du serveur, ou `null` avant le premier chargement. */
	snapshot = $state<MemberSnapshot | null>(null);

	/** Message de retour éphémère affiché par la coquille. */
	notice = $state<MemberNotice | null>(null);

	/** Vrai pendant qu'une commande est en cours. */
	pending = $state(false);

	get ready(): boolean {
		return this.snapshot !== null;
	}

	get profile(): MemberProfile {
		return this.snapshot?.profile ?? EMPTY_PROFILE;
	}

	/** Alias historique utilisé par les pages. */
	get activeProfile(): MemberProfile {
		return this.profile;
	}

	get activeProfileId(): string {
		return this.profile.id;
	}

	get profiles(): MemberProfile[] {
		return this.snapshot?.profiles ?? [];
	}

	get events(): MemberEvent[] {
		return this.snapshot?.events ?? [];
	}

	get responses(): MemberResponse[] {
		return this.snapshot?.responses ?? [];
	}

	get notifications(): MemberNotification[] {
		return this.snapshot?.notifications ?? [];
	}

	get documents(): MemberDocument[] {
		return this.snapshot?.documents ?? [];
	}

	get articles(): MemberArticle[] {
		return this.snapshot?.articles ?? [];
	}

	get albums(): MemberAlbum[] {
		return this.snapshot?.albums ?? [];
	}

	get invitations(): MemberInvitation[] {
		return this.snapshot?.invitations ?? [];
	}

	get preferences(): MemberPreferences[] {
		return this.snapshot?.preferences ?? [];
	}

	get settings(): MemberSettings {
		return this.snapshot?.settings ?? EMPTY_SETTINGS;
	}

	applySnapshot(snapshot: MemberSnapshot): void {
		this.snapshot = snapshot;
	}

	/** Vide l'état après déconnexion. */
	clear(): void {
		this.snapshot = null;
	}

	notify(kind: MemberNoticeKind, text: string): void {
		this.notice = { kind, text };
	}

	clearNotice(): void {
		this.notice = null;
	}

	/** Exécute une commande serveur et applique l'instantané renvoyé. */
	async request<T = unknown>(action: string, payload: unknown = {}): Promise<T> {
		this.pending = true;
		try {
			const response = await fetch('/api/member/action', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ action, payload })
			});
			const body = (await response.json().catch(() => null)) as {
				message?: string;
				code?: string;
				snapshot?: MemberSnapshot;
				result?: T;
			} | null;

			if (!response.ok) {
				throw new MemberApiError(
					body?.message ?? 'L’action n’a pas pu être enregistrée.',
					response.status,
					body?.code ?? null
				);
			}

			if (body?.snapshot) this.applySnapshot(body.snapshot);
			return (body?.result ?? null) as T;
		} finally {
			this.pending = false;
		}
	}

	/** Recharge l'instantané depuis le serveur. */
	async refresh(): Promise<void> {
		const response = await fetch('/api/member', { headers: { accept: 'application/json' } });
		if (!response.ok) {
			throw new MemberApiError('Impossible de recharger l’espace adhérents.', response.status);
		}
		const body = (await response.json()) as { snapshot?: MemberSnapshot };
		if (body.snapshot) this.applySnapshot(body.snapshot);
	}

	/** Réinitialise l'affichage à partir du serveur. */
	async reset(): Promise<void> {
		await this.refresh();
		this.notify('info', 'Les données ont été rechargées depuis le serveur.');
	}
}

export const member = new MemberStore();
