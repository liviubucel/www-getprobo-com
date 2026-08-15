<script lang="ts">
  import { onMount } from "svelte";

  type PublicStatus = "operational" | "degraded" | "outage" | "no_data" | "unknown";

  const STATUS_API = "https://status-page.zebrabyte-uk.workers.dev/api/status";
  const STATUS_PAGE = "https://status-page.zebrabyte-uk.workers.dev/";

  let status = $state<PublicStatus>("unknown");

  const dictionary: Record<PublicStatus, { label: string; color: string; live: boolean }> = {
    operational: { label: "Toate sistemele sunt operaționale", color: "#22a06b", live: true },
    degraded: { label: "Performanță degradată", color: "#d49a2a", live: true },
    outage: { label: "Incident activ", color: "#d64545", live: true },
    no_data: { label: "Se verifică statusul", color: "#8a8a8a", live: false },
    unknown: { label: "Status indisponibil", color: "#8a8a8a", live: false },
  };

  let current = $derived(dictionary[status]);

  onMount(() => {
    let stopped = false;

    const fetchStatus = async () => {
      try {
        const response = await fetch(STATUS_API, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = (await response.json()) as { overall?: string };
        const next = payload.overall;
        if (
          !stopped &&
          (next === "operational" || next === "degraded" || next === "outage" || next === "no_data")
        ) {
          status = next;
        }
      } catch {
        if (!stopped) status = "unknown";
      }
    };

    fetchStatus();
    const timer = window.setInterval(fetchStatus, 60_000);

    const refreshOnVisible = () => {
      if (!document.hidden) fetchStatus();
    };
    document.addEventListener("visibilitychange", refreshOnVisible);

    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshOnVisible);
    };
  });
</script>

<a
  class="border border-border-mid bg-invert py-1.5 px-3 rounded-lg w-max flex items-center gap-2"
  href={STATUS_PAGE}
  rel="noreferrer"
  target="_blank"
  aria-label={`Status servicii ZebraByte: ${current.label}`}
>
  <span class="status-dot-wrap" aria-hidden="true" style={`--status-color:${current.color}`}>
    {#if current.live}<span class="status-dot-pulse"></span>{/if}
    <span class="status-dot"></span>
  </span>
  {current.label}
</a>

<style>
  .status-dot-wrap {
    position: relative;
    display: inline-flex;
    width: 0.5rem;
    height: 0.5rem;
    flex: 0 0 0.5rem;
    align-items: center;
    justify-content: center;
  }

  .status-dot,
  .status-dot-pulse {
    position: absolute;
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 9999px;
    background: var(--status-color);
  }

  .status-dot-pulse {
    opacity: 0.32;
    animation: zbt-status-pulse 2.2s ease-out infinite;
  }

  @keyframes zbt-status-pulse {
    0% { transform: scale(1); opacity: 0.32; }
    75%, 100% { transform: scale(2.25); opacity: 0; }
  }

  @media (prefers-reduced-motion: reduce) {
    .status-dot-pulse { animation: none; display: none; }
  }
</style>
