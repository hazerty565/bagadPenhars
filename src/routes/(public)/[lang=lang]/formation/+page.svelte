<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { ArrowRight, Mail } from '@lucide/svelte';
	import { MASCOTS_GROUP, PUPITRE_KEYS, PUPITRE_MASCOTS, PUPITRE_PHOTOS } from '$lib/data/site';
	import { getDict } from '$lib/i18n';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const t = $derived(getDict(data.lang));
	const f = $derived(t.formation);
	const contactHref = $derived(resolve('/(public)/[lang=lang]/contact', { lang: data.lang }));

	const origin = $derived(page.url.origin);
	const canonical = $derived(`${origin}/${data.lang}/formation`);
</script>

<svelte:head>
	<title>{f.meta.title}</title>
	<meta name="description" content={f.meta.description} />
	<link rel="canonical" href={canonical} />
	<link rel="alternate" hreflang="fr" href={`${origin}/fr/formation`} />
	<link rel="alternate" hreflang="en" href={`${origin}/en/formation`} />
	<link rel="alternate" hreflang="br" href={`${origin}/br/formation`} />
	<link rel="alternate" hreflang="x-default" href={`${origin}/fr/formation`} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={f.meta.title} />
	<meta property="og:description" content={f.meta.description} />
	<meta property="og:url" content={canonical} />
</svelte:head>

<section class="relative overflow-hidden bg-ivoire">
	<div
		class="container-page grid items-center gap-10 py-14 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-20"
	>
		<div class="max-w-xl">
			<p class="eyebrow">
				<span class="h-px w-8 bg-or" aria-hidden="true"></span>
				{f.eyebrow}
			</p>

			<h1
				class="mt-5 font-serif text-4xl leading-[1.03] tracking-[-0.01em] text-marine sm:text-5xl lg:text-6xl"
			>
				{f.title}
			</h1>

			<p class="mt-6 max-w-lg text-base leading-relaxed text-ink/75 sm:text-lg">
				{f.lead}
			</p>

			<p class="mt-4 max-w-lg text-sm leading-relaxed text-ink/60">
				{f.leadMore}
			</p>

			<a href={contactHref} class="btn-primary mt-8">
				{f.ctaContact}
				<Mail class="h-4 w-4" />
			</a>
		</div>

		<figure class="relative mx-auto w-full max-w-[19rem] sm:max-w-sm lg:max-w-md">
			<div
				class="absolute -left-3 -top-3 h-full w-full border border-or/70"
				aria-hidden="true"
			></div>
			<img
				src={MASCOTS_GROUP.src}
				alt={f.mascotAlt}
				width={MASCOTS_GROUP.width}
				height={MASCOTS_GROUP.height}
				loading="eager"
				fetchpriority="high"
				decoding="async"
				class="relative w-full mix-blend-multiply"
			/>
			<figcaption class="mt-3 flex items-center gap-2 text-xs text-ink/50">
				<span class="h-px w-6 bg-or" aria-hidden="true"></span>
				{f.mascotCaption}
			</figcaption>
		</figure>
	</div>
</section>

