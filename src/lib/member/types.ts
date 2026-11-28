import type { AccountStatus, AppRole } from '$lib/auth/roles';

/**
 * Types de l'espace adhérents.
 *
 * Ils reprennent les noms de champs utilisés par les composants depuis la
 * première maquette, mais les données viennent désormais de Neon (snapshot
 * serveur filtré par le rôle du profil connecté) et non plus du `localStorage`.
 */

export type MemberPupitreId = 'bombarde' | 'cornemuse' | 'caisse-claire' | 'percussion';

export type MemberLevel = 'skolaj' | 'bagadig' | 'bagad';

export type MemberEventType =
	| 'sortie'
	| 'concert'
	| 'fest-noz'
	| 'festival'
	| 'concours'
	| 'gala'
	| 'repetition'
	| 'reunion'
	| 'repas';

export type MemberEventVisibility = 'public' | 'interne' | 'pupitre';

export type MemberEventStatus = 'active' | 'cancelled';

export type MemberResponseStatus = 'present' | 'absent';

export type MemberNotificationAudience = 'all' | 'pupitre' | 'profiles';

export type MemberArticleStatus = 'draft' | 'published';

export type MemberInvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';

export interface MemberProfilePupitre {
	pupitreId: MemberPupitreId;
	isChef: boolean;
}

export interface MemberProfile {
	id: string;
	firstName: string;
	lastName: string;
	/** Vide pour les lignes issues de l'annuaire restreint (autres membres). */
	email: string;
	role: AppRole;
	accountStatus: AccountStatus;
	level: MemberLevel;
	/** Fonction au bureau, informative : ne donne aucun droit. */
	bureauPosition: string | null;
	pupitres: MemberProfilePupitre[];
	/** Identifiant de palette du portrait illustré (1 à 12). */
	avatar: number;
	joinedAt: string;
}

export interface MemberEvent {
	id: string;
	title: string;
	description: string;
	/** Date civile `YYYY-MM-DD`, sans heure (docs/event.md). */
	date: string;
	type: MemberEventType;
	visibility: MemberEventVisibility;
	isPoll: boolean;
	status: MemberEventStatus;
	/** Vide = tous les pupitres (événement global). */
	pupitreIds: MemberPupitreId[];
	createdBy: string;
	location: string;
}

export interface MemberResponse {
	eventId: string;
	profileId: string;
	status: MemberResponseStatus;
	updatedAt: string;
}

export interface MemberNotification {
	id: string;
	title: string;
	body: string;
	createdAt: string;
	audience: MemberNotificationAudience;
	/** Pupitres ou profils ciblés selon `audience`. */
	audienceIds: string[];
	sentBy: string;
	/** Profils ayant lu la notification. */
	readBy: string[];
}

export interface MemberDocument {
	id: string;
	title: string;
	description: string;
	/** `null` = document commun à tous les pupitres. */
	pupitreId: MemberPupitreId | null;
	fileName: string;
	mimeType: string;
	sizeBytes: number;
	uploadedBy: string;
	uploadedAt: string;
}

export interface MemberArticle {
	id: string;
	title: string;
	slug: string;
	excerpt: string;
	contentMarkdown: string;
	status: MemberArticleStatus;
	authorId: string;
	publishedAt: string | null;
	updatedAt: string;
}

export interface MemberMedia {
	id: string;
	albumId: string;
	src: string;
	alt: string;
	caption: string;
	order: number;
}

export interface MemberAlbum {
	id: string;
	title: string;
	description: string;
	date: string;
	published: boolean;
	photos: MemberMedia[];
}

export interface MemberInvitation {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	pupitreIds: MemberPupitreId[];
	status: MemberInvitationStatus;
	sentAt: string;
	expiresAt: string;
	invitedBy: string;
}

export interface MemberPreferences {
	profileId: string;
	/** Notifications générales de l'association. */
	global: boolean;
	/** Rappels avant les événements. */
	reminders: boolean;
	/** Notifications liées aux événements de ses pupitres. */
	events: boolean;
}

export interface MemberSettings {
	associationName: string;
	email: string;
	address: string;
	website: string;
	storageUsedBytes: number;
	storageQuotaBytes: number;
	storageAlertBytes: number;
	notifyOnEventCreate: boolean;
	notifyReminderDays: number;
}

export interface MemberPupitre {
	id: MemberPupitreId;
	name: string;
	description: string;
}

/**
 * Types de chargement ciblé par page (étapes 58 à 73).
 *
 * Chaque page de l'espace adhérents charge son propre DTO, contenant uniquement
 * les champs qu'elle affiche. Aucun instantané complet n'est plus renvoyé.
 */

/** Profil de la session — sous-ensemble lisible sur toutes les pages privées. */
export interface SessionProfile {
	id: string;
	firstName: string;
	lastName: string;
	avatarUrl: string | null;
	level: MemberLevel | null;
	bureauPosition: string | null;
	pupitres: Array<{ pupitreId: MemberPupitreId }>;
}

/** Socle chargé par le layout : profil de session + compteur de notifications non lues. */
export interface MemberShell {
	profile: MemberProfile;
	unreadCount: number;
}

/** Sections de page possibles pour le chargement ciblé (§7.11 du contrat). */
export type PageSection =
	| 'overview'
	| 'agenda'
	| 'event'
	| 'eventForm'
	| 'directory'
	| 'pupitre'
	| 'documents'
	| 'notifications'
	| 'profile'
	| 'adminOverview'
	| 'adminMembers'
	| 'adminInvitations'
	| 'adminArticles'
	| 'adminMedia'
	| 'adminNotifications'
	| 'adminSettings';

/** Enveloppe de réponse d'une page : section identifiée + données ciblées. */
export interface MemberPageEnvelope<S extends PageSection = PageSection, D = unknown> {
	memberPage: { section: S; data: D };
}

/** Événement avec réponse de l'acteur courant et agrégats de réponses. */
export interface MemberEventPageItem extends MemberEvent {
	myResponse: MemberResponseStatus | null;
	responseSummary: { present: number; absent: number; total: number };
}

export interface AgendaPageData {
	events: MemberEventPageItem[];
}

export interface OverviewPageData {
	events: MemberEventPageItem[];
	notifications: MemberNotification[];
	documentsCount: number;
}

export interface EventDetailPageData {
	event: MemberEventPageItem;
	profiles: DirectoryProfile[];
	responses: MemberResponse[];
}

export interface EventFormPageData {
	event: MemberEvent | null;
	canManage: boolean;
	canEditVisibility: boolean;
	canEditPupitres: boolean;
	canDelete: boolean;
}

export interface EventPageContext {
	role: AppRole;
	pupitres: Array<{ id: string; name: string; slug: string }>;
}

export interface DirectoryProfile {
	id: string;
	firstName: string;
	lastName: string;
	avatar: number;
	avatarUrl: string | null;
	pupitres: Array<{ pupitreId: MemberPupitreId }>;
	level: MemberLevel;
	bureauPosition: string | null;
}

/** Re-exports des DTO de page pour le store et les composants. */
export type {
	MemberAdminSummary,
	AdminMembersPageData
} from '$lib/server/member/queries/adminMembers';
export type { PupitreMember, PupitrePageData } from '$lib/server/member/queries/pupitre';
export type { AdminOverviewPageData } from '$lib/server/member/queries/adminOverview';
export type { ArticlesPageData } from '$lib/server/member/queries/articles';
