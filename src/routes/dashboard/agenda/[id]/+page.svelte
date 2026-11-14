<script lang="ts">
	import { page } from '$app/state';
	import MemberRoute from '$lib/components/dashboard/MemberRoute.svelte';
</script>

<MemberRoute
	loader={() => import('$lib/member/pages/EventDetailPage.svelte')}
	props={{ eventId: page.params.id ?? '' }}
/>
