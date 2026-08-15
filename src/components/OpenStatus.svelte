<script lang="ts">
  import { onMount } from "svelte";

  type PublicStatus = "operational" | "degraded" | "outage" | "no_data" | "unknown";

  const STATUS_API = "https://status-page.zebrabyte-uk.workers.dev/api/status";
  const STATUS_PAGE = "https://status-page.zebrabyte-uk.workers.dev/";

  let status = $state<PublicStatus>("unknown");

  const dictionary: Record<PublicStatus, { label: string; color: string }> = {
    operational: {
      label: "All systems operational",
      color: "#22a06b",
    },
    degraded: {
      label: "Degraded performance",
      color: "#d49a2a",
    },
    outage: {
      label: "Service disruption",
      color: "#d64545",
    },
    no_data: {
      label: "Checking status",
      color: "#8a8a8a",
    },
    unknown: {
      label: "Status unavailable",
      color: "#8a8a8a",
    },
  };

  let label = $derived(dictionary[status].label);
  let color = $derived(dictionary[status].color);

  onMount(() => {
    let stopped = false;

    const fetchStatus = async () => {
      try {
        const res = await fetch(STATUS_API, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { overall?: string };
        const next = data.overall;
        if (!stopped && (next === "operational" || next === "degraded" || next === "outage" || next === "no_data")) {
          status = next;
        }
      } catch {
        if (!stopped) status = "unknown";
      }
    };

    fetchStatus();
    const timer = window.setInterval(fetchStatus, 60_000);

    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  });
</script>

<a
  class="border border-border-mid bg-invert py-1.5 px-3 rounded-lg w-max flex items-center gap-2"
  href={STATUS_PAGE}
  rel="noreferrer"
  target="_blank"
  aria-label={`ZebraByte service status: ${label}`}
>
  <span
    class="relative inline-flex h-2 w-2 rounded-full"
    style:background-color={color}
  ></span>
  {label}
</a>
