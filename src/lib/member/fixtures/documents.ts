import type { DemoDocument } from '../types';

/** Documents fictifs : métadonnées uniquement, aucun fichier réel n’est stocké. */
export const DEMO_DOCUMENTS: DemoDocument[] = [
	{
		id: 'd01',
		title: 'Réglement intérieur 2026',
		description: 'Version approuvée en assemblée générale. À lire par tous les adhérents.',
		pupitreId: null,
		fileName: 'reglement-interieur-2026.pdf',
		mimeType: 'application/pdf',
		sizeBytes: 348_160,
		uploadedBy: 'p02',
		uploadedAt: '2026-11-05'
	},
	{
		id: 'd02',
		title: 'Partitions — set de concours bombarde',
		description: 'Trois morceaux du set de concours, avec les ornements annotés.',
		pupitreId: 'bombarde',
		fileName: 'partitions-concours-bombarde.pdf',
		mimeType: 'application/pdf',
		sizeBytes: 1_204_224,
		uploadedBy: 'p03',
		uploadedAt: '2026-11-08'
	},
	{
		id: 'd03',
		title: 'Partitions — medley fest-noz cornemuse',
		description: 'Medley de fest-noz, tonalités et réglages d’anche.',
		pupitreId: 'cornemuse',
		fileName: 'medley-fest-noz-cornemuse.pdf',
		mimeType: 'application/pdf',
		sizeBytes: 986_112,
		uploadedBy: 'p03',
		uploadedAt: '2026-11-07'
	},
	{
		id: 'd04',
		title: 'Grille de caisse claire — niveau bagadig',
		description: 'Exercices et grilles de travail pour les élèves du bagadig.',
		pupitreId: 'caisse-claire',
		fileName: 'grilles-caisse-claire-bagadig.pdf',
		mimeType: 'application/pdf',
		sizeBytes: 512_000,
		uploadedBy: 'p04',
		uploadedAt: '2026-10-28'
	},
	{
		id: 'd05',
		title: 'Plan de scène — Fest-noz de décembre',
		description: 'Implantation des pupitres, retours et conduites micro.',
		pupitreId: null,
		fileName: 'plan-scene-fest-noz-decembre.pdf',
		mimeType: 'application/pdf',
		sizeBytes: 734_003,
		uploadedBy: 'p02',
		uploadedAt: '2026-11-02'
	},
	{
		id: 'd06',
		title: 'Fiche technique — concert de la Sainte-Cécile',
		description: 'Besoins techniques, horaires de montage et contacts sur place.',
		pupitreId: null,
		fileName: 'fiche-technique-sainte-cecile.pdf',
		mimeType: 'application/pdf',
		sizeBytes: 421_888,
		uploadedBy: 'p02',
		uploadedAt: '2026-11-09'
	}
];
