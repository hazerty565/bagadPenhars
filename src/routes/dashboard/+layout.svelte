<script lang="ts">
	import { dev } from '$app/environment';
	import type { Component, Snippet } from 'svelte';

	interface Props {
		children?: Snippet;
	}

	let { children }: Props = $props();

	/**
	 * En développement, la coquille de démonstration est chargée en import
	 * dynamique : le build de production ne référence jamais `$lib/demo`.
	 */
	let Shell = $state<Component<{ children?: Snippet }> | null>(null);

	$effect(() => {
		if (!dev) return;
		let cancelled = false;
		import('$lib/demo/components/DemoShell.svelte')
			.then((module) => {
				if (!cancelled) Shell = module.default;
			})
			.catch(() => {
				if (!cancelled) Shell = null;
			});
		return () => {
			cancelled = true;
		};
	});
</script>

{#if dev}
	{#if Shell}
		<Shell>{@render children?.()}</Shell>
	{:else}
		<p class="p-10 text-center text-sm text-ardoise" role="status">
			Chargement de l’espace de démonstration…
		</p>
	{/if}
{:else}
	{@render children?.()}
{/if}
