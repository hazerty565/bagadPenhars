<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		label: string;
		value: string | number;
		hint?: string;
		tone?: 'marine' | 'gold' | 'plain';
		icon?: Snippet;
	}

	let { label, value, hint, tone = 'plain', icon }: Props = $props();
</script>

<div
	class="border p-4 sm:p-5 {tone === 'marine'
		? 'border-marine bg-marine text-ivoire'
		: tone === 'gold'
			? 'border-or/50 bg-or/10 text-ink'
			: 'border-marine/15 bg-white text-ink'}"
>
	<div class="flex items-start justify-between gap-3">
		<p
			class="text-[0.65rem] font-semibold uppercase tracking-[0.18em] {tone === 'marine'
				? 'text-ivoire/70'
				: 'text-ardoise'}"
		>
			{label}
		</p>
		{#if icon}
			<span class={tone === 'marine' ? 'text-or-light' : 'text-or-dark'}>{@render icon()}</span>
		{/if}
	</div>
	<p
		class="mt-3 font-serif text-3xl leading-none {tone === 'marine' ? 'text-white' : 'text-marine'}"
	>
		{value}
	</p>
	{#if hint}
		<p class="mt-2 text-xs leading-relaxed {tone === 'marine' ? 'text-ivoire/70' : 'text-ardoise'}">
			{hint}
		</p>
	{/if}
</div>
