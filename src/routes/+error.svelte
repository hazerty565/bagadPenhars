<script lang="ts">
	import { page } from '$app/state';
</script>

<section class="p-6">
	<h1>{page.status}</h1>
	<p>{page.error?.message ?? 'Une erreur est survenue.'}</p>
</section>