<section class="bg-white py-14 sm:py-20">
	<div class="container-page">
		<div class="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-end lg:gap-16">
			<div>
				<p class="eyebrow">
					<span class="h-px w-8 bg-or" aria-hidden="true"></span>
					{f.sectionsEyebrow}
				</p>
				<h2 class="mt-4 font-serif text-3xl leading-tight text-marine sm:text-4xl">
					{f.sectionsTitle}
				</h2>
			</div>
			<p class="max-w-xl text-sm leading-relaxed text-ink/65">{f.sectionsLead}</p>
		</div>

		<div class="mt-10 border-t border-ink/10">
			{#each PUPITRE_KEYS as key, index (key)}
				{@const item = f.items[key]}
				{@const mascot = PUPITRE_MASCOTS[key]}
				{@const photo = PUPITRE_PHOTOS[key]}
				<article
					id={key}
					class="grid scroll-mt-28 gap-y-8 border-b border-ink/10 py-10 sm:py-12 lg:grid-cols-2 lg:items-start lg:gap-x-16 lg:gap-y-0 lg:py-16"
				>
					<div class="min-w-0 lg:order-2">
						<div class="flex items-start gap-4">
							<img
								src={mascot.src}
								alt={item.imageAlt}
								width={mascot.width}
								height={mascot.height}
								loading="lazy"
								decoding="async"
								class="mt-0.5 w-14 shrink-0 mix-blend-multiply sm:w-16"
							/>
							<div class="min-w-0">
								<p class="text-[0.62rem] font-semibold tracking-[0.2em] text-or-dark">
									{String(index + 1).padStart(2, '0')}
								</p>
								<div class="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
									<h3 class="font-serif text-2xl text-marine sm:text-3xl">{item.name}</h3>
									<span class="text-sm italic text-ink/45">{item.breton}</span>
								</div>
								<p
									class="mt-2 text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-or-dark"
								>
									{item.role}
								</p>
							</div>
						</div>

						<div class="mt-6 max-w-2xl space-y-3.5">
							{#each item.paragraphs as paragraph, paragraphIndex (paragraphIndex)}
								<p class="text-sm leading-relaxed text-ink/70">
									{paragraph}
								</p>
							{/each}
						</div>

						<div class="mt-7">
							<p class="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-ink/40">
								{f.tagsLabel}
							</p>
							<ul class="mt-2 flex flex-wrap gap-1.5">
								{#each item.tags as tag (tag)}
									<li class="border border-marine/15 px-2 py-0.5 text-[0.65rem] text-marine/80">
										{tag}
									</li>
								{/each}
							</ul>
						</div>
					</div>

					<figure
						class="mx-auto w-full max-w-[26rem] lg:mx-0 {index % 2 === 1
							? 'lg:order-3 lg:justify-self-end'
							: 'lg:order-1'}"
					>
						<div class="relative">
							<div
								class="absolute -right-2 -top-2 h-full w-full border border-or/50"
								aria-hidden="true"
							></div>
							<img
								src={photo.src}
								alt={item.photoAlt}
								width={photo.width}
								height={photo.height}
								loading="lazy"
								decoding="async"
								class="relative aspect-[4/3] w-full bg-sable/40 object-cover"
							/>
						</div>
					</figure>
				</article>
			{/each}
		</div>
	</div>
</section>

<section class="bg-sable/50 py-14 sm:py-20">
	<div class="container-page grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
		<div class="max-w-lg">
			<p class="eyebrow">
				<span class="h-px w-8 bg-or" aria-hidden="true"></span>
				{f.practical.eyebrow}
			</p>
			<h2 class="mt-4 font-serif text-3xl leading-tight text-marine sm:text-4xl">
				{f.practical.title}
			</h2>
			<p class="mt-4 text-sm leading-relaxed text-ink/70">{f.practical.lead}</p>
			<p class="mt-4 text-xs leading-relaxed text-ink/45">{f.practical.note}</p>
			<a href={contactHref} class="btn-primary mt-7">
				{f.practical.cta}
				<ArrowRight class="h-4 w-4" />
			</a>
		</div>

		<ul class="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
			{#each f.practical.points as point, index (point.title)}
				<li class="border-t border-marine/15 pt-4">
					<span class="text-[0.62rem] font-semibold tracking-[0.16em] text-or-dark">
						{String(index + 1).padStart(2, '0')}
					</span>
					<h3 class="mt-1 font-serif text-lg text-marine">{point.title}</h3>
					<p class="mt-1 text-sm leading-relaxed text-ink/65">{point.text}</p>
				</li>
			{/each}
		</ul>
	</div>
</section>

<section class="bg-marine py-14 text-ivoire sm:py-16">
	<div class="container-page grid gap-8 lg:grid-cols-[1.2fr_auto] lg:items-center lg:gap-16">
		<div class="max-w-2xl">
			<h2 class="font-serif text-3xl leading-tight sm:text-4xl">{f.join.title}</h2>
			<p class="mt-4 text-base leading-relaxed text-ivoire/70">{f.join.text}</p>
		</div>
		<a href={contactHref} class="btn-gold justify-self-start">
			{f.join.cta}
			<ArrowRight class="h-4 w-4" />
		</a>
	</div>
</section>
