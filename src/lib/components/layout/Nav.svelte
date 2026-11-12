<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { ChevronRight, LogIn, Menu, Music2, X } from '@lucide/svelte';
	import LanguageSwitcher from './LanguageSwitcher.svelte';
	import SocialIcon from '$lib/components/ui/SocialIcon.svelte';
	import { PUBLIC_NAV } from '$lib/data/nav';
	import { site } from '$lib/data/site';
	import type { Dictionary, Lang } from '$lib/i18n';

	let { lang, t, onListen }: { lang: Lang; t: Dictionary; onListen: () => void } = $props();

	let mobileOpen = $state(false);
	let menuButton: HTMLButtonElement | undefined = $state();

	const pathname = $derived(page.url.pathname);

	const navItems = $derived.by(() =>
		PUBLIC_NAV.map((item) => {
			const href = resolve(item.route, { lang });
			const isHome = item.route === '/(public)/[lang=lang]';
			const active = isHome
				? pathname === href
				: pathname === href || pathname.startsWith(`${href}/`);

			return { href, label: t.nav[item.key], active };
		})
	);

	afterNavigate(() => {
		mobileOpen = false;
	});

	function openPlayer() {
		mobileOpen = false;
		onListen();
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && mobileOpen) {
			mobileOpen = false;
			menuButton?.focus();
		}
	}
</script>

<svelte:window onkeydown={onKeydown} />

<header class="sticky top-0 z-50 border-b border-ink/10 bg-ivoire">
	<div class="container-page flex h-20 items-center justify-between gap-5">
		<a
			href={resolve('/(public)/[lang=lang]', { lang })}
			class="flex shrink-0 items-center gap-3"
			aria-label={`${site.name} â€” ${t.nav.home}`}
		>
			<img
				src="/logo-penhars.svg"
				alt=""
				width="44"
				height="44"
				fetchpriority="high"
				class="h-11 w-11 object-contain"
			/>
			<span class="hidden leading-none sm:block">
				<span class="block font-serif text-xl font-semibold tracking-tight text-marine">
					Bagad Penhars
				</span>
				<span class="mt-1.5 block text-[0.62rem] uppercase tracking-[0.2em] text-ink/55">
					{t.header.tagline}
				</span>
			</span>
		</a>

		<nav class="hidden items-center gap-3.5 xl:flex 2xl:gap-4" aria-label={t.nav.main}>
			{#each navItems as item (item.href)}
				<a
					href={item.href}
					aria-current={item.active ? 'page' : undefined}
					class={[
						'border-b-2 py-1 text-[0.74rem] font-medium whitespace-nowrap transition-colors 2xl:text-[0.8rem]',
						item.active
							? 'border-or text-marine'
							: 'border-transparent text-ink/65 hover:border-or/50 hover:text-marine'
					].join(' ')}
				>
					{item.label}
				</a>
			{/each}
		</nav>

		<div class="flex items-center gap-1.5">
			<div class="mr-1 hidden items-center gap-1.5 xl:flex">
				<a
					href={site.social.facebook}
					target="_blank"
					rel="external noopener noreferrer"
					aria-label="Facebook"
					title="Facebook"
					class="flex h-9 w-9 items-center justify-center transition-opacity hover:opacity-75"
				>
					<SocialIcon name="facebook" className="h-[1.15rem] w-[1.15rem]" />
				</a>
				<a
					href={site.social.instagram}
					target="_blank"
					rel="external noopener noreferrer"
					aria-label="Instagram"
					title="Instagram"
					class="flex h-9 w-9 items-center justify-center transition-opacity hover:opacity-75"
				>
					<SocialIcon name="instagram" className="h-[1.15rem] w-[1.15rem]" />
				</a>
			</div>

			<div class="hidden border-l border-ink/10 pl-2 md:block">
				<LanguageSwitcher {lang} label={t.nav.language} />
			</div>

			<button
				type="button"
				onclick={openPlayer}
				class="ml-1 inline-flex h-10 items-center gap-2 border border-or/70 px-3 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-marine transition-colors hover:bg-or/10"
			>
				<Music2 class="h-4 w-4" />
				<span class="hidden 2xl:inline">{t.nav.listen}</span>
				<span class="sr-only 2xl:hidden">{t.nav.listen}</span>
			</button>

			<a
				href={resolve('/auth/login')}
				class="hidden h-10 items-center gap-2 px-3 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ink/60 transition-colors hover:text-marine 2xl:inline-flex"
			>
				<LogIn class="h-4 w-4" />
				{t.nav.login}
			</a>

			<button
				type="button"
				bind:this={menuButton}
				onclick={() => (mobileOpen = !mobileOpen)}
				aria-expanded={mobileOpen}
				aria-controls="menu-mobile"
				aria-label={mobileOpen ? t.nav.closeMenu : t.nav.menu}
				class="ml-1 flex h-10 w-10 items-center justify-center border border-ink/15 text-marine transition-colors hover:border-marine xl:hidden"
			>
				{#if mobileOpen}
					<X class="h-5 w-5" />
				{:else}
					<Menu class="h-5 w-5" />
				{/if}
			</button>
		</div>
	</div>

	{#if mobileOpen}
		<div id="menu-mobile" class="border-t border-ink/10 bg-ivoire xl:hidden">
			<nav class="container-page py-3" aria-label={t.nav.main}>
				<ul>
					{#each navItems as item (item.href)}
						<li>
							<a
								href={item.href}
								aria-current={item.active ? 'page' : undefined}
								class={[
									'flex items-center justify-between border-b border-ink/10 py-3.5 text-base',
									item.active ? 'font-semibold text-marine' : 'text-ink/75'
								].join(' ')}
							>
								{item.label}
								<ChevronRight class="h-4 w-4 text-or-dark" />
							</a>
						</li>
					{/each}
				</ul>

				<div class="border-t border-ink/10 pt-5">
					<a
						href={resolve('/auth/login')}
						class="inline-flex items-center gap-2 text-sm text-ink/70"
					>
						<LogIn class="h-4 w-4" />
						{t.nav.login}
					</a>
				</div>
			</nav>
		</div>
	{/if}
</header>
