<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { LogOut } from '@lucide/svelte';

	const homeHref = resolve('/(public)/[lang=lang]', { lang: 'fr' });
</script>

<svelte:head>
	<title>Déconnexion — Bagad Penhars</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main
	class="flex min-h-screen flex-col items-center justify-center gap-6 bg-ivoire px-5 text-center"
>
	<h1 class="font-serif text-3xl text-marine">Se déconnecter ?</h1>
	<p class="max-w-md text-sm leading-relaxed text-ink/65">
		Votre session Better Auth sera invalidée côté serveur et le cookie de session sera effacé.
	</p>
	<form method="POST" use:enhance>
		<button
			type="submit"
			class="inline-flex items-center gap-2 rounded-none border border-marine bg-marine px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-marine/90"
		>
			<LogOut size={16} aria-hidden="true" />
			Confirmer la déconnexion
		</button>
	</form>
	<a
		href={homeHref}
		class="text-sm font-semibold text-marine/70 underline-offset-4 transition-colors hover:text-marine hover:underline"
	>
		Retour au site public
	</a>
</main>
