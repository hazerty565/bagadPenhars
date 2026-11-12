<script lang="ts">
	import DemoRoute from '$lib/components/dashboard/DemoRoute.svelte';
</script>

<DemoRoute
	loader={() => import('$lib/demo/pages/NotificationsPage.svelte')}
	props={{
		pupitreMode: true,
		title: 'Notifications de mes pupitres',
		description: 'Messages reçus et envois simulés vers les pupitres que vous dirigez uniquement.'
	}}
/>
