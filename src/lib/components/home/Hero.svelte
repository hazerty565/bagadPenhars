<script lang="ts">
	import { CalendarDays, MoveDown } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import type { Dictionary, Lang } from '$lib/i18n';

	let { t, lang }: { t: Dictionary; lang: Lang } = $props();
</script>

<section class="relative overflow-hidden bg-ivoire">
	<div
		class="container-page grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16 lg:py-20"
	>
		<div class="max-w-xl">
			<p class="eyebrow">
				<span class="h-px w-8 bg-or" aria-hidden="true"></span>
				{t.hero.eyebrow}
			</p>

			<h1
				class="mt-5 font-serif text-[2.9rem] leading-[0.98] tracking-[-0.015em] text-marine sm:text-6xl lg:text-7xl"
			>
				Bagad
				<br />
				Penhars
			</h1>

			<p class="mt-6 max-w-lg text-base leading-relaxed text-ink/75 sm:text-lg">
				{t.hero.lead}
			</p>

			<div class="mt-8 flex flex-wrap items-center gap-3">
				<a href={resolve('/(public)/[lang=lang]/agenda', { lang })} class="btn-primary">
					{t.hero.ctaPrimary}
					<CalendarDays class="h-4 w-4" />
				</a>
				<a href="#le-bagad" class="btn-ghost">
					{t.hero.ctaSecondary}
					<MoveDown class="h-4 w-4" />
				</a>
			</div>

			<dl class="mt-10 flex flex-wrap gap-x-12 gap-y-4 border-t border-ink/10 pt-6">
				<div>
					<dt class="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-ink/50">
						{t.hero.sinceLabel}
					</dt>
					<dd class="mt-1 font-serif text-2xl text-marine">{t.hero.sinceValue}</dd>
				</div>
				<div>
					<dt class="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-ink/50">
						{t.hero.pupitresLabel}
					</dt>
					<dd class="mt-1 font-serif text-2xl text-marine">{t.hero.pupitresValue}</dd>
				</div>
			</dl>
		</div>

		<figure class="relative">
			<div
				class="absolute -left-3 -top-3 h-full w-full border border-or/70"
				aria-hidden="true"
			></div>
			<img
				src="/hero.webp"
				alt={t.hero.imageAlt}
				width="1536"
				height="1148"
				loading="eager"
				fetchpriority="high"
				decoding="async"
				class="relative aspect-[4/3] w-full object-cover"
			/>
			<figcaption class="mt-3 flex items-center gap-2 text-xs text-ink/50">
				<span class="h-px w-6 bg-or" aria-hidden="true"></span>
				{t.hero.caption}
			</figcaption>
		</figure>
	</div>
</section>
