<script lang="ts">
	import { ArrowUpRight } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import { LOCALES, type Dictionary, type Lang } from '$lib/i18n';
	import type { PublicArticle } from '$lib/types';
	import { formatArticleDate } from '$lib/utils';

	let {
		article,
		lang,
		t,
		eager = false
	}: {
		article: PublicArticle;
		lang: Lang;
		t: Dictionary;
		eager?: boolean;
	} = $props();

	const href = $derived(
		resolve('/(public)/[lang=lang]/articles/[slug]', { lang, slug: article.slug })
	);
	const date = $derived(formatArticleDate(article.date, LOCALES[lang]));
</script>

<article
	class="group flex h-full flex-col border border-ink/10 bg-white transition-colors hover:border-marine/25"
>
	<a {href} class="flex h-full flex-col">
		<div class="overflow-hidden bg-sable">
			<img
				src={article.image}
				alt={article.imageAlt}
				width="960"
				height="600"
				loading={eager ? 'eager' : 'lazy'}
				fetchpriority={eager ? 'high' : 'auto'}
				decoding="async"
				class="aspect-[16/10] w-full object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-[1.02]"
			/>
		</div>

		<div class="flex flex-1 flex-col p-5 sm:p-6">
			<p class="text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-or-dark">
				{article.category}
			</p>
			<time datetime={article.date} class="mt-2 text-xs text-ink/50">
				{t.articles.publishedOn}
				{date}
			</time>
			<h3 class="mt-3 font-serif text-xl leading-snug text-marine">{article.title}</h3>
			<p class="mt-3 text-sm leading-relaxed text-ink/65">{article.excerpt}</p>
			<span class="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-marine">
				{t.articles.readMore}
				<ArrowUpRight class="h-4 w-4" aria-hidden="true" />
			</span>
		</div>
	</a>
</article>
