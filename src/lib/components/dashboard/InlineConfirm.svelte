<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		label: string;
		confirmLabel?: string;
		cancelLabel?: string;
		message?: string;
		tone?: 'danger' | 'neutral';
		disabled?: boolean;
		onconfirm: () => void;
		children?: Snippet;
	}

	let {
		label,
		confirmLabel = 'Confirmer',
		cancelLabel = 'Annuler',
		message = 'Cette action est définitive dans la démonstration.',
		tone = 'danger',
		disabled = false,
		onconfirm,
		children
	}: Props = $props();

	let open = $state(false);
</script>

<span class="inline-flex flex-wrap items-center gap-2">
	{#if open}
		<span class="text-xs text-ardoise">{message}</span>
		<button
			type="button"
			class="inline-flex items-center gap-1 border px-3 py-1.5 text-xs font-semibold {tone ===
			'danger'
				? 'border-danger bg-danger text-white hover:bg-danger/90'
				: 'border-marine bg-marine text-white hover:bg-marine-700'}"
			onclick={() => {
				open = false;
				onconfirm();
			}}
		>
			{confirmLabel}
		</button>
		<button
			type="button"
			class="border border-marine/25 px-3 py-1.5 text-xs font-semibold text-marine hover:bg-marine/5"
			onclick={() => (open = false)}
		>
			{cancelLabel}
		</button>
	{:else}
		<button
			type="button"
			class="inline-flex items-center gap-1.5 px-1 py-1 text-xs font-semibold underline decoration-marine/30 underline-offset-4 {tone ===
			'danger'
				? 'text-danger hover:decoration-danger'
				: 'text-marine hover:decoration-marine'}"
			{disabled}
			onclick={() => (open = true)}
		>
			{@render children?.()}
			{label}
		</button>
	{/if}
</span>
