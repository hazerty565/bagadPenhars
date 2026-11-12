import type { DemoAlbum } from '../types';

/**
 * Albums fictifs. Les visuels sont des photographies déjà publiques du site
 * (`static/`) : aucune personne n’est nommée dans les légendes.
 */
export const DEMO_ALBUMS: DemoAlbum[] = [
	{
		id: 'al01',
		title: 'Concert de la Sainte-Cécile',
		description: 'Quelques images de la soirée au Théâtre de Cornouaille.',
		date: '2026-11-09',
		published: true,
		photos: [
			{
				id: 'm01',
				albumId: 'al01',
				src: '/IMG_0877.webp',
				alt: 'Le bagad en tenue sur scène, éclairé par les projecteurs.',
				caption: 'Le bagad en tenue, sur scène.',
				order: 1
			},
			{
				id: 'm02',
				albumId: 'al01',
				src: '/IMG_0878.webp',
				alt: 'Un musicien du bagad en pleine prestation.',
				caption: 'Prestation instrumentale.',
				order: 2
			},
			{
				id: 'm03',
				albumId: 'al01',
				src: '/IMG_0879.webp',
				alt: 'Vue du groupe pendant le concert.',
				caption: 'Le groupe pendant le concert.',
				order: 3
			}
		]
	},
	{
		id: 'al02',
		title: 'Répétitions à l’Espace Chaptal',
		description: 'Le travail des pupitres, semaine après semaine.',
		date: '2026-10-18',
		published: true,
		photos: [
			{
				id: 'm04',
				albumId: 'al02',
				src: '/IMG_0880.webp',
				alt: 'Grosse caisse et percussions en répétition.',
				caption: 'Travail de la grosse caisse.',
				order: 1
			},
			{
				id: 'm05',
				albumId: 'al02',
				src: '/IMG_0881.webp',
				alt: 'Practice pads et baguettes posés sur une table.',
				caption: 'Atelier de percussion.',
				order: 2
			},
			{
				id: 'm06',
				albumId: 'al02',
				src: '/IMG_0874.webp',
				alt: 'Pratique des practice chanters en cercle.',
				caption: 'Travail des practice chanters.',
				order: 3
			}
		]
	},
	{
		id: 'al03',
		title: 'Sortie de groupe',
		description: 'Album en préparation, non publié sur le site public.',
		date: '2026-11-02',
		published: false,
		photos: [
			{
				id: 'm07',
				albumId: 'al03',
				src: '/groupe_bagad.webp',
				alt: 'Photographie de groupe du bagad en extérieur.',
				caption: 'Photo de groupe.',
				order: 1
			},
			{
				id: 'm08',
				albumId: 'al03',
				src: '/couple_jeune.webp',
				alt: 'Deux musiciens du bagad en tenue.',
				caption: 'Deux instrumentistes.',
				order: 2
			}
		]
	}
];
