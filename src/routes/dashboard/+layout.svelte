<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import MemberShell from '$lib/member/components/MemberShell.svelte';
	import { member } from '$lib/member/store.svelte';

	interface Props {
		data: { memberShell: import('$lib/member/types').MemberShell };
		children?: Snippet;
	}

	let { data, children }: Props = $props();

	/**
	 * Le `load` du layout a produit le socle (profil de session +
	 * compteur de notifications non lues). On l'applique avant le rendu
	 * des pages et à chaque navigation qui renvoie un nouvel état.
	 */
	member.applyShell(data.memberShell);

	$effect(() => {
		if (data.memberShell) member.applyShell(data.memberShell);
	});

	// Abonnement aux changements de route : à chaque navigation, on vide
	// les données de la page précédente. Le socle (profil + unreadCount)
	// reste conservé par le store.
	$effect(() => {
		void page.url.pathname;
		member.clearPage();
	});
</script>

<MemberShell>{@render children?.()}</MemberShell>
