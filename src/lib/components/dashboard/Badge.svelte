<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		tone?: 'neutral' | 'marine' | 'gold' | 'danger' | 'success' | 'muted';
		children: Snippet;
		title?: string;
	}

	let { tone = 'neutral', children, title }: Props = $props();

	const toneClass = $derived(
		tone === 'marine'
			? 'border-marine/25 bg-marine/10 text-marine'
			: tone === 'gold'
				? 'border-or/50 bg-or/15 text-or-dark'
				: tone === 'danger'
					? 'border-danger/30 bg-danger/10 text-danger'
					: tone === 'success'
						? 'border-emerald-700/25 bg-emerald-700/10 text-emerald-800'
						: tone === 'muted'
							? 'border-ardoise/20 bg-ivoire text-ardoise'
							: 'border-marine/15 bg-white text-ink'
	);
</script>

<span
	class="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold leading-none {toneClass}"
	{title}
>
	{@render children()}
</span>
