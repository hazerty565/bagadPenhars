<script lang="ts">
	let { type = 'text', value = $bindable(''), placeholder = '' } = $props();
</script>

<input {type} bind:value class="border rounded px-3 py-2 w-full" {placeholder} />
