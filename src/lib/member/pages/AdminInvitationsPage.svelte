<script lang="ts">
	import { Check, Mail, Plus, RefreshCw, Send, X } from '@lucide/svelte';
	import PageHeader from '$lib/components/dashboard/PageHeader.svelte';
	import EmptyState from '$lib/components/dashboard/EmptyState.svelte';
	import Badge from '$lib/components/dashboard/Badge.svelte';
	import AccessDenied from '$lib/components/dashboard/AccessDenied.svelte';
	import {
		errorClass,
		inputClass,
		labelClass,
		primaryButtonClass,
		secondaryButtonClass
	} from '$lib/components/dashboard/form';
	import { member } from '$lib/member/store.svelte';
	import { actorOf } from '$lib/member/permissions';
	import { canInviteAndActivate } from '$lib/auth/roles';
	import {
		cancelInvitation,
		createInvitation,
		invitationStatusLabel,
		resendInvitation
	} from '$lib/member/services/invitations';
	import { formatDate } from '$lib/member/clock';
	import { MEMBER_PUPITRES, pupitreName } from '$lib/member/fixtures/pupitres';
	import type { MemberInvitationStatus, MemberPupitreId } from '$lib/member/types';

	const actor = $derived(actorOf(member.activeProfile));
	const allowed = $derived(canInviteAndActivate(actor.role));

	let filter = $state<MemberInvitationStatus | 'all'>('all');
	let composing = $state(false);
	let formEmail = $state('');
	let formFirstName = $state('');
	let formLastName = $state('');
	let formPupitres = $state<MemberPupitreId[]>([]);
	let formError = $state<string | null>(null);

	const invitations = $derived(
		[...member.invitations]
			.filter((invitation) => filter === 'all' || invitation.status === filter)
			.sort((a, b) => b.sentAt.localeCompare(a.sentAt))
	);

	const counts = $derived({
		pending: member.invitations.filter((item) => item.status === 'pending').length,
		accepted: member.invitations.filter((item) => item.status === 'accepted').length,
		expired: member.invitations.filter((item) => item.status === 'expired').length,
		cancelled: member.invitations.filter((item) => item.status === 'cancelled').length
	});

	function toneFor(status: MemberInvitationStatus) {
		if (status === 'accepted') return 'success' as const;
		if (status === 'pending') return 'gold' as const;
		if (status === 'expired') return 'danger' as const;
		return 'muted' as const;
	}

	function togglePupitre(id: MemberPupitreId, checked: boolean) {
		formPupitres = checked ? [...formPupitres, id] : formPupitres.filter((item) => item !== id);
	}

	function submit(event: SubmitEvent) {
		event.preventDefault();
		formError = null;
		try {
			createInvitation(member.activeProfileId, {
				email: formEmail,
				firstName: formFirstName,
				lastName: formLastName,
				pupitreIds: formPupitres
			});
			member.notify('success', 'Invitation créée (aucun e-mail réellement envoyé).');
			formEmail = '';
			formFirstName = '';
			formLastName = '';
			formPupitres = [];
			composing = false;
		} catch (error) {
			formError = error instanceof Error ? error.message : 'Invitation impossible.';
			member.notify('error', formError);
		}
	}

	function resend(id: string) {
		try {
			resendInvitation(member.activeProfileId, id);
			member.notify('success', 'Invitation relancée (simulation).');
		} catch (error) {
			member.notify('error', error instanceof Error ? error.message : 'Relance impossible.');
		}
	}

	function cancel(id: string) {
		try {
			cancelInvitation(member.activeProfileId, id);
			member.notify('info', 'Invitation annulée.');
		} catch (error) {
			member.notify('error', error instanceof Error ? error.message : 'Annulation impossible.');
		}
	}
</script>

