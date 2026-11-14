<script lang="ts">
	import MemberRoute from '$lib/components/dashboard/MemberRoute.svelte';
</script>

<MemberRoute
	loader={() => import('$lib/member/pages/NotificationsPage.svelte')}
	props={{
		adminMode: true,
		title: 'Envoi de notifications',
		description:
			'Composez un message simulé pour tout le bagad, un pupitre ou des membres. Aucun push réel n’est envoyé.'
	}}
/>
