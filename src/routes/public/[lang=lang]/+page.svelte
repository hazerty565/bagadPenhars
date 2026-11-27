<script lang="ts">
	import Hero from '$lib/components/home/Hero.svelte';
	import About from '$lib/components/home/About.svelte';
	import GalleryPreview from '$lib/components/home/GalleryPreview.svelte';
	import AgendaPreview from '$lib/components/home/AgendaPreview.svelte';
	import Prestations from '$lib/components/home/Prestations.svelte';
	import Join from '$lib/components/home/Join.svelte';
	import NewsPreview from '$lib/components/home/NewsPreview.svelte';
	import { getDict } from '$lib/i18n';
	import type { Lang } from '$lib/i18n';
	import type { PublicPhoto, PublicEvent, PublicArticle } from '$lib/types';

	let {
		data
	}: {
		data: {
			lang: Lang;
			galleryPhotos: PublicPhoto[];
			upcomingEvents: PublicEvent[];
			latestArticles: PublicArticle[];
		};
	} = $props();

	const t = $derived(getDict(data.lang));
</script>

<main>
	<Hero {t} lang={data.lang} />
	<About {t} lang={data.lang} />
	<GalleryPreview {t} lang={data.lang} photos={data.galleryPhotos} />
	<AgendaPreview {t} lang={data.lang} events={data.upcomingEvents} />
	<Prestations {t} lang={data.lang} />
	<NewsPreview {t} lang={data.lang} articles={data.latestArticles} />
	<Join {t} lang={data.lang} />
</main>
