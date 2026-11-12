<script lang="ts">
	import { resolve } from '$app/paths';
	import { Bell, CalendarDays, FolderOpen, ShieldCheck, UserRound, Users } from '@lucide/svelte';
	import PageHeader from '$lib/components/dashboard/PageHeader.svelte';
	import StatCard from '$lib/components/dashboard/StatCard.svelte';
	import Badge from '$lib/components/dashboard/Badge.svelte';
	import { primaryButtonClass, secondaryButtonClass } from '$lib/components/dashboard/form';
	import { demo } from '$lib/demo/store.svelte';
	import { actorOf, canSeeAdminSection, canSeePupitreSection } from '$lib/demo/permissions';
	import { eventAudience, visibleEvents } from '$lib/demo/services/members';
	import { presenceSummary, responseOf } from '$lib/demo/services/responses';
	import { notificationsFor, unreadCount } from '$lib/demo/services/notifications';
	import { formatDateTime, formatDemoDate, isPast, DEMO_TODAY } from '$lib/demo/clock';
	import { EVENT_TYPE_LABELS } from '$lib/demo/labels';
	import { pupitreName } from '$lib/demo/fixtures/pupitres';

	const actor = $derived(actorOf(demo.activeProfile));
	const profile = $derived(demo.activeProfile);
	const todayLabel = $derived(formatDemoDate(DEMO_TODAY));

	const upcoming = $derived(
		visibleEvents(actor)
			.filter((event) => event.status === 'active' && !isPast(event.date))
			.slice(0, 4)
	);

	const pending = $derived(
		visibleEvents(actor).filter(
			(event) =>
				event.status === 'active' &&
				!isPast(event.date) &&
				responseOf(event.id, demo.activeProfileId) === null
		)
	);

	const unread = $derived(unreadCount(demo.activeProfileId));
	const latestNotifications = $derived(notificationsFor(demo.activeProfileId).slice(0, 3));

	const myPupitres = $derived(profile.pupitres);
	const chefPupitres = $derived(myPupitres.filter((pupitre) => pupitre.isChef));
	const documentsCount = $derived(demo.documents.length);

	function summaryOf(eventId: string) {
		const event = demo.events.find((item) => item.id === eventId);
		if (!event) return { present: 0, absent: 0 };
		const summary = presenceSummary(
			eventId,
			eventAudience(event).map((item) => item.id)
		);
		return { present: summary.present, absent: summary.absent };
	}
</script>

<PageHeader
	eyebrow={todayLabel}
	title={`Bonjour ${profile.firstName}`}
	description={canSeeAdminSection(actor)
		? 'Voici l’état du bagad et les actions qui vous attendent aujourd’hui. Les données affichées sont fictives.'
		: 'Voici vos prochains rendez-vous et les réponses encore attendues. Les données affichées sont fictives.'}
