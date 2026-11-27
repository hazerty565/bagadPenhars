<script lang="ts">
	import MemberRoute from '$lib/components/dashboard/MemberRoute.svelte';
	import { member } from '$lib/member/store.svelte';
	import type { MemberPageEnvelope } from '$lib/member/types';

	interface Props {
		data?: MemberPageEnvelope | null;
	}

	let { data }: Props = $props();

	$effect(() => {
		if (data?.memberPage) member.applyPage(data);
	});
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
