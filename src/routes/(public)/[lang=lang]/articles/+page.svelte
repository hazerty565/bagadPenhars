<script lang="ts">
	import { page } from '$app/state';
	import ArticleCard from '$lib/components/articles/ArticleCard.svelte';
	import { getDict } from '$lib/i18n';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const t = $derived(getDict(data.lang));
	const a = $derived(t.articles);

	const origin = $derived(page.url.origin);
	const canonical = $derived(`${origin}/${data.lang}/articles`);
</script>

<svelte:head>
	<title>{a.meta.title}</title>
	<meta name="description" content={a.meta.description} />
	<link rel="canonical" href={canonical} />
	<link rel="alternate" hreflang="fr" href={`${origin}/fr/articles`} />
	<link rel="alternate" hreflang="en" href={`${origin}/en/articles`} />
	<link rel="alternate" hreflang="br" href={`${origin}/br/articles`} />
	<link rel="alternate" hreflang="x-default" href={`${origin}/fr/articles`} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={a.meta.title} />
	<meta property="og:description" content={a.meta.description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:image" content={`${origin}/hero.webp`} />
</svelte:head>

<section class="bg-ivoire pb-12 pt-14 sm:pb-16 sm:pt-16 lg:pt-20">
	<div class="container-page">
		<div class="max-w-3xl">
			<p class="eyebrow">
				<span class="h-px w-8 bg-or" aria-hidden="true"></span>
				{a.eyebrow}
			</p>

			<h1
				class="mt-5 font-serif text-4xl leading-[1.03] tracking-[-0.01em] text-marine sm:text-5xl lg:text-6xl"
			>
				{a.title}
			</h1>

			<p class="mt-6 max-w-2xl text-base leading-relaxed text-ink/75 sm:text-lg">
				{a.lead}
			</p>
		</div>
	</div>
</section>

<section class="bg-white py-14 sm:py-20" aria-labelledby="articles-list-title">
	<div class="container-page">
		<h2 id="articles-list-title" class="sr-only">{a.eyebrow}</h2>

		{#if data.articles.length === 0}
			<div class="border-y border-ink/10 py-12">
				<p class="font-serif text-2xl text-marine">{a.emptyTitle}</p>
				<p class="mt-3 max-w-2xl text-sm leading-relaxed text-ink/65">{a.emptyText}</p>
			</div>
		{:else}
			<ul class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
				{#each data.articles as article, index (article.slug)}
					<li class="h-full">
						<ArticleCard {article} lang={data.lang} {t} eager={index < 3} />
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</section>
