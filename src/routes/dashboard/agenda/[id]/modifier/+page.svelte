<script lang="ts">
	import { page } from '$app/state';
	import DemoRoute from '$lib/components/dashboard/DemoRoute.svelte';
</script>

<DemoRoute
	loader={() => import('$lib/demo/pages/EventFormPage.svelte')}
	props={{ eventId: page.params.id ?? '' }}
/>
