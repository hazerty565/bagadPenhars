<script lang="ts">
	let { children } = $props();
</script>

<nav aria-label="Pagination" class="flex items-center gap-2">
	{@render children?.()}
</nav>
