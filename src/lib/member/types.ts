import type { AppRole } from '$lib/auth/roles';

/**
 * Types miroirs du modèle de `docs/database.md`.
 *
 * Ils portent les mêmes noms de champs que les futures entités serveur afin
 * que le remplacement des services de démonstration par Neon/Drizzle ne
 * change pas les composants d'interface.
 *
 * Toutes les données sont fictives. Aucune information personnelle réelle ne
 * doit être ajoutée dans ce dossier.
 */

export type DemoPupitreId = 'bombarde' | 'cornemuse' | 'caisse-claire' | 'percussion';

export type DemoLevel = 'skolaj' | 'bagadig' | 'bagad';

export type DemoEventType =
	| 'sortie'
	| 'concert'
	| 'fest-noz'
	| 'festival'
	| 'concours'
	| 'gala'
	| 'repetition'
	| 'reunion'
	| 'repas';

export type DemoEventVisibility = 'public' | 'interne' | 'pupitre';

export type DemoEventStatus = 'active' | 'cancelled';

export type DemoResponseStatus = 'present' | 'absent';

export type DemoNotificationAudience = 'all' | 'pupitre' | 'profiles';

export type DemoArticleStatus = 'draft' | 'published';

export type DemoInvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';

export interface DemoProfilePupitre {
	pupitreId: DemoPupitreId;
	isChef: boolean;
}

export interface DemoProfile {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	role: AppRole;
	accountStatus: 'active';
	level: DemoLevel;
	/** Fonction au bureau, informative : ne donne aucun droit. */
	bureauPosition: string | null;
	pupitres: DemoProfilePupitre[];
	/** Identifiant de palette du portrait illustré (1 à 12). */
	avatar: number;
	joinedAt: string;
}

export interface DemoEvent {
	id: string;
	title: string;
	description: string;
	/** Date civile `YYYY-MM-DD`, sans heure (docs/event.md). */
	date: string;
	type: DemoEventType;
	visibility: DemoEventVisibility;
	isPoll: boolean;
	status: DemoEventStatus;
	/** Vide = tous les pupitres (événement global). */
	pupitreIds: DemoPupitreId[];
	createdBy: string;
	location: string;
}

export interface DemoResponse {
	eventId: string;
	profileId: string;
	status: DemoResponseStatus;
	updatedAt: string;
}

export interface DemoNotification {
	id: string;
	title: string;
	body: string;
	createdAt: string;
	audience: DemoNotificationAudience;
	/** Pupitres ou profils ciblés selon `audience`. */
	audienceIds: string[];
	sentBy: string;
	/** Profils ayant lu la notification. */
	readBy: string[];
}

export interface DemoDocument {
	id: string;
	title: string;
	description: string;
	/** `null` = document commun à tous les pupitres. */
	pupitreId: DemoPupitreId | null;
	fileName: string;
	mimeType: string;
	sizeBytes: number;
	uploadedBy: string;
	uploadedAt: string;
}

export interface DemoArticle {
	id: string;
	title: string;
	slug: string;
	excerpt: string;
	contentMarkdown: string;
	status: DemoArticleStatus;
	authorId: string;
	publishedAt: string | null;
	updatedAt: string;
}

export interface DemoMedia {
	id: string;
	albumId: string;
	src: string;
	alt: string;
	caption: string;
	order: number;
}

export interface DemoAlbum {
	id: string;
	title: string;
	description: string;
	date: string;
	published: boolean;
	photos: DemoMedia[];
}

export interface DemoInvitation {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	pupitreIds: DemoPupitreId[];
	status: DemoInvitationStatus;
	sentAt: string;
	expiresAt: string;
	invitedBy: string;
}

export interface DemoPreferences {
	profileId: string;
	/** Notifications générales de l'association. */
	global: boolean;
	/** Rappels avant les événements. */
	reminders: boolean;
	/** Notifications liées aux événements de ses pupitres. */
	events: boolean;
}

export interface DemoSettings {
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

export interface DemoState {
	version: number;
	activeProfileId: string;
	profiles: DemoProfile[];
	events: DemoEvent[];
	responses: DemoResponse[];
	notifications: DemoNotification[];
	documents: DemoDocument[];
	articles: DemoArticle[];
	albums: DemoAlbum[];
	invitations: DemoInvitation[];
	preferences: DemoPreferences[];
	settings: DemoSettings;
}

export interface DemoPupitre {
	id: DemoPupitreId;
	name: string;
	description: string;
}

/** Identifiant du profil utilisé pour la première visite. */
export const DEFAULT_PROFILE_ID = 'p06';
