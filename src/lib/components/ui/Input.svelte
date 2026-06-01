<script lang="ts">
  export let type = 'text';
  export let value = '';
  export let placeholder = '';
</script>
<input {type} bind:value class="border rounded px-3 py-2 w-full" placeholder={placeholder} />
