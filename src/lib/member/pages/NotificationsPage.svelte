<script lang="ts">
	import { Bell, Check, Megaphone, Send } from '@lucide/svelte';
	import PageHeader from '$lib/components/dashboard/PageHeader.svelte';
	import EmptyState from '$lib/components/dashboard/EmptyState.svelte';
	import AccessDenied from '$lib/components/dashboard/AccessDenied.svelte';
	import Badge from '$lib/components/dashboard/Badge.svelte';
	import {
		errorClass,
		inputClass,
		labelClass,
		primaryButtonClass,
		secondaryButtonClass
	} from '$lib/components/dashboard/form';
	import { member } from '$lib/member/store.svelte';
	import {
		actorOf,
		canSeeAdminSection,
		canSeePupitreSection,
		chefPupitreIds,
		scopedPupitreIds
	} from '$lib/member/permissions';
	import {
		markAllRead,
		markRead,
		markUnread,
		notificationRecipients,
		notificationsFor,
		sendNotification,
		unreadCount
	} from '$lib/member/services/notifications';
	import { formatDateTime } from '$lib/member/clock';
	import { AUDIENCE_LABELS } from '$lib/member/labels';
	import { MEMBER_PUPITRES, pupitreName } from '$lib/member/pupitres';
	import type { MemberNotificationAudience, MemberPupitreId } from '$lib/member/types';

	interface Props {
		pupitreScope?: MemberPupitreId[];
		/** Mode espace pupitre : le périmètre est calculé depuis le rôle actif. */
		pupitreMode?: boolean;
		/** Mode administration : la page est réservée à la secrétaire et à l’administrateur. */
		adminMode?: boolean;
		title?: string;
		description?: string;
	}

	let {
		pupitreScope = [],
		pupitreMode = false,
		adminMode = false,
		title = 'Notifications',
		description = 'Boîte de réception simulée. Aucune notification push réelle n’est envoyée.'
	}: Props = $props();

	let filter = $state<'all' | 'unread' | 'read'>('all');
	let composing = $state(false);
	let formTitle = $state('');
	let formBody = $state('');
	let formAudience = $state<MemberNotificationAudience>('all');
	let formPupitres = $state<MemberPupitreId[]>([]);
	let formProfiles = $state<string[]>([]);
	let formError = $state<string | null>(null);

	const actor = $derived(actorOf(member.activeProfile));
	const denied = $derived(
		(pupitreMode && !canSeePupitreSection(actor)) || (adminMode && !canSeeAdminSection(actor))
	);
	const scope = $derived(pupitreMode ? scopedPupitreIds(actor) : pupitreScope);
	const scoped = $derived(scope.length > 0);

	const canCompose = $derived(
		canSeeAdminSection(actor) || (actor.role === 'chef_pupitre' && chefPupitreIds(actor).length > 0)
	);

	const availablePupitres = $derived(
		scoped
			? MEMBER_PUPITRES.filter((pupitre) => scope.includes(pupitre.id))
			: actor.role === 'chef_pupitre'
				? MEMBER_PUPITRES.filter((pupitre) => chefPupitreIds(actor).includes(pupitre.id))
				: MEMBER_PUPITRES
	);

	const items = $derived(
		notificationsFor(member.activeProfileId).filter((notification) => {
			if (scoped) {
				if (notification.audience !== 'pupitre') return false;
				if (!notification.audienceIds.some((id) => scope.includes(id as MemberPupitreId)))
					return false;
			}
			if (filter === 'unread') return !notification.readBy.includes(member.activeProfileId);
			if (filter === 'read') return notification.readBy.includes(member.activeProfileId);
			return true;
		})
	);

	const unread = $derived(unreadCount(member.activeProfileId));

	$effect(() => {
		if (actor.role === 'chef_pupitre' && formAudience === 'all') {
			formAudience = 'pupitre';
		}
	});

	function togglePupitre(id: MemberPupitreId, checked: boolean) {
		formPupitres = checked ? [...formPupitres, id] : formPupitres.filter((item) => item !== id);
		if (actor.role === 'chef_pupitre') formPupitres = formPupitres.slice(-1);
	}

	function toggleProfile(id: string, checked: boolean) {
		formProfiles = checked ? [...formProfiles, id] : formProfiles.filter((item) => item !== id);
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		formError = null;
		try {
			await sendNotification(member.activeProfileId, {
				title: formTitle,
				body: formBody,
				audience: formAudience,
				pupitreIds: formPupitres,
				profileIds: formProfiles
			});
			member.notify(
				'success',
				'Notification enregistrée (l’envoi push sera branché sur OneSignal).'
			);
			formTitle = '';
			formBody = '';
			formPupitres = [];
			formProfiles = [];
			composing = false;
		} catch (error) {
			formError = error instanceof Error ? error.message : 'Envoi impossible.';
			member.notify('error', formError);
		}
	}

	async function markAsRead(id: string) {
		try {
			await markRead(member.activeProfileId, id);
		} catch (error) {
			member.notify('error', error instanceof Error ? error.message : 'Action impossible.');
		}
	}

	async function unreadAction(id: string) {
		try {
			await markUnread(member.activeProfileId, id);
		} catch (error) {
			member.notify('error', error instanceof Error ? error.message : 'Action impossible.');
		}
	}
