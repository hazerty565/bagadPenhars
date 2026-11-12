<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		description?: string;
		actions?: Snippet;
		icon?: Snippet;
	}

	let { title, description, actions, icon }: Props = $props();
</script>

<div
	class="flex flex-col items-center justify-center border border-dashed border-marine/25 bg-white px-6 py-12 text-center"
>
	{#if icon}
		<div class="mb-4 text-marine/40">{@render icon()}</div>
	{/if}
	<p class="font-serif text-xl text-marine">{title}</p>
	{#if description}
		<p class="mt-2 max-w-md text-sm leading-relaxed text-ardoise">{description}</p>
	{/if}
	{#if actions}
		<div class="mt-5">{@render actions()}</div>
	{/if}
</div>
