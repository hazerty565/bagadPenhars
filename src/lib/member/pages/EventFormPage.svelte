<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { ArrowLeft, Save } from '@lucide/svelte';
	import PageHeader from '$lib/components/dashboard/PageHeader.svelte';
	import AccessDenied from '$lib/components/dashboard/AccessDenied.svelte';
	import {
		inputClass,
		labelClass,
		primaryButtonClass,
		secondaryButtonClass
	} from '$lib/components/dashboard/form';
	import { demo } from '$lib/demo/store.svelte';
	import {
		actorOf,
		canManageEvent,
		canSeeAdminSection,
		chefPupitreIds
	} from '$lib/demo/permissions';
	import { createEvent, updateEvent } from '$lib/demo/services/events';
	import { addDays } from '$lib/demo/services/helpers';
	import { DEMO_PUPITRES } from '$lib/demo/fixtures/pupitres';
	import { DEMO_TODAY } from '$lib/demo/clock';
	import { EVENT_TYPE_LABELS } from '$lib/demo/labels';
	import type { DemoEventType, DemoEventVisibility, DemoPupitreId } from '$lib/demo/types';

	interface Props {
		eventId?: string | null;
		/** Mode administration : le formulaire est réservé à la secrétaire et à l’administrateur. */
		adminMode?: boolean;
	}

	let { eventId = null, adminMode = false }: Props = $props();

	const actor = $derived(actorOf(demo.activeProfile));
	const existing = $derived(
		eventId ? (demo.events.find((event) => event.id === eventId) ?? null) : null
	);
	const isSecretary = $derived(canSeeAdminSection(actor));
	const chefPupils = $derived(chefPupitreIds(actor));

	const allowed = $derived.by(() => {
		if (adminMode && !isSecretary) return false;
		if (eventId) return existing ? canManageEvent(actor, existing) : false;
		return isSecretary || (actor.role === 'chef_pupitre' && chefPupils.length > 0);
	});

	let title = $state(existing?.title ?? '');
	let description = $state(existing?.description ?? '');
	let date = $state(existing?.date ?? addDays(DEMO_TODAY, 7));
	let type = $state<DemoEventType>(existing?.type ?? 'repetition');
	let visibility = $state<DemoEventVisibility>(
		existing?.visibility ?? (actor.role === 'chef_pupitre' ? 'pupitre' : 'interne')
	);
	let location = $state(existing?.location ?? 'Espace Chaptal, Quimper');
	let isPoll = $state(existing?.isPoll ?? false);
	let pupitreIds = $state<DemoPupitreId[]>(
		existing?.pupitreIds ?? (actor.role === 'chef_pupitre' ? chefPupils.slice(0, 1) : [])
	);
	let error = $state<string | null>(null);
	let submitting = $state(false);

	// Réinitialise le formulaire quand on passe d’un événement à un autre sans
	// démonter la page (navigation cliente).
	let syncedKey = $state<string | null | undefined>(undefined);
	$effect(() => {
		const key = existing ? `event:${existing.id}` : `new:${eventId ?? 'none'}:${actor.id}`;
		if (key === syncedKey) return;
		syncedKey = key;
		title = existing?.title ?? '';
		description = existing?.description ?? '';
		date = existing?.date ?? addDays(DEMO_TODAY, 7);
		type = existing?.type ?? 'repetition';
		visibility = existing?.visibility ?? (actor.role === 'chef_pupitre' ? 'pupitre' : 'interne');
		location = existing?.location ?? 'Espace Chaptal, Quimper';
		isPoll = existing?.isPoll ?? false;
		pupitreIds =
			existing?.pupitreIds ?? (actor.role === 'chef_pupitre' ? chefPupils.slice(0, 1) : []);
		error = null;
	});

	const availablePupitres = $derived(
		isSecretary ? DEMO_PUPITRES : DEMO_PUPITRES.filter((pupitre) => chefPupils.includes(pupitre.id))
	);

	function togglePupitre(id: DemoPupitreId, checked: boolean) {
		if (checked) {
			if (!isSecretary && actor.role === 'chef_pupitre') {
				pupitreIds = [id];
			} else {
				pupitreIds = [...pupitreIds, id];
			}
		} else {
			pupitreIds = pupitreIds.filter((item) => item !== id);
		}
	}

	function submit(event: SubmitEvent) {
		event.preventDefault();
		error = null;
		if (!title.trim() || title.trim().length < 3) {
			error = 'Le titre doit contenir au moins trois caractères.';
			return;
		}
		if (!location.trim()) {
			error = 'Le lieu est obligatoire.';
			return;
		}
		if (visibility === 'pupitre' && pupitreIds.length === 0) {
			error = 'Sélectionnez au moins un pupitre.';
			return;
		}
		submitting = true;
		try {
			const input = {
				title,
				description,
				date,
				type,
				visibility,
				isPoll,
				pupitreIds,
				location
			};
			const saved = existing
				? (updateEvent(demo.activeProfileId, existing.id, input), existing)
				: createEvent(demo.activeProfileId, input);
			demo.notify('success', existing ? 'Événement mis à jour.' : 'Événement créé.');
			goto(resolve('/dashboard/agenda/[id]', { id: saved.id }));
		} catch (reason) {
			error = reason instanceof Error ? reason.message : 'L’événement n’a pas pu être enregistré.';
		} finally {
			submitting = false;
		}
	}
