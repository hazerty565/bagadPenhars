<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { ArrowRight, CalendarDays, MapPin } from '@lucide/svelte';
	import { getDict } from '$lib/i18n';
	import type { PageData } from './$types';

	export const prerender = true;

	// eslint-disable-next-line svelte/valid-prop-names-in-kit-pages
	let { data }: { data: PageData } = $props();

	const t = $derived(getDict(data.lang));
	const a = $derived(t.agenda);

	const contactHref = $derived(resolve('/(public)/[lang=lang]/contact', { lang: data.lang }));

	const origin = $derived(page.url.origin);
	const canonical = $derived(`${origin}/${data.lang}/agenda`);

	const nextEvent = $derived(data.upcoming[0]);
	const otherUpcoming = $derived(data.upcoming.slice(1));

	function dateParts(value: string) {
		const [year, month, day] = value.split('-');

		return {
			day,
			month: a.months[Number(month) - 1] ?? month,
			year
		};
	}
</script>

<svelte:head>
	<title>{a.meta.title}</title>
	<meta name="description" content={a.meta.description} />
	<link rel="canonical" href={canonical} />
	<link rel="alternate" hreflang="fr" href={`${origin}/fr/agenda`} />
	<link rel="alternate" hreflang="en" href={`${origin}/en/agenda`} />
	<link rel="alternate" hreflang="br" href={`${origin}/br/agenda`} />
	<link rel="alternate" hreflang="x-default" href={`${origin}/fr/agenda`} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={a.meta.title} />
	<meta property="og:description" content={a.meta.description} />
	<meta property="og:url" content={canonical} />
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

		<figure class="mt-10 sm:mt-12">
			<div class="relative">
				<div
					class="absolute -right-2 -top-2 h-full w-full border border-or/50"
					aria-hidden="true"
				></div>
				<img
					src="/hero.webp"
					alt={a.heroAlt}
					width="1440"
					height="1123"
					loading="eager"
					fetchpriority="high"
					decoding="async"
					class="relative aspect-[16/10] w-full bg-sable/40 object-cover object-center"
				/>
			</div>
			<figcaption class="mt-3 flex items-center gap-2 text-xs text-ink/50">
				<span class="h-px w-6 bg-or" aria-hidden="true"></span>
				{a.heroCaption}
			</figcaption>
		</figure>
	</div>
</section>

