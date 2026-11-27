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

<MemberRoute loader={() => import('$lib/member/pages/MembersPage.svelte')} />
