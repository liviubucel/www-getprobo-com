<script lang="ts">
  import { scale } from "svelte/transition";
  import { onDestroy } from "svelte";
  import { frameworks } from "../content/frameworks.ts";
  import { windowWidth } from "../lib/window.ts";
  import FrameworkBadge from "./FrameworkBadge.svelte";
  import { useIntersectionObserver } from "../lib/runes/useIntersectionObserver.svelte.ts";
  import clsx from "clsx";

  const duration = 5000;
  const preferredOrder = [
    "SOC2_TYPE1",
    "ISO27001",
    "ISO42001",
    "CCPA",
    "JetDePierre",
    "ISO27701",
    "HIPAA",
    "FERPA",
    "CASA",
    "SOC2_TYPE2",
    "SOC3",
  ];

  const orderedFrameworks = [
    ...preferredOrder
      .map((badge) => frameworks.find((framework) => framework.badge === badge))
      .filter((framework): framework is (typeof frameworks)[number] => Boolean(framework)),
    ...frameworks.filter((framework) => !preferredOrder.includes(framework.badge)),
  ];

  let {
    count,
    class: className,
    countMobile,
    border,
  }: {
    count: number;
    countMobile?: number;
    class: string;
    border?: boolean;
  } = $props();

  let timer: ReturnType<typeof setTimeout> | null = null;
  let destroyed = false;
  let rotationGeneration = 0;
  let innerWidth = $state(windowWidth());
  let isMobile = $derived(innerWidth < 640);
  let targetCount = $derived(isMobile && countMobile ? countMobile : count);
  let intersection = useIntersectionObserver({ threshold: 0 });
  let visibleFrameworks = $state(orderedFrameworks.slice(0, count));

  const badgeSrc = (badge: string) =>
    `/frameworks/${badge.replaceAll(" ", "")}.svg?v=3`;

  const preloadFramework = (framework: (typeof frameworks)[number]) =>
    new Promise<boolean>((resolve) => {
      if (typeof Image === "undefined") {
        resolve(true);
        return;
      }

      const image = new Image();
      image.decoding = "async";
      image.onload = async () => {
        try {
          await image.decode?.();
        } catch {
          // The resource is already loaded; decode() support varies by browser.
        }
        resolve(true);
      };
      image.onerror = () => resolve(false);
      image.src = badgeSrc(framework.badge);
    });

  const preloadRemainingFrameworks = () => {
    if (typeof Image === "undefined") return;
    orderedFrameworks.forEach((framework) => {
      const image = new Image();
      image.decoding = "async";
      image.src = badgeSrc(framework.badge);
    });
  };

  const scheduleNext = () => {
    if (destroyed) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(tick, duration);
  };

  const tick = async () => {
    const generation = ++rotationGeneration;
    const visibleBadges = new Set(visibleFrameworks.map((framework) => framework.badge));
    const availableFrameworks = orderedFrameworks.filter(
      (framework) => !visibleBadges.has(framework.badge),
    );

    if (availableFrameworks.length === 0 || visibleFrameworks.length === 0) {
      scheduleNext();
      return;
    }

    const randomFramework =
      availableFrameworks[Math.floor(Math.random() * availableFrameworks.length)];
    const randomIndex = Math.floor(Math.random() * visibleFrameworks.length);

    // Keep the existing badge visible until its replacement is fully loaded.
    const loaded = await preloadFramework(randomFramework);
    if (destroyed || generation !== rotationGeneration) return;

    if (loaded) {
      visibleFrameworks = visibleFrameworks.map((framework, index) =>
        index === randomIndex ? randomFramework : framework,
      );
    }

    scheduleNext();
  };

  // Identical SSR/client initial order avoids hydration mismatches. Rotation is
  // still live after hydration and starts only when the grid is visible.
  $effect(() => {
    visibleFrameworks = orderedFrameworks.slice(0, targetCount);
    rotationGeneration += 1;
  });

  $effect(() => {
    if (!intersection.observed) return;

    preloadRemainingFrameworks();
    scheduleNext();

    return () => {
      rotationGeneration += 1;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };
  });

  onDestroy(() => {
    destroyed = true;
    rotationGeneration += 1;
    if (timer) clearTimeout(timer);
  });

  const columns = $derived(isMobile ? 3 : 5);
</script>

<div class={clsx(className, "relative")} bind:this={intersection.ref}>
  {#each visibleFrameworks as framework, index (index)}
    <div
      class={clsx(
        "text-center grid place-items-center overflow-hidden",
        border &&
          "aspect-square md:aspect-192/180 hover:bg-[#F4FCE6] transition-all",
      )}
    >
      {#key framework.badge}
        <div
          class="transition-all duration-1000 col-1 row-1 space-y-3 size-25 aspect-square mix-blend-multiply"
          transition:scale={{ duration: 750 }}
        >
          <FrameworkBadge
            name={framework.badge}
            class="block size-16 mx-auto"
            priority={true}
          />
          <div class="whitespace-nowrap text-xxs">{framework.label}</div>
        </div>
      {/key}
    </div>
  {/each}
  {#if border}
    {#each { length: columns + 1 }, x}
      <div
        class="vertical-rule"
        style={`left: ${Math.round((x * 100) / columns)}%`}
      ></div>
    {/each}
    {#each { length: 3 }, y}
      <div
        class="horizontal-rule"
        style={`top: ${Math.round((y * 100) / 2)}%`}
      ></div>
    {/each}
  {/if}
</div>
<svelte:window bind:innerWidth />

<style>
  .vertical-rule {
    top: -20px;
    bottom: -20px;
    width: 1px;
    background: linear-gradient(
      to bottom,
      transparent,
      var(--color-border-low) 20px,
      var(--color-border-low) calc(100% - 20px),
      transparent
    );
    position: absolute;
  }
  .horizontal-rule {
    left: -20px;
    right: -20px;
    height: 1px;
    background: linear-gradient(
      to right,
      transparent,
      var(--color-border-low) 40px,
      var(--color-border-low) calc(100% - 40px),
      transparent
    );
    position: absolute;
  }
</style>
