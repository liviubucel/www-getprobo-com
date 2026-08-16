<script lang="ts">
  import { browserT } from "../lib/browser-i18n";

  const {
    name,
    class: className,
    priority = false,
  }: { name: string; class?: string; priority?: boolean } = $props();

  const requestedAssetName = name.replaceAll(" ", "");
  const darkVariant = requestedAssetName.endsWith("_dark");
  const assetName = darkVariant
    ? requestedAssetName.replace(/_dark$/, "")
    : requestedAssetName;
  const resolvedClassName = [className, darkVariant ? "invert" : ""]
    .filter(Boolean)
    .join(" ");
  const altName = name.replace(/_dark$/, "").replaceAll("_", " ");
</script>

<img
  src={`/frameworks/${assetName}.svg?v=4`}
  class={resolvedClassName}
  alt={`${altName} ${browserT("badge de conformitate", "framework badge")}`}
  width="64"
  height="64"
  loading={priority ? "eager" : "lazy"}
  fetchpriority={priority ? "high" : "auto"}
  decoding="async"
  draggable="false"
/>
