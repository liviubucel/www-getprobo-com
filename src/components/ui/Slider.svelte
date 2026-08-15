<script lang="ts">
  import Splide, { type Options } from "@splidejs/splide";
  import clsx from "clsx";
  import { browserT } from "../../lib/browser-i18n";

  let slider = $state<HTMLDivElement | null>(null);
  const props = $props<{
    children: () => any;
    options: Options;
    // Display elements on the side
    withOverflow?: boolean;
    // Clicking on a slide navigate to it
    navigateOnClick?: boolean;
  }>();

  $effect(() => {
    if (!slider) {
      return;
    }
    const root = slider.querySelector("astro-slot")! as HTMLElement;
    root.setAttribute("class", "splide__list block");
    Array.from(root.children).forEach((node) =>
      (node as HTMLDivElement).classList.add("splide__slide"),
    );

    const localizedOptions: Options = {
      ...props.options,
      i18n: {
        ...props.options.i18n,
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
        slide: browserT("slide", "slide"),
        slideLabel: browserT("%s din %s", "%s of %s"),
      },
    };

    const s = new Splide(slider, localizedOptions).mount();

    s.on("click", (slide, e) => {
      // Clicking on the side, should focus the right item
      if (props.navigateOnClick && slide.index !== s.index) {
        e.preventDefault();
        s.go(slide.index);
      }
    });

    return () => {
      s.destroy();
    };
  });
</script>

<div class="splide" bind:this={slider}>
  <div class={clsx("splide__track", props.withOverflow && "overflow-visible")}>
    {@render props.children()}
  </div>
</div>
