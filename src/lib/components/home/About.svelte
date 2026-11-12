<script lang="ts">
	import { ArrowRight } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import Ornament from '$lib/components/ui/Ornament.svelte';
	import type { Dictionary, Lang } from '$lib/i18n';

	let { t, lang }: { t: Dictionary; lang: Lang } = $props();
</script>

<section id="le-bagad" class="scroll-mt-24 bg-white py-16 sm:py-20">
	<div class="container-page grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
		<figure class="relative order-2 lg:order-1">
			<img
				src="/couple_jeune.webp"
				alt={t.about.imageAlt}
				width="2000"
				height="1333"
				fetchpriority="high"
				decoding="async"
				class="aspect-[4/5] w-full object-cover object-[50%_35%] sm:aspect-[5/4] lg:aspect-[4/5]"
			/>
			<div class="absolute -bottom-4 -right-4 hidden bg-ivoire px-5 py-4 sm:block">
				<p class="font-serif text-3xl leading-none text-marine">{t.hero.sinceValue}</p>
				<p class="mt-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-ink/50">
					{t.about.since}
				</p>
			</div>
		</figure>

		<div class="order-1 lg:order-2">
			<p class="eyebrow">
				<span class="h-px w-8 bg-or" aria-hidden="true"></span>
				{t.about.eyebrow}
			</p>

			<h2 class="mt-4 max-w-lg font-serif text-3xl leading-tight text-marine sm:text-4xl">
				{t.about.title}
			</h2>

			<Ornament className="mt-6 h-4 w-28 text-or" />

			<div class="mt-6 space-y-4">
				{#each t.about.paragraphs as paragraph, index (index)}
					<p class="max-w-xl text-base leading-relaxed text-ink/70">{paragraph}</p>
				{/each}
			</div>

			<a href={resolve('/(public)/[lang=lang]/bagad', { lang })} class="btn-ghost mt-8">
				{t.about.cta}
				<ArrowRight class="h-4 w-4" />
			</a>
		</div>
	</div>
</section>
