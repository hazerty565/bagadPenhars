<script lang="ts">
	let { className = '' }: { className?: string } = $props();
</script>

<svg class={className} viewBox="0 0 128 16" fill="none" aria-hidden="true">
	<path d="M2 8h42" stroke="currentColor" stroke-width="1" stroke-linecap="round" />
	<path d="M84 8h42" stroke="currentColor" stroke-width="1" stroke-linecap="round" />
	<path
		d="M60 1.8c3.4 0 6.2 2.8 6.2 6.2S63.4 14.2 60 14.2 53.8 11.4 53.8 8 56.6 1.8 60 1.8Z"
		stroke="currentColor"
		stroke-width="1"
	/>
	<path
		d="M60 4.8c1.8 0 3.2 1.4 3.2 3.2S61.8 11.2 60 11.2 56.8 9.8 56.8 8 58.2 4.8 60 4.8Z"
		fill="currentColor"
	/>
	<path
		d="M46 8c2.6-.5 4.6-2.5 5.2-5.2M46 8c2.6.5 4.6 2.5 5.2 5.2M74 8c-2.6-.5-4.6-2.5-5.2-5.2M74 8c-2.6.5-4.6 2.5-5.2 5.2"
		stroke="currentColor"
		stroke-width=".8"
		stroke-linecap="round"
	/>
</svg>
