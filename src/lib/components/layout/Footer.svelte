<script lang="ts">
	import { resolve } from '$app/paths';
	import { ArrowRight } from '@lucide/svelte';
	import SocialIcon from '$lib/components/ui/SocialIcon.svelte';
	import { PUBLIC_NAV } from '$lib/data/nav';
	import { copyrightYears, site } from '$lib/data/site';
	import type { Dictionary, Lang } from '$lib/i18n';

	let { lang, t }: { lang: Lang; t: Dictionary } = $props();

	const copyright = copyrightYears();
	const legalHref = $derived(resolve('/(public)/[lang=lang]/informations-legales', { lang }));
</script>

<footer class="bg-marine text-ivoire">
	<div class="h-px w-full bg-or/40"></div>

	<div
		class="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr] lg:gap-12"
	>
		<div>
			<a href={resolve('/(public)/[lang=lang]', { lang })} class="flex items-center gap-3">
				<span class="flex h-14 w-14 items-center justify-center rounded-full bg-ivoire">
					<img src="/logo-penhars.svg" alt="" width="44" height="44" class="h-11 w-11" />
				</span>
				<span class="leading-none">
					<span class="block font-serif text-xl font-semibold">Bagad Penhars</span>
					<span class="mt-1.5 block text-[0.6rem] uppercase tracking-[0.2em] text-ivoire/55">
						{t.header.tagline}
					</span>
				</span>
			</a>

			<p class="mt-5 max-w-xs text-sm leading-relaxed text-ivoire/65">{t.footer.tagline}</p>

			<div class="mt-6 flex items-center gap-2">
				<a
					href={site.social.facebook}
					target="_blank"
					rel="external noopener noreferrer"
					aria-label="Facebook"
					title="Facebook"
					class="flex h-9 w-9 items-center justify-center border border-ivoire/25 transition-colors hover:border-or"
				>
					<SocialIcon name="facebook" className="h-[1.15rem] w-[1.15rem]" />
				</a>
				<a
					href={site.social.instagram}
					target="_blank"
					rel="external noopener noreferrer"
					aria-label="Instagram"
					title="Instagram"
					class="flex h-9 w-9 items-center justify-center border border-ivoire/25 transition-colors hover:border-or"
				>
					<SocialIcon name="instagram" className="h-[1.15rem] w-[1.15rem]" />
				</a>
			</div>
		</div>

		<div>
			<h2 class="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-or-light">
				{t.footer.navTitle}
			</h2>
			<ul class="mt-4 space-y-2.5">
				{#each PUBLIC_NAV as item (item.key)}
					<li>
						<a
							href={resolve(item.route, { lang })}
							class="text-sm text-ivoire/65 transition-colors hover:text-white"
						>
							{t.nav[item.key]}
						</a>
					</li>
				{/each}
			</ul>
		</div>

		<div>
			<h2 class="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-or-light">
				{t.footer.contactTitle}
			</h2>
			<address class="mt-4 space-y-1 text-sm not-italic text-ivoire/65">
				<span class="block">{site.address.street}</span>
				<span class="block">{site.address.postalCode} {site.address.city}</span>
				<a
					href={`mailto:${site.email}`}
					class="mt-3 inline-block break-all transition-colors hover:text-white"
				>
					{site.email}
				</a>
			</address>
		</div>

		<div>
			<h2 class="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-or-light">
				{t.footer.membersTitle}
			</h2>
			<p class="mt-4 text-sm leading-relaxed text-ivoire/65">{t.footer.membersText}</p>
			<a
				href={resolve('/auth/login')}
				class="mt-5 inline-flex items-center gap-2 border border-or/60 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-ivoire transition-colors hover:bg-or/10"
			>
				{t.footer.membersCta}
				<ArrowRight class="h-4 w-4" />
			</a>
		</div>
	</div>

	<div class="border-t border-ivoire/15">
		<div
			class="container-page flex flex-col gap-2 py-5 text-xs text-ivoire/50 sm:flex-row sm:items-center sm:gap-6"
		>
			<p class="sm:flex-1">Copyright © {copyright} Bagad Penhars. {t.footer.rights}</p>
			<a
				href={legalHref}
				class="font-semibold text-ivoire/70 underline decoration-or/40 underline-offset-4 transition-colors hover:text-ivoire hover:decoration-or sm:order-2 sm:flex-1 sm:text-center"
			>
				{t.footer.legal}
			</a>
			<p class="sm:order-3 sm:flex-1 sm:text-right">{t.footer.madeIn}</p>
		</div>
	</div>
</footer>
