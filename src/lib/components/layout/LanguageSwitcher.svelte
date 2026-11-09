<script lang="ts">
	import { page } from '$app/state';
	import type { ResolvedPathname } from '$app/types';
	import { LANGUAGES, type Lang } from '$lib/i18n';

	let { lang, label, dark = false }: { lang: Lang; label: string; dark?: boolean } = $props();

	const codes: Lang[] = ['fr', 'en', 'br'];

	/**
	 * Conserve la page courante et remplace le segment de langue.
	 * Le résultat est un chemin interne déjà résolu : on l'annote
	 * `ResolvedPathname` pour la règle `svelte/no-navigation-without-resolve`.
	 */
	function hrefFor(code: Lang): ResolvedPathname {
		const { pathname, search } = page.url;
		const prefix = `/${lang}`;
		const isCurrent = pathname === prefix || pathname.startsWith(`${prefix}/`);
		const rest = isCurrent ? pathname.slice(prefix.length) : '';

		return `/${code}${rest}${search}` as ResolvedPathname;
	}
</script>

<nav aria-label={label}>
	<ul class="flex items-center gap-0.5">
		{#each codes as code (code)}
			<li>
				<a
					href={hrefFor(code)}
					hreflang={code}
					lang={code}
					aria-label={LANGUAGES[code]}
					aria-current={code === lang ? 'true' : undefined}
					class={[
						'block px-2 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] transition-colors',
						code === lang
							? dark
								? 'text-white'
								: 'text-marine'
							: dark
								? 'text-ivoire/55 hover:text-white'
								: 'text-ink/45 hover:text-marine'
					].join(' ')}
				>
					{code}
				</a>
			</li>
		{/each}
	</ul>
</nav>
