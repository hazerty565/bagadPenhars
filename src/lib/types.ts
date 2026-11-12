/**
 * Types partagés entre le serveur et le client.
 */

export interface ApiError {
	code: string;
	message: string;
	status: number;
}

export interface ApiSuccess<T = unknown> {
	success: true;
	data?: T;
	message?: string;
}

export interface PaginatedResponse<T> {
	items: T[];
	total: number;
	page: number;
	pageSize: number;
}

/** Types publics alignés sur `equipe/CONTRAT_API.md` (§3). */

export type PupitreKey = 'bombarde' | 'cornemuse' | 'caisseClaire' | 'percussion';

/**
 * Formats de prestation proposés aux organisateurs.
 *
 * Ces clés sont stables : elles servent d'identifiant dans les dictionnaires
 * i18n (`prestations.items`) et ne doivent pas être traduites.
 */
export const PRESTATION_KEYS = ['aubade', 'deambulation', 'fest-noz', 'couple-trio'] as const;

export type PrestationKey = (typeof PRESTATION_KEYS)[number];

export type EventType =
	| 'sortie'
	| 'concert'
	| 'fest-noz'
	| 'festival'
	| 'concours'
	| 'gala'
	| 'repetition'
	| 'reunion'
	| 'repas';

export type EventState = 'actif' | 'clos' | 'annule';

/**
 * Sujets proposés par le formulaire de contact public.
 *
 * Ces valeurs sont postées telles quelles : elles servent de contrat entre le
 * navigateur, le schéma Zod et l'action serveur. Elles ne doivent pas être
 * traduites ; les libellés affichés vivent dans `src/lib/i18n/`.
 */
export const CONTACT_SUBJECTS = [
	'adhesion',
	'information',
	'partenariat',
	'prestation',
	'autre'
] as const;

export type ContactSubject = (typeof CONTACT_SUBJECTS)[number];

export interface Pupitre {
	id: string;
	name: 'Bombarde' | 'Caisse claire' | 'Cornemuse' | 'Percussion';
}

export interface PublicEvent {
	id: string;
	title: string;
	description: string | null;
	eventDate: string; // YYYY-MM-DD
	eventType: EventType;
	isPoll: boolean;
	state: EventState;
}

/**
 * Événement public tel qu'affiché sur la page Agenda.
 *
 * Le lieu est un complément d'affichage : la table `events` ne le stocke pas
 * encore. Il vit donc dans la couche de données et devra être ajouté au schéma
 * (migration) lorsque l'agenda sera branché sur Neon — voir `docs/questions.md`.
 */
export interface PublicAgendaEvent extends PublicEvent {
	location: string;
}

export interface PublicPhoto {
	id: string;
	caption: string | null;
	sortOrder: number;
	thumbnailUrl: string;
	fullUrl: string;
}

/**
 * Bloc de contenu d'un article public.
 *
 * Les articles sont stockés en Markdown dans la future table `articles`.
 * En attendant le branchement sur Neon, la couche de données expose des
 * sections déjà structurées (titre intermédiaire facultatif + paragraphes)
 * pour éviter d'ajouter un analyseur Markdown au site public.
 */
export interface ArticleSection {
	heading?: string;
	paragraphs: string[];
}

export interface PublicArticle {
	slug: string;
	title: string;
	excerpt: string;
	category: string;
	date: string; // YYYY-MM-DD
	image: string;
	imageAlt: string;
	content: ArticleSection[];
}
