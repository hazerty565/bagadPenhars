<script lang="ts">
	import type { AppRole } from '$lib/auth/roles';
	import { ROLE_LABELS } from '$lib/member/labels';

	interface Props {
		role: AppRole;
		size?: 'sm' | 'md';
	}

	let { role, size = 'sm' }: Props = $props();

	const tone = $derived(
		role === 'admin'
			? 'border-or/60 bg-or/15 text-or-dark'
			: role === 'secretaire'
				? 'border-marine/30 bg-marine/10 text-marine'
				: role === 'chef_pupitre'
					? 'border-marine/20 bg-white text-marine'
					: 'border-ardoise/25 bg-white text-ardoise'
	);
</script>

<span
	class="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-semibold uppercase tracking-[0.12em] {tone} {size ===
	'sm'
		? 'text-[0.62rem]'
		: 'text-xs'}"
>
	{ROLE_LABELS[role]}
</span>
