<script lang="ts">
	import { ArrowUpRight, CalendarDays } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import { LOCALES, type Dictionary, type Lang } from '$lib/i18n';
	import type { PublicEvent } from '$lib/types';

	let { t, lang, events }: { t: Dictionary; lang: Lang; events: PublicEvent[] } = $props();

	const upcoming = $derived(
		[...events]
			.filter((event) => event.state === 'actif')
			.sort((a, b) => a.eventDate.localeCompare(b.eventDate))
			.slice(0, 2)
	);

	function dateParts(value: string) {
		const date = new Date(`${value}T12:00:00Z`);
		const locale = LOCALES[lang];

		return {
			day: new Intl.DateTimeFormat(locale, { day: '2-digit', timeZone: 'UTC' }).format(date),
			month: new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' })
				.format(date)
				.replace('.', ''),
			year: new Intl.DateTimeFormat(locale, { year: 'numeric', timeZone: 'UTC' }).format(date)
		};
	}
</script>

<section class="bg-white py-16 sm:py-20">
	<div class="container-page">
		<div class="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
			<div>
				<p class="eyebrow">
					<span class="h-px w-8 bg-or" aria-hidden="true"></span>
					{t.agenda.eyebrow}
				</p>
				<h2 class="mt-4 font-serif text-3xl leading-tight text-marine sm:text-4xl">
					{t.agenda.title}
				</h2>
				<p class="mt-3 max-w-xl text-sm leading-relaxed text-ink/65">{t.agenda.lead}</p>
			</div>

			<a
				href={resolve('/(public)/[lang=lang]/agenda', { lang })}
				class="inline-flex items-center gap-2 self-start border-b border-marine/30 pb-1 text-sm font-semibold text-marine transition-colors hover:border-marine sm:self-auto"
			>
				{t.agenda.cta}
				<ArrowUpRight class="h-4 w-4" />
			</a>
		</div>

		{#if upcoming.length === 0}
			<div
				class="mt-10 grid gap-6 border-y border-ink/10 py-9 md:grid-cols-[auto_1fr] md:items-center"
			>
				<div class="flex h-16 w-16 items-center justify-center border border-or/60 text-marine">
					<CalendarDays class="h-6 w-6" />
				</div>
				<div>
					<p class="font-serif text-2xl text-marine">{t.agenda.emptyTitle}</p>
					<p class="mt-2 max-w-2xl text-sm leading-relaxed text-ink/65">
						{t.agenda.emptyText}
					</p>
				</div>
			</div>
		{:else}
			<ul class="mt-10 divide-y divide-ink/10 border-y border-ink/10">
				{#each upcoming as event (event.id)}
					{@const date = dateParts(event.eventDate)}
					<li class="grid gap-4 py-6 sm:grid-cols-[7.5rem_1fr] sm:items-baseline">
						<div class="flex items-baseline gap-2 sm:block">
							<span class="font-serif text-4xl leading-none text-marine">{date.day}</span>
							<span class="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-ink/50">
								{date.month}
								{date.year}
							</span>
						</div>
						<div>
							<p class="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-or-dark">
								{t.agenda.types[event.eventType]}
							</p>
							<p class="mt-1 font-serif text-xl leading-snug text-marine">{event.title}</p>
							{#if event.description}
								<p class="mt-2 max-w-2xl text-sm leading-relaxed text-ink/65">
									{event.description}
								</p>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</section>
