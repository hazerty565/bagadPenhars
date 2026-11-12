<script lang="ts">
	import { ArrowRight } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import { PRESTATION_KEYS } from '$lib/types';
	import type { Dictionary, Lang } from '$lib/i18n';

	let { t, lang }: { t: Dictionary; lang: Lang } = $props();

	const contactHref = $derived(resolve('/(public)/[lang=lang]/contact', { lang }));
</script>

<section class="bg-sable/50 pb-16 pt-10 sm:pb-20 sm:pt-12" aria-labelledby="prestations-title">
	<div class="container-page">
		<div class="flex items-center gap-4" aria-hidden="true">
			<span class="h-px flex-1 bg-marine/20"></span>
			<span class="h-1.5 w-1.5 rotate-45 bg-or"></span>
			<span class="h-px flex-1 bg-marine/20"></span>
		</div>

		<div class="mt-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-12">
			<div>
				<p class="eyebrow">
					<span class="h-px w-8 bg-or" aria-hidden="true"></span>
					{t.prestations.eyebrow}
				</p>
				<h2
					id="prestations-title"
					class="mt-4 font-serif text-3xl leading-tight text-marine sm:text-4xl"
				>
					{t.prestations.title}
				</h2>
			</div>
			<p class="max-w-md text-sm leading-relaxed text-ink/65">{t.prestations.lead}</p>
		</div>

		<ul class="mt-10 grid gap-x-12 gap-y-8 sm:grid-cols-2">
			{#each PRESTATION_KEYS as key, index (key)}
				{@const item = t.prestations.items[key]}
				<li class="border-t border-marine/20 pt-5">
					<div class="flex items-baseline gap-4">
						<span class="font-serif text-xl leading-none text-or-dark">
							{String(index + 1).padStart(2, '0')}
						</span>
						<h3 class="font-serif text-2xl leading-tight text-marine">{item.title}</h3>
					</div>
					<p class="mt-3 text-sm leading-relaxed text-ink/70">{item.description}</p>
				</li>
			{/each}
		</ul>

		<div
			class="mt-12 flex flex-col gap-5 border-t border-marine/20 pt-7 sm:flex-row sm:items-center sm:justify-between"
		>
			<p class="max-w-md font-serif text-xl leading-snug text-marine">{t.prestations.ctaLead}</p>
			<a href={contactHref} class="btn-primary self-start sm:self-auto">
				{t.prestations.cta}
				<ArrowRight class="h-4 w-4" aria-hidden="true" />
			</a>
		</div>
	</div>
</section>
