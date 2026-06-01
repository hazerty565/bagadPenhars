<script lang="ts">
  export let type = 'button';
  export let disabled = false;
</script>
<button type={type} disabled={disabled} class="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50">
  <slot />
</button>
