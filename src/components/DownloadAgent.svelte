<script lang="ts">
  import { onMount } from "svelte";
  import { slide } from "svelte/transition";
  import Button from "./ui/Button.svelte";
  import {
    describeAsset,
    detectPlatform,
    fetchLatestDeviceAgentRelease,
    listBinaryAssets,
    platformLabel,
    resolvePrimaryAsset,
    type DetectedPlatform,
    type DeviceAgentRelease,
    type ReleaseAsset,
  } from "../lib/device-agent-release";

  let status = $state<"loading" | "ready" | "error">("loading");
  let release = $state<DeviceAgentRelease | null>(null);
  let platform = $state<DetectedPlatform>({ os: "unknown", arch: "unknown" });
  let primaryAsset = $state<ReleaseAsset | null>(null);
  let errorMessage = $state("Unable to load the latest release.");
  let platformsOpen = $state(false);

  const binaryAssets = $derived(
    release ? listBinaryAssets(release) : ([] as ReleaseAsset[]),
  );

  onMount(() => {
    Promise.all([detectPlatform(), fetchLatestDeviceAgentRelease()])
      .then(([detected, latest]) => {
        platform = detected;
        release = latest;
        primaryAsset = resolvePrimaryAsset(latest, detected);
        status = "ready";
      })
      .catch((error: unknown) => {
        errorMessage =
          error instanceof Error
            ? error.message
            : "Unable to load the latest release.";
        status = "error";
      });
  });
</script>

{#snippet downloadIcon(className: string)}
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 256 256"
    fill="currentColor"
    class={className}
    aria-hidden="true"
  >
    <path d="M224,144v64a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V144a8,8,0,0,1,16,0v56H208V144a8,8,0,0,1,16,0Zm-101.66,5.66a8,8,0,0,0,11.32,0l40-40a8,8,0,0,0-11.32-11.32L136,124.69V32a8,8,0,0,0-16,0v92.69L93.66,98.34a8,8,0,0,0-11.32,11.32Z" />
  </svg>
{/snippet}

{#snippet caretIcon(className: string)}
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 256 256"
    fill="currentColor"
    class={className}
    aria-hidden="true"
  >
    <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z" />
  </svg>
{/snippet}

<div class="mx-auto flex max-w-xl flex-col items-center text-center">
  {#if status === "loading"}
    <Button size="lg" disabled aria-busy="true">
      Detecting your platform…
    </Button>
    <p class="text-muted-foreground mt-4 text-sm">
      Looking up the latest ZebraByte Device Agent release…
    </p>
  {:else if status === "error"}
    <p class="text-muted-foreground mb-4 text-sm">{errorMessage}</p>
    <Button size="lg" href="/contact" rel="nofollow">
      Contact support
    </Button>
  {:else if release}
    <p class="text-muted-foreground mb-4 text-sm">
      Latest release: <span class="text-foreground font-medium">v{release.version}</span>
    </p>

    {#if primaryAsset}
      <Button
        size="lg"
        href={primaryAsset.url}
        rel="nofollow"
        data-ph-event="download_device_agent_click"
      >
        {@render downloadIcon("size-5 shrink-0")}
        Download for {platformLabel(platform)}
      </Button>
    {:else}
      <p class="text-muted-foreground mb-4 text-sm">
        We couldn’t match a download automatically for your platform. Choose one below.
      </p>
    {/if}

    <div class="mt-10 w-full">
      <button
        type="button"
        class="text-foreground hover:text-foreground/80 mx-auto flex cursor-pointer items-center justify-center gap-1 text-sm font-medium"
        aria-expanded={platformsOpen}
        aria-controls="other-platforms-list"
        onclick={() => (platformsOpen = !platformsOpen)}
      >
        Other platforms
        {@render caretIcon(
          `size-3.5 shrink-0 transition-transform duration-200 ${platformsOpen ? "rotate-180" : ""}`,
        )}
      </button>
      {#if platformsOpen}
        <ul
          id="other-platforms-list"
          class="mx-auto mt-4 w-max space-y-2 text-left"
          transition:slide={{ duration: 200 }}
        >
          {#each binaryAssets as asset (asset.id)}
            <li>
              <a
                class="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm underline underline-offset-2"
                href={asset.url}
                rel="nofollow"
              >
                {@render downloadIcon("size-3.5 shrink-0")}
                {describeAsset(asset)}
              </a>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {/if}
</div>
