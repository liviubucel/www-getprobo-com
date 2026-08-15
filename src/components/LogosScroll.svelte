<script lang="ts">
  import { onMount, type Snippet } from "svelte";
  import clsx from "clsx";
  import Splide from "@splidejs/splide";
  import { AutoScroll } from "@splidejs/splide-extension-auto-scroll";
  import { Intersection } from "@splidejs/splide-extension-intersection";
  import { browserT } from "../lib/browser-i18n";

  const props: { children: Snippet; class?: string } = $props();
  let slider: HTMLDivElement | null = null;
  const createOptions = () => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    return {
      type: "loop",
      gap: 16,
      arrows: false,
      autoWidth: true,
      pagination: false,
      mediaQuery: "min",
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
      autoScroll: {
        autoStart: !prefersReducedMotion,
        pauseOnFocus: true,
        speed: prefersReducedMotion ? 0 : 0.7,
        pauseOnHover: true,
      },
    } as const;
  };

  onMount(() => {
    if (!slider) {
      return;
    }
    const slot = slider.querySelector("astro-slot") as HTMLElement;
    slot.setAttribute("class", "splide__list items-center block");
    Array.from(slot.children).forEach((child) => {
      child.classList.add("splide__slide");
    });
    const s = new Splide(slider, createOptions()).mount({
      AutoScroll,
      Intersection,
    });
    return () => {
      s.destroy();
    };
  });
</script>

<div class={clsx(props.class, "splide")} bind:this={slider}>
  <div class="splide__track">
    {@render props.children()}
  </div>
</div>
