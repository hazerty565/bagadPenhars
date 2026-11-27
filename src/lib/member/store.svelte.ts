import { invalidateAll } from '$app/navigation';
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
	MemberShell,
	MemberPageEnvelope,
	PageSection
} from './types';

/**
 * Store de l'espace adhérents — chargement ciblé par section (étapes 58 à 73).
 *
 * Le layout charge le socle (`memberShell`) et chaque page charge ses données
 * (`memberPage`). Le store ne fait que conserver ces deux états et les exposer
 * via des getters dont les noms sont inchangés par rapport à l'ancien snapshot,
 * afin que les composants n'aient pas à être modifiés à cette étape.
 *
 * Aucune donnée n'est persistée dans le navigateur. La déconnexion vide l'état.
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
	/** Socle (profil de la session + unreadCount), chargé par le layout. */
	shell = $state<MemberShell | null>(null);

	/** Données de la page courante, chargées par le load de la page. */
	page = $state<MemberPageEnvelope | null>(null);

	/** Message de retour éphémère affiché par la coquille. */
	notice = $state<MemberNotice | null>(null);

	/** Vrai pendant qu'une commande est en cours. */
	pending = $state(false);

	get ready(): boolean {
		return this.shell !== null;
	}

	get profile(): MemberProfile {
		return this.shell?.profile ?? EMPTY_PROFILE;
	}

	/** Alias historique utilisé par les pages. */
	get activeProfile(): MemberProfile {
		return this.profile;
	}

	get activeProfileId(): string {
		return this.profile.id;
	}

	get profiles(): MemberProfile[] {
		const data = this.page?.memberPage.data as { profiles?: unknown } | undefined;
		if (data?.profiles) return data.profiles as MemberProfile[];
		return [];
	}

	get events(): MemberEvent[] {
		const data = this.page?.memberPage.data as { events?: unknown } | undefined;
		if (data?.events) return data.events as MemberEvent[];
		return [];
	}

	get responses(): MemberResponse[] {
		const data = this.page?.memberPage.data as { responses?: unknown } | undefined;
		if (data?.responses) return data.responses as MemberResponse[];
		return [];
	}

	get notifications(): MemberNotification[] {
		const data = this.page?.memberPage.data as { notifications?: unknown } | undefined;
		if (data?.notifications) return data.notifications as MemberNotification[];
		return [];
	}

	get documents(): MemberDocument[] {
		const data = this.page?.memberPage.data as { documents?: unknown } | undefined;
		if (data?.documents) return data.documents as MemberDocument[];
		return [];
	}

	get articles(): MemberArticle[] {
		const data = this.page?.memberPage.data as { articles?: unknown } | undefined;
		if (data?.articles) return data.articles as MemberArticle[];
		return [];
	}

	get albums(): MemberAlbum[] {
		const data = this.page?.memberPage.data as { albums?: unknown } | undefined;
		if (data?.albums) return data.albums as MemberAlbum[];
		return [];
	}

	get invitations(): MemberInvitation[] {
		const data = this.page?.memberPage.data as { invitations?: unknown } | undefined;
		if (data?.invitations) return data.invitations as MemberInvitation[];
		return [];
	}

	/** Préférences de notification de la page profil (objet unique → tableau pour compatibilité). */
	get preferences(): MemberPreferences[] {
		const data = this.page?.memberPage.data as
			| {
					preferences?: MemberPreferences | null;
			  }
			| undefined;
		if (data?.preferences) return [data.preferences];
		return [];
	}

	get settings(): MemberSettings {
		const data = this.page?.memberPage.data as
			| {
					settings?: MemberSettings;
			  }
			| undefined;
		return data?.settings ?? EMPTY_SETTINGS;
	}

	/** Définit le socle (appelé par le layout après son load). */
	applyShell(shell: MemberShell): void {
		this.shell = shell;
	}

	/** Définit les données de la page courante, remplace les précédentes. */
	applyPage<S extends PageSection, D>(envelope: MemberPageEnvelope<S, D>): void {
		this.page = envelope;
	}

	/** Vide les données de page (changement de route). Le socle est conservé. */
	clearPage(): void {
		this.page = null;
	}

	notify(kind: MemberNoticeKind, text: string): void {
		this.notice = { kind, text };
	}

	clearNotice(): void {
		this.notice = null;
	}

	/**
	 * Exécute une commande serveur via POST /api/member/action.
	 * Le retour n'est plus un instantané : le client revalide la page courante
	 * après la mutation et le load ciblé renvoie l'état à jour.
	 */
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
				data?: T;
			} | null;

			if (!response.ok) {
				throw new MemberApiError(
					body?.message ?? 'L’action n’a pas pu être enregistrée.',
					response.status,
					body?.code ?? null
				);
			}

			invalidateAll();
			return (body?.data ?? null) as T;
		} finally {
			this.pending = false;
		}
	}
}

export const member = new MemberStore();
