<script lang="ts">
	let { name, className = 'h-4 w-4' }: { name: 'facebook' | 'instagram'; className?: string } =
		$props();
</script>

{#if name === 'facebook'}
	<svg class={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
		<path
			d="M13.5 22v-8h2.7l.4-3.1h-3.1V8.9c0-.9.3-1.5 1.6-1.5h1.7V4.6c-.3 0-1.3-.1-2.4-.1-2.4 0-4.1 1.5-4.1 4.2v2.2H7.5V14h2.8v8h3.2Z"
		/>
	</svg>
{:else}
	<svg
		class={className}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="1.8"
		stroke-linecap="round"
		stroke-linejoin="round"
		aria-hidden="true"
	>
		<rect x="3" y="3" width="18" height="18" rx="5" />
		<circle cx="12" cy="12" r="4" />
		<circle cx="17.3" cy="6.7" r="0.8" fill="currentColor" stroke="none" />
	</svg>
{/if}
