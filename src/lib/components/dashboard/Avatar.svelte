<script lang="ts">
	import type { MemberProfile } from '$lib/member/types';

	interface Props {
		profile: MemberProfile;
		size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
		decorative?: boolean;
	}

	let { profile, size = 'md', decorative = false }: Props = $props();

	const PALETTES = [
		{ bg: '#E7DCC7', coat: '#173B63', accent: '#C6A45B', skin: '#E8BE9A', hair: '#3B2B24' },
		{ bg: '#DCE4EC', coat: '#2E5A7D', accent: '#C6A45B', skin: '#D9A87F', hair: '#241C18' },
		{ bg: '#EFE1D6', coat: '#7B4B3A', accent: '#DCC48F', skin: '#F0C9A6', hair: '#5A3B2A' },
		{ bg: '#E3E8D8', coat: '#3F6B4F', accent: '#C6A45B', skin: '#C98F66', hair: '#1F1A16' },
		{ bg: '#E9E1D2', coat: '#8A6A2F', accent: '#F5F1E8', skin: '#E3B48C', hair: '#6B4A33' },
		{ bg: '#DDE5E9', coat: '#4A4F7A', accent: '#C6A45B', skin: '#AF7550', hair: '#171310' },
		{ bg: '#F1E4E0', coat: '#8C3B3B', accent: '#DCC48F', skin: '#F2CFB0', hair: '#7A4A2E' },
		{ bg: '#E6E2D6', coat: '#365B63', accent: '#C6A45B', skin: '#D8A47C', hair: '#2D211A' },
		{ bg: '#E2E6EA', coat: '#1F3A5F', accent: '#DCC48F', skin: '#C68B63', hair: '#120F0D' },
		{ bg: '#EDE3D2', coat: '#5B4B7A', accent: '#C6A45B', skin: '#EBC4A0', hair: '#4A3325' },
		{ bg: '#E5E9E1', coat: '#3E5E3A', accent: '#DCC48F', skin: '#B57F59', hair: '#1C1713' },
		{ bg: '#E9DEDC', coat: '#7A3F5B', accent: '#C6A45B', skin: '#F0C8A2', hair: '#633F26' }
	] as const;

	const palette = $derived(PALETTES[(profile.avatar - 1) % PALETTES.length]);
	const hairStyle = $derived((profile.avatar - 1) % 5);
	const gradientId = $derived(`avatar-bg-${profile.id}`);
	const initials = $derived(
		`${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase()
	);

	const sizeClass = $derived(
		size === 'xs'
			? 'h-8 w-8'
			: size === 'sm'
				? 'h-10 w-10'
				: size === 'md'
					? 'h-12 w-12'
					: size === 'lg'
						? 'h-20 w-20'
						: 'h-28 w-28'
	);
	const label = $derived(`Portrait illustré de ${profile.firstName} ${profile.lastName}`);
</script>

<span class="inline-flex shrink-0 overflow-hidden rounded-full ring-1 ring-marine/10 {sizeClass}">
	<svg
		viewBox="0 0 96 96"
		class="h-full w-full"
		role={decorative ? undefined : 'img'}
		aria-label={decorative ? undefined : label}
		aria-hidden={decorative ? 'true' : undefined}
		focusable="false"
	>
		<defs>
			<linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
				<stop offset="0%" stop-color={palette.bg} />
				<stop offset="100%" stop-color={palette.accent} stop-opacity="0.35" />
			</linearGradient>
		</defs>
		<rect width="96" height="96" fill="url(#{gradientId})" />
		<circle cx="48" cy="40" r="26" fill={palette.accent} opacity="0.16" />
		<!-- épaules -->
		<path d="M12 96c0-17 16-28 36-28s36 11 36 28z" fill={palette.coat} />
		<path d="M40 66h16l-8 12z" fill={palette.accent} opacity="0.9" />
		<!-- cou et visage -->
		<rect x="42" y="52" width="12" height="14" rx="5" fill={palette.skin} />
		<ellipse cx="48" cy="40" rx="17" ry="19" fill={palette.skin} />
		<!-- cheveux -->
		{#if hairStyle === 0}
			<path d="M31 38c0-12 7-19 17-19s17 7 17 19c-4-6-9-8-17-8s-13 2-17 8z" fill={palette.hair} />
		{:else if hairStyle === 1}
			<path
				d="M30 42c-1-14 7-24 18-24s19 10 18 24c-3-4-5-9-6-13-5 4-17 5-24 2-2 4-4 8-6 11z"
				fill={palette.hair}
			/>
		{:else if hairStyle === 2}
			<path
				d="M31 40c0-12 7-20 17-20s17 8 17 20c-2 4-4 5-5 1-2-6-6-8-12-8s-10 2-12 8c-1 4-3 3-5-1z"
				fill={palette.hair}
			/>
			<circle cx="34" cy="34" r="5" fill={palette.hair} />
			<circle cx="62" cy="34" r="5" fill={palette.hair} />
		{:else if hairStyle === 3}
			<path
				d="M30 44V36c0-11 8-18 18-18s18 7 18 18v8c-3-2-4-7-5-12-6 3-14 4-20 2-3 1-6 3-7 8-1 4-2 4-4 2z"
				fill={palette.hair}
			/>
		{:else}
			<path
				d="M32 38c1-11 8-17 16-17 9 0 16 6 16 17 0 5-1 8-2 10-2-5-4-8-6-10-5 3-13 3-18 0-2 3-3 6-4 10-1-2-2-5-2-10z"
				fill={palette.hair}
			/>
		{/if}
		<!-- traits du visage -->
		<circle cx="42" cy="41" r="1.6" fill={palette.hair} />
		<circle cx="54" cy="41" r="1.6" fill={palette.hair} />
		<path
			d="M44 48c2 1.6 6 1.6 8 0"
			stroke={palette.hair}
			stroke-width="1.6"
			stroke-linecap="round"
			fill="none"
		/>
		<!-- hermine discrète sur l’épaule -->
		<circle cx="72" cy="84" r="2.2" fill={palette.accent} />
		<circle cx="76" cy="88" r="1.4" fill={palette.accent} />
		<text
			x="48"
			y="90"
			text-anchor="middle"
			font-size="8"
			font-family="Inter, system-ui, sans-serif"
			font-weight="700"
			fill="#F5F1E8"
			opacity="0.9">{initials}</text
		>
	</svg>
</span>
