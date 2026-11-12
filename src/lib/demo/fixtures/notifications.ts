import type { DemoNotification } from '../types';

/** Notifications fictives, lues et non lues. */
export const DEMO_NOTIFICATIONS: DemoNotification[] = [
	{
		id: 'n01',
		title: 'Répétition générale jeudi 12 novembre',
		body: 'La répétition de l’ensemble du bagad est avancée à 19 h. Merci de confirmer votre présence.',
		createdAt: '2026-11-09T08:15:00.000Z',
		audience: 'all',
		audienceIds: [],
		sentBy: 'p02',
		readBy: ['p01', 'p03', 'p06', 'p08']
	},
	{
		id: 'n02',
		title: 'Nouvelles partitions disponibles',
		body: 'Les partitions du set de concours sont déposées dans l’espace Documents, pupitre Bombarde.',
		createdAt: '2026-11-08T17:40:00.000Z',
		audience: 'pupitre',
		audienceIds: ['bombarde'],
		sentBy: 'p03',
		readBy: ['p03', 'p06']
	},
	{
		id: 'n03',
		title: 'Rappel : concert du 21 novembre',
		body: 'Rendez-vous à 19 h 30 au Théâtre de Cornouaille. Tenue complète et instruments accordés.',
		createdAt: '2026-11-07T10:00:00.000Z',
		audience: 'all',
		audienceIds: [],
		sentBy: 'p02',
		readBy: ['p03']
	},
	{
		id: 'n04',
		title: 'Sondage repas de fin d’année',
		body: 'Merci de répondre avant le 10 décembre pour permettre la réservation de la salle.',
		createdAt: '2026-11-06T19:20:00.000Z',
		audience: 'all',
		audienceIds: [],
		sentBy: 'p02',
		readBy: []
	},
	{
		id: 'n05',
		title: 'Réglement intérieur mis à jour',
		body: 'La version 2026 du réglement intérieur est disponible dans les documents communs.',
		createdAt: '2026-11-05T09:05:00.000Z',
		audience: 'all',
		audienceIds: [],
		sentBy: 'p01',
		readBy: ['p01', 'p02', 'p03', 'p04', 'p05', 'p06', 'p09', 'p10']
	},
	{
		id: 'n06',
		title: 'Réunion du bureau mercredi 18 novembre',
		body: 'Ordre du jour : budget 2027, calendrier des sorties, bilan du mois d’octobre.',
		createdAt: '2026-11-04T16:30:00.000Z',
		audience: 'profiles',
		audienceIds: ['p01', 'p02', 'p03', 'p04', 'p05'],
		sentBy: 'p01',
		readBy: ['p01']
	},
	{
		id: 'n07',
		title: 'Bienvenue sur l’espace adhérents',
		body: 'Cet espace est en démonstration : toutes les données sont fictives. Explorez librement les menus.',
		createdAt: '2026-11-03T12:00:00.000Z',
		audience: 'all',
		audienceIds: [],
		sentBy: 'p01',
		readBy: ['p06', 'p07', 'p08', 'p09', 'p10', 'p11', 'p12']
	},
	{
		id: 'n08',
		title: 'Photo de groupe disponible',
		body: 'La photo de groupe du festival est publiée dans les albums. Merci au photographe bénévole.',
		createdAt: '2026-11-01T11:15:00.000Z',
		audience: 'all',
		audienceIds: [],
		sentBy: 'p02',
		readBy: ['p01', 'p02', 'p03', 'p04', 'p05', 'p06', 'p07', 'p08', 'p09', 'p10']
	}
];
