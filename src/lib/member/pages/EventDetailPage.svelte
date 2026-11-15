<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { ArrowLeft, Check, Pencil, Trash, X } from '@lucide/svelte';
	import PageHeader from '$lib/components/dashboard/PageHeader.svelte';
	import Badge from '$lib/components/dashboard/Badge.svelte';
	import EmptyState from '$lib/components/dashboard/EmptyState.svelte';
	import InlineConfirm from '$lib/components/dashboard/InlineConfirm.svelte';
	import Avatar from '$lib/components/dashboard/Avatar.svelte';
	import AccessDenied from '$lib/components/dashboard/AccessDenied.svelte';
	import { secondaryButtonClass } from '$lib/components/dashboard/form';
	import { member } from '$lib/member/store.svelte';
	import {
		actorOf,
		canDeleteEvents,
		canManageEvent,
		canRespondToEvent,
		canViewEvent,
		canViewPresenceDetail,
		responseLockMessage
	} from '$lib/member/permissions';
	import { eventAudience } from '$lib/member/services/members';
	import { presenceSummary, responseOf, setResponse } from '$lib/member/services/responses';
	import { cancelEvent, deleteEvent, reactivateEvent } from '$lib/member/services/events';
	import { formatDate, formatDateTime, isPast } from '$lib/member/clock';
	import { EVENT_TYPE_LABELS, LEVEL_LABELS, VISIBILITY_LABELS } from '$lib/member/labels';
	import { pupitreName } from '$lib/member/pupitres';
	import type { MemberResponseStatus } from '$lib/member/types';

	interface Props {
		eventId: string;
	}

	let { eventId }: Props = $props();

	const actor = $derived(actorOf(member.activeProfile));
	const event = $derived(member.events.find((item) => item.id === eventId) ?? null);
	const visible = $derived(event ? canViewEvent(actor, event) : false);
	const audience = $derived(event ? eventAudience(event) : []);
	const summary = $derived(
		event
			? presenceSummary(
					event.id,
					audience.map((item) => item.id)
				)
			: null
	);
	const myResponse = $derived(responseOf(eventId, member.activeProfileId));
	const lockMessage = $derived(event ? responseLockMessage(event) : null);

	async function respond(status: MemberResponseStatus) {
		try {
			await setResponse(member.activeProfileId, eventId, status);
			member.notify(
				'success',
				status === 'present' ? 'Présence enregistrée.' : 'Absence enregistrée.'
			);
		} catch (error) {
			member.notify('error', error instanceof Error ? error.message : 'Réponse impossible.');
		}
	}

	async function cancel() {
		if (!event) return;
		try {
			await cancelEvent(member.activeProfileId, eventId);
			member.notify('info', 'Événement annulé.');
		} catch (error) {
			member.notify('error', error instanceof Error ? error.message : 'Annulation impossible.');
		}
	}

	async function reactivate() {
		try {
			await reactivateEvent(member.activeProfileId, eventId);
			member.notify('success', 'Événement réactivé.');
		} catch (error) {
			member.notify('error', error instanceof Error ? error.message : 'Réactivation impossible.');
		}
	}

	async function remove() {
		try {
			await deleteEvent(member.activeProfileId, eventId);
			member.notify('success', 'Événement supprimé.');
			goto(resolve('/dashboard/agenda'));
		} catch (error) {
			member.notify('error', error instanceof Error ? error.message : 'Suppression impossible.');
		}
	}

	function statusOf(profileId: string): MemberResponseStatus | null {
		return (
			member.responses.find(
				(response) => response.eventId === eventId && response.profileId === profileId
			)?.status ?? null
		);
	}
</script>

<a
	href={resolve('/dashboard/agenda')}
	class="inline-flex items-center gap-2 text-xs font-semibold text-marine underline underline-offset-4"
>
	<ArrowLeft size={14} />
	Retour à l’agenda
</a>

