<script lang="ts">
	import { ChevronRight } from '@lucide/svelte';
	import Avatar from './Avatar.svelte';
	import Badge from './Badge.svelte';
	import type { MemberProfile } from '$lib/member/types';
	import { LEVEL_LABELS } from '$lib/member/labels';
	import { pupitreName } from '$lib/member/pupitres';

	interface Props {
		profile: MemberProfile;
		onselect?: (profileId: string) => void;
	}

	let { profile, onselect }: Props = $props();

	// Aria-label complet incluant toutes les informations visibles de la carte
	const memberAriaLabel = $derived(
		`Voir la fiche de ${profile.firstName} ${profile.lastName}, ${LEVEL_LABELS[profile.level]}${profile.pupitres.length > 0 ? ', pupitres : ' + profile.pupitres.map(p => pupitreName(p.pupitreId) + (p.isChef ? ' (chef)' : '')).join(', ') : ''}${profile.bureauPosition ? ', ' + profile.bureauPosition : ''}`
	);
</script>

{#if onselect}
	<button
		type="button"
		class="group flex w-full flex-col items-center border border-marine/10 bg-white px-4 py-5 transition-colors hover:border-marine/30 hover:bg-ivoire/60"
		onclick={() => onselect(profile.id)}
		aria-label={memberAriaLabel}
	>
		<Avatar {profile} size="lg" decorative />
		<span class="mt-3 block font-serif text-lg leading-tight text-marine">
			{profile.firstName}
			{profile.lastName}
		</span>
		<span class="mt-1 block text-[0.68rem] uppercase tracking-[0.16em] text-ardoise">
			{LEVEL_LABELS[profile.level]}
		</span>
		<span class="mt-3 flex flex-wrap justify-center gap-1.5">
			{#each profile.pupitres as pupitre (pupitre.pupitreId)}
				<Badge tone="muted">{pupitreName(pupitre.pupitreId)}{pupitre.isChef ? ' · chef' : ''}</Badge
				>
			{/each}
		</span>
		{#if profile.bureauPosition}
			<span class="mt-2 text-[0.7rem] text-or-dark">{profile.bureauPosition}</span>
		{/if}
		<span
			class="mt-3 inline-flex items-center gap-1 text-[0.68rem] font-semibold text-marine opacity-0 transition-opacity group-hover:opacity-100"
		>
			Voir la fiche
			<ChevronRight size={13} />
		</span>
	</button>
{:else}
	<div class="flex flex-col items-center border border-marine/10 bg-white px-4 py-5">
		<Avatar {profile} size="lg" decorative />
		<span class="mt-3 block text-center">
			<span class="block font-serif text-lg leading-tight text-marine">
				{profile.firstName}
				{profile.lastName}
			</span>
			<span class="mt-1 block text-[0.68rem] uppercase tracking-[0.16em] text-ardoise">
				{LEVEL_LABELS[profile.level]}
			</span>
		</span>
	</div>
{/if}
