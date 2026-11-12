<script lang="ts">
	let { children } = $props();
</script>

<span
	class="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700"
>
	{@render children?.()}
</span>
