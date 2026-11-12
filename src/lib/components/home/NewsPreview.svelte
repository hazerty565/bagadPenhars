<script lang="ts">
	import { ArrowUpRight } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import ArticleCard from '$lib/components/articles/ArticleCard.svelte';
	import type { Dictionary, Lang } from '$lib/i18n';
	import type { PublicArticle } from '$lib/types';

	let { t, lang, articles }: { t: Dictionary; lang: Lang; articles: PublicArticle[] } = $props();

	const visible = $derived(articles.slice(0, 3));
</script>

<section class="bg-sable/50 py-16 sm:py-20" aria-labelledby="home-news-title">
	<div class="container-page">
		<div class="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
			<div>
				<p class="eyebrow">
					<span class="h-px w-8 bg-or" aria-hidden="true"></span>
					{t.articles.home.eyebrow}
				</p>
				<h2
					id="home-news-title"
					class="mt-4 font-serif text-3xl leading-tight text-marine sm:text-4xl"
				>
					{t.articles.home.title}
				</h2>
				<p class="mt-3 max-w-xl text-sm leading-relaxed text-ink/65">
					{t.articles.home.lead}
				</p>
			</div>

			<a
				href={resolve('/(public)/[lang=lang]/articles', { lang })}
				class="inline-flex items-center gap-2 self-start border-b border-marine/30 pb-1 text-sm font-semibold text-marine transition-colors hover:border-marine sm:self-auto"
			>
				{t.articles.home.cta}
				<ArrowUpRight class="h-4 w-4" aria-hidden="true" />
			</a>
		</div>

		{#if visible.length === 0}
			<div class="mt-10 border border-ink/10 bg-white px-6 py-8">
				<p class="font-serif text-xl text-marine">{t.articles.emptyTitle}</p>
				<p class="mt-2 text-sm leading-relaxed text-ink/65">{t.articles.emptyText}</p>
			</div>
		{:else}
			<ul class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
				{#each visible as article (article.slug)}
					<li class="h-full">
						<ArticleCard {article} {lang} {t} />
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</section>
