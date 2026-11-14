<script lang="ts">
	import MemberRoute from '$lib/components/dashboard/MemberRoute.svelte';
</script>

<MemberRoute
	loader={() => import('$lib/member/pages/NotificationsPage.svelte')}
	props={{
		pupitreMode: true,
		title: 'Notifications de mes pupitres',
		description: 'Messages reçus et envois simulés vers les pupitres que vous dirigez uniquement.'
	}}
/>
