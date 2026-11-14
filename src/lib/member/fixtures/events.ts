import type { DemoEvent } from '../types';

/**
 * 16 événements fictifs autour de la date de démonstration (2026-11-11) :
 * passés et verrouillés, à venir, annulés, sondage, publics, internes,
 * de pupitre et multi-pupitres.
 */
export const DEMO_EVENTS: DemoEvent[] = [
	{
		id: 'e01',
		title: 'Répétition générale',
		description:
			'Répétition de l’ensemble du bagad avant la série de concerts de novembre. Prévoir les partitions du set 2026.',
		date: '2026-11-12',
		type: 'repetition',
		visibility: 'interne',
		isPoll: false,
		status: 'active',
		pupitreIds: [],
		createdBy: 'p02',
		location: 'Espace Chaptal, Quimper'
	},
	{
		id: 'e02',
		title: 'Répétition bombarde',
		description: 'Mise en place des harmonies et travail des ornements sur le set de concours.',
		date: '2026-11-13',
		type: 'repetition',
		visibility: 'pupitre',
		isPoll: false,
		status: 'active',
		pupitreIds: ['bombarde'],
		createdBy: 'p03',
		location: 'Salle 1, Espace Chaptal'
	},
	{
		id: 'e03',
		title: 'Répétition cornemuse',
		description: 'Réglage des anches et répétition du medley de fest-noz.',
		date: '2026-11-14',
		type: 'repetition',
		visibility: 'pupitre',
		isPoll: false,
		status: 'active',
		pupitreIds: ['cornemuse'],
		createdBy: 'p03',
		location: 'Salle 2, Espace Chaptal'
	},
	{
		id: 'e04',
		title: 'Répétition percussion',
		description: 'Travail des breaks et des fins de morceaux.',
		date: '2026-11-15',
		type: 'repetition',
		visibility: 'pupitre',
		isPoll: false,
		status: 'active',
		pupitreIds: ['percussion'],
		createdBy: 'p05',
		location: 'Salle 1, Espace Chaptal'
	},
	{
		id: 'e05',
		title: 'Répétition caisse claire',
		description: 'Répétition des rythmes binaires et ternaires du répertoire.',
		date: '2026-11-16',
		type: 'repetition',
		visibility: 'pupitre',
		isPoll: false,
		status: 'active',
		pupitreIds: ['caisse-claire'],
		createdBy: 'p04',
		location: 'Salle 3, Espace Chaptal'
	},
	{
		id: 'e06',
		title: 'Répétition bombarde et caisse claire',
		description:
			'Passage commun des morceaux de concours, pupitres bombarde et caisse claire réunis.',
		date: '2026-11-20',
		type: 'repetition',
		visibility: 'pupitre',
		isPoll: false,
		status: 'active',
		pupitreIds: ['bombarde', 'caisse-claire'],
		createdBy: 'p02',
		location: 'Grande salle, Espace Chaptal'
	},
	{
		id: 'e07',
		title: 'Concert de la Sainte-Cécile',
		description:
			'Concert annuel du bagad. Rendez-vous à 19 h 30 pour l’échauffement, tenue complète et instruments accordés.',
		date: '2026-11-21',
		type: 'concert',
		visibility: 'public',
		isPoll: false,
		status: 'active',
		pupitreIds: [],
		createdBy: 'p02',
		location: 'Théâtre de Cornouaille, Quimper'
	},
	{
		id: 'e08',
		title: 'Repas de fin d’année',
		description:
			'Repas convivial de l’association. Répondez présent ou absent ; le nombre de convives sera arrêté le 10 décembre.',
		date: '2026-12-19',
		type: 'repas',
		visibility: 'interne',
		isPoll: true,
		status: 'active',
		pupitreIds: [],
		createdBy: 'p02',
		location: 'Salle des fêtes de Penhars'
	},
	{
		id: 'e09',
		title: 'Fest-noz de décembre',
		description: 'Prestation du bagad puis session ouverte. Départ groupé depuis l’Espace Chaptal.',
		date: '2026-12-05',
		type: 'fest-noz',
		visibility: 'public',
		isPoll: false,
		status: 'active',
		pupitreIds: [],
		createdBy: 'p02',
		location: 'Salle Omnisports, Quimper'
	},
	{
		id: 'e10',
		title: 'Sortie « Passeurs des lumières »',
		description:
			'Sortie publique au départ de Quimper. Prévoir un pique-nique et une tenue de scène.',
		date: '2026-12-12',
		type: 'sortie',
		visibility: 'public',
		isPoll: false,
		status: 'active',
		pupitreIds: [],
		createdBy: 'p02',
		location: 'Départ : place Saint-Corentin'
	},
	{
		id: 'e11',
		title: 'Réunion du bureau',
		description: 'Préparation du budget 2027 et calendrier des sorties du premier semestre.',
		date: '2026-11-18',
		type: 'reunion',
		visibility: 'interne',
		isPoll: false,
		status: 'active',
		pupitreIds: [],
		createdBy: 'p01',
		location: 'Salle du bureau, Espace Chaptal'
	},
	{
		id: 'e12',
		title: 'Concours de printemps',
		description: 'Concours national, catégorie bagad. Déplacement en car, départ le matin.',
		date: '2027-03-14',
		type: 'concours',
		visibility: 'interne',
		isPoll: false,
		status: 'active',
		pupitreIds: [],
		createdBy: 'p02',
		location: 'Lorient'
	},
	{
		id: 'e13',
		title: 'Gala de l’association',
		description: 'Soirée de gala avec les partenaires et les bénévoles. Tenue de cérémonie.',
		date: '2027-01-24',
		type: 'gala',
		visibility: 'public',
		isPoll: false,
		status: 'active',
		pupitreIds: [],
		createdBy: 'p02',
		location: 'Hôtel de ville, Quimper'
	},
	{
		id: 'e14',
		title: 'Répétition du 4 novembre',
		description: 'Répétition passée, conservée pour l’historique des présences.',
		date: '2026-11-04',
		type: 'repetition',
		visibility: 'interne',
		isPoll: false,
		status: 'active',
		pupitreIds: [],
		createdBy: 'p02',
		location: 'Espace Chaptal, Quimper'
	},
	{
		id: 'e15',
		title: 'Concert de Noël — annulé',
		description:
			'Concert annulé par l’organisateur. Les réponses restent visibles en lecture seule.',
		date: '2026-12-01',
		type: 'concert',
		visibility: 'public',
		isPoll: false,
		status: 'cancelled',
		pupitreIds: [],
		createdBy: 'p02',
		location: 'Place de la Résistance, Quimper'
	},
	{
		id: 'e16',
		title: 'Festival interceltique',
		description: 'Participation au festival. Programme détaillé communiqué en juin.',
		date: '2027-08-08',
		type: 'festival',
		visibility: 'public',
		isPoll: false,
		status: 'active',
		pupitreIds: [],
		createdBy: 'p02',
		location: 'Lorient'
	}
];