</script>

<a
	href={resolve('/dashboard/agenda')}
	class="inline-flex items-center gap-2 text-xs font-semibold text-marine underline underline-offset-4"
>
	<ArrowLeft size={14} />
	Retour à l’agenda
</a>

{#if !allowed}
	<div class="mt-6">
		<AccessDenied
			{actor}
			required={existing ? 'modifier cet événement' : 'créer un événement'}
			message={existing
				? 'Cet événement est multi-pupitres, global, ou appartient à un pupitre que vous ne dirigez pas.'
				: 'Un chef de pupitre ne crée que des événements ciblant un seul de ses pupitres.'}
		/>
	</div>
{:else}
	<PageHeader
		eyebrow="Événement"
		title={existing ? `Modifier « ${existing.title} »` : 'Nouvel événement'}
		description="La date est une date civile, sans heure. La clôture des réponses intervient à minuit le lendemain, fuseau Europe/Paris."
	/>

	{#if error}
		<p class="mt-4 border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger" role="alert">
			{error}
		</p>
	{/if}

	<form class="mt-6 space-y-6" onsubmit={submit} novalidate>
		<section class="border border-marine/10 bg-white p-5">
			<h2 class="font-serif text-xl text-marine">Informations</h2>
			<div class="mt-4 grid gap-4">
				<label>
					<span class={labelClass}>Titre *</span>
					<input
						class="{inputClass} mt-1"
						bind:value={title}
						required
						minlength="3"
						placeholder="Répétition générale, concert…"
					/>
				</label>
				<div class="grid gap-4 sm:grid-cols-2">
					<label>
						<span class={labelClass}>Date *</span>
						<input type="date" class="{inputClass} mt-1" bind:value={date} required />
					</label>
					<label>
						<span class={labelClass}>Type *</span>
						<select class="{inputClass} mt-1" bind:value={type}>
							{#each Object.entries(EVENT_TYPE_LABELS) as [value, label] (value)}
								<option {value}>{label}</option>
							{/each}
						</select>
					</label>
				</div>
				<label>
					<span class={labelClass}>Lieu *</span>
					<input
						class="{inputClass} mt-1"
						bind:value={location}
						required
						placeholder="Espace Chaptal, Quimper"
					/>
				</label>
				<label>
					<span class={labelClass}>Description</span>
					<textarea
						class="{inputClass} mt-1 min-h-28"
						bind:value={description}
						placeholder="Consignes, horaires de rendez-vous, matériel…"
					></textarea>
				</label>
			</div>
		</section>

		<section class="border border-marine/10 bg-white p-5">
			<h2 class="font-serif text-xl text-marine">Visibilité et pupitres</h2>
			{#if actor.role === 'chef_pupitre'}
				<p class="mt-1 text-xs leading-relaxed text-ardoise">
					En tant que chef de pupitre, vous créez uniquement des événements de pupitre ciblés sur un
					seul pupitre que vous dirigez.
				</p>
			{/if}
			<div class="mt-4 grid gap-4">
				<label>
					<span class={labelClass}>Visibilité</span>
					<select
						class="{inputClass} mt-1"
						bind:value={visibility}
						disabled={actor.role === 'chef_pupitre'}
					>
						<option value="interne">Interne — tous les membres</option>
						<option value="public">Public — visible aussi sur le site</option>
						<option value="pupitre">Pupitre — uniquement les pupitres ciblés</option>
					</select>
				</label>

				{#if visibility === 'pupitre'}
					<fieldset>
						<legend class={labelClass}>Pupitres ciblés</legend>
						<div class="mt-2 grid gap-2 sm:grid-cols-2">
							{#each availablePupitres as pupitre (pupitre.id)}
								<label
									class="flex items-center gap-2 border border-marine/15 px-3 py-2 text-sm text-ink"
								>
									<input
										type={actor.role === 'chef_pupitre' ? 'radio' : 'checkbox'}
										name="pupitre"
										class="h-4 w-4 accent-marine"
										checked={pupitreIds.includes(pupitre.id)}
										onchange={(event) => togglePupitre(pupitre.id, event.currentTarget.checked)}
									/>
									{pupitre.name}
								</label>
							{/each}
						</div>
						{#if availablePupitres.length === 0}
							<p class="mt-2 text-xs text-danger">Aucun pupitre ne vous est attribué comme chef.</p>
						{/if}
					</fieldset>
				{/if}

				<label class="flex items-center gap-2 text-sm text-ink">
					<input type="checkbox" bind:checked={isPoll} class="h-4 w-4 accent-marine" />
					Sondage (réponses présent / absent mises en avant)
				</label>
			</div>
		</section>

		<div class="flex flex-wrap gap-3">
			<button type="submit" class={primaryButtonClass} disabled={submitting}>
				<Save size={16} />
				{submitting
					? 'Enregistrement…'
					: existing
						? 'Enregistrer les modifications'
						: 'Créer l’événement'}
			</button>
			<a href={resolve('/dashboard/agenda')} class={secondaryButtonClass}>Annuler</a>
		</div>
	</form>
{/if}
