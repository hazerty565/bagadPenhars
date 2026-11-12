<script lang="ts">
	import DemoRoute from '$lib/components/dashboard/DemoRoute.svelte';
</script>

<DemoRoute
	loader={() => import('$lib/demo/pages/MembersPage.svelte')}
	props={{
		pupitreMode: true,
		title: 'Membres de mes pupitres',
		description:
			'Les membres actifs des pupitres que vous dirigez. Aucune coordonnée personnelle n’est affichée.'
	}}
/>
