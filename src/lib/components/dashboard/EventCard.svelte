<script lang="ts">
	import type { Snippet } from 'svelte';
	import { resolve } from '$app/paths';
	import { MapPin } from '@lucide/svelte';
	import Badge from './Badge.svelte';
	import type { MemberEvent, MemberResponseStatus } from '$lib/member/types';
	import { EVENT_TYPE_LABELS, VISIBILITY_LABELS } from '$lib/member/labels';
	import { isPast } from '$lib/member/clock';
	import { pupitreName } from '$lib/member/pupitres';

	interface Props {
		event: MemberEvent;
		response?: MemberResponseStatus | null;
		present?: number;
		absent?: number;
		actions?: Snippet;
		showPresence?: boolean;
	}

	let {
		event,
		response = null,
		present = 0,
		absent = 0,
		actions,
		showPresence = true
	}: Props = $props();

	const MONTHS_SHORT = [
		'janv.',
		'févr.',
		'mars',
		'avr.',
		'mai',
		'juin',
		'juil.',
		'août',
		'sept.',
		'oct.',
		'nov.',
		'déc.'
	];

	const parts = $derived(event.date.split('-'));
	const dayLabel = $derived(parts[2] ?? '');
	const monthLabel = $derived(MONTHS_SHORT[Number(parts[1]) - 1] ?? '');
	const yearLabel = $derived(parts[0] ?? '');
</script>

<article
	class="flex flex-col gap-4 border border-marine/10 bg-white p-4 sm:flex-row sm:items-start sm:p-5 {event.status ===
	'cancelled'
		? 'opacity-75'
		: ''}"
>
	<div
		class="flex w-16 shrink-0 flex-col items-center justify-center border border-marine/15 bg-ivoire py-2 text-center"
	>
		<span class="font-serif text-2xl leading-none text-marine">{dayLabel}</span>
		<span class="mt-1 text-[0.62rem] font-semibold uppercase tracking-wider text-ardoise"
			>{monthLabel}</span
		>
		<span class="text-[0.6rem] text-ardoise/70">{yearLabel}</span>
	</div>

	<div class="min-w-0 flex-1">
		<div class="flex flex-wrap items-center gap-1.5">
			<Badge tone="marine">{EVENT_TYPE_LABELS[event.type]}</Badge>
			<Badge tone={event.visibility === 'public' ? 'gold' : 'muted'}
				>{VISIBILITY_LABELS[event.visibility]}</Badge
			>
			{#if event.isPoll}
				<Badge tone="success">Sondage</Badge>
			{/if}
			{#if event.status === 'cancelled'}
				<Badge tone="danger">Annulé</Badge>
			{:else if isPast(event.date)}
				<Badge tone="muted">Passé</Badge>
			{/if}
		</div>

		<h3 class="mt-2 font-serif text-xl leading-tight text-marine">
			<a
				href={resolve('/dashboard/agenda/[id]', { id: event.id })}
				class="hover:underline hover:decoration-or hover:underline-offset-4"
			>
				{event.title}
			</a>
		</h3>

		<p class="mt-1 flex items-center gap-1 text-xs text-ardoise">
			<MapPin size={13} />
			{event.location}
		</p>

		{#if event.pupitreIds.length}
			<p class="mt-2 text-xs text-ardoise">
				Pupitres : {event.pupitreIds.map((id) => pupitreName(id)).join(', ')}
			</p>
		{/if}

		<div class="mt-3 flex flex-wrap items-center gap-3">
			{#if showPresence}
				<span class="text-xs text-ardoise">
					<span class="font-semibold text-marine">{present}</span> présent{present > 1 ? 's' : ''} ·
					<span class="font-semibold text-marine">{absent}</span> absent{absent > 1 ? 's' : ''}
				</span>
			{/if}
			{#if event.status === 'active' && !isPast(event.date)}
				{#if response === 'present'}
					<Badge tone="success">Vous êtes présent</Badge>
				{:else if response === 'absent'}
					<Badge tone="danger">Vous êtes absent</Badge>
				{:else}
					<span class="text-xs italic text-ardoise">Sans réponse</span>
				{/if}
			{/if}
		</div>

		{#if actions}
			<div class="mt-4 flex flex-wrap items-center gap-3 border-t border-marine/10 pt-3">
				{@render actions()}
			</div>
		{/if}
	</div>
</article>
