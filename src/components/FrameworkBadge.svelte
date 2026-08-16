<script lang="ts">
  import lottie, { type AnimationItem } from "lottie-web";
  import { onDestroy } from "svelte";
  import { browserT } from "../lib/browser-i18n";
  import { useIntersectionObserver } from "../lib/runes/useIntersectionObserver.svelte.ts";

  const {
    name,
    class: className,
  }: { name: string; class?: string; priority?: boolean } = $props();
  let animation: AnimationItem | null = null;
  let intersection = useIntersectionObserver();

  $effect(() => {
    if (intersection.observed && !animation && intersection.ref) {
      animation = lottie.loadAnimation({
        container: intersection.ref,
        renderer: "svg",
        loop: false,
        autoplay: true,
        path: `/frameworks/${name.replaceAll(" ", "")}.json`,
      });
      animation.addEventListener("complete", () => {
        if (!animation) {
          return;
        }
        animation.goToAndPlay(300, true);
      });
      return;
    }

    if (!animation) {
      return;
    }

    if (!intersection.observed) {
      animation.stop();
      return;
    }

    animation.play();
  });

  onDestroy(() => {
    animation?.destroy();
  });
</script>

<div
  bind:this={intersection.ref}
  class={className}
  role="img"
  aria-label={`${name.replace(/_dark$/, "").replaceAll("_", " ")} ${browserT("badge de conformitate", "framework badge")}`}
></div>
