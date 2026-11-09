import { getDict, isLang, type Lang } from '$lib/i18n';
import { homeGallery } from '$lib/data/site';
import { PUPITRES } from '$lib/data/pupitres';
import type { PublicPhoto } from '$lib/types';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const lang: Lang = isLang(params.lang) ? params.lang : 'fr';
	const t = getDict(lang);

	/**
	 * Sélection provisoire : les albums publics (R2) ne sont pas encore
	 * branchés. Ces photographies réelles du dépôt seront remplacées par
	 * `galleryPhotos` issu des albums publiés dès l'étape médias.
	 */
	const galleryPhotos: PublicPhoto[] = homeGallery.map((photo, index) => ({
		id: photo.id,
		caption: t.gallery.captions[index] ?? photo.alt,
		sortOrder: index,
		thumbnailUrl: photo.src,
		fullUrl: photo.src
	}));

	return {
		lang,
		// Les événements publics seront branchés sur Neon à l'étape agenda.
		nextPublicEvents: [],
		galleryPhotos,
		pupitres: PUPITRES
	};
};
