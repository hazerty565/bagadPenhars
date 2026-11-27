<script lang="ts">
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { CircleAlert, CircleCheck, Clock, Mail, MapPin, Send } from '@lucide/svelte';
	import MapPanel from '$lib/components/shared/Map.svelte';
	import { site } from '$lib/data/site';
	import { getDict } from '$lib/i18n';
	import type { PageProps, SubmitFunction } from './$types';

	export const prerender = true;

	let { data, form }: PageProps = $props();

	const t = $derived(getDict(data.lang));
	const c = $derived(t.contact);
	const f = $derived(c.form);

	type ContactErrorCode = 'invalid' | 'captcha' | 'send' | 'unavailable';

	interface ContactFailure {
		code: ContactErrorCode;
		values?: Record<string, string>;
		fieldErrors?: Record<string, string[] | undefined>;
	}

	const ERROR_CODES: readonly string[] = ['invalid', 'captcha', 'send', 'unavailable'];

	function isErrorCode(value: unknown): value is ContactErrorCode {
		return typeof value === 'string' && ERROR_CODES.includes(value);
	}

	const succeeded = $derived(form !== null && 'success' in form && form.success === true);
	const failure: ContactFailure | null = $derived(
		form !== null && 'code' in form && isErrorCode(form.code)
			? (form as unknown as ContactFailure)
			: null
	);
	const failureMessage = $derived(failure ? f.errors[failure.code] : undefined);

	const origin = $derived(page.url.origin);
	const canonical = $derived(`${origin}/${data.lang}/contact`);

	/** Retourne le message localisé d'un champ refusé par le serveur. */
	function fieldError(name: string): string | undefined {
		const list = failure?.fieldErrors?.[name];
		return list && list.length > 0 ? f.fieldError : undefined;
	}

	/* ---------------------------------------------------------------------
	 * Cloudflare Turnstile
	 *
	 * Le widget est monté explicitement : la navigation interne de SvelteKit ne
	 * rejoue pas le scan automatique du script. Le jeton reste dans un champ
	 * caché, et il est remis à zéro après un échec (un jeton est à usage unique).
	 * ------------------------------------------------------------------- */

	interface TurnstileApi {
		render(container: HTMLElement, options: Record<string, unknown>): string;
		reset(widgetId?: string): void;
		remove(widgetId?: string): void;
	}

	const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

	const TURNSTILE_LANG: Record<string, string> = { fr: 'fr', en: 'en', br: 'fr' };

	function turnstileApi(): TurnstileApi | undefined {
		return (window as unknown as { turnstile?: TurnstileApi }).turnstile;
	}

	function loadTurnstile(): Promise<TurnstileApi> {
		const ready = turnstileApi();
		if (ready) return Promise.resolve(ready);

		return new Promise((resolve, reject) => {
			const script = document.createElement('script');
			script.src = TURNSTILE_SRC;
			script.async = true;
			script.addEventListener('load', () => {
				const api = turnstileApi();
				if (api) resolve(api);
				else reject(new Error('API Turnstile absente après chargement'));
			});
			script.addEventListener('error', () => reject(new Error('Script Turnstile bloqué')));
			document.head.appendChild(script);
		});
	}

	let captchaContainer = $state<HTMLDivElement | null>(null);
	let widgetId = $state<string | null>(null);
	let token = $state('');
	let captchaBlocked = $state(false);
	let submitting = $state(false);

	onMount(() => {
		let cancelled = false;

		if (!data.turnstileSiteKey) {
			captchaBlocked = true;
			return;
		}

		loadTurnstile()
			.then((api) => {
				if (cancelled || !captchaContainer) return;

				widgetId = api.render(captchaContainer, {
					sitekey: data.turnstileSiteKey,
					language: TURNSTILE_LANG[data.lang] ?? 'fr',
					theme: 'light',
					size: 'flexible',
					callback: (value: string) => {
						token = value;
					},
					'expired-callback': () => {
						token = '';
					},
					'error-callback': () => {
						token = '';
						captchaBlocked = true;
					}
				});
			})
			.catch((error) => {
				console.error('[contact] Turnstile indisponible :', error);
				if (!cancelled) captchaBlocked = true;
			});

		return () => {
			cancelled = true;
			if (widgetId) turnstileApi()?.remove(widgetId);
			widgetId = null;
		};
	});

	const handleSubmit: SubmitFunction = () => {
		submitting = true;

		return async ({ result, update }) => {
			await update();
			submitting = false;

			if (result.type !== 'success') {
				token = '';
				if (widgetId) turnstileApi()?.reset(widgetId);
			}
		};
	};

	const labelClass = 'block text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-marine/75';
	const inputClass =
		'mt-2 w-full rounded-none border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink transition-colors placeholder:text-ink/35 focus:border-marine focus:outline-none disabled:opacity-60';
</script>

