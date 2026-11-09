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
