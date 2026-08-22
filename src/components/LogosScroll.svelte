<script lang="ts">
  import { onMount, type Snippet } from "svelte";
  import clsx from "clsx";
  import Splide from "@splidejs/splide";
  import { AutoScroll } from "@splidejs/splide-extension-auto-scroll";
  import { Intersection } from "@splidejs/splide-extension-intersection";
  import { browserT } from "../lib/browser-i18n";

  type Logo = {
    src: string;
    alt: string;
    class?: string;
    width?: number;
    height?: number;
  };

  const props: {
    children?: Snippet;
    class?: string;
    logos?: Logo[];
  } = $props();

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
    if (!slider) return;

    const list =
      (slider.querySelector("astro-slot") as HTMLElement | null) ??
      (slider.querySelector(".splide__list") as HTMLElement | null);

    if (!list) return;

    if (list.tagName.toLowerCase() === "astro-slot") {
      list.setAttribute("class", "splide__list items-center block");
    }

    Array.from(list.children).forEach((child) => {
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

{#if props.logos?.length}
  <div
    class={clsx(
      props.class,
      "splide flex h-16 w-full items-center sm:h-30",
    )}
    bind:this={slider}
  >
    <div class="splide__track w-full">
      <div class="splide__list items-center block">
        {#each props.logos as logo}
          <div
            class="splide__slide mx-4 flex w-30 flex-none items-center justify-center sm:mx-15 sm:w-50"
          >
            <img
              src={logo.src}
              alt={logo.alt}
              class={clsx("h-6 w-auto object-contain sm:h-7", logo.class)}
              width={logo.width ?? 160}
              height={logo.height ?? 36}
              loading="lazy"
              decoding="async"
            />
          </div>
        {/each}
      </div>
    </div>
  </div>
{:else}
  <div class={clsx(props.class, "splide")} bind:this={slider}>
    <div class="splide__track">
      {@render props.children!()}
    </div>
  </div>
{/if}
