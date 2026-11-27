<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { ArrowRight, Mail } from '@lucide/svelte';
	import { PARTNERS } from '$lib/data/partenaires';
	import { getDict } from '$lib/i18n';
	import type { PageData } from './$types';

	export const prerender = true;

	// eslint-disable-next-line svelte/valid-prop-names-in-kit-pages
	let { data }: { data: PageData } = $props();

	const t = $derived(getDict(data.lang));
	const p = $derived(t.partners);
	const contactHref = $derived(resolve('/(public)/[lang=lang]/contact', { lang: data.lang }));

	const origin = $derived(page.url.origin);
	const canonical = $derived(`${origin}/${data.lang}/partenaires`);
</script>

<svelte:head>
	<title>{p.meta.title}</title>
	<meta name="description" content={p.meta.description} />
	<link rel="canonical" href={canonical} />
	<link rel="alternate" hreflang="fr" href={`${origin}/fr/partenaires`} />
	<link rel="alternate" hreflang="en" href={`${origin}/en/partenaires`} />
	<link rel="alternate" hreflang="br" href={`${origin}/br/partenaires`} />
	<link rel="alternate" hreflang="x-default" href={`${origin}/fr/partenaires`} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={p.meta.title} />
	<meta property="og:description" content={p.meta.description} />
	<meta property="og:url" content={canonical} />
</svelte:head>

<section class="relative overflow-hidden bg-ivoire">
	<div class="container-page py-14 sm:py-16 lg:py-20">
		<div class="max-w-3xl">
			<p class="eyebrow">
				<span class="h-px w-8 bg-or" aria-hidden="true"></span>
				{p.eyebrow}
			</p>

			<h1
				class="mt-5 font-serif text-4xl leading-[1.03] tracking-[-0.01em] text-marine sm:text-5xl lg:text-6xl"
			>
				{p.title}
			</h1>

			<p class="mt-6 max-w-2xl text-base leading-relaxed text-ink/75 sm:text-lg">
				{p.lead}
			</p>

			<div class="mt-8 flex flex-wrap gap-3">
				<a href={contactHref} class="btn-primary">
					{p.cta}
					<Mail class="h-4 w-4" />
				</a>
				<a href="#partenaires" class="btn-ghost">
					{p.logos.cta}
					<ArrowRight class="h-4 w-4" />
				</a>
			</div>
		</div>
	</div>
</section>

<section class="bg-white py-14 sm:py-20">
	<div class="container-page grid gap-10 lg:grid-cols-2 lg:gap-16">
		<div class="max-w-xl">
			<h2 class="font-serif text-3xl leading-tight text-marine sm:text-4xl">
				{p.support.title}
			</h2>

			{#each p.support.paragraphs as paragraph (paragraph)}
				<p class="mt-5 text-sm leading-relaxed text-ink/70 sm:text-base">{paragraph}</p>
			{/each}

			<p class="mt-5 text-sm leading-relaxed text-ink/70 sm:text-base">
				{p.support.deductionIntro}
			</p>
		</div>

		<div class="lg:pt-1">
			<ul class="grid gap-6 sm:grid-cols-2 lg:grid-cols-1 lg:gap-7">
				{#each p.support.deductions as item (item.label)}
					<li class="border-t border-marine/15 pt-5">
						<p class="font-serif text-4xl leading-none text-or-dark sm:text-5xl">
							{item.rate}
						</p>
						<h3 class="mt-4 text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-marine">
							{item.label}
						</h3>
						<p class="mt-2 text-sm leading-relaxed text-ink/65">{item.text}</p>
					</li>
				{/each}
			</ul>

			<p class="mt-8 border-l-2 border-or pl-4 text-sm italic leading-relaxed text-ink/60">
				{p.support.thanks}
			</p>
		</div>
	</div>
</section>

<section id="partenaires" class="scroll-mt-24 bg-sable/50 py-14 sm:py-20">
	<div class="container-page">
		<div class="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-end lg:gap-16">
			<div>
				<p class="eyebrow">
					<span class="h-px w-8 bg-or" aria-hidden="true"></span>
					{p.logos.eyebrow}
				</p>
				<h2 class="mt-4 font-serif text-3xl leading-tight text-marine sm:text-4xl">
					{p.logos.title}
				</h2>
			</div>
			<p class="max-w-xl text-sm leading-relaxed text-ink/65">{p.logos.lead}</p>
		</div>

		<ul class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
			{#each PARTNERS as partner (partner.id)}
				<li>
					<!-- `rel="external"` : la cible est un site tiers, hors de l'application (le plugin ESLint
					     no-navigation-without-resolve ne peut pas le deviner depuis une URL variable). -->
					<a
						href={partner.url}
						target="_blank"
						rel="noopener noreferrer external"
						class="group flex h-full flex-col items-center gap-5 border border-ink/10 bg-white px-5 py-7 transition-colors hover:border-marine/25"
					>
						<span class="flex h-24 w-full items-center justify-center">
							<img
								src={partner.logo}
								alt=""
								width={partner.width}
								height={partner.height}
								fetchpriority="high"
								decoding="async"
								class="h-full w-full object-contain"
							/>
						</span>
						<span
							class="mt-auto text-center text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-marine/80 transition-colors group-hover:text-marine"
						>
							{partner.name}
							<span class="sr-only"> â€” {p.logos.newTab}</span>
						</span>
					</a>
				</li>
			{/each}
		</ul>
	</div>
</section>
