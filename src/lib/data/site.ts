import type { PupitreKey } from '$lib/types';

/**
 * Informations publiques validées de l'association.
 *
 * Coordonnées et réseaux repris du site officiel https://bagad-penhars.com/
 * (à reconfirmer par le bureau avant mise en production).
 */
export const site = {
	name: 'Bagad Penhars',
	foundedYear: 1985,
	address: {
		street: '6 Av. des Oiseaux',
		postalCode: '29000',
		city: 'Quimper'
	},
	email: 'bagadpenhars@gmail.com',
	social: {
		facebook: 'https://www.facebook.com/bagadpenhars',
		instagram: 'https://www.instagram.com/bagad_penhars/'
	}
} as const;

export interface HomeGalleryItem {
	id: string;
	src: string;
	alt: string;
}

/**
 * Sélection provisoire pour l'aperçu de la galerie.
 *
 * Les albums publiés (R2) ne sont pas encore branchés ; ces photographies
 * réelles du dépôt seront remplacées par `galleryPhotos` issu des albums
 * publics dès que l'étape médias sera livrée.
 */
export const homeGallery: HomeGalleryItem[] = [
	{
		id: 'scene-2025',
		src: '/IMG_0877.webp',
		alt: 'Sonneurs de cornemuse et de bombarde et batteurs du Bagad Penhars sur scène'
	},
	{
		id: 'percussion',
		src: '/IMG_0880.webp',
		alt: 'Une joueuse de percussion devant la grosse caisse marquée du logo du Bagad Penhars'
	},
	{
		id: 'repetition',
		src: '/IMG_0881.webp',
		alt: 'Des membres du Bagad Penhars répètent les rudiments de percussion sur des padis'
	}
];

export const PUPITRE_KEYS: PupitreKey[] = ['bombarde', 'cornemuse', 'caisseClaire', 'percussion'];

export interface PupitreMascot {
	src: string;
	width: number;
	height: number;
}

/**
 * Les quatre mascottes réunies sur une seule image (composition 1000 × 900).
 *
 * Le fichier `static/mascottes-groupe.svg` est assemblé à partir des quatre
 * silhouettes fournies, sur deux rangs et sur une ligne de sol commune.
 */
export const MASCOTS_GROUP: PupitreMascot = {
	src: '/mascottes-groupe.svg',
	width: 1000,
	height: 900
};

/**
 * Mascottes des quatre pupitres, fournies par l'association.
 *
 * Ce sont des silhouettes noires vectorielles (1772 × 1772) sur fond blanc.
 * Elles sont posées avec `mix-blend-mode: multiply` pour que le fond blanc
 * disparaisse sur l'ivoire comme sur le blanc, sans découpe manuelle.
 */
export const PUPITRE_MASCOTS: Record<PupitreKey, PupitreMascot> = {
	bombarde: { src: '/mascotte_2.svg', width: 1772, height: 1772 },
	cornemuse: { src: '/mascotte_3.svg', width: 1772, height: 1772 },
	caisseClaire: { src: '/mascotte_4.svg', width: 1772, height: 1772 },
	percussion: { src: '/mascotte_1.svg', width: 1772, height: 1772 }
};

/**
 * Photographies d'illustration des quatre pupitres.
 *
 * Reprises de la page Formation du site officiel https://bagad-penhars.com/
 * et servies depuis `static/`. Les dimensions réelles sont déclarées pour
 * éviter tout décalage de mise en page au chargement.
 */
export const PUPITRE_PHOTOS: Record<PupitreKey, PupitreMascot> = {
	bombarde: { src: '/Formation_bombarde.webp', width: 960, height: 960 },
	cornemuse: { src: '/IMG_0874.webp', width: 2040, height: 1536 },
	caisseClaire: { src: '/IMG_0881.webp', width: 960, height: 960 },
	percussion: { src: '/IMG_0880.webp', width: 720, height: 960 }
};
