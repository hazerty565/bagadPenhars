<script lang="ts">
  export let error: Error;
  export let status: number;
</script>
<section class="p-6">
  <h1>{status}</h1>
  <p>{error?.message ?? 'Une erreur est survenue.'}</p>
</section>
