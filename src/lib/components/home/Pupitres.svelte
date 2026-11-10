<script lang="ts">
	import { ArrowRight } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import { PUPITRE_KEYS } from '$lib/data/site';
	import type { Dictionary, Lang } from '$lib/i18n';

	let { t, lang }: { t: Dictionary; lang: Lang } = $props();
</script>

<section class="bg-ivoire py-16 sm:py-20">
	<div class="container-page">
		<div class="flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-12">
			<div>
				<p class="eyebrow">
					<span class="h-px w-8 bg-or" aria-hidden="true"></span>
					{t.pupitres.eyebrow}
				</p>
				<h2 class="mt-4 font-serif text-3xl leading-tight text-marine sm:text-4xl">
					{t.pupitres.title}
				</h2>
			</div>
			<p class="max-w-md text-sm leading-relaxed text-ink/65">{t.pupitres.lead}</p>
		</div>

		<ul class="mt-10 grid gap-x-12 gap-y-7 sm:grid-cols-2">
			{#each PUPITRE_KEYS as key, index (key)}
				{@const item = t.pupitres.items[key]}
				<li class="border-t border-ink/15 pt-5">
					<a href={resolve('/(public)/[lang=lang]/formation', { lang })} class="group flex gap-5">
						<span
							class="font-serif text-2xl leading-none text-or-dark transition-colors group-hover:text-marine"
						>
							{String(index + 1).padStart(2, '0')}
						</span>
						<span class="min-w-0">
							<span class="block font-serif text-2xl leading-tight text-marine">
								{item.name}
							</span>
							<span class="mt-1 block text-xs italic text-ink/45">{item.breton}</span>
							<span class="mt-2 block text-sm leading-relaxed text-ink/70">
								{item.description}
							</span>
						</span>
					</a>
				</li>
			{/each}
		</ul>

		<a
			href={resolve('/(public)/[lang=lang]/formation', { lang })}
			class="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-marine transition-colors hover:text-marine-700"
		>
			{t.pupitres.cta}
			<ArrowRight class="h-4 w-4" />
		</a>
	</div>
</section>
