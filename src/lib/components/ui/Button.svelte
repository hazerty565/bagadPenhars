<script lang="ts">
	let {
		type = 'button',
		disabled = false,
		children
	}: {
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		children?: import('svelte').Snippet;
	} = $props();
</script>

<button {type} {disabled} class="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50">
	{@render children?.()}
</button>
