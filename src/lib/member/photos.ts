/**
 * Visuels autorisés pour les albums.
 *
 * Liste pure, partagée par l'interface et par le serveur : un album ne peut
 * référencer que des photographies déjà publiques du site. Aucun téléversement
 * de fichier arbitraire n'est accepté.
 */

export interface MemberPhotoLibraryItem {
	src: string;
	alt: string;
}

export const MEMBER_PHOTO_LIBRARY: MemberPhotoLibraryItem[] = [
	{ src: '/IMG_0877.webp', alt: 'Le bagad en tenue sur scène, éclairé par les projecteurs.' },
	{ src: '/IMG_0878.webp', alt: 'Un musicien du bagad en pleine prestation.' },
	{ src: '/IMG_0879.webp', alt: 'Vue du groupe pendant un concert.' },
	{ src: '/IMG_0880.webp', alt: 'Grosse caisse et percussions en répétition.' },
	{ src: '/IMG_0881.webp', alt: 'Practice pads et baguettes posés sur une table.' },
	{ src: '/IMG_0874.webp', alt: 'Pratique des practice chanters en cercle.' },
	{ src: '/groupe_bagad.webp', alt: 'Photographie de groupe du bagad en extérieur.' },
	{ src: '/couple_jeune.webp', alt: 'Deux musiciens du bagad en tenue.' },
	{ src: '/couple_joueur.webp', alt: 'Deux instrumentistes sur scène.' },
	{ src: '/hero.webp', alt: 'Le bagad en prestation, vu depuis le public.' }
];

export function isAllowedPhoto(src: string): boolean {
	return MEMBER_PHOTO_LIBRARY.some((photo) => photo.src === src);
}
