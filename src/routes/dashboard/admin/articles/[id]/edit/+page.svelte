<script lang="ts">
	import { page } from '$app/state';
	import DemoRoute from '$lib/components/dashboard/DemoRoute.svelte';
</script>

<DemoRoute
	loader={() => import('$lib/demo/pages/ArticleFormPage.svelte')}
	props={{ articleId: page.params.id ?? '' }}
/>
