<script lang="ts">
  const {
    name,
    class: className,
    priority = false,
  }: { name: string; class?: string; priority?: boolean } = $props();
  const assetName = name.replaceAll(" ", "");
</script>

<img
  src={`/frameworks/${assetName}.svg?v=3`}
  class={className}
  alt={`${name} framework badge`}
  width="64"
  height="64"
  loading={priority ? "eager" : "lazy"}
  fetchpriority={priority ? "high" : "auto"}
  decoding="async"
  draggable="false"
/>
