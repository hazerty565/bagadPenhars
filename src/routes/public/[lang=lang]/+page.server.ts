import { homeGallery } from '$lib/data/site';
import { agendaSections } from '$lib/data/agenda';
import { latestArticles } from '$lib/data/articles';
import { type Lang } from '$lib/i18n';
import type { PublicPhoto, PublicEvent, PublicArticle } from '$lib/types';

export const load = async ({ params }: { params: { lang: Lang } }) => {
	const lang = params.lang;

	// Photos pour la galerie d'aperçu
	const galleryPhotos: PublicPhoto[] = homeGallery.map((photo, index) => ({
		id: photo.id,
		caption: photo.alt,
		sortOrder: index,
		thumbnailUrl: photo.src,
		fullUrl: photo.src
	}));

	// 2 prochains événements publics
	const { upcoming } = agendaSections();
	const upcomingEvents: PublicEvent[] = upcoming.slice(0, 2).map((event) => ({
		id: event.id,
		title: event.title,
		description: event.description,
		eventDate: event.eventDate,
		eventType: event.eventType,
		isPoll: event.isPoll,
		state: event.state
	}));

	// 3 derniers articles publiés
	const latestArticlesData: PublicArticle[] = latestArticles(lang, 3);

	return {
		lang,
		galleryPhotos,
		upcomingEvents,
		latestArticles: latestArticlesData
	};
};