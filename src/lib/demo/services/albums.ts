import { demo } from '../store.svelte';
import type { DemoAlbum, DemoMedia } from '../types';
import { canManageContents, DemoPermissionError } from '../permissions';
import { actorFor, isNonEmpty, nextId } from './helpers';

export interface DemoAlbumInput {
	title: string;
	description: string;
	date: string;
	published: boolean;
}

export interface DemoPhotoInput {
	src: string;
	alt: string;
	caption: string;
}

/** Visuels autorisés : uniquement des photographies déjà publiques du site. */
export const DEMO_PHOTO_LIBRARY: { src: string; alt: string }[] = [
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

function requireContentManager(actorProfileId: string) {
	const actor = actorFor(actorProfileId);
	if (!canManageContents(actor)) {
		throw new DemoPermissionError('Seuls la secrétaire et l’administrateur gèrent les albums.');
	}
	return actor;
}

export function saveAlbum(
	actorProfileId: string,
	input: DemoAlbumInput,
	albumId: string | null = null
): DemoAlbum {
	requireContentManager(actorProfileId);
	if (!isNonEmpty(input.title, 3)) {
		throw new DemoPermissionError('Le titre de l’album doit contenir au moins trois caractères.');
	}
	const existing = albumId ? demo.albums.find((album) => album.id === albumId) : null;
	if (albumId && !existing) throw new DemoPermissionError('Album introuvable.');

	if (existing) {
		existing.title = input.title.trim();
		existing.description = input.description.trim();
		existing.date = input.date;
		existing.published = input.published;
		demo.persist();
		return existing;
	}

	const album: DemoAlbum = {
		id: nextId('al', demo.albums),
		title: input.title.trim(),
		description: input.description.trim(),
		date: input.date,
		published: input.published,
		photos: []
	};
	demo.albums = [...demo.albums, album];
	demo.persist();
	return album;
}

export function addPhoto(
	actorProfileId: string,
	albumId: string,
	input: DemoPhotoInput
): DemoMedia {
	requireContentManager(actorProfileId);
	const album = demo.albums.find((item) => item.id === albumId);
	if (!album) throw new DemoPermissionError('Album introuvable.');
	if (!DEMO_PHOTO_LIBRARY.some((photo) => photo.src === input.src)) {
		throw new DemoPermissionError('Seuls les visuels de la galerie publique sont autorisés.');
	}
	if (!isNonEmpty(input.alt, 5)) {
		throw new DemoPermissionError('Le texte alternatif est obligatoire.');
	}

	const photo: DemoMedia = {
		id: nextId(
			'm',
			demo.albums.flatMap((item) => item.photos)
		),
		albumId,
		src: input.src,
		alt: input.alt.trim(),
		caption: input.caption.trim() || input.alt.trim(),
		order: album.photos.length + 1
	};
	album.photos.push(photo);
	demo.persist();
	return photo;
}

export function removePhoto(actorProfileId: string, albumId: string, photoId: string): void {
	requireContentManager(actorProfileId);
	const album = demo.albums.find((item) => item.id === albumId);
	if (!album) throw new DemoPermissionError('Album introuvable.');
	album.photos = album.photos
		.filter((photo) => photo.id !== photoId)
		.map((photo, index) => ({ ...photo, order: index + 1 }));
	demo.persist();
}

export function movePhoto(
	actorProfileId: string,
	albumId: string,
	photoId: string,
	direction: -1 | 1
): void {
	requireContentManager(actorProfileId);
	const album = demo.albums.find((item) => item.id === albumId);
	if (!album) throw new DemoPermissionError('Album introuvable.');
	const index = album.photos.findIndex((photo) => photo.id === photoId);
	const target = index + direction;
	if (index < 0 || target < 0 || target >= album.photos.length) return;
	const [photo] = album.photos.splice(index, 1);
	album.photos.splice(target, 0, photo);
	album.photos.forEach((item, position) => {
		item.order = position + 1;
	});
	demo.persist();
}

export function deleteAlbum(actorProfileId: string, albumId: string): void {
	requireContentManager(actorProfileId);
	demo.albums = demo.albums.filter((album) => album.id !== albumId);
	demo.persist();
}
