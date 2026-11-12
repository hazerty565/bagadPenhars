<script lang="ts">
	import DemoRoute from '$lib/components/dashboard/DemoRoute.svelte';
</script>

<DemoRoute loader={() => import('$lib/demo/pages/ArticleFormPage.svelte')} />
