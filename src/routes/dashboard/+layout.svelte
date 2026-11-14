<script lang="ts">
	import type { Snippet } from 'svelte';
	import MemberShell from '$lib/member/components/MemberShell.svelte';
	import { member } from '$lib/member/store.svelte';

	interface Props {
		data: { snapshot: import('$lib/member/types').MemberSnapshot };
		children?: Snippet;
	}

	let { data, children }: Props = $props();

	/**
	 * Le `load` du layout a produit l'instantané sous RLS. On l'applique avant
	 * le rendu des pages et à chaque navigation qui renvoie un nouvel état.
	 */
	member.applySnapshot(data.snapshot);

	$effect(() => {
		if (data.snapshot) member.applySnapshot(data.snapshot);
	});
</script>

<MemberShell>{@render children?.()}</MemberShell>
