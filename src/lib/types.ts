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

export interface PublicPhoto {
	id: string;
	caption: string | null;
	sortOrder: number;
	thumbnailUrl: string;
	fullUrl: string;
}
