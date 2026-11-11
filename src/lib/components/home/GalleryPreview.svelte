<script lang="ts">
	import { ArrowUpRight, ImageOff } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import type { Dictionary, Lang } from '$lib/i18n';
	import type { PublicPhoto } from '$lib/types';

	let { t, lang, photos }: { t: Dictionary; lang: Lang; photos: PublicPhoto[] } = $props();

	const visible = $derived(photos.slice(0, 3));
</script>

<section class="bg-ivoire py-16 sm:py-20">
	<div class="container-page">
		<div class="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
			<div>
				<p class="eyebrow">
					<span class="h-px w-8 bg-or" aria-hidden="true"></span>
					{t.gallery.eyebrow}
				</p>
				<h2 class="mt-4 font-serif text-3xl leading-tight text-marine sm:text-4xl">
					{t.gallery.title}
				</h2>
				<p class="mt-3 max-w-xl text-sm leading-relaxed text-ink/65">{t.gallery.lead}</p>
			</div>

			<a
				href={resolve('/(public)/[lang=lang]/media', { lang })}
				class="inline-flex items-center gap-2 self-start border-b border-marine/30 pb-1 text-sm font-semibold text-marine transition-colors hover:border-marine sm:self-auto"
			>
				{t.gallery.cta}
				<ArrowUpRight class="h-4 w-4" />
			</a>
		</div>

		{#if visible.length === 0}
			<div
				class="mt-10 flex flex-col items-start gap-4 border border-ink/10 bg-white px-6 py-8 sm:flex-row sm:items-center"
			>
				<ImageOff class="h-6 w-6 text-marine/50" />
				<p class="text-sm leading-relaxed text-ink/65">{t.gallery.lead}</p>
			</div>
		{:else}
			<div class="mt-10 grid gap-5 sm:grid-cols-3 sm:items-start">
				{#each visible as photo, index (photo.id)}
					<figure class={index === 1 ? 'sm:mt-10' : index === 2 ? 'sm:mt-20' : ''}>
						<div class="overflow-hidden bg-sable">
							<img
								src={photo.thumbnailUrl}
								alt={photo.caption ?? ''}
								width="960"
								height="1280"
								fetchpriority="high"
								decoding="async"
								class="aspect-[3/4] w-full object-cover transition-transform duration-500 hover:scale-[1.02]"
							/>
						</div>
						{#if photo.caption}
							<figcaption class="mt-2.5 text-xs text-ink/50">{photo.caption}</figcaption>
						{/if}
					</figure>
				{/each}
			</div>
		{/if}
	</div>
</section>