</script>

{#if denied}
	<div class="mt-6">
		<AccessDenied
			{actor}
			required={adminMode ? 'l’administration des notifications' : 'l’espace pupitre'}
			message={adminMode
				? 'L’envoi de notifications pour tout le bagad est réservé à la secrétaire et à l’administrateur.'
				: 'L’espace pupitre est réservé aux chefs de pupitre, à la secrétaire et à l’administrateur.'}
		/>
	</div>
{:else}
	<PageHeader {title} {description}>
		{#snippet actions()}
			{#if canCompose}
				<button type="button" class={primaryButtonClass} onclick={() => (composing = !composing)}>
					<Megaphone size={16} />
					{composing ? 'Fermer' : 'Composer'}
				</button>
			{/if}
			<button
				type="button"
				class={secondaryButtonClass}
				onclick={() =>
					markAllRead(member.activeProfileId).catch((error) =>
						member.notify('error', error instanceof Error ? error.message : 'Action impossible.')
					)}
				disabled={unread === 0}
			>
				<Check size={16} />
				Tout marquer comme lu
			</button>
		{/snippet}
	</PageHeader>

	{#if composing && canCompose}
		<form class="mt-5 border border-or/40 bg-or/10 p-5" onsubmit={submit} novalidate>
			<h2 class="font-serif text-xl text-marine">Composer une notification</h2>
			<p class="mt-1 text-xs text-ardoise">
				{canSeeAdminSection(actor)
					? 'La secrétaire et l’administrateur peuvent notifier tout le bagad ou plusieurs pupitres.'
					: 'Vous pouvez notifier uniquement les pupitres que vous dirigez.'}
			</p>
			{#if formError}
				<p class="{errorClass} mt-3" role="alert">{formError}</p>
			{/if}
			<div class="mt-4 grid gap-4">
				<label>
					<span class={labelClass}>Titre *</span>
					<input
						class="{inputClass} mt-1"
						bind:value={formTitle}
						required
						placeholder="Rappel de répétition"
					/>
				</label>
				<label>
					<span class={labelClass}>Message *</span>
					<textarea
						class="{inputClass} mt-1 min-h-24"
						bind:value={formBody}
						required
						placeholder="Texte de la notification…"
					></textarea>
				</label>
				<label>
					<span class={labelClass}>Destinataires</span>
					<select class="{inputClass} mt-1" bind:value={formAudience}>
						{#if canSeeAdminSection(actor)}
							<option value="all">Tout le bagad</option>
							<option value="profiles">Membres choisis</option>
						{/if}
						<option value="pupitre">Pupitres</option>
					</select>
				</label>

				{#if formAudience === 'pupitre'}
					<fieldset>
						<legend class={labelClass}>Pupitres</legend>
						<div class="mt-2 grid gap-2 sm:grid-cols-2">
							{#each availablePupitres as pupitre (pupitre.id)}
								<label class="flex items-center gap-2 border border-marine/15 px-3 py-2 text-sm">
									<input
										type={actor.role === 'chef_pupitre' ? 'radio' : 'checkbox'}
										name="notify-pupitre"
										class="h-4 w-4 accent-marine"
										checked={formPupitres.includes(pupitre.id)}
										onchange={(event) => togglePupitre(pupitre.id, event.currentTarget.checked)}
									/>
									{pupitre.name}
								</label>
							{/each}
						</div>
					</fieldset>
				{/if}

				{#if formAudience === 'profiles'}
					<fieldset>
						<legend class={labelClass}>Membres</legend>
						<div class="mt-2 max-h-48 overflow-y-auto border border-marine/15 bg-white p-2">
							{#each member.profiles as profile (profile.id)}
								<label class="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-ivoire/60">
									<input
										type="checkbox"
										class="h-4 w-4 accent-marine"
										checked={formProfiles.includes(profile.id)}
										onchange={(event) => toggleProfile(profile.id, event.currentTarget.checked)}
									/>
									{profile.firstName}
									{profile.lastName}
								</label>
							{/each}
						</div>
					</fieldset>
				{/if}
			</div>
			<div class="mt-4 flex flex-wrap gap-3">
				<button type="submit" class={primaryButtonClass}>
					<Send size={16} />
					Envoyer (simulation)
				</button>
				<button type="button" class={secondaryButtonClass} onclick={() => (composing = false)}
					>Annuler</button
				>
			</div>
		</form>
	{/if}

	<div class="mt-6 flex flex-wrap items-center justify-between gap-3">
		<div class="flex gap-1" role="group" aria-label="Filtrer les notifications">
			{#each [['all', 'Toutes'], ['unread', 'Non lues'], ['read', 'Lues']] as [value, label] (value)}
				<button
					type="button"
					class="border px-3 py-1.5 text-xs font-semibold {filter === value
						? 'border-marine bg-marine text-white'
						: 'border-marine/20 bg-white text-marine hover:border-marine'}"
					aria-pressed={filter === value}
					onclick={() => (filter = value as 'all' | 'unread' | 'read')}
				>
					{label}
				</button>
			{/each}
		</div>
		<p class="text-xs text-ardoise">
			{unread} non lue{unread > 1 ? 's' : ''} · {items.length} affichée{items.length > 1 ? 's' : ''}
		</p>
	</div>

	<ul class="mt-3 space-y-2">
		{#each items as notification (notification.id)}
			{@const read = notification.readBy.includes(member.activeProfileId)}
			{@const recipients = notificationRecipients(notification)}
			<li class="border border-marine/10 bg-white p-4 {read ? 'opacity-80' : ''}">
				<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
					<div class="flex min-w-0 gap-3">
						<span class="mt-1 h-2.5 w-2.5 shrink-0 rounded-full {read ? 'bg-marine/15' : 'bg-or'}"
						></span>
						<div class="min-w-0">
							<div class="flex flex-wrap items-center gap-2">
								<p class="font-semibold text-marine">{notification.title}</p>
								{#if !read}<Badge tone="gold">Non lue</Badge>{/if}
							</div>
							<p class="mt-1 text-sm leading-relaxed text-ardoise">{notification.body}</p>
							<p
								class="mt-2 flex flex-wrap items-center gap-2 text-[0.65rem] uppercase tracking-wider text-ardoise/70"
							>
								<span>{formatDateTime(notification.createdAt)}</span>
								<span>·</span>
								<span>{AUDIENCE_LABELS[notification.audience]}</span>
								<span>·</span>
								<span>{recipients.length} destinataire{recipients.length > 1 ? 's' : ''}</span>
								{#if notification.audience === 'pupitre'}
									<span>·</span>
									<span>{notification.audienceIds.map((id) => pupitreName(id)).join(', ')}</span>
								{/if}
							</p>
						</div>
					</div>
					<div class="flex shrink-0 gap-3">
						{#if read}
							<button
								type="button"
								class="text-xs font-semibold text-marine underline underline-offset-4"
								onclick={() => unreadAction(notification.id)}
							>
								Marquer non lue
							</button>
						{:else}
							<button
								type="button"
								class="text-xs font-semibold text-marine underline underline-offset-4"
								onclick={() => markAsRead(notification.id)}
							>
								Marquer lue
							</button>
						{/if}
					</div>
				</div>
			</li>
		{:else}
			<li>
				<EmptyState
					title="Aucune notification"
					description="Cette boîte est vide pour le filtre choisi et le profil actif."
				>
					{#snippet icon()}<Bell size={28} />{/snippet}
				</EmptyState>
			</li>
		{/each}
	</ul>
{/if}
