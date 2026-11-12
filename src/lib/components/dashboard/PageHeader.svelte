<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		eyebrow?: string;
		description?: string;
		actions?: Snippet;
	}

	let { title, eyebrow, description, actions }: Props = $props();
</script>

<header
	class="flex flex-col gap-4 border-b border-marine/10 pb-6 sm:flex-row sm:items-end sm:justify-between"
>
	<div class="min-w-0">
		{#if eyebrow}
			<p class="eyebrow">{eyebrow}</p>
		{/if}
		<h1 class="mt-2 font-serif text-3xl leading-tight text-marine sm:text-4xl">{title}</h1>
		{#if description}
			<p class="mt-2 max-w-2xl text-sm leading-relaxed text-ardoise">{description}</p>
		{/if}
	</div>
	{#if actions}
		<div class="flex shrink-0 flex-wrap items-center gap-2">{@render actions()}</div>
	{/if}
</header>
