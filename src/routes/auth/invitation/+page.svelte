<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { CircleAlert, CircleCheck, LoaderCircle } from '@lucide/svelte';
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let submitting = $state(false);
	let password = $state('');
	let confirmPassword = $state('');

	const homeHref = resolve('/(public)/[lang=lang]', { lang: 'fr' });

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
	<title>Activer mon compte — Espace adhérents · Bagad Penhars</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="flex min-h-screen flex-col bg-ivoire px-5 py-7 sm:px-8 lg:px-12 lg:py-10">
	<div class="mx-auto w-full max-w-md">
		<a href={homeHref} class="inline-flex items-center gap-3" aria-label="Bagad Penhars — accueil">
			<span
				class="flex h-12 w-12 items-center justify-center rounded-full bg-white ring-1 ring-ink/10"
			>
				<img src="/logo-penhars.svg" alt="" width="36" height="36" class="h-9 w-9" />
			</span>
			<span class="font-serif text-lg font-semibold leading-none text-marine">Bagad Penhars</span>
		</a>

		<h1 class="mt-8 font-serif text-4xl leading-[1.05] tracking-[-0.015em] text-marine">
			Activer mon compte
		</h1>

		{#if form?.success}
			<div class="mt-6 flex gap-3 border-l-2 border-marine bg-marine/5 px-4 py-3" role="status">
				<CircleCheck class="mt-0.5 h-4 w-4 shrink-0 text-marine" aria-hidden="true" />
				<div class="text-sm leading-relaxed text-marine">
					<p class="font-semibold">Votre compte est créé.</p>
					<p class="mt-1">
						Votre adresse est confirmée. Un administrateur ou la secrétaire doit maintenant activer
						votre accès. Vous pourrez ensuite vous connecter.
					</p>
					<a
						class="mt-3 inline-block font-semibold underline underline-offset-4"
						href={resolve('/auth/login')}
					>
						Aller à la connexion
					</a>
				</div>
			</div>
		{:else if !data.valid}
			<div class="mt-6 flex gap-3 border-l-2 border-danger bg-danger/5 px-4 py-3" role="alert">
				<CircleAlert class="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
				<p class="text-sm leading-relaxed text-danger">{data.error}</p>
			</div>
			<p class="mt-4 text-sm text-ink/65">
				Demandez une nouvelle invitation à la secrétaire du bagad.
			</p>
		{:else}
			<p class="mt-4 text-sm leading-relaxed text-ink/65">
				Bonjour {data.firstName}
				{data.lastName}. Choisissez le mot de passe de votre compte
				<strong>{data.email}</strong>. Vos pupitres ({(data.pupitres ?? []).join(', ')}) sont déjà
				enregistrés et ne sont pas modifiables ici.
			</p>

			{#if form?.error}
				<div class="mt-6 flex gap-3 border-l-2 border-danger bg-danger/5 px-4 py-3" role="alert">
					<CircleAlert class="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
					<p class="text-sm leading-relaxed text-danger">{form.error}</p>
				</div>
			{/if}

			<form method="POST" action="?/accept" use:enhance={submit} class="mt-7 space-y-5">
				<input type="hidden" name="token" value={data.token} />

				<div>
					<label class={labelClass} for="password">Mot de passe</label>
					<input
						id="password"
						name="password"
						type="password"
						required
						minlength="8"
						autocomplete="new-password"
						bind:value={password}
						class="{inputClass} mt-2"
						disabled={submitting}
					/>
					<p class="mt-1.5 text-xs text-ink/55">Huit caractères minimum.</p>
				</div>

				<div>
					<label class={labelClass} for="confirmPassword">Confirmer le mot de passe</label>
					<input
						id="confirmPassword"
						name="confirmPassword"
						type="password"
						required
						minlength="8"
						autocomplete="new-password"
						bind:value={confirmPassword}
						class="{inputClass} mt-2"
						disabled={submitting}
					/>
				</div>

				<button type="submit" class="btn-primary w-full" disabled={submitting}>
					{#if submitting}
						<LoaderCircle class="h-4 w-4 animate-spin" aria-hidden="true" />
						Création…
					{:else}
						Créer mon compte
					{/if}
				</button>
			</form>
		{/if}
	</div>
</main>
