<script lang="ts">
  import Splide from "@splidejs/splide";
  import { AutoScroll } from "@splidejs/splide-extension-auto-scroll";
  import { Intersection } from "@splidejs/splide-extension-intersection";

  import { onMount } from "svelte";
  import { browserT } from "../../lib/browser-i18n";
  import { useWindowSize } from "../../lib/runes/useWindowSize.svelte.ts";

  let slider: HTMLDivElement | null = null;
  let sliderReversed = $state<HTMLDivElement | null>(null);
  let windowSize = useWindowSize();
  let isMobile = $derived(windowSize.width < 640);

  const createOptions = () => ({
    type: "loop" as const,
    fixedWidth: 270,
    gap: 16,
    focus: "center" as const,
    arrows: false,
    pagination: false,
    mediaQuery: "min" as const,
    i18n: {
      prev: browserT("Slide-ul anterior", "Previous slide"),
      next: browserT("Slide-ul următor", "Next slide"),
      first: browserT("Mergi la primul slide", "Go to first slide"),
      last: browserT("Mergi la ultimul slide", "Go to last slide"),
      slideX: browserT("Mergi la slide-ul %s", "Go to slide %s"),
      pageX: browserT("Mergi la pagina %s", "Go to page %s"),
      play: browserT("Pornește redarea automată", "Start autoplay"),
      pause: browserT("Oprește redarea automată", "Pause autoplay"),
      carousel: browserT("carusel", "carousel"),
      select: browserT("Selectează un slide pentru afișare", "Select a slide to show"),
      slide: "slide",
      slideLabel: browserT("%s din %s", "%s of %s"),
    },
    breakpoints: {
      640: {
        fixedWidth: 450,
      },
    },
  });

  // Main slider scrolling from left to right
  onMount(() => {
    if (!slider) {
      return;
    }
    slider
      .querySelector("astro-slot")!
      .setAttribute("class", "splide__list items-start block");
    const s = new Splide(slider, createOptions()).mount({ AutoScroll, Intersection });
    return () => {
      s.destroy();
    };
  });

  // Secondary slider, only visible on desktop
  $effect(() => {
    if (!sliderReversed || isMobile) {
      return;
    }
    const slot = sliderReversed.querySelector("astro-slot") as HTMLSlotElement;
    slot.setAttribute("class", "splide__list items-start block");
    const s = new Splide(sliderReversed, {
      ...createOptions(),
      start: slot.children.length / 2,
      autoScroll: {
        speed: -1,
      },
    }).mount({ AutoScroll, Intersection });
    return () => {
      s.destroy();
    };
  });

  const props = $props();
</script>

<div class="space-y-12">
  <div class="splide" bind:this={slider}>
    <div class="splide__track">
      {@render props.children()}
    </div>
  </div>
  {#if !isMobile}
    <div class="splide mb-12" bind:this={sliderReversed}>
      <div class="splide__track">
        {@render props.children()}
      </div>
    </div>
  {/if}
</div>
