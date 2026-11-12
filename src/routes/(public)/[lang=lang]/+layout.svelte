<script lang="ts">
	import type { Snippet } from 'svelte';
	import Nav from '$lib/components/layout/Nav.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import FloatingPlayer from '$lib/components/layout/FloatingPlayer.svelte';
	import { getDict } from '$lib/i18n';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	const t = $derived(getDict(data.lang));
	let playerOpen = $state(false);

	$effect(() => {
		document.documentElement.lang = data.lang;
	});
</script>

<a class="skip-link" href="#contenu">{t.nav.skip}</a>

<Nav lang={data.lang} {t} onListen={() => (playerOpen = !playerOpen)} />

<main id="contenu" tabindex="-1" class="min-h-[60vh] outline-none">
	{@render children()}
</main>

<Footer lang={data.lang} {t} />

<FloatingPlayer open={playerOpen} onClose={() => (playerOpen = false)} {t} />
