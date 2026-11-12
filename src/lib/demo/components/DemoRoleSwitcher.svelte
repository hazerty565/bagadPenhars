<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { Search, X } from '@lucide/svelte';
	import Avatar from '$lib/components/dashboard/Avatar.svelte';
	import RoleBadge from '$lib/components/dashboard/RoleBadge.svelte';
	import { demo } from '$lib/demo/store.svelte';
	import { session } from '$lib/demo/session.svelte';
	import { actorOf, canSeeAdminSection, canSeePupitreSection } from '$lib/demo/permissions';
	import { ROLE_LABELS } from '$lib/demo/labels';
	import { pupitreName } from '$lib/demo/fixtures/pupitres';
	import type { AppRole } from '$lib/auth/roles';

	interface Props {
		open?: boolean;
	}

	let { open = $bindable(false) }: Props = $props();

	let search = $state('');
	let roleFilter = $state<AppRole | 'all'>('all');
	let panel = $state<HTMLDivElement | null>(null);

	const roles: AppRole[] = ['member', 'chef_pupitre', 'secretaire', 'admin'];

	const filtered = $derived(
		demo.profiles.filter((profile) => {
			if (roleFilter !== 'all' && profile.role !== roleFilter) return false;
			const needle = search.trim().toLowerCase();
			if (!needle) return true;
			return `${profile.firstName} ${profile.lastName} ${profile.email}`
				.toLowerCase()
				.includes(needle);
		})
	);

	function pupitresLabel(profileId: string): string {
		const profile = demo.profiles.find((item) => item.id === profileId);
		if (!profile || profile.pupitres.length === 0) return 'Aucun pupitre';
		return profile.pupitres
			.map((pupitre) => `${pupitreName(pupitre.pupitreId)}${pupitre.isChef ? ' (chef)' : ''}`)
			.join(', ');
	}

	function quickProfile(role: AppRole) {
		return demo.profiles.find((profile) => profile.role === role) ?? demo.profiles[0];
	}

	function select(profileId: string) {
		session.switchTo(profileId);
		open = false;
		const actor = actorOf(demo.activeProfile);
		if (page.url.pathname.startsWith('/dashboard/admin') && !canSeeAdminSection(actor)) {
			goto(resolve('/dashboard'));
		} else if (page.url.pathname.startsWith('/dashboard/pupitre') && !canSeePupitreSection(actor)) {
			goto(resolve('/dashboard'));
		}
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) open = false;
	}

	$effect(() => {
		if (open) {
			queueMicrotask(() => panel?.querySelector<HTMLElement>('button, input, a')?.focus());
		}
	});
</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
	<div
		class="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-marine-900/50 p-4 py-10"
	>
		<div
			bind:this={panel}
			class="w-full max-w-3xl border border-or/40 bg-ivoire shadow-2xl"
			role="dialog"
			aria-modal="true"
			aria-labelledby="switcher-title"
		>
			<div
				class="flex items-start justify-between gap-4 border-b border-marine/15 bg-white px-5 py-4"
			>
				<div>
					<p class="eyebrow">Démonstration</p>
					<h2 id="switcher-title" class="font-serif text-2xl text-marine">Changer de profil</h2>
					<p class="mt-1 text-xs text-ardoise">
						Le changement est immédiat et ne s’applique qu’à cette démonstration locale.
					</p>
				</div>
				<button
					type="button"
					class="p-2 text-marine hover:bg-marine/5"
					aria-label="Fermer le sélecteur de profil"
					onclick={() => (open = false)}
				>
					<X size={20} />
				</button>
			</div>

			<div class="border-b border-marine/10 bg-white/60 px-5 py-4">
				<div class="flex flex-wrap gap-2" role="group" aria-label="Profils rapides par rôle">
					{#each roles as role (role)}
						{@const profile = quickProfile(role)}
						<button
							type="button"
							class="flex items-center gap-2 border border-marine/20 bg-white px-3 py-2 text-left text-xs font-semibold text-marine transition-colors hover:border-marine hover:bg-marine/5"
							onclick={() => select(profile.id)}
						>
							<Avatar {profile} size="xs" decorative />
							<span>
								<span class="block">{ROLE_LABELS[role]}</span>
								<span class="block font-normal text-ardoise"
									>{profile.firstName} {profile.lastName}</span
								>
							</span>
						</button>
					{/each}
				</div>

				<div class="mt-4 flex flex-col gap-2 sm:flex-row">
					<label class="relative flex-1">
						<span class="sr-only">Rechercher un profil</span>
						<Search
							size={16}
							class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ardoise"
						/>
						<input
							type="search"
							bind:value={search}
							placeholder="Rechercher un nom ou une adresse…"
							class="w-full border border-marine/20 bg-white py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ardoise/70"
						/>
					</label>
					<label>
						<span class="sr-only">Filtrer par rôle</span>
						<select
							bind:value={roleFilter}
							class="w-full border border-marine/20 bg-white px-3 py-2 text-sm text-ink sm:w-48"
						>
							<option value="all">Tous les rôles</option>
							{#each roles as role (role)}
								<option value={role}>{ROLE_LABELS[role]}</option>
							{/each}
						</select>
					</label>
				</div>
			</div>

			<ul class="max-h-[55vh] divide-y divide-marine/10 overflow-y-auto bg-white">
				{#each filtered as profile (profile.id)}
					{@const active = profile.id === demo.activeProfileId}
					<li>
						<button
							type="button"
							class="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-ivoire {active
								? 'bg-ivoire'
								: ''}"
							aria-pressed={active}
							onclick={() => select(profile.id)}
						>
							<Avatar {profile} size="sm" decorative />
							<span class="min-w-0 flex-1">
								<span class="flex flex-wrap items-center gap-2">
									<span class="font-semibold text-marine"
										>{profile.firstName} {profile.lastName}</span
									>
									<RoleBadge role={profile.role} />
									{#if active}
										<span class="text-[0.65rem] font-semibold uppercase tracking-wider text-or-dark"
											>Profil actif</span
										>
									{/if}
								</span>
								<span class="mt-0.5 block truncate text-xs text-ardoise">
									{pupitresLabel(profile.id)} · {profile.email}
								</span>
							</span>
						</button>
					</li>
				{:else}
					<li class="px-5 py-8 text-center text-sm text-ardoise">
						Aucun profil ne correspond à la recherche.
					</li>
				{/each}
			</ul>

			<div class="border-t border-marine/15 bg-ivoire px-5 py-3 text-xs text-ardoise">
				{demo.profiles.length} profils fictifs. Aucune donnée réelle, aucun appel réseau, aucun cookie
				de session.
			</div>
		</div>
	</div>
{/if}
