<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { afterNavigate } from '$app/navigation';
	import type { Snippet } from 'svelte';
	import {
		ArrowLeft,
		Bell,
		CalendarDays,
		FolderOpen,
		LayoutDashboard,
		LogOut,
		Menu,
		ShieldCheck,
		UserRound,
		Users,
		X
	} from '@lucide/svelte';
	import Avatar from '$lib/components/dashboard/Avatar.svelte';
	import RoleBadge from '$lib/components/dashboard/RoleBadge.svelte';
	import { member } from '$lib/member/store.svelte';
	import { actorOf, canSeeAdminSection, canSeePupitreSection } from '$lib/member/permissions';
	import { dashboardPageTitle } from '$lib/member/labels';
	import { unreadCount } from '$lib/member/services/notifications';

	interface Props {
		children?: Snippet;
	}

	let { children }: Props = $props();

	let drawerOpen = $state(false);

	const profile = $derived(member.profile);
	const actor = $derived(actorOf(profile));
	const adminVisible = $derived(canSeeAdminSection(actor));
	const pupitreVisible = $derived(canSeePupitreSection(actor));
	const unread = $derived(unreadCount(member.activeProfileId));

	type NavItem = { href: string; label: string; icon: typeof LayoutDashboard; badge?: number };

	const mainNav = $derived<NavItem[]>([
		{ href: resolve('/dashboard'), label: 'Accueil', icon: LayoutDashboard },
		{ href: resolve('/dashboard/agenda'), label: 'Agenda', icon: CalendarDays },
		{ href: resolve('/dashboard/membres'), label: 'Membres', icon: Users },
		{ href: resolve('/dashboard/documents'), label: 'Documents', icon: FolderOpen },
		{ href: resolve('/dashboard/notifications'), label: 'Notifications', icon: Bell, badge: unread }
	]);

	const accountNav = $derived<NavItem[]>([
		{ href: resolve('/dashboard/profil'), label: 'Mon profil', icon: UserRound },
		{ href: resolve('/dashboard/securite'), label: 'Sécurité et session', icon: ShieldCheck }
	]);

	const pupitreNav = $derived<NavItem[]>(
		pupitreVisible
			? [{ href: resolve('/dashboard/pupitre'), label: 'Espace pupitre', icon: Users }]
			: []
	);

	const adminNav = $derived<NavItem[]>(
		adminVisible
			? [
					{ href: resolve('/dashboard/admin'), label: 'Administration', icon: ShieldCheck },
					{ href: resolve('/dashboard/admin/articles'), label: 'Articles', icon: FolderOpen },
					{ href: resolve('/dashboard/admin/media'), label: 'Médias', icon: FolderOpen }
				]
			: []
	);

	const allNav = $derived([...mainNav, ...accountNav, ...pupitreNav, ...adminNav]);

	function isActive(href: string): boolean {
		const pathname = page.url.pathname;
		if (href === resolve('/dashboard')) return pathname === href;
		return pathname === href || pathname.startsWith(`${href}/`);
	}

	function closeDrawer() {
		drawerOpen = false;
	}

	afterNavigate(() => {
		drawerOpen = false;
	});

	$effect(() => {
		const notice = member.notice;
		if (!notice) return;
		const timer = setTimeout(() => member.clearNotice(), 5200);
		return () => clearTimeout(timer);
	});

	const publicHome = resolve('/(public)/[lang=lang]', { lang: 'fr' });
	const logoutHref = resolve('/auth/logout');
	const bottomNav = $derived(mainNav.slice(0, 4));
	const pageTitle = $derived(`${dashboardPageTitle(page.url.pathname)} — Bagad Penhars`);
</script>

<svelte:head>
	<title>{pageTitle}</title>
</svelte:head>

