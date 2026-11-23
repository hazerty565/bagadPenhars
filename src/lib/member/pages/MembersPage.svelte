<script lang="ts">
	import { Search, X } from '@lucide/svelte';
	import PageHeader from '$lib/components/dashboard/PageHeader.svelte';
	import EmptyState from '$lib/components/dashboard/EmptyState.svelte';
	import AccessDenied from '$lib/components/dashboard/AccessDenied.svelte';
	import MemberCard from '$lib/components/dashboard/MemberCard.svelte';
	import Avatar from '$lib/components/dashboard/Avatar.svelte';
	import Badge from '$lib/components/dashboard/Badge.svelte';
	import { inputClass, labelClass } from '$lib/components/dashboard/form';
	import { member } from '$lib/member/store.svelte';
	import { actorOf, canSeePupitreSection, scopedPupitreIds } from '$lib/member/permissions';
	import { visibleProfiles } from '$lib/member/services/members';
	import { LEVEL_LABELS } from '$lib/member/labels';
	import { MEMBER_PUPITRES, pupitreName } from '$lib/member/pupitres';
	import type { MemberLevel, MemberPupitreId } from '$lib/member/types';

	interface Props {
		/** Limite l’affichage aux pupitres dirigés (espace pupitre du chef). */
		pupitreScope?: MemberPupitreId[];
		/** Mode espace pupitre : le périmètre est calculé depuis le rôle actif. */
		pupitreMode?: boolean;
		title?: string;
		description?: string;
	}

	let {
		pupitreScope = [],
		pupitreMode = false,
		title = 'Trombinoscope',
		description = 'Les membres actifs du bagad. Seuls le nom, le prénom, le portrait, les pupitres, le niveau musical et la fonction au bureau sont affichés.'
	}: Props = $props();

	let search = $state('');
	let pupitreFilter = $state<MemberPupitreId | 'all'>('all');
	let levelFilter = $state<MemberLevel | 'all'>('all');
	let selectedId = $state<string | null>(null);

	const actor = $derived(actorOf(member.activeProfile));
	const denied = $derived(pupitreMode && !canSeePupitreSection(actor));
	const scope = $derived(pupitreMode ? scopedPupitreIds(actor) : pupitreScope);
	const scoped = $derived(scope.length > 0);
	const availablePupitres = $derived(
		scoped ? MEMBER_PUPITRES.filter((pupitre) => scope.includes(pupitre.id)) : MEMBER_PUPITRES
	);

	/** Recherche insensible aux accents et aux apostrophes typographiques. */
	function normalize(value: string): string {
		return value
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.replace(/[’‘`´']/g, '')
			.toLowerCase();
	}

	const members = $derived(
		visibleProfiles().filter((profile) => {
			if (scoped && !profile.pupitres.some((pupitre) => scope.includes(pupitre.pupitreId))) {
				return false;
			}
			if (
				pupitreFilter !== 'all' &&
				!profile.pupitres.some((pupitre) => pupitre.pupitreId === pupitreFilter)
			) {
				return false;
			}
			if (levelFilter !== 'all' && profile.level !== levelFilter) return false;
			const needle = normalize(search.trim());
			if (!needle) return true;
			return normalize(`${profile.firstName} ${profile.lastName}`).includes(needle);
		})
	);

	const selected = $derived(member.profiles.find((profile) => profile.id === selectedId) ?? null);

	function close() {
		selectedId = null;
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') close();
	}
</script>

<svelte:window onkeydown={onKeydown} />

{#if denied}
	<div class="mt-6">
		<AccessDenied
			{actor}
			required="l’espace pupitre"
			message="L’espace pupitre est réservé aux chefs de pupitre, à la secrétaire et à l’administrateur."
		/>
	</div>
{:else}
	<PageHeader eyebrow={scoped ? 'Espace pupitre' : 'Mon espace'} {title} {description} />

	<section class="mt-6 border border-marine/10 bg-white p-4" aria-label="Filtres du trombinoscope">
		<div class="grid gap-3 sm:grid-cols-3">
			<label class="sm:col-span-1">
				<span class={labelClass}>Rechercher</span>
				<span class="relative mt-1 block">
					<Search
						size={15}
						class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ardoise"
					/>
					<input
						type="search"
						bind:value={search}
						placeholder="Nom ou prénom…"
						class="{inputClass} pl-9"
					/>
				</span>
			</label>
			<label>
				<span class={labelClass}>Pupitre</span>
				<select bind:value={pupitreFilter} class="{inputClass} mt-1">
					<option value="all">Tous les pupitres</option>
					{#each availablePupitres as pupitre (pupitre.id)}
						<option value={pupitre.id}>{pupitre.name}</option>
					{/each}
				</select>
			</label>
			<label>
				<span class={labelClass}>Niveau</span>
				<select bind:value={levelFilter} class="{inputClass} mt-1">
					<option value="all">Tous les niveaux</option>
					{#each Object.entries(LEVEL_LABELS) as [value, label] (value)}
						<option {value}>{label}</option>
					{/each}
				</select>
			</label>
		</div>
		<p class="mt-3 text-xs text-ardoise">
			{members.length} membre{members.length > 1 ? 's' : ''} affiché{members.length > 1 ? 's' : ''}.
		</p>
	</section>

	{#if members.length}
		<div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
			{#each members as profile (profile.id)}
				<MemberCard {profile} onselect={(id) => (selectedId = id)} />
			{/each}
		</div>
	{:else}
		<div class="mt-4">
			<EmptyState
				title="Aucun membre trouvé"
				description="Essayez un autre nom, un autre pupitre ou un autre niveau."
			/>
		</div>
	{/if}

	{#if selected}
		<div
			class="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-marine-900/50 p-4 py-10"
		>
			<button type="button" class="absolute inset-0" aria-label="Fermer la fiche" onclick={close}
			></button>
			<div
				class="relative w-full max-w-lg border border-or/40 bg-white shadow-2xl"
				role="dialog"
				aria-modal="true"
				aria-labelledby="fiche-membre"
			>
				<div
					class="flex items-start justify-between gap-3 border-b border-marine/10 bg-ivoire px-5 py-4"
				>
					<h2 id="fiche-membre" class="font-serif text-2xl text-marine">Fiche membre</h2>
					<button
						type="button"
						class="p-2 text-marine hover:bg-white"
						aria-label="Fermer la fiche"
						onclick={close}
					>
						<X size={20} />
					</button>
				</div>
				<div class="p-6">
					<div class="flex items-center gap-4">
						<Avatar profile={selected} size="xl" />
						<div>
							<p class="font-serif text-2xl leading-tight text-marine">
								{selected.firstName}
								{selected.lastName}
							</p>
							<p class="mt-1 flex flex-wrap gap-2">
								<Badge tone="muted">{LEVEL_LABELS[selected.level]}</Badge>
							</p>
						</div>
					</div>

					<dl class="mt-6 space-y-4 text-sm">
						<div>
							<dt class="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ardoise">
								Pupitres
							</dt>
							<dd class="mt-1 flex flex-wrap gap-1.5">
								<!-- Contrat §12.3 : `isChef` n'apparaît jamais dans le trombinoscope. -->
								{#each selected.pupitres as pupitre (pupitre.pupitreId)}
									<Badge tone="marine">{pupitreName(pupitre.pupitreId)}</Badge>
								{:else}
									<span class="text-ardoise">Aucun pupitre</span>
								{/each}
							</dd>
						</div>
						{#if selected.bureauPosition}
							<div>
								<dt class="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ardoise">
									Fonction au bureau
								</dt>
								<dd class="mt-1 text-ink">
									{selected.bureauPosition}
									<span class="text-xs text-ardoise">(information sans droit supplémentaire)</span>
								</dd>
							</div>
						{/if}
					</dl>

					<p
						class="mt-6 border border-marine/10 bg-ivoire/70 px-3 py-2 text-xs leading-relaxed text-ardoise"
					>
						Aucune coordonnée privée n’est affichée : ni e-mail, ni téléphone, ni adresse postale.
					</p>
				</div>
			</div>
		</div>
	{/if}
{/if}
