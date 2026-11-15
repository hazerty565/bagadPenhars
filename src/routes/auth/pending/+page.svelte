<script lang="ts">
	import { resolve } from '$app/paths';
	import { ArrowLeft, CircleAlert, Hourglass } from '@lucide/svelte';
	import { copyrightYears } from '$lib/data/site';

	let { data }: { data: { email?: string | null } } = $props();

	const homeHref = resolve('/(public)/[lang=lang]', { lang: 'fr' });
	const contactHref = resolve('/(public)/[lang=lang]/contact', { lang: 'fr' });
	const logoutHref = resolve('/auth/logout');
	const copyright = copyrightYears();
</script>

<svelte:head>
	<title>Compte en attente — Bagad Penhars</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="flex min-h-screen flex-col bg-ivoire px-5 py-7 sm:px-8 lg:px-12 lg:py-10">
	<a href="#attente" class="skip-link">Aller au contenu principal</a>

	<div class="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
		<a href={homeHref} class="inline-flex items-center gap-3" aria-label="Bagad Penhars — accueil">
			<span
				class="flex h-12 w-12 items-center justify-center rounded-full bg-white ring-1 ring-ink/10"
			>
				<img
					src="/logo-penhars.svg"
					alt=""
					width="36"
					height="36"
					fetchpriority="high"
					class="h-9 w-9"
				/>
			</span>
			<span class="font-serif text-lg font-semibold leading-none text-marine"> Bagad Penhars </span>
		</a>

		<a
			href={homeHref}
			class="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-marine/70 transition-colors hover:text-marine"
		>
			<ArrowLeft class="h-4 w-4" aria-hidden="true" />
			Retour au site
		</a>
	</div>

	<div
		id="attente"
		class="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12 sm:py-16"
	>
		<p class="eyebrow">
			<span class="h-px w-8 bg-or" aria-hidden="true"></span>
			Espace adhérents
		</p>

		<h1 class="mt-5 font-serif text-4xl leading-[1.05] tracking-[-0.015em] text-marine sm:text-5xl">
			Compte en attente
		</h1>

		<p class="mt-4 text-sm leading-relaxed text-ink/65">
			Votre compte a été créé, mais il n’est pas encore activé. Un administrateur ou la secrétaire
			valide les accès : vous recevrez une confirmation, puis vous pourrez vous connecter à l’espace
			adhérents.
		</p>

		<section class="mt-8 border border-or/40 bg-white p-5" aria-label="Détails du compte">
			<p class="flex items-center gap-2 text-sm font-semibold text-marine">
				<Hourglass class="h-4 w-4 text-or-dark" aria-hidden="true" />
				Statut : en attente de validation
			</p>
			{#if data.email}
				<p class="mt-2 text-sm text-ink/70">
					Compte : <span class="font-medium text-ink">{data.email}</span>
				</p>
			{/if}
			<p class="mt-3 flex gap-2 text-xs leading-relaxed text-ink/60">
				<CircleAlert class="mt-0.5 h-4 w-4 shrink-0 text-or-dark" aria-hidden="true" />
				<span>
					Cette page reflète l’état réel de votre compte dans la base. Reconnectez-vous plus tard
					pour vérifier s’il a été activé.
				</span>
			</p>
		</section>

		<div class="mt-8 flex flex-wrap items-center gap-4">
			<form method="POST" action={logoutHref}>
				<button type="submit" class="btn-primary">Se déconnecter</button>
			</form>
			<a
				href={contactHref}
				class="text-sm font-semibold text-marine underline decoration-or/60 underline-offset-4 transition-colors hover:decoration-or"
			>
				Contacter l’association
			</a>
		</div>
	</div>

	<footer class="mx-auto w-full max-w-5xl border-t border-ink/10 pt-4 text-[0.7rem] text-ink/45">
		<p>Copyright © {copyright} Bagad Penhars · Quimper</p>
	</footer>
</main>
