<script lang="ts">
	let { error }: { error: { status: number; message: string } } = $props();
</script>

<section class="p-6">
	<h1>{error.status}</h1>
	<p>{error?.message ?? 'Une erreur est survenue.'}</p>
</section>