{#if !event}
	<div class="mt-6">
		<EmptyState
			title="Événement introuvable"
			description="Cet événement n’existe pas dans le jeu de démonstration, ou il a été supprimé."
		/>
	</div>
{:else if !visible}
	<div class="mt-6">
		<AccessDenied
			{actor}
			required="consulter cet événement"
			message="Cet événement est réservé à un autre pupitre."
		/>
	</div>
{:else}
	<PageHeader eyebrow={EVENT_TYPE_LABELS[event.type]} title={event.title}>
		{#snippet actions()}
			{#if canManageEvent(actor, event)}
				<a
					href={resolve('/dashboard/agenda/[id]/modifier', { id: event.id })}
					class={secondaryButtonClass}
				>
					<Pencil size={16} />
					Modifier
				</a>
				{#if event.status === 'active'}
					<InlineConfirm
						label="Annuler l’événement"
						confirmLabel="Confirmer"
						message="Les réponses seront conservées en lecture seule."
						tone="neutral"
						onconfirm={cancel}
					/>
				{:else}
					<button type="button" class={secondaryButtonClass} onclick={reactivate}>Réactiver</button>
				{/if}
			{/if}
			{#if canDeleteEvents(actor)}
				<InlineConfirm
					label="Supprimer"
					confirmLabel="Supprimer définitivement"
					message="L’événement et toutes ses réponses seront supprimés."
					onconfirm={remove}
				>
					<Trash size={14} />
				</InlineConfirm>
			{/if}
		{/snippet}
	</PageHeader>

	<div class="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
		<div class="space-y-5">
			<div class="flex flex-wrap gap-2">
				<Badge tone="marine">{EVENT_TYPE_LABELS[event.type]}</Badge>
				<Badge tone={event.visibility === 'public' ? 'gold' : 'muted'}
					>{VISIBILITY_LABELS[event.visibility]}</Badge
				>
				{#if event.isPoll}<Badge tone="success">Sondage</Badge>{/if}
				{#if event.status === 'cancelled'}<Badge tone="danger">Annulé</Badge>{/if}
				{#if isPast(event.date)}<Badge tone="muted">Passé</Badge>{/if}
			</div>

			<dl class="grid gap-4 border border-marine/10 bg-white p-5 sm:grid-cols-2">
				<div>
					<dt class="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ardoise">
						Date
					</dt>
					<dd class="mt-1 text-sm text-ink">{formatDate(event.date)}</dd>
				</div>
				<div>
					<dt class="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ardoise">
						Lieu
					</dt>
					<dd class="mt-1 text-sm text-ink">{event.location}</dd>
				</div>
				<div class="sm:col-span-2">
					<dt class="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ardoise">
						Pupitres
					</dt>
					<dd class="mt-1 text-sm text-ink">
						{#if event.pupitreIds.length}
							{event.pupitreIds.map((id) => pupitreName(id)).join(', ')}
						{:else}
							Tous les pupitres
						{/if}
					</dd>
				</div>
				<div class="sm:col-span-2">
					<dt class="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ardoise">
						Description
					</dt>
					<dd class="mt-1 whitespace-pre-line text-sm leading-relaxed text-ardoise">
						{event.description || 'Aucune description.'}
					</dd>
				</div>
			</dl>

			{#if canViewPresenceDetail(actor, event)}
				<section aria-labelledby="presences-detail">
					<h2 id="presences-detail" class="font-serif text-2xl text-marine">
						Présences détaillées
					</h2>
					<p class="mt-1 text-xs text-ardoise">
						{summary?.present} présent(s) · {summary?.absent} absent(s) · {summary?.noAnswer} sans réponse
					</p>
					<ul class="mt-3 divide-y divide-marine/10 border border-marine/10 bg-white">
						{#each audience as member (member.id)}
							{@const status = statusOf(member.id)}
							<li class="flex items-center gap-3 px-4 py-2.5">
								<Avatar profile={member} size="xs" decorative />
								<span class="min-w-0 flex-1">
									<span class="block truncate text-sm text-ink"
										>{member.firstName} {member.lastName}</span
									>
									<span class="block text-[0.65rem] text-ardoise">
										{member.pupitres.map((pupitre) => pupitreName(pupitre.pupitreId)).join(', ')} · {LEVEL_LABELS[
											member.level
										]}
									</span>
								</span>
								{#if status === 'present'}
									<Badge tone="success">Présent</Badge>
								{:else if status === 'absent'}
									<Badge tone="danger">Absent</Badge>
								{:else}
									<Badge tone="muted">Sans réponse</Badge>
								{/if}
							</li>
						{:else}
							<li class="px-4 py-5 text-sm text-ardoise">Aucun membre concerné.</li>
						{/each}
					</ul>
				</section>
			{:else}
				<section class="border border-marine/10 bg-white p-5">
					<h2 class="font-serif text-xl text-marine">Présences</h2>
					<div class="mt-3 grid grid-cols-3 gap-3 text-center">
						<div class="bg-ivoire p-3">
							<p class="font-serif text-2xl text-marine">{summary?.present}</p>
							<p class="text-[0.65rem] uppercase tracking-wider text-ardoise">Présents</p>
						</div>
						<div class="bg-ivoire p-3">
							<p class="font-serif text-2xl text-marine">{summary?.absent}</p>
							<p class="text-[0.65rem] uppercase tracking-wider text-ardoise">Absents</p>
						</div>
						<div class="bg-ivoire p-3">
							<p class="font-serif text-2xl text-marine">{summary?.noAnswer}</p>
							<p class="text-[0.65rem] uppercase tracking-wider text-ardoise">Sans réponse</p>
						</div>
					</div>
					<p class="mt-3 text-xs leading-relaxed text-ardoise">
						Les réponses individuelles ne sont visibles que par les chefs des pupitres concernés, la
						secrétaire et l’administrateur.
					</p>
				</section>
			{/if}
		</div>

		<aside class="space-y-4">
			<section class="border border-marine/15 bg-white p-5" aria-labelledby="ma-reponse">
				<h2 id="ma-reponse" class="font-serif text-xl text-marine">Ma réponse</h2>
				{#if canRespondToEvent(actor, event)}
					<p class="mt-1 text-xs text-ardoise">
						Réponse modifiable jusqu’à la clôture, à minuit le lendemain de l’événement.
					</p>
					<div class="mt-4 grid gap-2">
						<button
							type="button"
							class="inline-flex items-center justify-center gap-2 border px-4 py-2.5 text-sm font-semibold {myResponse ===
							'present'
								? 'border-emerald-700 bg-emerald-700 text-white'
								: 'border-marine/25 text-marine hover:border-marine'}"
							onclick={() => respond('present')}
						>
							<Check size={16} />
							Je serai présent
						</button>
						<button
							type="button"
							class="inline-flex items-center justify-center gap-2 border px-4 py-2.5 text-sm font-semibold {myResponse ===
							'absent'
								? 'border-danger bg-danger text-white'
								: 'border-marine/25 text-marine hover:border-marine'}"
							onclick={() => respond('absent')}
						>
							<X size={16} />
							Je serai absent
						</button>
					</div>
					{#if myResponse}
						<p class="mt-3 text-xs text-ardoise">
							Réponse actuelle : <strong>{myResponse === 'present' ? 'présent' : 'absent'}</strong>.
						</p>
					{/if}
				{:else if lockMessage}
					<p class="mt-3 border border-or/40 bg-or/10 px-3 py-2 text-xs leading-relaxed text-ink">
						{lockMessage}
					</p>
					{#if myResponse}
						<p class="mt-2 text-xs text-ardoise">
							Votre réponse conservée : <strong
								>{myResponse === 'present' ? 'présent' : 'absent'}</strong
							>.
						</p>
					{:else}
						<p class="mt-2 text-xs text-ardoise">Vous n’aviez pas répondu.</p>
					{/if}
				{:else}
					<p class="mt-3 text-xs text-ardoise">Cet événement n’est pas ouvert à votre réponse.</p>
				{/if}
			</section>

			<section
				class="border border-marine/10 bg-ivoire/70 p-5 text-xs leading-relaxed text-ardoise"
			>
				<p class="font-semibold text-marine">Traçabilité fictive</p>
				<p class="mt-2">
					Créé par {member.profiles.find((profile) => profile.id === event.createdBy)?.firstName ??
						'un membre'}.
				</p>
				{#if myResponse}
					<p class="mt-1">
						Dernière réponse enregistrée : {formatDateTime(
							member.responses.find(
								(response) =>
									response.eventId === eventId && response.profileId === member.activeProfileId
							)?.updatedAt ?? ''
						)}.
					</p>
				{/if}
				<a
					href={resolve('/dashboard/documents')}
					class="mt-3 inline-block font-semibold text-marine underline underline-offset-4"
				>
					Documents liés aux événements
				</a>
			</section>
		</aside>
	</div>
{/if}
