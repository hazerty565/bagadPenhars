<script lang="ts">
	import { page } from '$app/state';
	import About from '$lib/components/home/About.svelte';
	import AgendaPreview from '$lib/components/home/AgendaPreview.svelte';
	import GalleryPreview from '$lib/components/home/GalleryPreview.svelte';
	import Hero from '$lib/components/home/Hero.svelte';
	import Join from '$lib/components/home/Join.svelte';
	import NewsPreview from '$lib/components/home/NewsPreview.svelte';
	import Pupitres from '$lib/components/home/Pupitres.svelte';
	import Prestations from '$lib/components/home/Prestations.svelte';
	import { getDict } from '$lib/i18n';
	import type { PageData } from './$types';

	export const prerender = true;

	// eslint-disable-next-line svelte/valid-prop-names-in-kit-pages
	let { data }: { data: PageData } = $props();

	const t = $derived(getDict(data.lang));
	const origin = $derived(page.url.origin);
	const canonical = $derived(`${origin}/${data.lang}`);
	const ogLocale = $derived(data.lang === 'fr' ? 'fr_FR' : data.lang === 'en' ? 'en_GB' : 'br_FR');
</script>

<svelte:head>
	<title>{t.meta.title}</title>
	<meta name="description" content={t.meta.description} />
	<link rel="canonical" href={canonical} />
	<link rel="alternate" hreflang="fr" href={`${origin}/fr`} />
	<link rel="alternate" hreflang="en" href={`${origin}/en`} />
	<link rel="alternate" hreflang="br" href={`${origin}/br`} />
	<link rel="alternate" hreflang="x-default" href={`${origin}/fr`} />

	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Bagad Penhars" />
	<meta property="og:title" content={t.meta.title} />
	<meta property="og:description" content={t.meta.description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:locale" content={ogLocale} />
	<meta property="og:image" content={`${origin}/hero.webp`} />

	<link rel="preload" as="image" href="/hero.webp" fetchpriority="high" />
</svelte:head>

<Hero {t} lang={data.lang} />
<About {t} lang={data.lang} />
<Pupitres {t} lang={data.lang} />
<Prestations {t} lang={data.lang} />
<AgendaPreview {t} lang={data.lang} events={data.nextPublicEvents} />
<NewsPreview {t} lang={data.lang} articles={data.latestArticles} />
<GalleryPreview {t} lang={data.lang} photos={data.galleryPhotos} />
<Join {t} lang={data.lang} />
