<script lang="ts">
	import { dev } from '$app/environment';
	import { resolve } from '$app/paths';
	import AsyncDemoPage from './AsyncDemoPage.svelte';

	/**
	 * Point d’entrée des routes de l’espace membre.
	 *
	 * En développement uniquement, le module de démonstration est chargé en
	 * import dynamique. Dans un build de production, la branche est éliminée et
	 * aucun module de `$lib/demo` n’est référencé.
	 */
	interface Props {
		loader: () => Promise<{ default: unknown }>;
		props?: Record<string, unknown>;
	}

	let { loader, props = {} }: Props = $props();
</script>

{#if dev}
	<AsyncDemoPage {loader} {props} />
{:else}
	<div class="border border-marine/15 bg-white p-8 text-center">
		<p class="font-serif text-2xl text-marine">Espace adhérents</p>
		<p class="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ardoise">
			Cet espace nécessite une session vérifiée. La page de démonstration n’est disponible qu’en
			développement local.
		</p>
		<a
			href={resolve('/auth/login')}
			class="mt-5 inline-flex items-center justify-center border border-marine bg-marine px-4 py-2.5 text-sm font-semibold text-white"
		>
			Se connecter
		</a>
	</div>
{/if}