<!-- eslint-disable svelte/no-navigation-without-resolve -- les href sont déjà produits par resolve() -->
<div class="min-h-screen bg-ivoire/50">
	<a class="skip-link" href="#contenu-dashboard">Aller au contenu principal</a>

	<!-- Barre latérale desktop -->
	<aside class="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col bg-marine text-ivoire lg:flex">
		<div class="border-b border-ivoire/15 px-5 py-5">
			<a
				href={publicHome}
				class="flex items-center gap-3"
				aria-label="Retour au site public du Bagad Penhars"
			>
				<span class="flex h-11 w-11 items-center justify-center rounded-full bg-ivoire">
					<img src="/logo-penhars.svg" alt="" width="30" height="30" fetchpriority="high" />
				</span>
				<span>
					<span class="block font-serif text-lg leading-tight text-white">Bagad Penhars</span>
					<span class="block text-[0.62rem] uppercase tracking-[0.2em] text-ivoire/60"
						>Espace adhérents</span
					>
				</span>
			</a>
		</div>

		<div class="flex items-center gap-3 border-b border-ivoire/15 px-5 py-4">
			<Avatar {profile} size="sm" decorative />
			<span class="min-w-0 flex-1">
				<span class="block truncate text-sm font-semibold text-white">
					{profile.firstName}
					{profile.lastName}
				</span>
				<span class="mt-1 block"><RoleBadge role={profile.role} /></span>
			</span>
		</div>

		<nav class="flex-1 overflow-y-auto px-3 py-4" aria-label="Navigation de l’espace adhérents">
			<p class="px-2 pb-2 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-ivoire/40">
				Mon espace
			</p>
			<ul class="space-y-1">
				{#each mainNav as item (item.href)}
					{@const Icon = item.icon}
					<li>
						<a
							href={item.href}
							aria-current={isActive(item.href) ? 'page' : undefined}
							class="flex items-center gap-3 px-3 py-2.5 text-sm transition-colors {isActive(
								item.href
							)
								? 'bg-ivoire/10 font-semibold text-white'
								: 'text-ivoire/75 hover:bg-white/5 hover:text-white'}"
						>
							<Icon size={17} />
							<span class="flex-1">{item.label}</span>
							{#if item.badge}
								<span
									class="min-w-5 rounded-full bg-or px-1.5 py-0.5 text-center text-[0.62rem] font-bold text-ink"
								>
									{item.badge}
								</span>
							{/if}
						</a>
					</li>
				{/each}
			</ul>

			<p
				class="mt-6 px-2 pb-2 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-ivoire/40"
			>
				Mon compte
			</p>
			<ul class="space-y-1">
				{#each accountNav as item (item.href)}
					{@const Icon = item.icon}
					<li>
						<a
							href={item.href}
							aria-current={isActive(item.href) ? 'page' : undefined}
							class="flex items-center gap-3 px-3 py-2.5 text-sm transition-colors {isActive(
								item.href
							)
								? 'bg-ivoire/10 font-semibold text-white'
								: 'text-ivoire/75 hover:bg-white/5 hover:text-white'}"
						>
							<Icon size={17} />
							{item.label}
						</a>
					</li>
				{/each}
			</ul>

			{#if pupitreNav.length}
				<p
					class="mt-6 px-2 pb-2 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-ivoire/40"
				>
					Pupitre
				</p>
				<ul class="space-y-1">
					{#each pupitreNav as item (item.href)}
						{@const Icon = item.icon}
						<li>
							<a
								href={item.href}
								aria-current={isActive(item.href) ? 'page' : undefined}
								class="flex items-center gap-3 px-3 py-2.5 text-sm transition-colors {isActive(
									item.href
								)
									? 'bg-ivoire/10 font-semibold text-white'
									: 'text-ivoire/75 hover:bg-white/5 hover:text-white'}"
							>
								<Icon size={17} />
								{item.label}
							</a>
						</li>
					{/each}
				</ul>
			{/if}

			{#if adminNav.length}
				<p
					class="mt-6 px-2 pb-2 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-ivoire/40"
				>
					Administration
				</p>
				<ul class="space-y-1">
					{#each adminNav as item (item.href)}
						{@const Icon = item.icon}
						<li>
							<a
								href={item.href}
								aria-current={isActive(item.href) ? 'page' : undefined}
								class="flex items-center gap-3 px-3 py-2.5 text-sm transition-colors {isActive(
									item.href
								)
									? 'bg-ivoire/10 font-semibold text-white'
									: 'text-ivoire/75 hover:bg-white/5 hover:text-white'}"
							>
								<Icon size={17} />
								{item.label}
							</a>
						</li>
					{/each}
				</ul>
			{/if}
		</nav>

		<div class="space-y-3 border-t border-ivoire/15 px-4 py-3 text-xs">
			<a href={publicHome} class="inline-flex items-center gap-2 text-ivoire/70 hover:text-white">
				<ArrowLeft size={14} />
				Retour au site public
			</a>
			<form method="POST" action={logoutHref}>
				<button
					type="submit"
					class="inline-flex items-center gap-2 text-ivoire/70 hover:text-white"
				>
					<LogOut size={14} />
					Se déconnecter
				</button>
			</form>
		</div>
	</aside>

	<div class="lg:pl-72">
		<!-- Barre supérieure mobile -->
		<header
			class="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-marine/10 bg-ivoire px-4 py-3 lg:hidden"
		>
			<button
				type="button"
				class="p-2 text-marine"
				aria-label="Ouvrir le menu"
				aria-expanded={drawerOpen}
				onclick={() => (drawerOpen = true)}
			>
				<Menu size={22} />
			</button>
			<a href={resolve('/dashboard')} class="font-serif text-lg text-marine">Espace adhérents</a>
			<span class="flex items-center gap-2" aria-hidden="true">
				<Avatar {profile} size="xs" decorative />
			</span>
		</header>

		<main
			id="contenu-dashboard"
			class="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-8"
		>
			{@render children?.()}
		</main>
	</div>

	<!-- Navigation inférieure mobile -->
	<nav
		class="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-marine/10 bg-white lg:hidden"
		aria-label="Navigation rapide"
	>
		{#each bottomNav as item (item.href)}
			{@const Icon = item.icon}
			<a
				href={item.href}
				aria-current={isActive(item.href) ? 'page' : undefined}
				class="relative flex flex-col items-center gap-1 py-2.5 text-[0.62rem] font-medium {isActive(
					item.href
				)
					? 'text-marine'
					: 'text-ardoise'}"
			>
				<Icon size={19} />
				{item.label}
				{#if item.badge}
					<span
						class="absolute right-4 top-1 rounded-full bg-or px-1 text-[0.55rem] font-bold text-ink"
						>{item.badge}</span
					>
				{/if}
			</a>
		{/each}
	</nav>

	<!-- Tiroir mobile -->
	{#if drawerOpen}
		<div class="fixed inset-0 z-50 lg:hidden">
			<button
				type="button"
				class="absolute inset-0 bg-marine-900/50"
				aria-label="Fermer le menu"
				onclick={closeDrawer}
			></button>
			<div class="absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-marine text-ivoire">
				<div class="flex items-center justify-between border-b border-ivoire/15 px-4 py-4">
					<span class="font-serif text-lg text-white">Bagad Penhars</span>
					<button type="button" class="p-2" aria-label="Fermer le menu" onclick={closeDrawer}>
						<X size={20} />
					</button>
				</div>
				<div class="flex items-center gap-3 border-b border-ivoire/15 px-4 py-4">
					<Avatar {profile} size="sm" decorative />
					<span>
						<span class="block text-sm font-semibold text-white">
							{profile.firstName}
							{profile.lastName}
						</span>
						<span class="mt-1 block"><RoleBadge role={profile.role} /></span>
					</span>
				</div>
				<nav class="flex-1 overflow-y-auto px-3 py-3" aria-label="Navigation mobile">
					<ul class="space-y-1">
						{#each allNav as item (item.href)}
							{@const Icon = item.icon}
							<li>
								<a
									href={item.href}
									aria-current={isActive(item.href) ? 'page' : undefined}
									class="flex items-center gap-3 px-3 py-2.5 text-sm {isActive(item.href)
										? 'bg-ivoire/10 font-semibold text-white'
										: 'text-ivoire/75'}"
									onclick={closeDrawer}
								>
									<Icon size={17} />
									<span class="flex-1">{item.label}</span>
									{#if item.badge}
										<span class="rounded-full bg-or px-1.5 text-[0.62rem] font-bold text-ink"
											>{item.badge}</span
										>
									{/if}
								</a>
							</li>
						{/each}
					</ul>
				</nav>
				<div class="space-y-3 border-t border-ivoire/15 px-4 py-4 text-xs">
					<a href={publicHome} class="inline-flex items-center gap-2 text-ivoire/70">
						<ArrowLeft size={14} />
						Retour au site public
					</a>
					<form method="POST" action={logoutHref}>
						<button
							type="submit"
							class="inline-flex items-center gap-2 text-ivoire/70 hover:text-white"
						>
							<LogOut size={14} />
							Se déconnecter
						</button>
					</form>
				</div>
			</div>
		</div>
	{/if}

	<!-- Message global -->
	{#if member.notice}
		<div
			class="fixed bottom-20 left-1/2 z-[80] w-[92%] max-w-md -translate-x-1/2 border px-4 py-3 text-sm shadow-xl lg:bottom-6 {member
				.notice.kind === 'error'
				? 'border-danger bg-danger text-white'
				: member.notice.kind === 'success'
					? 'border-marine bg-marine text-white'
					: 'border-or bg-ivoire text-ink'}"
			role="status"
			aria-live="polite"
		>
			<div class="flex items-start gap-3">
				<p class="flex-1">{member.notice.text}</p>
				<button
					type="button"
					class="shrink-0 p-1 opacity-70 hover:opacity-100"
					aria-label="Fermer le message"
					onclick={() => member.clearNotice()}
				>
					<X size={16} />
				</button>
			</div>
		</div>
	{/if}
</div>
