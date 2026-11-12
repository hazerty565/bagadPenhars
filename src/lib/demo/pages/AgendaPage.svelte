<script lang="ts">
	import { resolve } from '$app/paths';
	import { CalendarPlus, Check, Pencil, Plus, X } from '@lucide/svelte';
	import PageHeader from '$lib/components/dashboard/PageHeader.svelte';
	import EmptyState from '$lib/components/dashboard/EmptyState.svelte';
	import InlineConfirm from '$lib/components/dashboard/InlineConfirm.svelte';
	import EventCard from '$lib/components/dashboard/EventCard.svelte';
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
		canDeleteEvents,
		canManageEvent,
		canRespondToEvent,
		canSeeAdminSection,
		chefPupitreIds,
		responseLockMessage
	} from '$lib/demo/permissions';
	import { eventAudience, manageableEvents, visibleEvents } from '$lib/demo/services/members';
	import { presenceSummary, responseOf, setResponse } from '$lib/demo/services/responses';
	import { cancelEvent, deleteEvent, reactivateEvent } from '$lib/demo/services/events';
	import { isPast, DEMO_TODAY } from '$lib/demo/clock';
	import { EVENT_TYPE_LABELS, VISIBILITY_LABELS } from '$lib/demo/labels';
	import { DEMO_PUPITRES } from '$lib/demo/fixtures/pupitres';
	import type { DemoEventType, DemoPupitreId, DemoResponseStatus } from '$lib/demo/types';

	interface Props {
		management?: boolean;
	}

	let { management = false }: Props = $props();

	let search = $state('');
	let period = $state<'upcoming' | 'past' | 'all'>('upcoming');
	let typeFilter = $state<DemoEventType | 'all'>('all');
	let visibilityFilter = $state<'all' | 'public' | 'interne' | 'pupitre'>('all');
	let pupitreFilter = $state<DemoPupitreId | 'all'>('all');
	let onlyPending = $state(false);

	const actor = $derived(actorOf(demo.activeProfile));
	const canCreate = $derived(
		canSeeAdminSection(actor) || (actor.role === 'chef_pupitre' && chefPupitreIds(actor).length > 0)
	);
	const canManageList = $derived(canSeeAdminSection(actor));

	const baseEvents = $derived(management ? manageableEvents(actor) : visibleEvents(actor));

	const filtered = $derived(
		baseEvents
			.filter((event) => {
				if (period === 'upcoming' && isPast(event.date)) return false;
				if (period === 'past' && !isPast(event.date)) return false;
				if (typeFilter !== 'all' && event.type !== typeFilter) return false;
				if (visibilityFilter !== 'all' && event.visibility !== visibilityFilter) return false;
				if (
					pupitreFilter !== 'all' &&
					!event.pupitreIds.includes(pupitreFilter) &&
					event.pupitreIds.length > 0
				) {
					return false;
				}
				if (onlyPending && responseOf(event.id, demo.activeProfileId) !== null) return false;
				const needle = search.trim().toLowerCase();
				if (needle) {
					return `${event.title} ${event.location} ${event.description}`
						.toLowerCase()
						.includes(needle);
				}
				return true;
			})
			.sort((a, b) =>
				period === 'past' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)
			)
	);

	function summary(eventId: string) {
		const event = demo.events.find((item) => item.id === eventId);
		if (!event) return { present: 0, absent: 0 };
		const ids = eventAudience(event).map((item) => item.id);
		const result = presenceSummary(eventId, ids);
		return { present: result.present, absent: result.absent };
	}

	function respond(eventId: string, status: DemoResponseStatus) {
		try {
			setResponse(demo.activeProfileId, eventId, status);
			demo.notify(
				'success',
				status === 'present'
					? 'Votre présence a été enregistrée.'
					: 'Votre absence a été enregistrée.'
			);
		} catch (error) {
			demo.notify(
				'error',
				error instanceof Error ? error.message : 'La réponse n’a pas pu être enregistrée.'
			);
		}
	}

	function cancel(eventId: string) {
		try {
			cancelEvent(demo.activeProfileId, eventId);
			demo.notify('info', 'L’événement a été annulé. Les réponses restent visibles.');
		} catch (error) {
			demo.notify('error', error instanceof Error ? error.message : 'Annulation impossible.');
		}
	}

	function reactivate(eventId: string) {
		try {
			reactivateEvent(demo.activeProfileId, eventId);
			demo.notify('success', 'L’événement est de nouveau actif.');
		} catch (error) {
			demo.notify('error', error instanceof Error ? error.message : 'Réactivation impossible.');
		}
	}

	function remove(eventId: string) {
		try {
			deleteEvent(demo.activeProfileId, eventId);
			demo.notify('success', 'L’événement a été supprimé.');
		} catch (error) {
			demo.notify('error', error instanceof Error ? error.message : 'Suppression impossible.');
		}
	}
