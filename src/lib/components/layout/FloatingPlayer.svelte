<script lang="ts">
	import { Music2, X } from 'lucide-svelte';
	import type { Dictionary } from '$lib/i18n';

	let { open, onClose, t }: { open: boolean; onClose: () => void; t: Dictionary } = $props();

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
	<aside
		class="fixed bottom-4 right-4 z-50 w-[min(22rem,calc(100vw-2rem))] border border-or/50 bg-white shadow-xl"
		role="region"
		aria-label={t.player.title}
	>
		<div class="h-1 w-full bg-or"></div>

		<div class="flex items-center justify-between gap-4 border-b border-ink/10 bg-ivoire px-4 py-3">
			<div class="flex items-center gap-3">
				<span class="flex h-9 w-9 items-center justify-center border border-or/60 text-marine">
					<Music2 class="h-4 w-4" />
				</span>
				<div class="leading-tight">
					<p class="text-sm font-semibold text-marine">{t.player.title}</p>
					<p class="mt-0.5 text-[0.58rem] uppercase tracking-[0.18em] text-ink/45">
						{t.player.subtitle}
					</p>
				</div>
			</div>

			<button
				type="button"
				onclick={onClose}
				aria-label={t.player.close}
				class="flex h-8 w-8 items-center justify-center text-ink/50 transition-colors hover:text-marine"
			>
				<X class="h-4 w-4" />
			</button>
		</div>

		<div class="px-4 py-5">
			<p class="font-serif text-lg leading-snug text-marine">{t.player.emptyTitle}</p>
			<p class="mt-2 text-sm leading-relaxed text-ink/65">{t.player.emptyText}</p>
		</div>
	</aside>
{/if}
