<script lang="ts">
	import DemoRoute from '$lib/components/dashboard/DemoRoute.svelte';
</script>

<DemoRoute
	loader={() => import('$lib/demo/pages/NotificationsPage.svelte')}
	props={{
		adminMode: true,
		title: 'Envoi de notifications',
		description:
			'Composez un message simulé pour tout le bagad, un pupitre ou des membres. Aucun push réel n’est envoyé.'
	}}
/>
