<script lang="ts">
  import { onDestroy } from "svelte";
  import type { AnimationItem } from "lottie-web";
  import { useIntersectionObserver } from "../lib/runes/useIntersectionObserver.svelte.ts";

  type Props = {
    src: string;
    label?: string;
    class?: string;
    loop?: boolean;
    decorative?: boolean;
  };

  type LottieDocument = Record<string, any>;

  const {
    src,
    label = "Animated illustration",
    class: className,
    loop = true,
    decorative = false,
  }: Props = $props();

  let animation = $state<AnimationItem | null>(null);
  let loadingPromise: Promise<void> | null = null;
  let reducedMotion = $state(false);
  const intersection = useIntersectionObserver({ threshold: 0.2 });

  const isSlackBrandAnimation = src.includes(
    "/lottie/trust-center/slack-zebrabyte-v6.json",
  );

  const patchSlackBranding = (data: LottieDocument) => {
    const assets = new Map(
      (data.assets ?? []).map((asset: LottieDocument) => [String(asset.id), asset]),
    );

    // The APP badge is a dedicated precomp in each of the four animated states.
    const appLayers: Record<string, { ind: number; refId: string }> = {
      "305": { ind: 290, refId: "288" },
      "861": { ind: 802, refId: "800" },
      "2444": { ind: 2429, refId: "2427" },
      "2957": { ind: 2942, refId: "2940" },
    };

    for (const [assetId, target] of Object.entries(appLayers)) {
      const asset = assets.get(assetId);
      const layer = asset?.layers?.find(
        (candidate: LottieDocument) =>
          candidate.ind === target.ind && String(candidate.refId) === target.refId,
      );
      if (layer) layer.hd = true;
    }

    // Keep the current wordmark dimensions and transforms. Only increase font weight.
    const fonts = (data.fonts ??= {}).list ??= [];
    if (!fonts.some((font: LottieDocument) => font.fName === "GeistBold")) {
      const base = fonts.find(
        (font: LottieDocument) => font.fName === "GeistSemiBold",
      );
      fonts.push(
        base
          ? { ...base, fName: "GeistBold", fFamily: "Geist", fStyle: "Bold" }
          : {
              fName: "GeistBold",
              fFamily: "Geist",
              fStyle: "Bold",
              ascent: 75,
            },
      );
    }

    const wordmarkLayers: Record<string, number> = {
      "305": 20305,
      "861": 20861,
      "2444": 22444,
      "2957": 22957,
    };

    for (const [assetId, layerIndex] of Object.entries(wordmarkLayers)) {
      const asset = assets.get(assetId);
      const layer = asset?.layers?.find(
        (candidate: LottieDocument) =>
          candidate.ind === layerIndex && candidate.nm === "ZEBRABYTE",
      );
      const documents = layer?.t?.d?.k ?? [];
      for (const document of documents) {
        if (document?.s?.t === "ZEBRABYTE") document.s.f = "GeistBold";
      }
    }

    return data;
  };

  const syncPlayback = () => {
    if (!animation) return;

    if (reducedMotion) {
      animation.goToAndStop(0, true);
    } else if (intersection.observed) {
      animation.play();
    } else {
      animation.pause();
    }
  };

  const loadAnimation = async () => {
    const { default: lottie } = await import("lottie-web");

    if (!intersection.ref || animation) return;

    const options = {
      container: intersection.ref,
      renderer: "svg" as const,
      loop,
      autoplay: false,
      rendererSettings: {
        preserveAspectRatio: "xMidYMid meet",
        progressiveLoad: true,
      },
    };

    if (isSlackBrandAnimation) {
      const response = await fetch(src, { cache: "force-cache" });
      if (!response.ok) {
        throw new Error(`Unable to load Lottie animation: ${response.status}`);
      }
      const animationData = patchSlackBranding(await response.json());
      animation = lottie.loadAnimation({ ...options, animationData });
    } else {
      animation = lottie.loadAnimation({ ...options, path: src });
    }

    animation.addEventListener("DOMLoaded", syncPlayback);
  };

  $effect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotionPreference = () => {
      reducedMotion = mediaQuery.matches;
      syncPlayback();
    };

    syncMotionPreference();
    mediaQuery.addEventListener("change", syncMotionPreference);

    return () => {
      mediaQuery.removeEventListener("change", syncMotionPreference);
    };
  });

  $effect(() => {
    if (!intersection.ref) return;

    if (!intersection.observed) {
      animation?.pause();
      return;
    }

    if (animation) {
      syncPlayback();
      return;
    }

    loadingPromise ??= loadAnimation().catch((error) => {
      loadingPromise = null;
      console.error("Failed to load Lottie animation", error);
    });
  });

  onDestroy(() => {
    animation?.destroy();
  });
</script>

<div
  bind:this={intersection.ref}
  class={className}
  role={decorative ? undefined : "img"}
  aria-label={decorative ? undefined : label}
  aria-hidden={decorative ? "true" : undefined}
></div>
