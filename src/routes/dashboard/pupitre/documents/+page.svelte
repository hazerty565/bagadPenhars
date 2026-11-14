<script lang="ts">
	import MemberRoute from '$lib/components/dashboard/MemberRoute.svelte';
</script>

<MemberRoute
	loader={() => import('$lib/member/pages/DocumentsPage.svelte')}
	props={{
		pupitreMode: true,
		title: 'Documents de mes pupitres',
		description:
			'Partitions et documents des pupitres que vous dirigez. Vous pouvez y déposer un fichier simulé.'
	}}
/>