<svelte:head>
	<title>{c.meta.title}</title>
	<meta name="description" content={c.meta.description} />
	<link rel="canonical" href={canonical} />
	<link rel="alternate" hreflang="fr" href={`${origin}/fr/contact`} />
	<link rel="alternate" hreflang="en" href={`${origin}/en/contact`} />
	<link rel="alternate" hreflang="br" href={`${origin}/br/contact`} />
	<link rel="alternate" hreflang="x-default" href={`${origin}/fr/contact`} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={c.meta.title} />
	<meta property="og:description" content={c.meta.description} />
	<meta property="og:url" content={canonical} />
</svelte:head>

<section class="relative overflow-hidden bg-ivoire">
	<div class="container-page py-14 sm:py-16 lg:py-20">
		<div class="max-w-3xl">
			<p class="eyebrow">
				<span class="h-px w-8 bg-or" aria-hidden="true"></span>
				{c.eyebrow}
			</p>

			<h1
				class="mt-5 font-serif text-4xl leading-[1.03] tracking-[-0.01em] text-marine sm:text-5xl lg:text-6xl"
			>
				{c.title}
			</h1>

			<p class="mt-6 max-w-2xl text-base leading-relaxed text-ink/75 sm:text-lg">
				{c.lead}
			</p>
		</div>
	</div>
</section>

