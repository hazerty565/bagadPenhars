<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { ArrowRight, Mail } from '@lucide/svelte';
	import { site } from '$lib/data/site';
	import { getDict } from '$lib/i18n';
	import type { PageData } from './$types';

	export const prerender = true;

	// eslint-disable-next-line svelte/valid-prop-names-in-kit-pages
	let { data }: { data: PageData } = $props();

	const t = $derived(getDict(data.lang));
	const l = $derived(t.legal);
	const contactHref = $derived(resolve('/(public)/[lang=lang]/contact', { lang: data.lang }));

	const origin = $derived(page.url.origin);
	const canonical = $derived(`${origin}/${data.lang}/informations-legales`);
</script>

<svelte:head>
	<title>{l.meta.title}</title>
	<meta name="description" content={l.meta.description} />
	<link rel="canonical" href={canonical} />
	<link rel="alternate" hreflang="fr" href={`${origin}/fr/informations-legales`} />
	<link rel="alternate" hreflang="en" href={`${origin}/en/informations-legales`} />
	<link rel="alternate" hreflang="br" href={`${origin}/br/informations-legales`} />
	<link rel="alternate" hreflang="x-default" href={`${origin}/fr/informations-legales`} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={l.meta.title} />
	<meta property="og:description" content={l.meta.description} />
	<meta property="og:url" content={canonical} />
</svelte:head>

<section class="relative overflow-hidden bg-ivoire">
	<div class="container-page py-14 sm:py-16 lg:py-20">
		<div class="max-w-3xl">
			<p class="eyebrow">
				<span class="h-px w-8 bg-or" aria-hidden="true"></span>
				{l.eyebrow}
			</p>

			<h1
				class="mt-5 font-serif text-4xl leading-[1.03] tracking-[-0.01em] text-marine sm:text-5xl lg:text-6xl"
			>
				{l.title}
			</h1>

			<p class="mt-6 max-w-2xl text-base leading-relaxed text-ink/75 sm:text-lg">
				{l.lead}
			</p>

			<p class="mt-8 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-ink/45">
				{l.updated}
			</p>
		</div>
	</div>
</section>

<section class="bg-white py-14 sm:py-16">
	<div class="container-page">
		<div class="max-w-3xl">
			<div class="mb-8 border border-ink/12 bg-sable/30 p-6 sm:p-8">
				<h2 class="font-serif text-xl leading-snug text-marine">{l.identity.title}</h2>
				<dl class="mt-5 grid gap-x-10 gap-y-4 sm:grid-cols-2">
					{#each l.identity.items as item (item.label)}
						<div>
							<dt class="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-ink/45">
								{item.label}
							</dt>
							<dd class="mt-1 text-sm leading-relaxed text-ink/80">{item.value}</dd>
						</div>
					{/each}
				</dl>
			</div>

			<div>
				{#each l.sections as section, index (section.title)}
					<article class="border-t border-ink/12 py-8 first:border-t-0 first:pt-0">
						<div class="flex items-baseline gap-4">
							<span class="font-serif text-lg leading-none text-or-dark">
								{String(index + 1).padStart(2, '0')}
							</span>
							<h2 class="font-serif text-2xl leading-snug text-marine">{section.title}</h2>
						</div>

						<div class="mt-3 space-y-3">
							{#each section.paragraphs as paragraph, paragraphIndex (paragraphIndex)}
								<p class="text-sm leading-relaxed text-ink/70">{paragraph}</p>
							{/each}
						</div>
					</article>
				{/each}
			</div>
		</div>
	</div>
</section>

<section class="bg-sable/50 py-14 sm:py-16">
	<div class="container-page">
		<div
			class="flex max-w-3xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between sm:gap-10"
		>
			<div>
				<h2 class="font-serif text-2xl leading-snug text-marine">{l.contact.title}</h2>
				<p class="mt-2 text-sm leading-relaxed text-ink/70">{l.contact.text}</p>
				<a
					href={`mailto:${site.email}`}
					class="mt-3 inline-flex items-center gap-2 break-all text-sm font-semibold text-marine underline decoration-or/60 underline-offset-4 transition-colors hover:decoration-or"
				>
					<Mail class="h-4 w-4 shrink-0" aria-hidden="true" />
					{site.email}
				</a>
			</div>

			<a href={contactHref} class="btn-primary self-start sm:self-auto">
				{l.contact.cta}
				<ArrowRight class="h-4 w-4" aria-hidden="true" />
			</a>
		</div>
	</div>
</section>