<section class="bg-white py-14 sm:py-20" aria-labelledby="agenda-upcoming">
	<div class="container-page">
		<div class="max-w-2xl">
			<h2 id="agenda-upcoming" class="font-serif text-3xl leading-tight text-marine sm:text-4xl">
				{a.upcoming.title}
			</h2>
			<p class="mt-3 text-sm leading-relaxed text-ink/65">{a.upcoming.lead}</p>
		</div>

		{#if !nextEvent}
			<div
				class="mt-10 grid gap-6 border-y border-ink/10 py-9 md:grid-cols-[auto_1fr] md:items-center"
			>
				<div class="flex h-16 w-16 items-center justify-center border border-or/60 text-marine">
					<CalendarDays class="h-6 w-6" aria-hidden="true" />
				</div>
				<div>
					<p class="font-serif text-2xl text-marine">{a.emptyTitle}</p>
					<p class="mt-2 max-w-2xl text-sm leading-relaxed text-ink/65">
						{a.emptyText}
					</p>
				</div>
			</div>
		{:else}
			{@const nextDate = dateParts(nextEvent.eventDate)}
			<article class="relative mt-10 border border-marine/15 bg-ivoire/70 p-6 sm:p-9">
				<div class="absolute inset-y-0 left-0 w-1 bg-or" aria-hidden="true"></div>

				<p class="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-or-dark">
					{a.currentLabel}
				</p>

				<div class="mt-5 grid gap-6 sm:grid-cols-[9rem_1fr] sm:gap-9">
					<time
						datetime={nextEvent.eventDate}
						class="flex items-baseline gap-3 sm:block sm:border-r sm:border-marine/15 sm:pr-8"
					>
						<span class="block font-serif text-6xl leading-none text-marine">{nextDate.day}</span>
						<span
							class="block text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-ink/50"
						>
							{nextDate.month}
							{nextDate.year}
						</span>
					</time>

					<div>
						<p class="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-or-dark">
							{a.types[nextEvent.eventType]}
						</p>
						<h3 class="mt-2 font-serif text-2xl leading-snug text-marine sm:text-3xl">
							{nextEvent.title}
						</h3>
						<p class="mt-3 flex items-center gap-2 text-sm text-ink/60">
							<MapPin class="h-4 w-4 text-or-dark" aria-hidden="true" />
							<span class="sr-only">{a.locationLabel} : </span>
							{nextEvent.location}
						</p>
					</div>
				</div>
			</article>

			{#if otherUpcoming.length > 0}
				<ul class="mt-8 divide-y divide-ink/10 border-t border-ink/10">
					{#each otherUpcoming as event (event.id)}
						{@const date = dateParts(event.eventDate)}
						<li class="grid gap-3 py-6 sm:grid-cols-[8.5rem_1fr] sm:items-baseline sm:gap-8">
							<time datetime={event.eventDate} class="flex items-baseline gap-2 sm:block">
								<span class="font-serif text-3xl leading-none text-marine">{date.day}</span>
								<span class="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-ink/50">
									{date.month}
									{date.year}
								</span>
							</time>
							<div>
								<p class="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-or-dark">
									{a.types[event.eventType]}
								</p>
								<h3 class="mt-1 font-serif text-xl leading-snug text-marine">{event.title}</h3>
								<p class="mt-1.5 flex items-center gap-2 text-sm text-ink/60">
									<MapPin class="h-3.5 w-3.5 text-or-dark" aria-hidden="true" />
									<span class="sr-only">{a.locationLabel} : </span>
									{event.location}
								</p>
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		{/if}
	</div>
</section>

{#if data.past.length > 0}
	<section class="bg-sable/50 py-14 sm:py-20" aria-labelledby="agenda-past">
		<div class="container-page">
			<div class="max-w-2xl">
				<h2 id="agenda-past" class="font-serif text-3xl leading-tight text-marine sm:text-4xl">
					{a.past.title}
				</h2>
				<p class="mt-3 text-sm leading-relaxed text-ink/65">{a.past.lead}</p>
			</div>

			<ol class="mt-9 divide-y divide-marine/10 border-y border-marine/10">
				{#each data.past as event (event.id)}
					{@const date = dateParts(event.eventDate)}
					<li class="grid gap-2 py-5 sm:grid-cols-[8.5rem_1fr] sm:items-baseline sm:gap-8">
						<time datetime={event.eventDate} class="flex items-baseline gap-2 text-ink/45 sm:block">
							<span class="font-serif text-xl leading-none text-marine/80">{date.day}</span>
							<span class="text-[0.6rem] font-semibold uppercase tracking-[0.16em]">
								{date.month}
								{date.year}
							</span>
						</time>
						<div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
							<h3 class="font-serif text-lg leading-snug text-marine/90">{event.title}</h3>
							<p class="flex items-center gap-1.5 text-xs text-ink/50">
								<MapPin class="h-3 w-3" aria-hidden="true" />
								<span class="sr-only">{a.locationLabel} : </span>
								{event.location}
							</p>
							<p class="text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-ink/40">
								{a.types[event.eventType]}
							</p>
						</div>
					</li>
				{/each}
			</ol>
		</div>
	</section>
{/if}

<section class="bg-marine py-14 text-ivoire sm:py-16">
	<div class="container-page grid gap-8 lg:grid-cols-[1.15fr_auto] lg:items-center lg:gap-16">
		<div class="max-w-2xl">
			<h2 class="font-serif text-3xl leading-tight sm:text-4xl">{a.contact.title}</h2>
			<p class="mt-4 text-base leading-relaxed text-ivoire/70">{a.contact.text}</p>
		</div>
		<a href={contactHref} class="btn-gold">
			{a.contact.cta}
			<ArrowRight class="h-4 w-4" aria-hidden="true" />
		</a>
	</div>
</section>