{#if !allowed}
	<AccessDenied
		{actor}
		required="les invitations"
		message="Seuls la secrétaire et l’administrateur peuvent inviter des membres."
	/>
{:else}
	<PageHeader
		eyebrow="Administration"
		title="Invitations"
		description="Invitations fictives. Aucun e-mail n’est envoyé : la création, la relance et l’annulation sont simulées et persistent localement."
	>
		{#snippet actions()}
			<button type="button" class={primaryButtonClass} onclick={() => (composing = !composing)}>
				<Plus size={16} />
				{composing ? 'Fermer' : 'Inviter un membre'}
			</button>
		{/snippet}
	</PageHeader>

	<section class="mt-6 grid gap-3 sm:grid-cols-4" aria-label="État des invitations">
		<div class="border border-marine/10 bg-white p-4">
			<p class="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-ardoise">
				En attente
			</p>
			<p class="mt-2 font-serif text-2xl text-marine">{counts.pending}</p>
		</div>
		<div class="border border-marine/10 bg-white p-4">
			<p class="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-ardoise">Acceptées</p>
			<p class="mt-2 font-serif text-2xl text-marine">{counts.accepted}</p>
		</div>
		<div class="border border-marine/10 bg-white p-4">
			<p class="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-ardoise">Expirées</p>
			<p class="mt-2 font-serif text-2xl text-marine">{counts.expired}</p>
		</div>
		<div class="border border-marine/10 bg-white p-4">
			<p class="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-ardoise">Annulées</p>
			<p class="mt-2 font-serif text-2xl text-marine">{counts.cancelled}</p>
		</div>
	</section>

	{#if composing}
		<form class="mt-5 border border-or/40 bg-or/10 p-5" onsubmit={submit} novalidate>
			<h2 class="font-serif text-xl text-marine">Nouvelle invitation</h2>
			<p class="mt-1 text-xs text-ardoise">
				L’invitation expire au bout de sept jours dans la démonstration. Aucun compte n’est
				réellement créé.
			</p>
			{#if formError}
				<p class={errorClass} role="alert">{formError}</p>
			{/if}
			<div class="mt-4 grid gap-4 sm:grid-cols-2">
				<label>
					<span class={labelClass}>Prénom *</span>
					<input class="{inputClass} mt-1" bind:value={formFirstName} required />
				</label>
				<label>
					<span class={labelClass}>Nom *</span>
					<input class="{inputClass} mt-1" bind:value={formLastName} required />
				</label>
				<label class="sm:col-span-2">
					<span class={labelClass}>Adresse e-mail *</span>
					<input
						type="email"
						class="{inputClass} mt-1"
						bind:value={formEmail}
						required
						placeholder="prenom.nom@example.com"
					/>
				</label>
				<fieldset class="sm:col-span-2">
					<legend class={labelClass}>Pupitres *</legend>
					<div class="mt-2 grid gap-2 sm:grid-cols-2">
						{#each MEMBER_PUPITRES as pupitre (pupitre.id)}
							<label
								class="flex items-center gap-2 border border-marine/15 bg-white px-3 py-2 text-sm"
							>
								<input
									type="checkbox"
									class="h-4 w-4 accent-marine"
									checked={formPupitres.includes(pupitre.id)}
									onchange={(event) => togglePupitre(pupitre.id, event.currentTarget.checked)}
								/>
								{pupitre.name}
							</label>
						{/each}
					</div>
				</fieldset>
			</div>
			<div class="mt-4 flex flex-wrap gap-3">
				<button type="submit" class={primaryButtonClass}>
					<Send size={16} />
					Créer l’invitation
				</button>
				<button type="button" class={secondaryButtonClass} onclick={() => (composing = false)}
					>Annuler</button
				>
			</div>
		</form>
	{/if}

	<div class="mt-6 flex flex-wrap gap-1" role="group" aria-label="Filtrer les invitations">
		{#each [['all', 'Toutes'], ['pending', 'En attente'], ['accepted', 'Acceptées'], ['expired', 'Expirées'], ['cancelled', 'Annulées']] as [value, label] (value)}
			<button
				type="button"
				class="border px-3 py-1.5 text-xs font-semibold {filter === value
					? 'border-marine bg-marine text-white'
					: 'border-marine/20 bg-white text-marine hover:border-marine'}"
				aria-pressed={filter === value}
				onclick={() => (filter = value as MemberInvitationStatus | 'all')}
			>
				{label}
			</button>
		{/each}
	</div>

	<ul class="mt-3 divide-y divide-marine/10 border border-marine/10 bg-white">
		{#each invitations as invitation (invitation.id)}
			<li class="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
				<div class="flex min-w-0 items-start gap-3">
					<span
						class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center bg-ivoire text-marine"
					>
						<Mail size={17} />
					</span>
					<div class="min-w-0">
						<p class="font-semibold text-marine">{invitation.firstName} {invitation.lastName}</p>
						<p class="text-xs text-ardoise">{invitation.email}</p>
						<p class="mt-1 flex flex-wrap items-center gap-2 text-[0.68rem] text-ardoise/80">
							<Badge tone={toneFor(invitation.status)}
								>{invitationStatusLabel(invitation.status)}</Badge
							>
							{#each invitation.pupitreIds as id (id)}
								<Badge tone="muted">{pupitreName(id)}</Badge>
							{/each}
							<span
								>Envoyée le {formatDate(invitation.sentAt)} · expire le {formatDate(
									invitation.expiresAt
								)}</span
							>
						</p>
					</div>
				</div>
				<div class="flex shrink-0 flex-wrap gap-3">
					{#if invitation.status !== 'accepted' && invitation.status !== 'cancelled'}
						<button
							type="button"
							class="inline-flex items-center gap-1.5 text-xs font-semibold text-marine underline underline-offset-4"
							onclick={() => resend(invitation.id)}
						>
							<RefreshCw size={13} />
							Relancer
						</button>
					{/if}
					{#if invitation.status === 'pending' || invitation.status === 'expired'}
						<button
							type="button"
							class="inline-flex items-center gap-1.5 text-xs font-semibold text-danger underline underline-offset-4"
							onclick={() => cancel(invitation.id)}
						>
							<X size={13} />
							Annuler
						</button>
					{/if}
					{#if invitation.status === 'accepted'}
						<span class="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800">
							<Check size={13} />
							Acceptée
						</span>
					{/if}
				</div>
			</li>
		{:else}
			<li class="p-4">
				<EmptyState
					title="Aucune invitation"
					description="Aucune invitation ne correspond à ce filtre."
				>
					{#snippet icon()}<Mail size={28} />{/snippet}
				</EmptyState>
			</li>
		{/each}
	</ul>

	<p class="mt-4 text-xs leading-relaxed text-ardoise">
		En production, l’invitation enverra un e-mail signé et créera un compte au statut « en attente
		». En démonstration, aucune donnée ne quitte le navigateur.
	</p>
{/if}