</script>

{#if management && !canSeeAdminSection(actor)}
	<AccessDenied
		{actor}
		required="la gestion des événements"
		message="La gestion des événements est réservée à la secrétaire et à l’administrateur. En tant que chef de pupitre, vous gérez vos événements depuis l’agenda."
	/>
{:else}
	<PageHeader
		eyebrow={management ? 'Gestion' : 'Mon espace'}
		title={management ? 'Gestion des événements' : 'Agenda'}
		description={management
			? 'Créez, modifiez, annulez ou supprimez les événements selon vos droits. Les chefs ne gèrent que les événements ciblant un seul de leurs pupitres.'
			: 'Consultez les événements visibles avec votre profil et répondez présent ou absent jusqu’à la clôture.'}
	>
		{#snippet actions()}
			{#if canCreate}
				<a href={resolve('/dashboard/agenda/nouveau')} class={primaryButtonClass}>
					<Plus size={16} />
					Nouvel événement
				</a>
			{/if}
			{#if management}
				<a href={resolve('/dashboard/agenda')} class={secondaryButtonClass}>Vue membre</a>
			{:else if canManageList}
				<a href={resolve('/dashboard/admin/agenda')} class={secondaryButtonClass}>Gestion</a>
			{/if}
		{/snippet}
	</PageHeader>

	<!-- Filtres -->
	<section class="mt-6 border border-marine/10 bg-white p-4" aria-label="Filtres de l’agenda">
		<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
			<label class="lg:col-span-2">
				<span class={labelClass}>Rechercher</span>
				<input
					type="search"
					bind:value={search}
					placeholder="Titre, lieu, description…"
					class="{inputClass} mt-1"
				/>
			</label>
			<label>
				<span class={labelClass}>Période</span>
				<select bind:value={period} class="{inputClass} mt-1">
					<option value="upcoming">À venir</option>
					<option value="past">Passés</option>
					<option value="all">Tous</option>
				</select>
			</label>
			<label>
				<span class={labelClass}>Type</span>
				<select bind:value={typeFilter} class="{inputClass} mt-1">
					<option value="all">Tous les types</option>
					{#each Object.entries(EVENT_TYPE_LABELS) as [value, label] (value)}
						<option {value}>{label}</option>
					{/each}
				</select>
			</label>
			<label>
				<span class={labelClass}>Visibilité</span>
				<select bind:value={visibilityFilter} class="{inputClass} mt-1">
					<option value="all">Toutes</option>
					{#each Object.entries(VISIBILITY_LABELS) as [value, label] (value)}
						<option {value}>{label}</option>
					{/each}
				</select>
			</label>
			<label>
				<span class={labelClass}>Pupitre</span>
				<select bind:value={pupitreFilter} class="{inputClass} mt-1">
					<option value="all">Tous les pupitres</option>
					{#each DEMO_PUPITRES as pupitre (pupitre.id)}
						<option value={pupitre.id}>{pupitre.name}</option>
					{/each}
				</select>
			</label>
			{#if !management}
				<label class="flex items-end gap-2 pb-2 text-xs text-ardoise">
					<input type="checkbox" bind:checked={onlyPending} class="h-4 w-4 accent-marine" />
					Uniquement sans réponse
				</label>
			{/if}
		</div>
		<p class="mt-3 text-xs text-ardoise">
			{filtered.length} événement{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1
				? 's'
				: ''}. Date de démonstration : {DEMO_TODAY}.
		</p>
	</section>

	<div class="mt-4 space-y-3">
		{#each filtered as event (event.id)}
			{@const response = responseOf(event.id, demo.activeProfileId)}
			{@const summaryData = summary(event.id)}
			{@const lockMessage = responseLockMessage(event)}
			<EventCard
				{event}
				{response}
				present={summaryData.present}
				absent={summaryData.absent}
				showPresence={!management || canManageEvent(actor, event)}
			>
				{#snippet actions()}
					{#if !management}
						{#if canRespondToEvent(actor, event)}
							<button
								type="button"
								class="inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs font-semibold {response ===
								'present'
									? 'border-emerald-700 bg-emerald-700 text-white'
									: 'border-marine/25 text-marine hover:border-marine'}"
								onclick={() => respond(event.id, 'present')}
							>
								<Check size={14} />
								Présent
							</button>
							<button
								type="button"
								class="inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs font-semibold {response ===
								'absent'
									? 'border-danger bg-danger text-white'
									: 'border-marine/25 text-marine hover:border-marine'}"
								onclick={() => respond(event.id, 'absent')}
							>
								<X size={14} />
								Absent
							</button>
							<a
								href={resolve('/dashboard/agenda/[id]', { id: event.id })}
								class="text-xs font-semibold text-marine underline underline-offset-4"
							>
								Détail
							</a>
						{:else if lockMessage}
							<span class="text-xs italic text-ardoise">{lockMessage}</span>
							<a
								href={resolve('/dashboard/agenda/[id]', { id: event.id })}
								class="text-xs font-semibold text-marine underline underline-offset-4"
							>
								Détail
							</a>
						{/if}
					{/if}

					{#if canManageEvent(actor, event)}
						<a
							href={resolve('/dashboard/agenda/[id]/modifier', { id: event.id })}
							class="inline-flex items-center gap-1.5 text-xs font-semibold text-marine underline underline-offset-4"
						>
							<Pencil size={13} />
							Modifier
						</a>
						{#if event.status === 'active'}
							<InlineConfirm
								label="Annuler"
								confirmLabel="Confirmer l’annulation"
								message="Les réponses seront conservées."
								tone="neutral"
								onconfirm={() => cancel(event.id)}
							/>
						{:else}
							<button
								type="button"
								class="text-xs font-semibold text-marine underline underline-offset-4"
								onclick={() => reactivate(event.id)}
							>
								Réactiver
							</button>
						{/if}
					{/if}

					{#if canDeleteEvents(actor)}
						<InlineConfirm
							label="Supprimer"
							confirmLabel="Supprimer définitivement"
							message="L’événement et ses réponses seront perdus."
							onconfirm={() => remove(event.id)}
						/>
					{/if}
				{/snippet}
			</EventCard>
		{:else}
			<EmptyState
				title="Aucun événement ne correspond aux filtres"
				description="Modifiez la période, le type ou le pupitre. Vous pouvez aussi créer un événement si votre rôle le permet."
			>
				{#snippet icon()}<CalendarPlus size={30} />{/snippet}
				{#snippet actions()}
					{#if canCreate}
						<a href={resolve('/dashboard/agenda/nouveau')} class={primaryButtonClass}>
							<Plus size={16} />
							Créer un événement
						</a>
					{/if}
				{/snippet}
			</EmptyState>
		{/each}
	</div>

	{#if management}
		<p class="mt-4 text-xs text-ardoise">
			Rappel : un chef ne peut ni créer ni modifier un événement multi-pupitres ou global, ni
			supprimer un événement. Ces refus sont appliqués par les services, pas seulement par
			l’interface.
		</p>
	{/if}
{/if}
