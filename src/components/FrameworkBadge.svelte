<script lang="ts">
  const { name, class: className }: { name: string; class?: string } = $props();
  const assetName = name.replaceAll(" ", "");
</script>

<img
  src={`/frameworks/${assetName}.svg?v=2`}
  class={className}
  alt={`${name} framework badge`}
  width="64"
  height="64"
  decoding="async"
  draggable="false"
/>
