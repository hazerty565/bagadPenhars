<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { ArrowLeft, CircleAlert, Eye, EyeOff, LoaderCircle } from '@lucide/svelte';
	import { copyrightYears } from '$lib/data/site';
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let showPassword = $state(false);
	let submitting = $state(false);

	const copyright = copyrightYears();

	/**
	 * L'espace adhérents est en français : les liens de la page pointent donc
	 * explicitement vers les routes publiques `fr`.
	 */
	const homeHref = resolve('/(public)/[lang=lang]', { lang: 'fr' });
	const contactHref = resolve('/(public)/[lang=lang]/contact', { lang: 'fr' });
	const forgotHref = resolve('/auth/forgot-password');

	/** Conserve les valeurs saisies après un échec d'identification. */
	const submit: SubmitFunction = () => {
		submitting = true;
		return async ({ update }) => {
			try {
				await update({ reset: false });
			} finally {
				submitting = false;
			}
		};
	};

	const labelClass = 'block text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-marine/75';
	const inputClass =
		'w-full rounded-none border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink transition-colors placeholder:text-ink/35 focus:border-marine focus:outline-none disabled:opacity-60';
</script>

<svelte:head>
	<title>Connexion — Espace adhérents · Bagad Penhars</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="flex min-h-screen flex-col bg-ivoire px-5 py-7 sm:px-8 lg:px-12 lg:py-10">
	<a href="#connexion" class="skip-link">Aller au formulaire de connexion</a>

	<div class="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
		<a href={homeHref} class="inline-flex items-center gap-3" aria-label="Bagad Penhars — accueil">
			<span
				class="flex h-12 w-12 items-center justify-center rounded-full bg-white ring-1 ring-ink/10"
			>
				<img src="/logo-penhars.svg" alt="" width="36" height="36" class="h-9 w-9" />
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

	<div class="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12 sm:py-16">
		<p class="eyebrow">
			<span class="h-px w-8 bg-or" aria-hidden="true"></span>
			Espace adhérents
		</p>

		<h1 class="mt-5 font-serif text-4xl leading-[1.05] tracking-[-0.015em] text-marine sm:text-5xl">
			Connexion
		</h1>

		<p class="mt-4 text-sm leading-relaxed text-ink/65">
			Identifiez-vous pour accéder à l’espace réservé aux adhérents du Bagad Penhars.
		</p>

		<form
			id="connexion"
			method="POST"
			action="?/login"
			use:enhance={submit}
			class="mt-9"
			aria-busy={submitting}
		>
			{#if form?.error}
				<div
					id="connexion-erreur"
					role="alert"
					class="mb-6 flex gap-3 border-l-2 border-danger bg-danger/5 px-4 py-3"
				>
					<CircleAlert class="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
					<p class="text-sm leading-relaxed text-danger">{form.error}</p>
				</div>
			{/if}

			<div>
				<label class={labelClass} for="email">Adresse e-mail</label>
				<div class="mt-2">
					<input
						id="email"
						name="email"
						type="email"
						required
						maxlength="160"
						inputmode="email"
						autocomplete="username"
						autocapitalize="none"
						spellcheck="false"
						value={form?.email ?? ''}
						aria-invalid={form?.error ? 'true' : undefined}
						aria-describedby={form?.error ? 'connexion-erreur' : undefined}
						class={inputClass}
						disabled={submitting}
					/>
				</div>
			</div>

			<div class="mt-5">
				<div class="flex items-baseline justify-between gap-4">
					<label class={labelClass} for="password">Mot de passe</label>
					<a
						href={forgotHref}
						class="text-xs font-semibold text-marine/70 underline-offset-4 transition-colors hover:text-marine hover:underline"
					>
						Mot de passe oublié ?
					</a>
				</div>
				<div class="relative mt-2">
					<input
						id="password"
						name="password"
						type={showPassword ? 'text' : 'password'}
						required
						minlength="6"
						autocomplete="current-password"
						aria-invalid={form?.error ? 'true' : undefined}
						aria-describedby={form?.error ? 'connexion-erreur' : undefined}
						class="{inputClass} pr-12"
						disabled={submitting}
					/>
					<button
						type="button"
						onclick={() => (showPassword = !showPassword)}
						class="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-ink/45 transition-colors hover:text-marine disabled:opacity-60"
						aria-label="Afficher le mot de passe"
						aria-pressed={showPassword}
						aria-controls="password"
						disabled={submitting}
					>
						{#if showPassword}
							<EyeOff class="h-4 w-4" aria-hidden="true" />
						{:else}
							<Eye class="h-4 w-4" aria-hidden="true" />
						{/if}
					</button>
				</div>
			</div>

			<button type="submit" class="btn-primary mt-7 w-full" disabled={submitting}>
				{#if submitting}
					<LoaderCircle class="h-4 w-4 animate-spin" aria-hidden="true" />
					Connexion…
				{:else}
					Se connecter
				{/if}
			</button>
		</form>

		<div class="mt-8 border-t border-ink/10 pt-6">
			<p class="text-sm leading-relaxed text-ink/60">
				L’accès se fait uniquement sur invitation. Une question sur votre compte ?
				<a
					href={contactHref}
					class="font-semibold text-marine underline decoration-or/60 underline-offset-4 transition-colors hover:decoration-or"
				>
					Écrivez-nous
				</a>.
			</p>
		</div>
	</div>

	<footer class="mx-auto w-full max-w-5xl border-t border-ink/10 pt-4 text-[0.7rem] text-ink/45">
		<p>Copyright © {copyright} Bagad Penhars · Quimper</p>
	</footer>
</main>
