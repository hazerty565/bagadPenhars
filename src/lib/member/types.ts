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

/**
 * Photographie complète de l'état visible par un profil.
 *
 * Elle est produite côté serveur dans une transaction dont le contexte RLS est
 * celui du profil : le client ne reçoit que ce que PostgreSQL l'autorise à
 * lire. Chaque mutation renvoie un nouveau snapshot.
 */
export interface MemberSnapshot {
	profile: MemberProfile;
	profiles: MemberProfile[];
	events: MemberEvent[];
	responses: MemberResponse[];
	notifications: MemberNotification[];
	documents: MemberDocument[];
	articles: MemberArticle[];
	albums: MemberAlbum[];
	invitations: MemberInvitation[];
	preferences: MemberPreferences[];
	settings: MemberSettings;
}

export interface MemberPupitre {
	id: MemberPupitreId;
	name: string;
	description: string;
}
