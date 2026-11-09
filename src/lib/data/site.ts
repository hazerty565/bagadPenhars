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
