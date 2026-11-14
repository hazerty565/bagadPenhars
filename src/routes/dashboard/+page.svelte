<script lang="ts">
	import MemberRoute from '$lib/components/dashboard/MemberRoute.svelte';
</script>

<MemberRoute loader={() => import('$lib/member/pages/OverviewPage.svelte')} />
