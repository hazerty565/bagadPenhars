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
	PageSection,
	MemberAdminSummary,
	DirectoryProfile,
	PupitreMember,
	AgendaPageData,
	OverviewPageData,
	AdminOverviewPageData,
	AdminMembersPageData,
	ArticlesPageData
} from './types';

/**
 * Store de l'espace adhérents — chargement ciblé par section (étapes 58 à 73).
 *
 * Le layout charge le socle (`memberShell`) et chaque page charge ses données
 * (`memberPage`). Le store expose des getters typés selon la section courante
 * pour que les composants accèdent aux bonnes clés des DTO.
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

	/** Section courante (pour le typage des getters). */
	get currentSection(): PageSection | null {
		return this.page?.memberPage.section ?? null;
	}

	// ——————————————————————————————————————————————————————————————————————
	// Getters pour les sections communes (profil membre)
	// ——————————————————————————————————————————————————————————————————————

	/** Événements : agenda + vue d'ensemble (MemberEventPageItem[]). */
	get events(): MemberEvent[] {
		if (!this.page) return [];
		const data = this.page.memberPage.data as AgendaPageData | OverviewPageData | undefined;
		if (data?.events) return data.events;
		return [];
	}

	/** Réponses RSVP de l'acteur courant. */
	get responses(): MemberResponse[] {
		if (!this.page) return [];
		const data = this.page.memberPage.data as { responses?: MemberResponse[] } | undefined;
		if (data?.responses) return data.responses;
		return [];
	}

	/** Notifications : overview + pupitre + admin. */
	get notifications(): MemberNotification[] {
		if (!this.page) return [];
		const data = this.page.memberPage.data as
			| OverviewPageData
			| { notifications?: MemberNotification[] }
			| undefined;
		if (data?.notifications) return data.notifications;
		return [];
	}

	/** Documents : overview + pupitre. */
	get documents(): MemberDocument[] {
		if (!this.page) return [];
		const data = this.page.memberPage.data as { documents?: MemberDocument[] } | undefined;
		if (data?.documents) return data.documents;
		return [];
	}

	/** Articles : admin articles. */
	get articles(): MemberArticle[] {
		if (!this.page) return [];
		const data = this.page.memberPage.data as ArticlesPageData | undefined;
		if (data?.articles) return data.articles;
		return [];
	}

	/** Albums : media. */
	get albums(): MemberAlbum[] {
		if (!this.page) return [];
		const data = this.page.memberPage.data as { albums?: MemberAlbum[] } | undefined;
		if (data?.albums) return data.albums;
		return [];
	}

	/** Invitations : admin invitations. */
	get invitations(): MemberInvitation[] {
		if (!this.page) return [];
		const data = this.page.memberPage.data as { invitations?: MemberInvitation[] } | undefined;
		if (data?.invitations) return data.invitations;
		return [];
	}

	/** Préférences de notification de la page profil. */
	get preferences(): MemberPreferences[] {
		if (!this.page) return [];
		const data = this.page.memberPage.data as
			| { preferences?: MemberPreferences | null }
			| undefined;
		if (data?.preferences) return [data.preferences];
		return [];
	}

	get settings(): MemberSettings {
		if (!this.page) return EMPTY_SETTINGS;
		const data = this.page.memberPage.data as { settings?: MemberSettings } | undefined;
		return data?.settings ?? EMPTY_SETTINGS;
	}

	// ——————————————————————————————————————————————————————————————————————
	// Getters spécifiques aux sections admin / pupitre (nouveaux DTO)
	// ——————————————————————————————————————————————————————————————————————

	/** Membres pour l'annuaire admin : MemberAdminSummary[] (clé `members` du DTO). */
	get adminMembers(): MemberAdminSummary[] {
		if (!this.page) return [];
		const data = this.page.memberPage.data as AdminMembersPageData | undefined;
		if (data?.members) return data.members;
		return [];
	}

	/** Nombre total de membres (admin). */
	get adminMembersCount(): number {
		if (!this.page) return 0;
		const data = this.page.memberPage.data as AdminMembersPageData | undefined;
		return data?.membersCount ?? 0;
	}

	/** Membres pour l'espace pupitre : PupitreMember[] (clé `members` du DTO pupitre). */
	get pupitreMembers(): PupitreMember[] {
		if (!this.page) return [];
		const data = this.page.memberPage.data as { members?: PupitreMember[] } | undefined;
		if (data?.members) return data.members;
		return [];
	}

	/** Comptage documents pupitre (clé `documentsCount`). */
	get pupitreDocumentsCount(): number {
		if (!this.page) return 0;
		const data = this.page.memberPage.data as { documentsCount?: number } | undefined;
		return data?.documentsCount ?? 0;
	}

	/** Compteur notifications non lues pupitre (clé `unreadCount`). */
	get pupitreUnreadCount(): number {
		if (!this.page) return 0;
		const data = this.page.memberPage.data as { unreadCount?: number } | undefined;
		return data?.unreadCount ?? 0;
	}

	/** Compteurs admin overview (clé `counts`). */
	get adminCounts(): AdminOverviewPageData['counts'] | null {
		if (!this.page) return null;
		const data = this.page.memberPage.data as AdminOverviewPageData | undefined;
		return data?.counts ?? null;
	}

	/** Stockage admin overview (clé `storage`). */
	get adminStorage(): AdminOverviewPageData['storage'] | null {
		if (!this.page) return null;
		const data = this.page.memberPage.data as AdminOverviewPageData | undefined;
		return data?.storage ?? null;
	}

	/** Auteurs distincts pour la page articles admin (clé `authors`, typés DirectoryProfile[]). */
	get authors(): DirectoryProfile[] {
		if (!this.page) return [];
		const data = this.page.memberPage.data as ArticlesPageData | undefined;
		if (data?.authors) return data.authors;
		return [];
	}

	/** Documents count pour la page overview membre (clé `documentsCount`). */
	get overviewDocumentsCount(): number {
		if (!this.page) return 0;
		const data = this.page.memberPage.data as OverviewPageData | undefined;
		return data?.documentsCount ?? 0;
	}

	/** Profils de l'annuaire (compatibilité avec l'ancien code qui utilisait `profiles`). */
	/** @deprecated Utiliser `adminMembers` ou `pupitreMembers` selon la section. */
	get profiles(): MemberProfile[] {
		// Fallback : si on a des adminMembers, les convertir en MemberProfile partiel
		if (this.currentSection === 'adminMembers' && this.adminMembers.length > 0) {
			return this.adminMembers.map((m) => ({
				id: m.id,
				firstName: m.firstName,
				lastName: m.lastName,
				email: m.email,
				role: m.role,
				accountStatus: m.accountStatus,
				level: m.level ?? 'bagad',
				bureauPosition: m.bureauPosition,
				pupitres: m.pupitres,
				avatar: m.avatar,
				joinedAt: m.joinedAt
			}));
		}
		// Pour la section pupitre, convertir pupitreMembers
		if (this.currentSection === 'pupitre' && this.pupitreMembers.length > 0) {
			return this.pupitreMembers.map((m) => ({
				id: m.id,
				firstName: m.firstName,
				lastName: m.lastName,
				email: '',
				role: 'member' as const,
				accountStatus: 'active' as const,
				level: m.level ?? 'bagad',
				bureauPosition: m.bureauPosition,
				pupitres: m.pupitres,
				avatar: m.avatar,
				joinedAt: ''
			}));
		}
		// Pour les autres sections, tenter l'ancien format
		const data = this.page?.memberPage.data as { profiles?: MemberProfile[] } | undefined;
		if (data?.profiles) return data.profiles;
		return [];
	}

	/** Membres du pupitre courant sous forme MemberProfile[] (pour compatibilité services). */
	get pupitreProfiles(): MemberProfile[] {
		if (this.currentSection !== 'pupitre' || this.pupitreMembers.length === 0) return [];
		return this.pupitreMembers.map((m) => ({
			id: m.id,
			firstName: m.firstName,
			lastName: m.lastName,
			email: '',
			role: 'member' as const,
			accountStatus: 'active' as const,
			level: m.level ?? 'bagad',
			bureauPosition: m.bureauPosition,
			pupitres: m.pupitres,
			avatar: m.avatar,
			joinedAt: ''
		}));
	}

	// ——————————————————————————————————————————————————————————————————————
	// Méthodes de mutation du store
	// ——————————————————————————————————————————————————————————————————————

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
