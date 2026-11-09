<script lang="ts">
	import { ArrowRight, Mail } from 'lucide-svelte';
	import { resolve } from '$app/paths';
	import Ornament from '$lib/components/ui/Ornament.svelte';
	import type { Dictionary, Lang } from '$lib/i18n';

	let { t, lang }: { t: Dictionary; lang: Lang } = $props();
</script>

<section class="relative overflow-hidden bg-marine py-16 text-ivoire sm:py-20">
	<div
		class="pointer-events-none absolute -right-10 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full border border-or/15"
		aria-hidden="true"
	></div>
	<div
		class="pointer-events-none absolute -right-24 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full border border-or/10"
		aria-hidden="true"
	></div>

	<div
		class="container-page relative grid gap-8 lg:grid-cols-[1.25fr_auto] lg:items-center lg:gap-16"
	>
		<div class="max-w-2xl">
			<p
				class="flex items-center gap-3 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-or-light"
			>
				<span class="h-px w-8 bg-or" aria-hidden="true"></span>
				{t.join.eyebrow}
			</p>

			<h2 class="mt-4 font-serif text-3xl leading-tight sm:text-4xl">{t.join.title}</h2>
			<p class="mt-4 text-base leading-relaxed text-ivoire/70">{t.join.text}</p>
		</div>

		<div class="flex flex-wrap items-center gap-3">
			<a href={resolve('/(public)/[lang=lang]/contact', { lang })} class="btn-gold">
				<Mail class="h-4 w-4" />
				{t.join.ctaContact}
			</a>
			<a href={resolve('/(public)/[lang=lang]/formation', { lang })} class="btn-light">
				{t.join.ctaFormation}
				<ArrowRight class="h-4 w-4" />
			</a>
		</div>
	</div>

	<div class="container-page mt-12 hidden sm:block">
		<Ornament className="h-4 w-32 text-or/50" />
	</div>
</section>
