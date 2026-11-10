import type { EventType, PublicAgendaEvent } from '$lib/types';

/**
 * Agenda provisoire.
 *
 * Les événements ci-dessous reprennent ceux publiés sur le site officiel
 * `https://bagad-penhars.com/agenda` (relevé du 10 novembre 2026). Ils ne
 * proviennent pas de la base : ce sont des données d'attente, le temps que
 * l'agenda soit branché sur Neon. Toute modification ici est donc à reporter
 * dans la base une fois la table `events` reliée à la page.
 *
 * Les titres et les lieux sont des contenus (noms propres, noms de
 * manifestations) : ils ne sont pas traduits.
 */
interface AgendaSeed {
	id: string;
	title: string;
	eventDate: string; // YYYY-MM-DD
	eventType: EventType;
	location: string;
}

const AGENDA_SEED: AgendaSeed[] = [
	{
		id: 'passeurs-des-lumieres-2026-12-12',
		title: 'Passeurs des lumières',
		eventDate: '2026-12-12',
		eventType: 'sortie',
		location: 'Quimper'
	},
	{
		id: 'derriere-les-remparts-2026-08-06',
		title: 'Derrière les remparts – jeudi du jardin de l’évêché',
		eventDate: '2026-08-06',
		eventType: 'concert',
		location: 'Quimper'
	},
	{
		id: 'derriere-les-remparts-2026-07-30',
		title: 'Derrière les remparts – jeudi du jardin de l’évêché',
		eventDate: '2026-07-30',
		eventType: 'concert',
		location: 'Quimper'
	},
	{
		id: 'defile-cornouaille-2026-07-26',
		title: 'Défilé du festival de Cornouaille',
		eventDate: '2026-07-26',
		eventType: 'festival',
		location: 'Quimper'
	},
	{
		id: 'aubade-musicale-2026-07-24',
		title: 'Aubade musicale en soirée',
		eventDate: '2026-07-24',
		eventType: 'concert',
		location: 'Quimper'
	},
	{
		id: 'concours-ete-2026-07-11',
		title: 'Concours d’été 4e catégorie',
		eventDate: '2026-07-11',
		eventType: 'concours',
		location: 'Saint-Malo'
	},
	{
		id: 'mondial-pupilles-2026-05-17',
		title: 'Participation au Mondial Pupilles',
		eventDate: '2026-05-17',
		eventType: 'sortie',
		location: 'Plomelin'
	},
	{
		id: 'gouel-sonerion-2026-05-16',
		title: 'Gouel Sonerion Penn Ar Bed',
		eventDate: '2026-05-16',
		eventType: 'sortie',
		location: 'Jardin de l’évêché, Quimper'
	},
	{
		id: 'concours-vannes-2026-02-15',
		title: 'Concours 4e catégorie',
		eventDate: '2026-02-15',
		eventType: 'concours',
		location: 'Vannes'
	},
	{
		id: 'passeurs-des-lumieres-2025-12-13',
		title: 'Passeurs des lumières',
		eventDate: '2025-12-13',
		eventType: 'sortie',
		location: 'Quimper'
	},
	{
		id: 'inauguration-salle-2025-10-19',
		title: 'Inauguration de la nouvelle salle',
		eventDate: '2025-10-19',
		eventType: 'sortie',
		location: 'Quimper'
	}
];

/**
 * Date du jour en `Europe/Paris`, au format `YYYY-MM-DD`.
 *
 * La date est calculée côté serveur pour que le partage « à venir / passés »
 * ne dépende pas du fuseau du visiteur, et pour rester identique entre le
 * rendu serveur et l'hydratation.
 */
export function parisToday(now: Date = new Date()): string {
	return new Intl.DateTimeFormat('en-CA', {
		timeZone: 'Europe/Paris',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).format(now);
}

export interface AgendaSections {
	upcoming: PublicAgendaEvent[];
	past: PublicAgendaEvent[];
}

/**
 * Sépare l'agenda provisoire en événements à venir (du plus proche au plus
 * lointain) et événements passés (du plus récent au plus ancien).
 *
 * Un événement reste « actif » jusqu'à la fin de sa journée, conformément à
 * `docs/event.md` : il ne bascule dans les passés qu'à partir du lendemain.
 */
export function agendaSections(today: string = parisToday()): AgendaSections {
	const events = AGENDA_SEED.map<PublicAgendaEvent>((seed) => ({
		...seed,
		description: null,
		isPoll: false,
		state: seed.eventDate < today ? 'clos' : 'actif'
	}));

	const byDateAsc = (a: PublicAgendaEvent, b: PublicAgendaEvent) =>
		a.eventDate.localeCompare(b.eventDate) || a.title.localeCompare(b.title, 'fr');

	return {
		upcoming: events.filter((event) => event.state === 'actif').sort(byDateAsc),
		past: events.filter((event) => event.state === 'clos').sort((a, b) => byDateAsc(b, a))
	};
}
