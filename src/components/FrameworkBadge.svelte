<script lang="ts">
  const { name, class: className }: { name: string; class?: string } = $props();
</script>

<img
  src={`/frameworks/${name.replaceAll(" ", "")}.svg`}
  class={className}
  alt={`${name} framework badge`}
  loading="lazy"
  decoding="async"
  draggable="false"
/>
