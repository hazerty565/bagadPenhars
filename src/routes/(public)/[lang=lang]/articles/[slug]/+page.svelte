<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { ArrowLeft, ArrowUpRight } from '@lucide/svelte';
	import ArticleCard from '$lib/components/articles/ArticleCard.svelte';
	import { getDict, LOCALES } from '$lib/i18n';
	import { formatArticleDate } from '$lib/utils';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const t = $derived(getDict(data.lang));
	const a = $derived(t.articles);
	const article = $derived(data.article);
	const date = $derived(formatArticleDate(article.date, LOCALES[data.lang]));

	const allHref = $derived(resolve('/(public)/[lang=lang]/articles', { lang: data.lang }));
	const origin = $derived(page.url.origin);
	const canonical = $derived(`${origin}/${data.lang}/articles/${article.slug}`);
</script>

<svelte:head>
	<title>{article.title} — Bagad Penhars</title>
	<meta name="description" content={article.excerpt} />
	<link rel="canonical" href={canonical} />
	<link rel="alternate" hreflang="fr" href={`${origin}/fr/articles/${article.slug}`} />
	<link rel="alternate" hreflang="en" href={`${origin}/en/articles/${article.slug}`} />
	<link rel="alternate" hreflang="br" href={`${origin}/br/articles/${article.slug}`} />
	<link rel="alternate" hreflang="x-default" href={`${origin}/fr/articles/${article.slug}`} />

	<meta property="og:type" content="article" />
	<meta property="og:site_name" content="Bagad Penhars" />
	<meta property="og:title" content={article.title} />
	<meta property="og:description" content={article.excerpt} />
	<meta property="og:url" content={canonical} />
	<meta property="og:image" content={`${origin}${article.image}`} />
	<meta property="article:published_time" content={`${article.date}T12:00:00Z`} />
</svelte:head>

<section class="bg-ivoire pb-10 pt-12 sm:pb-12 sm:pt-16">
	<div class="container-page">
		<a
			href={allHref}
			class="inline-flex items-center gap-2 text-sm font-semibold text-marine/80 transition-colors hover:text-marine"
		>
			<ArrowLeft class="h-4 w-4" aria-hidden="true" />
			{a.back}
		</a>

		<div class="mt-8 max-w-3xl">
			<p class="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-or-dark">
				{article.category}
			</p>

			<h1
				class="mt-4 font-serif text-4xl leading-[1.05] tracking-[-0.01em] text-marine sm:text-5xl"
			>
				{article.title}
			</h1>

			<time datetime={article.date} class="mt-5 block text-sm text-ink/50">
				{a.publishedOn}
				{date}
			</time>

			<p class="mt-6 max-w-2xl text-base leading-relaxed text-ink/75 sm:text-lg">
				{article.excerpt}
			</p>
		</div>

		<figure class="mt-10 sm:mt-12">
			<img
				src={article.image}
				alt={article.imageAlt}
				width="1440"
				height="900"
				loading="eager"
				fetchpriority="high"
				decoding="async"
				class="aspect-[16/10] w-full bg-sable/40 object-cover"
			/>
		</figure>
	</div>
</section>

<section class="bg-white py-14 sm:py-16">
	<div class="container-page">
		<article class="mx-auto max-w-3xl">
			{#each article.content as block, index (index)}
				{#if block.heading}
					<h2 class="mt-10 font-serif text-2xl leading-snug text-marine first:mt-0 sm:text-3xl">
						{block.heading}
					</h2>
				{/if}

				{#each block.paragraphs as paragraph (paragraph)}
					<p class="mt-4 text-base leading-relaxed text-ink/75">{paragraph}</p>
				{/each}
			{/each}

			<div class="mt-12 border-t border-ink/10 pt-6">
				<a
					href={allHref}
					class="inline-flex items-center gap-2 text-sm font-semibold text-marine transition-colors hover:text-or-dark"
				>
					<ArrowLeft class="h-4 w-4" aria-hidden="true" />
					{a.back}
				</a>
			</div>
		</article>
	</div>
</section>

{#if data.related.length > 0}
	<section class="bg-sable/50 py-14 sm:py-16" aria-labelledby="articles-related-title">
		<div class="container-page">
			<div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<h2
					id="articles-related-title"
					class="font-serif text-2xl leading-tight text-marine sm:text-3xl"
				>
					{a.moreTitle}
				</h2>

				<a
					href={allHref}
					class="inline-flex items-center gap-2 self-start border-b border-marine/30 pb-1 text-sm font-semibold text-marine transition-colors hover:border-marine sm:self-auto"
				>
					{a.back}
					<ArrowUpRight class="h-4 w-4" aria-hidden="true" />
				</a>
			</div>

			<ul class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
				{#each data.related as item (item.slug)}
					<li class="h-full">
						<ArticleCard article={item} lang={data.lang} {t} />
					</li>
				{/each}
			</ul>
		</div>
	</section>
{/if}