>
	{#snippet actions()}
		<a href={resolve('/dashboard/agenda')} class={primaryButtonClass}>
			<CalendarDays size={16} />
			Voir l’agenda
		</a>
		<a href={resolve('/dashboard/profil')} class={secondaryButtonClass}>
			<UserRound size={16} />
			Mon profil
		</a>
	{/snippet}
</PageHeader>

<section class="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Résumé">
	<StatCard
		label="Prochains événements"
		value={upcoming.length}
		hint={upcoming[0] ? `Le prochain : ${upcoming[0].title}` : 'Aucun événement à venir'}
		tone="marine"
	>
		{#snippet icon()}<CalendarDays size={18} />{/snippet}
	</StatCard>
	<StatCard
		label="Réponses attendues"
		value={pending.length}
		hint={pending.length
			? 'Événements auxquels vous n’avez pas encore répondu'
			: 'Vous avez répondu à tout'}
		tone={pending.length ? 'gold' : 'plain'}
	>
		{#snippet icon()}
			<svg
				viewBox="0 0 24 24"
				width="18"
				height="18"
				fill="none"
				stroke="currentColor"
				stroke-width="1.7"
				aria-hidden="true"
			>
				<path
					d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"
				/>
				<path d="M8 12h8" />
			</svg>
		{/snippet}
	</StatCard>
	<StatCard
		label="Notifications non lues"
		value={unread}
		hint={`${latestNotifications.length} notification(s) récente(s)`}
	>
		{#snippet icon()}<Bell size={18} />{/snippet}
	</StatCard>
	<StatCard
		label="Documents disponibles"
		value={documentsCount}
		hint="Partitions, fiches techniques et documents communs"
	>
		{#snippet icon()}<FolderOpen size={18} />{/snippet}
	</StatCard>
</section>

<div class="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
	<section aria-labelledby="prochains-titres">
		<div class="flex items-end justify-between gap-3">
			<h2 id="prochains-titres" class="font-serif text-2xl text-marine">Prochains rendez-vous</h2>
			<a
				href={resolve('/dashboard/agenda')}
				class="text-xs font-semibold text-marine underline underline-offset-4"
			>
				Tout l’agenda
			</a>
		</div>

		<ul class="mt-3 divide-y divide-marine/10 border border-marine/10 bg-white">
			{#each upcoming as event (event.id)}
				{@const response = responseOf(event.id, demo.activeProfileId)}
				{@const summary = summaryOf(event.id)}
				<li class="p-4">
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div class="min-w-0">
							<p class="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ardoise">
								{EVENT_TYPE_LABELS[event.type]} · {formatDemoDate(event.date, { withYear: false })}
							</p>
							<a
								href={resolve('/dashboard/agenda/[id]', { id: event.id })}
								class="mt-1 block font-serif text-lg leading-tight text-marine hover:underline hover:decoration-or hover:underline-offset-4"
							>
								{event.title}
							</a>
							<p class="mt-1 text-xs text-ardoise">
								{event.location}
								{#if event.pupitreIds.length}
									· {event.pupitreIds.map((id) => pupitreName(id)).join(', ')}
								{/if}
							</p>
						</div>
						<div class="flex shrink-0 flex-col items-end gap-1.5">
							{#if response === 'present'}
								<Badge tone="success">Présent</Badge>
							{:else if response === 'absent'}
								<Badge tone="danger">Absent</Badge>
							{:else}
								<Badge tone="muted">Sans réponse</Badge>
							{/if}
							<span class="text-[0.68rem] text-ardoise">
								{summary.present} présent{summary.present > 1 ? 's' : ''}
							</span>
						</div>
					</div>
				</li>
			{:else}
				<li class="p-6 text-sm text-ardoise">
					Aucun événement à venir n’est visible avec ce profil.
				</li>
			{/each}
		</ul>

		{#if canSeePupitreSection(actor) && chefPupitres.length}
			<section
				class="mt-6 border border-marine/15 bg-marine p-5 text-ivoire"
				aria-labelledby="pupitre-resume"
			>
				<h2 id="pupitre-resume" class="font-serif text-xl text-white">Vos pupitres</h2>
				<p class="mt-1 text-xs text-ivoire/70">Vous dirigez {chefPupitres.length} pupitre(s).</p>
				<ul class="mt-3 flex flex-wrap gap-2">
					{#each chefPupitres as pupitre (pupitre.pupitreId)}
						<li class="border border-ivoire/25 px-3 py-1.5 text-xs font-semibold">
							{pupitreName(pupitre.pupitreId)}
						</li>
					{/each}
				</ul>
				<a
					href={resolve('/dashboard/pupitre')}
					class="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-or-light underline underline-offset-4"
				>
					Ouvrir l’espace pupitre
				</a>
			</section>
		{/if}
	</section>

	<aside class="space-y-6">
		<section aria-labelledby="notifications-resume">
			<div class="flex items-end justify-between gap-3">
				<h2 id="notifications-resume" class="font-serif text-2xl text-marine">Notifications</h2>
				<a
					href={resolve('/dashboard/notifications')}
					class="text-xs font-semibold text-marine underline underline-offset-4"
				>
					Tout voir
				</a>
			</div>
			<ul class="mt-3 divide-y divide-marine/10 border border-marine/10 bg-white">
				{#each latestNotifications as notification (notification.id)}
					{@const read = notification.readBy.includes(demo.activeProfileId)}
					<li class="p-4">
						<div class="flex items-start gap-2">
							<span class="mt-1.5 h-2 w-2 shrink-0 rounded-full {read ? 'bg-marine/20' : 'bg-or'}"
							></span>
							<div class="min-w-0">
								<p class="text-sm font-semibold leading-snug text-marine">{notification.title}</p>
								<p class="mt-1 line-clamp-2 text-xs text-ardoise">{notification.body}</p>
								<p class="mt-1 text-[0.65rem] uppercase tracking-wider text-ardoise/70">
									{formatDateTime(notification.createdAt)}
								</p>
							</div>
						</div>
					</li>
				{:else}
					<li class="p-5 text-sm text-ardoise">Aucune notification.</li>
				{/each}
			</ul>
		</section>

		<section aria-labelledby="raccourcis">
			<h2 id="raccourcis" class="font-serif text-2xl text-marine">Raccourcis</h2>
			<div class="mt-3 grid gap-2">
				<a
					href={resolve('/dashboard/membres')}
					class="flex items-center gap-3 border border-marine/10 bg-white px-4 py-3 text-sm text-marine hover:bg-ivoire/60"
				>
					<Users size={18} class="text-or-dark" />
					Consulter le trombinoscope
				</a>
				<a
					href={resolve('/dashboard/documents')}
					class="flex items-center gap-3 border border-marine/10 bg-white px-4 py-3 text-sm text-marine hover:bg-ivoire/60"
				>
					<FolderOpen size={18} class="text-or-dark" />
					Ouvrir les documents
				</a>
				{#if canSeeAdminSection(actor)}
					<a
						href={resolve('/dashboard/admin')}
						class="flex items-center gap-3 border border-marine/10 bg-white px-4 py-3 text-sm text-marine hover:bg-ivoire/60"
					>
						<ShieldCheck size={18} class="text-or-dark" />
						Administration
					</a>
				{/if}
			</div>
		</section>

		{#if pending.length}
			<section class="border border-or/50 bg-or/10 p-5" aria-labelledby="reponses-attente">
				<h2 id="reponses-attente" class="font-serif text-xl text-marine">Réponses attendues</h2>
				<p class="mt-1 text-xs text-ardoise">
					{pending.length} événement{pending.length > 1 ? 's' : ''} sans réponse de votre part.
				</p>
				<ul class="mt-3 space-y-2">
					{#each pending.slice(0, 3) as event (event.id)}
						<li>
							<a
								href={resolve('/dashboard/agenda/[id]', { id: event.id })}
								class="block text-sm font-semibold text-marine underline underline-offset-4"
							>
								{event.title} — {formatDemoDate(event.date, { withYear: false })}
							</a>
						</li>
					{/each}
				</ul>
			</section>
		{/if}
	</aside>
</div>

<div class="mt-8 border border-marine/15 bg-white p-4 text-xs leading-relaxed text-ardoise">
	<strong class="text-marine">Mode démonstration.</strong> Toutes les données sont fictives et vivent
	uniquement dans votre navigateur. Aucune connexion à Neon, aucun envoi d’e-mail ni de notification réelle.
	Les rôles affichés sont simulés et ne remplacent pas les futurs contrôles serveur.
</div>
