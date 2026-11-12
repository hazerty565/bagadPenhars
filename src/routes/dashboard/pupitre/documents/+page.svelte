<script lang="ts">
	import DemoRoute from '$lib/components/dashboard/DemoRoute.svelte';
</script>

<DemoRoute
	loader={() => import('$lib/demo/pages/DocumentsPage.svelte')}
	props={{
		pupitreMode: true,
		title: 'Documents de mes pupitres',
		description:
			'Partitions et documents des pupitres que vous dirigez. Vous pouvez y déposer un fichier simulé.'
	}}
/>
