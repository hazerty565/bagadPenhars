<script lang="ts">
	import { page } from '$app/state';
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
	loader={() => import('$lib/member/pages/EventFormPage.svelte')}
	props={{ eventId: page.params.id ?? '' }}
/>
