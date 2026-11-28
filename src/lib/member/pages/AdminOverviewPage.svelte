<script lang="ts">
	import { resolve } from '$app/paths';
	import {
		Bell,
		BookOpen,
		CalendarDays,
		Images,
		Mail,
		ShieldCheck,
		SlidersHorizontal,
		Users
	} from '@lucide/svelte';
	import PageHeader from '$lib/components/dashboard/PageHeader.svelte';
	import StatCard from '$lib/components/dashboard/StatCard.svelte';
	import AccessDenied from '$lib/components/dashboard/AccessDenied.svelte';
	import { member } from '$lib/member/store.svelte';
	import { actorOf, canSeeAdminSection } from '$lib/member/permissions';
	import { unreadCount } from '$lib/member/services/notifications';
	import { formatBytes } from '$lib/member/clock';

	const actor = $derived(actorOf(member.activeProfile));
	const allowed = $derived(canSeeAdminSection(actor));

	const links = $derived([
		{
			href: resolve('/dashboard/admin/membres'),
			label: 'Membres',
			description: 'Rôles, pupitres, niveaux et fonctions du bureau.',
			icon: Users
		},
		{
			href: resolve('/dashboard/admin/invitations'),
			label: 'Invitations',
			description: 'Inviter, relancer ou annuler une invitation fictive.',
			icon: Mail
		},
		{
			href: resolve('/dashboard/admin/permissions'),
			label: 'Rôles et permissions',
			description: 'Matrice de référence, en lecture seule.',
			icon: ShieldCheck
		},
		{
			href: resolve('/dashboard/admin/agenda'),
			label: 'Événements',
			description: 'Gestion globale de l’agenda et des réponses.',
			icon: CalendarDays
		},
		{
			href: resolve('/dashboard/admin/articles'),
			label: 'Articles',
			description: 'Rédiger, publier ou dépublier les actualités.',
			icon: BookOpen
		},
		{
			href: resolve('/dashboard/admin/media'),
			label: 'Médias',
			description: 'Albums, photos et légendes.',
			icon: Images
		},
		{
			href: resolve('/dashboard/admin/notifications'),
			label: 'Notifications',
			description: 'Composer un envoi simulé pour tout le bagad.',
			icon: Bell
		},
		{
			href: resolve('/dashboard/admin/settings'),
			label: 'Réglages',
			description: 'Informations, notifications et stockage simulé.',
			icon: SlidersHorizontal
		}
	]);
</script>

{#if !allowed}
	<AccessDenied
		{actor}
		required="l’administration"
		message="L’administration est réservée à la secrétaire et à l’administrateur."
	/>
{:else}
	<PageHeader
		eyebrow="Administration"
		title="Administration du bagad"
		description="Gestion fictive de l’association. Les pages de cette section appliquent la matrice des permissions : masquer un lien ne suffit pas, chaque service refuse les actions interdites."
	/>

	<section
		class="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
		aria-label="Résumé de l’administration"
	>
		<StatCard
			label="Membres"
			value={member.adminCounts?.members ?? 0}
			hint="Profils fictifs actifs"
			tone="marine"
		>
			{#snippet icon()}<Users size={18} />{/snippet}
		</StatCard>
		<StatCard
			label="Invitations en attente"
			value={member.invitations.filter((item) => item.status === 'pending').length}
			hint="Sans envoi d’e-mail réel"
		>
			{#snippet icon()}<Mail size={18} />{/snippet}
		</StatCard>
		<StatCard
			label="Articles publiés"
			value={member.articles.filter((article) => article.status === 'published').length}
			hint={`${member.articles.filter((article) => article.status === 'draft').length} brouillon(s)`}
		>
			{#snippet icon()}<BookOpen size={18} />{/snippet}
		</StatCard>
		<StatCard
			label="Notifications non lues"
			value={unreadCount(member.activeProfileId)}
			hint={`Stockage fictif : ${formatBytes(member.settings.storageUsedBytes)}`}
		>
			{#snippet icon()}<Bell size={18} />{/snippet}
		</StatCard>
	</section>

	<div class="mt-6 grid gap-3 sm:grid-cols-2">
		{#each links as link (link.href)}
			{@const Icon = link.icon}
			<a
				href={link.href}
				class="group flex items-start gap-4 border border-marine/10 bg-white p-5 transition-colors hover:border-marine/30 hover:bg-ivoire/50"
			>
				<span class="flex h-10 w-10 shrink-0 items-center justify-center bg-ivoire text-marine">
					<Icon size={20} />
				</span>
				<span>
					<span class="block font-serif text-xl text-marine">{link.label}</span>
					<span class="mt-1 block text-xs leading-relaxed text-ardoise">{link.description}</span>
				</span>
			</a>
		{/each}
	</div>

	<section class="mt-6 border border-marine/15 bg-white p-5" aria-labelledby="admin-perimetre">
		<h2 id="admin-perimetre" class="font-serif text-xl text-marine">Périmètre de votre rôle</h2>
		<p class="mt-2 text-sm leading-relaxed text-ardoise">
			{#if actor.role === 'admin'}
				Administrateur : vous disposez de toutes les fonctions, y compris les rôles, les réglages
				globaux et les suppressions. Vous ne pouvez pas modifier votre propre rôle.
			{:else}
				Secrétaire : vous gérez tous les pupitres, les événements, les contenus, les invitations et
				les comptes. L’attribution des rôles, les réglages globaux et les suppressions restent
				réservés à l’administrateur.
			{/if}
		</p>
		<div class="mt-4 flex flex-wrap gap-2 text-xs">
			<a
				href={resolve('/dashboard/admin/membres')}
				class="border border-marine/25 px-3 py-1.5 font-semibold text-marine hover:border-marine"
				>Gérer les membres</a
			>
			<a
				href={resolve('/dashboard/admin/permissions')}
				class="border border-marine/25 px-3 py-1.5 font-semibold text-marine hover:border-marine"
				>Voir la matrice</a
			>
			<a
				href={resolve('/dashboard/securite')}
				class="border border-marine/25 px-3 py-1.5 font-semibold text-marine hover:border-marine"
				>Sécurité et session</a
			>
		</div>
	</section>
{/if}
