import { member } from '../store.svelte';
import { actorOf, canManageContents, MemberPermissionError } from '../permissions';
import { isNonEmpty } from './helpers';

export interface MemberAlbumInput {
	title: string;
	description: string;
	date: string;
	published: boolean;
}

export interface MemberPhotoInput {
	src: string;
	alt: string;
	caption: string;
}

import { isAllowedPhoto } from '../photos';

export { MEMBER_PHOTO_LIBRARY } from '../photos';

function requireContentManager() {
	if (!canManageContents(actorOf(member.profile))) {
		throw new MemberPermissionError('Seuls la secrétaire et l’administrateur gèrent les albums.');
	}
}

export async function saveAlbum(
	_actorProfileId: string,
	input: MemberAlbumInput,
	albumId: string | null = null
): Promise<void> {
	requireContentManager();
	if (!isNonEmpty(input.title, 3)) {
		throw new MemberPermissionError('Le titre de l’album doit contenir au moins trois caractères.');
	}
	await member.request('album.save', {
		albumId,
		input: {
			title: input.title.trim(),
			description: input.description.trim(),
			date: input.date,
			published: input.published
		}
	});
}

export async function addPhoto(
	_actorProfileId: string,
	albumId: string,
	input: MemberPhotoInput
): Promise<void> {
	requireContentManager();
	if (!isAllowedPhoto(input.src)) {
		throw new MemberPermissionError('Seuls les visuels de la galerie publique sont autorisés.');
	}
	if (!isNonEmpty(input.alt, 5)) {
		throw new MemberPermissionError('Le texte alternatif est obligatoire.');
	}
	await member.request('album.photo.add', {
		albumId,
		photo: {
			src: input.src,
			alt: input.alt.trim(),
			caption: input.caption.trim() || input.alt.trim()
		}
	});
}

export async function removePhoto(
	_actorProfileId: string,
	albumId: string,
	photoId: string
): Promise<void> {
	requireContentManager();
	await member.request('album.photo.remove', { albumId, photoId });
}

export async function movePhoto(
	_actorProfileId: string,
	albumId: string,
	photoId: string,
	direction: -1 | 1
): Promise<void> {
	requireContentManager();
	await member.request('album.photo.move', { albumId, photoId, direction });
}

export async function deleteAlbum(_actorProfileId: string, albumId: string): Promise<void> {
	requireContentManager();
	await member.request('album.delete', { albumId });
}
