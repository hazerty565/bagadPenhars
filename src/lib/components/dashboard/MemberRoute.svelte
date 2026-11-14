<script lang="ts">
	import AsyncMemberPage from './AsyncMemberPage.svelte';

	/**
	 * Point d’entrée des routes de l’espace membre.
	 *
	 * Les pages sont chargées en import dynamique pour garder le bundle public
	 * léger. Les données, elles, viennent de l’instantané serveur filtré par RLS.
	 */
	interface Props {
		loader: () => Promise<{ default: unknown }>;
		props?: Record<string, unknown>;
	}

	let { loader, props = {} }: Props = $props();
</script>

<AsyncMemberPage {loader} {props} />