<section class="bg-white py-14 sm:py-20">
	<div class="container-page grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
		<div>
			<h2 class="font-serif text-2xl leading-tight text-marine sm:text-3xl">{f.title}</h2>
			<p class="mt-3 text-sm leading-relaxed text-ink/60">{f.intro}</p>

			{#if succeeded}
				<div
					class="mt-8 flex gap-4 border border-marine/15 bg-ivoire/70 p-6"
					role="status"
					aria-live="polite"
				>
					<CircleCheck class="mt-0.5 h-5 w-5 shrink-0 text-marine" aria-hidden="true" />
					<div>
						<p class="font-semibold text-marine">{f.successTitle}</p>
						<p class="mt-2 text-sm leading-relaxed text-ink/70">{f.successText}</p>
					</div>
				</div>
			{:else}
				{#if failureMessage}
					<div
						class="mt-8 flex gap-3 border-l-2 border-danger bg-danger/5 px-4 py-3 text-sm text-danger"
						role="alert"
					>
						<CircleAlert class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
						<p>
							<span class="font-semibold">{f.errorTitle} — </span>{failureMessage}
						</p>
					</div>
				{/if}

				<form method="POST" action="?/send" use:enhance={handleSubmit} class="mt-8">
					<div class="grid gap-5 sm:grid-cols-2">
						<div>
							<label class={labelClass} for="lastName">
								{f.lastName}
								<span class="text-danger" aria-hidden="true">*</span>
								<span class="sr-only">({f.required})</span>
							</label>
							<input
								id="lastName"
								name="lastName"
								type="text"
								required
								maxlength="80"
								autocomplete="family-name"
								value={failure && 'values' in failure ? failure.values?.lastName : ''}
								aria-invalid={fieldError('lastName') ? 'true' : undefined}
								aria-describedby={fieldError('lastName') ? 'lastName-error' : undefined}
								class={inputClass}
							/>
							{#if fieldError('lastName')}
								<p id="lastName-error" class="mt-1.5 text-xs font-medium text-danger">
									{fieldError('lastName')}
								</p>
							{/if}
						</div>

						<div>
							<label class={labelClass} for="firstName">
								{f.firstName}
								<span class="text-danger" aria-hidden="true">*</span>
								<span class="sr-only">({f.required})</span>
							</label>
							<input
								id="firstName"
								name="firstName"
								type="text"
								required
								maxlength="80"
								autocomplete="given-name"
								value={failure && 'values' in failure ? failure.values?.firstName : ''}
								aria-invalid={fieldError('firstName') ? 'true' : undefined}
								aria-describedby={fieldError('firstName') ? 'firstName-error' : undefined}
								class={inputClass}
							/>
							{#if fieldError('firstName')}
								<p id="firstName-error" class="mt-1.5 text-xs font-medium text-danger">
									{fieldError('firstName')}
								</p>
							{/if}
						</div>
					</div>

					<div class="mt-5">
						<label class={labelClass} for="email">
							{f.email}
							<span class="text-danger" aria-hidden="true">*</span>
							<span class="sr-only">({f.required})</span>
						</label>
						<input
							id="email"
							name="email"
							type="email"
							required
							maxlength="160"
							autocomplete="email"
							inputmode="email"
							value={failure && 'values' in failure ? failure.values?.email : ''}
							aria-invalid={fieldError('email') ? 'true' : undefined}
							aria-describedby={fieldError('email') ? 'email-error' : undefined}
							class={inputClass}
						/>
						{#if fieldError('email')}
							<p id="email-error" class="mt-1.5 text-xs font-medium text-danger">
								{fieldError('email')}
							</p>
						{/if}
					</div>

					<div class="mt-5">
						<label class={labelClass} for="subject">
							{f.subject}
							<span class="text-danger" aria-hidden="true">*</span>
							<span class="sr-only">({f.required})</span>
						</label>
						<select
							id="subject"
							name="subject"
							required
							value={failure && 'values' in failure ? failure.values?.subject : ''}
							aria-invalid={fieldError('subject') ? 'true' : undefined}
							aria-describedby={fieldError('subject') ? 'subject-error' : undefined}
							class={inputClass}
						>
							<option value="" disabled>{f.subjectPlaceholder}</option>
							{#each Object.entries(f.subjects) as [value, label] (value)}
								<option {value}>{label}</option>
							{/each}
						</select>
						{#if fieldError('subject')}
							<p id="subject-error" class="mt-1.5 text-xs font-medium text-danger">
								{fieldError('subject')}
							</p>
						{/if}
					</div>

					<div class="mt-5">
						<label class={labelClass} for="message">
							{f.message}
							<span class="text-danger" aria-hidden="true">*</span>
							<span class="sr-only">({f.required})</span>
						</label>
						<textarea
							id="message"
							name="message"
							rows="6"
							required
							minlength="10"
							maxlength="5000"
							aria-describedby="message-hint"
							aria-invalid={fieldError('message') ? 'true' : undefined}
							class={inputClass}
							>{failure && 'values' in failure ? failure.values?.message : ''}</textarea
						>
						<p id="message-hint" class="mt-1.5 text-xs leading-relaxed text-ink/50">
							{f.messageHint}
						</p>
						{#if fieldError('message')}
							<p class="mt-1.5 text-xs font-medium text-danger">{fieldError('message')}</p>
						{/if}
					</div>

					<div class="mt-6">
						<p class={labelClass} id="captcha-label">{f.captcha}</p>
						<div
							class="mt-2"
							bind:this={captchaContainer}
							role="group"
							aria-labelledby="captcha-label"
						></div>
						<input type="hidden" name="token" value={token} />

						{#if captchaBlocked}
							<p class="mt-2 max-w-md text-xs leading-relaxed text-danger" role="alert">
								{f.captchaUnavailable}
								<a href={`mailto:${site.email}`} class="underline underline-offset-2">
									{site.email}
								</a>
							</p>
						{:else}
							<p class="mt-2 text-xs leading-relaxed text-ink/50">{f.captchaHelp}</p>
						{/if}
					</div>

					<div class="mt-7 flex flex-wrap items-center gap-4">
						<button type="submit" class="btn-primary" disabled={submitting || !token}>
							<Send class="h-4 w-4" aria-hidden="true" />
							{submitting ? f.submitting : f.submit}
						</button>
					</div>
				</form>
			{/if}
		</div>

		<aside class="h-fit border border-ink/10 bg-sable/40 p-6 sm:p-8">
			<h2 class="font-serif text-2xl leading-tight text-marine">{c.details.title}</h2>

			<dl class="mt-7 space-y-7">
				<div>
					<dt
						class="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-marine/60"
					>
						<MapPin class="h-3.5 w-3.5 text-or-dark" aria-hidden="true" />
						{c.details.addressLabel}
					</dt>
					<dd class="mt-2 text-sm leading-relaxed text-ink/75">
						<address class="not-italic">
							Espace Chaptal<br />
							{site.address.street}<br />
							{site.address.postalCode}
							{site.address.city}
						</address>
					</dd>
				</div>

				<div>
					<dt
						class="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-marine/60"
					>
						<Mail class="h-3.5 w-3.5 text-or-dark" aria-hidden="true" />
						{c.details.emailLabel}
					</dt>
					<dd class="mt-2 text-sm leading-relaxed">
						<a
							href={`mailto:${site.email}`}
							class="break-all text-marine underline decoration-or decoration-2 underline-offset-4 hover:text-marine-700"
						>
							{site.email}
						</a>
					</dd>
				</div>

				<div>
					<dt
						class="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-marine/60"
					>
						<Clock class="h-3.5 w-3.5 text-or-dark" aria-hidden="true" />
						{c.details.hoursLabel}
					</dt>
					<dd class="mt-2 text-sm leading-relaxed text-ink/75">
						<ul class="space-y-1">
							{#each c.details.hours as slot (slot)}
								<li>{slot}</li>
							{/each}
						</ul>
						<p class="mt-3 text-xs leading-relaxed text-ink/50">{c.details.hoursNote}</p>
					</dd>
				</div>
			</dl>
		</aside>
	</div>
</section>

<section class="bg-sable/50 py-14 sm:py-20">
	<div class="container-page">
		<div class="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-end lg:gap-16">
			<div>
				<p class="eyebrow">
					<span class="h-px w-8 bg-or" aria-hidden="true"></span>
					{c.eyebrow}
				</p>
				<h2 class="mt-4 font-serif text-3xl leading-tight text-marine sm:text-4xl">
					{c.map.title}
				</h2>
			</div>
			<p class="max-w-xl text-sm leading-relaxed text-ink/65">{c.map.text}</p>
		</div>

		<div class="mt-10">
			<MapPanel
				lat={47.9920253}
				lon={-4.120912}
				zoom={16}
				markerLabel={c.map.marker}
				ariaLabel={`${c.map.title} — ${c.map.marker}`}
				loadingLabel={c.map.loading}
				errorLabel={c.map.error}
				openLabel={c.map.open}
				openGoogleLabel={c.map.openGoogle}
				openAppleLabel={c.map.openApple}
			/>
		</div>
	</div>
</section>
