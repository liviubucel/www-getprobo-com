<script lang="ts">
  import { onMount } from "svelte";
  import { browserT } from "../lib/browser-i18n";

  type PublicStatus = "operational" | "degraded" | "outage" | "no_data" | "unknown";

  const STATUS_API = "/api/status";
  const STATUS_PAGE = "https://status.zebrabyte.ro/";
  const FETCH_TIMEOUT_MS = 6_000;

  let status = $state<PublicStatus>("no_data");
  let checking = $state(true);
  let primaryServiceId = $state<string | null>(null);
  let affectedCount = $state(0);

  const dictionary: Record<PublicStatus, { label: () => string; color: string; live: boolean }> = {
    operational: {
      label: () => browserT("Toate sistemele sunt operaționale", "All systems are operational"),
      color: "#22a06b",
      live: true,
    },
    degraded: {
      label: () => browserT("Performanță degradată", "Degraded performance"),
      color: "#d49a2a",
      live: true,
    },
    outage: {
      label: () => browserT("Incident activ", "Active incident"),
      color: "#d64545",
      live: true,
    },
    no_data: {
      label: () => browserT("Status indisponibil", "Status unavailable"),
      color: "#8a8a8a",
      live: false,
    },
    unknown: {
      label: () => browserT("Status indisponibil", "Status unavailable"),
      color: "#8a8a8a",
      live: false,
    },
  };

  const serviceLabels: Record<string, () => string> = {
    "client-portal": () => browserT("Portal", "Portal"),
    "managed-hosting": () => browserT("Hosting", "Hosting"),
    authentication: () => browserT("Autentificare", "Authentication"),
    "payments-billing": () => browserT("Plăți", "Payments"),
    "compliance-console": () => browserT("Compliance", "Compliance"),
    "cookie-consent": () => browserT("Cookies", "Cookies"),
    "accessibility-widget": () => browserT("Accesibilitate", "Accessibility"),
    "files-documents": () => browserT("Fișiere", "Files"),
    "zbt-edge-network": () => browserT("Edge/CDN", "Edge/CDN"),
    "zbt-dns-routing": () => browserT("DNS", "DNS"),
    "zbt-workers-apis": () => browserT("API-uri", "APIs"),
    "zbt-security-waf": () => browserT("WAF", "WAF"),
    "zbt-data-storage": () => browserT("Stocare", "Storage"),
    "zbt-ai-services": () => browserT("AI", "AI"),
    "zbt-email-services": () => browserT("Email", "Email"),
  };

  let current = $derived(dictionary[status]);
  let compactContextLabel = $derived.by(() => {
    if (status !== "degraded" && status !== "outage") return null;
    if (!primaryServiceId) return null;
    const service = serviceLabels[primaryServiceId]?.();
    if (!service) return null;

    const stateLabel =
      status === "outage"
        ? browserT("Incident", "Incident")
        : browserT("Degradat", "Degraded");
    const additional = affectedCount > 1 ? ` +${affectedCount - 1}` : "";
    return `${stateLabel} · ${service}${additional}`;
  });
  let label = $derived(
    checking
      ? browserT("Se verifică statusul", "Checking status")
      : compactContextLabel ?? current.label(),
  );

  onMount(() => {
    let stopped = false;

    const fetchStatus = async () => {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      try {
        const response = await fetch(STATUS_API, {
          headers: { Accept: "application/json" },
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const payload = (await response.json()) as {
          overall?: string;
          primaryServiceId?: string | null;
          affectedCount?: number;
        };
        const next = payload.overall;

        if (stopped) return;

        primaryServiceId = typeof payload.primaryServiceId === "string" ? payload.primaryServiceId : null;
        affectedCount = Number.isInteger(payload.affectedCount) && Number(payload.affectedCount) > 0
          ? Number(payload.affectedCount)
          : 0;

        if (next === "operational" || next === "degraded" || next === "outage") {
          status = next;
        } else if (next === "no_data") {
          status = "no_data";
        } else {
          status = "unknown";
        }

        if (status !== "degraded" && status !== "outage") {
          primaryServiceId = null;
          affectedCount = 0;
        }
      } catch {
        if (!stopped) {
          status = "unknown";
          primaryServiceId = null;
          affectedCount = 0;
        }
      } finally {
        window.clearTimeout(timeout);
        if (!stopped) checking = false;
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
  class="border border-border-mid bg-invert py-1.5 px-3 rounded-lg w-max max-w-full flex items-center gap-2 whitespace-nowrap"
  href={STATUS_PAGE}
  rel="noreferrer"
  target="_blank"
  title={browserT("Deschide pagina de status", "Open status page")}
  aria-label={`${browserT("Status servicii ZebraByte", "ZebraByte service status")}: ${label}`}
>
  <span class="status-dot-wrap" aria-hidden="true" style={`--status-color:${current.color}`}>
    {#if current.live}<span class="status-dot-pulse"></span>{/if}
    <span class="status-dot"></span>
  </span>
  <span class="truncate">{label}</span>
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
