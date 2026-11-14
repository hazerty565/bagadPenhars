<script lang="ts">
	import { dev } from '$app/environment';
	import type { Component } from 'svelte';

	interface Props {
		loader: () => Promise<{ default: unknown }>;
		props?: Record<string, unknown>;
	}

	let { loader, props = {} }: Props = $props();

	type ViewComponent = Component<Record<string, unknown>>;

	let View = $state<ViewComponent | null>(null);
	let error = $state<string | null>(null);

	$effect(() => {
		if (!dev) return;
		let cancelled = false;
		loader()
			.then((module) => {
				if (!cancelled) View = module.default as ViewComponent;
			})
			.catch((reason: unknown) => {
				if (!cancelled) {
					error =
						reason instanceof Error
							? reason.message
							: 'Le module de démonstration n’a pas pu être chargé.';
				}
			});
		return () => {
			cancelled = true;
		};
	});
</script>

{#if error}
	<div class="border border-danger/30 bg-white p-6 text-sm text-danger" role="alert">
		<p class="font-semibold">Impossible d’afficher cette page de démonstration.</p>
		<p class="mt-1">{error}</p>
	</div>
{:else if View}
	<View {...props} />
{:else}
	<p class="py-16 text-center text-sm text-ardoise" role="status">
		Chargement de la démonstration…
	</p>
{/if}
