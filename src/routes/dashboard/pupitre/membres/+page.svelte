<script lang="ts">
	import MemberRoute from '$lib/components/dashboard/MemberRoute.svelte';
</script>

<MemberRoute
	loader={() => import('$lib/member/pages/MembersPage.svelte')}
	props={{
		pupitreMode: true,
		title: 'Membres de mes pupitres',
		description:
			'Les membres actifs des pupitres que vous dirigez. Aucune coordonnée personnelle n’est affichée.'
	}}
/>
