import type { DemoProfile } from '../types';

/**
 * 24 profils fictifs. Tous les noms, adresses et fonctions sont inventés.
 * Les adresses utilisent le domaine réservé `example.com`.
 */
export const DEMO_PROFILES: DemoProfile[] = [
	{
		id: 'p01',
		firstName: 'Yann',
		lastName: 'Le Goff',
		email: 'yann.le-goff@example.com',
		role: 'admin',
		accountStatus: 'active',
		level: 'bagad',
		bureauPosition: 'Président',
		pupitres: [
			{ pupitreId: 'bombarde', isChef: false },
			{ pupitreId: 'cornemuse', isChef: false }
		],
		avatar: 1,
		joinedAt: '2012-09-01'
	},
	{
		id: 'p02',
		firstName: 'Rozenn',
		lastName: "Kerloc'h",
		email: 'rozenn.kerloch@example.com',
		role: 'secretaire',
		accountStatus: 'active',
		level: 'bagad',
		bureauPosition: 'Secrétaire',
		pupitres: [
			{ pupitreId: 'cornemuse', isChef: false },
			{ pupitreId: 'caisse-claire', isChef: false }
		],
		avatar: 2,
		joinedAt: '2014-09-01'
	},
	{
		id: 'p03',
		firstName: 'Bleuenn',
		lastName: 'Le Roux',
		email: 'bleuenn.le-roux@example.com',
		role: 'chef_pupitre',
		accountStatus: 'active',
		level: 'bagad',
		bureauPosition: 'Cheffe de pupitre',
		pupitres: [
			{ pupitreId: 'bombarde', isChef: true },
			{ pupitreId: 'cornemuse', isChef: true }
		],
		avatar: 3,
		joinedAt: '2013-09-01'
	},
	{
		id: 'p04',
		firstName: 'Gwendal',
		lastName: "Guivarc'h",
		email: 'gwendal.guivarch@example.com',
		role: 'chef_pupitre',
		accountStatus: 'active',
		level: 'bagad',
		bureauPosition: 'Chef de pupitre',
		pupitres: [{ pupitreId: 'caisse-claire', isChef: true }],
		avatar: 4,
		joinedAt: '2015-09-01'
	},
	{
		id: 'p05',
		firstName: 'Soizic',
		lastName: 'Le Bris',
		email: 'soizic.le-bris@example.com',
		role: 'chef_pupitre',
		accountStatus: 'active',
		level: 'bagad',
		bureauPosition: 'Cheffe de pupitre',
		pupitres: [{ pupitreId: 'percussion', isChef: true }],
		avatar: 5,
		joinedAt: '2016-09-01'
	},
	{
		id: 'p06',
		firstName: 'Maël',
		lastName: 'Kerdraon',
		email: 'mael.kerdraon@example.com',
		role: 'member',
		accountStatus: 'active',
		level: 'bagad',
		bureauPosition: null,
		pupitres: [{ pupitreId: 'bombarde', isChef: false }],
		avatar: 6,
		joinedAt: '2018-09-01'
	},
	{
		id: 'p07',
		firstName: 'Annaïg',
		lastName: 'Jaffré',
		email: 'annaig.jaffre@example.com',
		role: 'member',
		accountStatus: 'active',
		level: 'bagadig',
		bureauPosition: null,
		pupitres: [
			{ pupitreId: 'bombarde', isChef: false },
			{ pupitreId: 'cornemuse', isChef: false }
		],
		avatar: 7,
		joinedAt: '2021-09-01'
	},
	{
		id: 'p08',
		firstName: 'Tanguy',
		lastName: "Le Floc'h",
		email: 'tanguy.le-floch@example.com',
		role: 'member',
		accountStatus: 'active',
		level: 'bagad',
		bureauPosition: null,
		pupitres: [{ pupitreId: 'cornemuse', isChef: false }],
		avatar: 8,
		joinedAt: '2017-09-01'
	},
	{
		id: 'p09',
		firstName: 'Nolwenn',
		lastName: 'Salaün',
		email: 'nolwenn.salaun@example.com',
		role: 'member',
		accountStatus: 'active',
		level: 'bagad',
		bureauPosition: null,
		pupitres: [
			{ pupitreId: 'cornemuse', isChef: false },
			{ pupitreId: 'caisse-claire', isChef: false }
		],
		avatar: 9,
		joinedAt: '2019-09-01'
	},
	{
		id: 'p10',
		firstName: 'Erwan',
		lastName: 'Morvan',
		email: 'erwan.morvan@example.com',
		role: 'member',
		accountStatus: 'active',
		level: 'bagad',
		bureauPosition: null,
		pupitres: [{ pupitreId: 'percussion', isChef: false }],
		avatar: 10,
		joinedAt: '2016-09-01'
	},
	{
		id: 'p11',
		firstName: 'Lenaïg',
		lastName: 'Quéméneur',
		email: 'lenaig.quemeneur@example.com',
		role: 'member',
		accountStatus: 'active',
		level: 'bagadig',
		bureauPosition: null,
		pupitres: [{ pupitreId: 'caisse-claire', isChef: false }],
		avatar: 11,
		joinedAt: '2022-09-01'
	},
	{
		id: 'p12',
		firstName: 'Gaël',
		lastName: 'Le Gall',
		email: 'gael.le-gall@example.com',
		role: 'member',
		accountStatus: 'active',
		level: 'skolaj',
		bureauPosition: null,
		pupitres: [{ pupitreId: 'bombarde', isChef: false }],
		avatar: 12,
		joinedAt: '2024-09-01'
	},
	{
		id: 'p13',
		firstName: 'Aziliz',
		lastName: 'Cariou',
		email: 'aziliz.cariou@example.com',
		role: 'member',
		accountStatus: 'active',
		level: 'skolaj',
		bureauPosition: null,
		pupitres: [{ pupitreId: 'cornemuse', isChef: false }],
		avatar: 13,
		joinedAt: '2024-09-01'
	},
	{
		id: 'p14',
		firstName: 'Ronan',
		lastName: 'Le Bihan',
		email: 'ronan.le-bihan@example.com',
		role: 'member',
		accountStatus: 'active',
		level: 'bagad',
		bureauPosition: null,
		pupitres: [
			{ pupitreId: 'percussion', isChef: false },
			{ pupitreId: 'bombarde', isChef: false }
		],
		avatar: 14,
		joinedAt: '2015-09-01'
	},
	{
		id: 'p15',
		firstName: 'Katell',
		lastName: 'Riou',
		email: 'katell.riou@example.com',
		role: 'member',
		accountStatus: 'active',
		level: 'bagadig',
		bureauPosition: null,
		pupitres: [{ pupitreId: 'percussion', isChef: false }],
		avatar: 15,
		joinedAt: '2022-09-01'
	},
	{
		id: 'p16',
		firstName: 'Loïc',
		lastName: 'Pennarun',
		email: 'loic.pennarun@example.com',
		role: 'member',
		accountStatus: 'active',
		level: 'bagad',
		bureauPosition: null,
		pupitres: [{ pupitreId: 'caisse-claire', isChef: false }],
		avatar: 16,
		joinedAt: '2014-09-01'
	},
	{
		id: 'p17',
		firstName: 'Maiwenn',
		lastName: 'Le Corre',
		email: 'maiwenn.le-corre@example.com',
		role: 'member',
		accountStatus: 'active',
		level: 'bagad',
		bureauPosition: null,
		pupitres: [
			{ pupitreId: 'bombarde', isChef: false },
			{ pupitreId: 'caisse-claire', isChef: false }
		],
		avatar: 17,
		joinedAt: '2018-09-01'
	},
	{
		id: 'p18',
		firstName: 'Youenn',
		lastName: 'Abgrall',
		email: 'youenn.abgrall@example.com',
		role: 'member',
		accountStatus: 'active',
		level: 'bagadig',
		bureauPosition: null,
		pupitres: [{ pupitreId: 'cornemuse', isChef: false }],
		avatar: 18,
		joinedAt: '2023-09-01'
	},
	{
		id: 'p19',
		firstName: 'Solenn',
		lastName: 'Derrien',
		email: 'solenn.derrien@example.com',
		role: 'member',
		accountStatus: 'active',
		level: 'bagad',
		bureauPosition: null,
		pupitres: [{ pupitreId: 'percussion', isChef: false }],
		avatar: 19,
		joinedAt: '2019-09-01'
	},
	{
		id: 'p20',
		firstName: 'Ewen',
		lastName: 'Le Saux',
		email: 'ewen.le-saux@example.com',
		role: 'member',
		accountStatus: 'active',
		level: 'skolaj',
		bureauPosition: null,
		pupitres: [{ pupitreId: 'caisse-claire', isChef: false }],
		avatar: 20,
		joinedAt: '2025-09-01'
	},
	{
		id: 'p21',
		firstName: 'Morgane',
		lastName: 'Guillou',
		email: 'morgane.guillou@example.com',
		role: 'member',
		accountStatus: 'active',
		level: 'bagad',
		bureauPosition: null,
		pupitres: [
			{ pupitreId: 'cornemuse', isChef: false },
			{ pupitreId: 'percussion', isChef: false }
		],
		avatar: 21,
		joinedAt: '2017-09-01'
	},
	{
		id: 'p22',
		firstName: 'Alan',
		lastName: 'Crozon',
		email: 'alan.crozon@example.com',
		role: 'member',
		accountStatus: 'active',
		level: 'bagad',
		bureauPosition: null,
		pupitres: [{ pupitreId: 'bombarde', isChef: false }],
		avatar: 22,
		joinedAt: '2016-09-01'
	},
	{
		id: 'p23',
		firstName: 'Fanny',
		lastName: 'Le Ster',
		email: 'fanny.le-ster@example.com',
		role: 'member',
		accountStatus: 'active',
		level: 'bagadig',
		bureauPosition: null,
		pupitres: [{ pupitreId: 'caisse-claire', isChef: false }],
		avatar: 23,
		joinedAt: '2023-09-01'
	},
	{
		id: 'p24',
		firstName: 'Hugo',
		lastName: 'Berthou',
		email: 'hugo.berthou@example.com',
		role: 'member',
		accountStatus: 'active',
		level: 'skolaj',
		bureauPosition: null,
		pupitres: [{ pupitreId: 'percussion', isChef: false }],
		avatar: 24,
		joinedAt: '2025-09-01'
	}
];
