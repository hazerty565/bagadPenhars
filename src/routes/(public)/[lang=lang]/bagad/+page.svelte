<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { ArrowRight } from '@lucide/svelte';
	import { getDict } from '$lib/i18n';
	import { site } from '$lib/data/site';
	import type { PageData } from './$types';

	export const prerender = true;

	// eslint-disable-next-line svelte/valid-prop-names-in-kit-pages
	let { data }: { data: PageData } = $props();

	const t = $derived(getDict(data.lang));
	const b = $derived(t.bagad);

	const formationHref = $derived(resolve('/(public)/[lang=lang]/formation', { lang: data.lang }));
	const agendaHref = $derived(resolve('/(public)/[lang=lang]/agenda', { lang: data.lang }));
	const contactHref = $derived(resolve('/(public)/[lang=lang]/contact', { lang: data.lang }));

	const origin = $derived(page.url.origin);
	const canonical = $derived(`${origin}/${data.lang}/bagad`);
</script>

<svelte:head>
	<title>{b.meta.title}</title>
	<meta name="description" content={b.meta.description} />
	<link rel="canonical" href={canonical} />
	<link rel="alternate" hreflang="fr" href={`${origin}/fr/bagad`} />
	<link rel="alternate" hreflang="en" href={`${origin}/en/bagad`} />
	<link rel="alternate" hreflang="br" href={`${origin}/br/bagad`} />
	<link rel="alternate" hreflang="x-default" href={`${origin}/fr/bagad`} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={b.meta.title} />
	<meta property="og:description" content={b.meta.description} />
	<meta property="og:url" content={canonical} />
</svelte:head>

<section class="bg-ivoire pb-12 pt-14 sm:pb-16 sm:pt-16 lg:pt-20">
	<div class="container-page">
		<div class="max-w-3xl">
			<p class="eyebrow">
				<span class="h-px w-8 bg-or" aria-hidden="true"></span>
				{b.eyebrow}
			</p>

			<h1
				class="mt-5 font-serif text-4xl leading-[1.03] tracking-[-0.01em] text-marine sm:text-5xl lg:text-6xl"
			>
				{b.title}
			</h1>

			<p class="mt-6 max-w-2xl text-base leading-relaxed text-ink/75 sm:text-lg">
				{b.lead}
			</p>
		</div>

		<figure class="mt-10 sm:mt-12">
			<div class="relative">
				<div
					class="absolute -right-2 -top-2 h-full w-full border border-or/50"
					aria-hidden="true"
				></div>
				<img
					src="/groupe_bagad.webp"
					alt={b.heroAlt}
					width="1436"
					height="957"
					loading="eager"
					fetchpriority="high"
					decoding="async"
					class="relative w-full bg-sable/40 object-cover"
				/>
			</div>
		</figure>
	</div>
</section>

<section class="bg-white py-14 sm:py-20">
	<div class="container-page grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
		<div class="max-w-2xl">
			<p class="eyebrow">
				<span class="h-px w-8 bg-or" aria-hidden="true"></span>
				{b.history.eyebrow}
			</p>

			<h2 class="mt-4 font-serif text-3xl leading-tight text-marine sm:text-4xl">
				{b.history.title}
			</h2>

			<div class="mt-5 space-y-4">
				{#each b.history.paragraphs as paragraph, index (index)}
					<p class="text-base leading-relaxed text-ink/70">{paragraph}</p>
				{/each}
			</div>

			<a href={formationHref} class="btn-ghost mt-7">
				{b.history.cta}
				<ArrowRight class="h-4 w-4" aria-hidden="true" />
			</a>
		</div>

		<aside
			class="self-start border-t border-marine/15 pt-6 lg:mt-14 lg:border-t-0 lg:border-l lg:border-marine/15 lg:pl-10 lg:pt-0"
		>
			<p class="font-serif text-5xl leading-none text-or-dark sm:text-6xl">
				{site.foundedYear}
			</p>
			<p class="mt-3 text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-ink/50">
				{b.history.foundedLabel}
			</p>
		</aside>
	</div>
</section>

<section class="bg-sable/50 py-14 sm:py-20">
	<div class="container-page grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-16">
		<figure class="w-full">
			<div class="relative">
				<div
					class="absolute -right-2 -top-2 h-full w-full border border-or/50"
					aria-hidden="true"
				></div>
				<img
					src="/couple_joueur.webp"
					alt={b.mission.imageAlt}
					width="2048"
					height="1365"
					fetchpriority="high"
					decoding="async"
					class="relative aspect-[4/3] w-full bg-sable/60 object-cover"
				/>
			</div>
		</figure>

		<div class="lg:pt-6">
			<p class="eyebrow">
				<span class="h-px w-8 bg-or" aria-hidden="true"></span>
				{b.mission.eyebrow}
			</p>

			<h2 class="mt-4 font-serif text-3xl leading-tight text-marine sm:text-4xl">
				{b.mission.title}
			</h2>

			<div class="mt-5 space-y-4">
				{#each b.mission.paragraphs as paragraph, index (index)}
					<p class="text-base leading-relaxed text-ink/70">{paragraph}</p>
				{/each}
			</div>

			<a href={agendaHref} class="btn-primary mt-7">
				{b.mission.cta}
				<ArrowRight class="h-4 w-4" aria-hidden="true" />
			</a>

			<p class="mt-10 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-ink/40">
				{b.figures.title}
			</p>

			<dl class="mt-4 grid grid-cols-3 gap-4 border-t border-marine/15 pt-6">
				{#each b.figures.items as item (item.label)}
					<div class="flex min-w-0 flex-col-reverse">
						<dt
							class="mt-1.5 text-[0.6rem] font-medium uppercase leading-snug tracking-[0.12em] text-ink/50"
						>
							{item.label}
						</dt>
						<dd class="font-serif text-3xl leading-none text-marine">{item.value}</dd>
					</div>
				{/each}
			</dl>
		</div>
	</div>
</section>

<section class="bg-marine py-14 text-ivoire sm:py-16">
	<div class="container-page grid gap-8 lg:grid-cols-[1.15fr_auto] lg:items-center lg:gap-16">
		<div class="max-w-2xl">
			<h2 class="font-serif text-3xl leading-tight sm:text-4xl">{b.join.title}</h2>
			<p class="mt-4 text-base leading-relaxed text-ivoire/70">{b.join.text}</p>
		</div>
		<div class="flex flex-wrap items-center gap-3">
			<a href={formationHref} class="btn-gold">
				{b.join.ctaFormation}
				<ArrowRight class="h-4 w-4" aria-hidden="true" />
			</a>
			<a href={contactHref} class="btn-light">{b.join.ctaContact}</a>
		</div>
	</div>
</section>
