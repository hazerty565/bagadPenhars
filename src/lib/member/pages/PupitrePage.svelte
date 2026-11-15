<script lang="ts">
	import { resolve } from '$app/paths';
	import { Bell, FolderOpen, Users } from '@lucide/svelte';
	import PageHeader from '$lib/components/dashboard/PageHeader.svelte';
	import Badge from '$lib/components/dashboard/Badge.svelte';
	import AccessDenied from '$lib/components/dashboard/AccessDenied.svelte';
	import EventCard from '$lib/components/dashboard/EventCard.svelte';
	import { secondaryButtonClass } from '$lib/components/dashboard/form';
	import { member } from '$lib/member/store.svelte';
	import {
		actorOf,
		canSeePupitreSection,
		chefPupitreIds,
		scopedPupitreIds
	} from '$lib/member/permissions';
	import {
		activeChefs,
		eventAudience,
		manageableEvents,
		profilesOfPupitre
	} from '$lib/member/services/members';
	import { presenceSummary } from '$lib/member/services/responses';
	import { unreadCount } from '$lib/member/services/notifications';
	import { TODAY } from '$lib/member/clock';
	import { pupitreName } from '$lib/member/pupitres';

	const actor = $derived(actorOf(member.activeProfile));
	const allowed = $derived(canSeePupitreSection(actor));
	const scope = $derived(scopedPupitreIds(actor));

	const upcomingEvents = $derived(
		manageableEvents(actor)
			.filter((event) => event.status === 'active' && event.date >= TODAY)
			.sort((a, b) => a.date.localeCompare(b.date))
			.slice(0, 4)
	);

	function summary(eventId: string) {
		const event = member.events.find((item) => item.id === eventId);
		if (!event) return { present: 0, absent: 0 };
		const result = presenceSummary(
			eventId,
			eventAudience(event).map((item) => item.id)
		);
		return { present: result.present, absent: result.absent };
	}

	function membersCount(pupitreId: (typeof scope)[number]): number {
		return profilesOfPupitre(pupitreId).length;
	}

	function documentsCount(pupitreId: (typeof scope)[number]): number {
		return member.documents.filter((document) => document.pupitreId === pupitreId).length;
	}

	function chefsLabel(pupitreId: (typeof scope)[number]): string {
		const chefs = activeChefs(pupitreId);
		if (chefs.length === 0) return 'Aucun chef désigné';
		return chefs.map((chef) => `${chef.firstName} ${chef.lastName}`).join(', ');
	}
</script>

{#if !allowed}
	<AccessDenied
		{actor}
		required="l’espace pupitre"
		message="L’espace pupitre est réservé aux chefs de pupitre, à la secrétaire et à l’administrateur."
	/>
{:else}
	<PageHeader
		eyebrow="Pupitre"
		title="Espace pupitre"
		description={actor.role === 'chef_pupitre'
			? 'Vous ne voyez ici que les pupitres que vous dirigez. Les autres pupitres sont hors de votre périmètre.'
			: 'Vue consolidée des quatre pupitres. La secrétaire et l’administrateur disposent de l’ensemble du périmètre.'}
	>
		{#snippet actions()}
			<a href={resolve('/dashboard/pupitre/membres')} class={secondaryButtonClass}>
				<Users size={16} />
				Membres
			</a>
			<a href={resolve('/dashboard/pupitre/documents')} class={secondaryButtonClass}>
				<FolderOpen size={16} />
				Documents
			</a>
			<a href={resolve('/dashboard/pupitre/notifications')} class={secondaryButtonClass}>
				<Bell size={16} />
				Notifications
				{#if unreadCount(member.activeProfileId)}
					<span class="rounded-full bg-or px-1.5 text-[0.62rem] font-bold text-ink"
						>{unreadCount(member.activeProfileId)}</span
					>
				{/if}
			</a>
		{/snippet}
	</PageHeader>

	<div class="mt-6 grid gap-3 sm:grid-cols-2">
		{#each scope as pupitreId (pupitreId)}
			<section
				class="border border-marine/10 bg-white p-5"
				aria-labelledby={`pupitre-${pupitreId}`}
			>
				<div class="flex items-start justify-between gap-3">
					<div>
						<h2 id={`pupitre-${pupitreId}`} class="font-serif text-2xl text-marine">
							{pupitreName(pupitreId)}
						</h2>
						<p class="mt-1 text-xs text-ardoise">Chef(s) : {chefsLabel(pupitreId)}</p>
					</div>
					{#if chefPupitreIds(actor).includes(pupitreId)}
						<Badge tone="gold">Vous dirigez</Badge>
					{/if}
				</div>
				<div class="mt-4 grid grid-cols-3 gap-2 text-center">
					<div class="bg-ivoire p-3">
						<p class="font-serif text-2xl text-marine">{membersCount(pupitreId)}</p>
						<p class="text-[0.62rem] uppercase tracking-wider text-ardoise">Membres</p>
					</div>
					<div class="bg-ivoire p-3">
						<p class="font-serif text-2xl text-marine">{documentsCount(pupitreId)}</p>
						<p class="text-[0.62rem] uppercase tracking-wider text-ardoise">Documents</p>
					</div>
					<div class="bg-ivoire p-3">
						<p class="font-serif text-2xl text-marine">
							{member.events.filter(
								(event) =>
									event.pupitreIds.includes(pupitreId) &&
									event.status === 'active' &&
									event.date >= TODAY
							).length}
						</p>
						<p class="text-[0.62rem] uppercase tracking-wider text-ardoise">À venir</p>
					</div>
				</div>
				<div class="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-marine">
					<a href={resolve('/dashboard/pupitre/membres')} class="underline underline-offset-4"
						>Membres</a
					>
					<a href={resolve('/dashboard/pupitre/documents')} class="underline underline-offset-4"
						>Documents</a
					>
					<a href={resolve('/dashboard/agenda')} class="underline underline-offset-4">Agenda</a>
				</div>
			</section>
		{:else}
			<p class="text-sm text-ardoise">Aucun pupitre dans votre périmètre.</p>
		{/each}
	</div>

	<section class="mt-8" aria-labelledby="evenements-perimetre">
		<div class="flex items-end justify-between gap-3">
			<h2 id="evenements-perimetre" class="font-serif text-2xl text-marine">
				Événements à venir dans votre périmètre
			</h2>
			<a
				href={resolve('/dashboard/agenda')}
				class="text-xs font-semibold text-marine underline underline-offset-4">Gérer</a
			>
		</div>
		<div class="mt-3 space-y-3">
			{#each upcomingEvents as event (event.id)}
				{@const counts = summary(event.id)}
				<EventCard {event} present={counts.present} absent={counts.absent} />
			{:else}
				<p class="border border-marine/10 bg-white p-5 text-sm text-ardoise">
					Aucun événement à venir dans votre périmètre.
				</p>
			{/each}
		</div>
	</section>

	<p class="mt-6 border border-marine/10 bg-ivoire/70 p-4 text-xs leading-relaxed text-ardoise">
		Un chef ne gère que les événements ciblant un seul de ses pupitres. Les événements
		multi-pupitres et globaux restent gérés par la secrétaire ou l’administrateur.
	</p>
{/if}
