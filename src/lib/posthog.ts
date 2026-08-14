import posthog from "posthog-js";
import { getConsent } from "@probo/cookie-banner/consent";
import type { BannerConfig } from "@probo/cookie-banner";

export { posthog };

let initialized = false;
const ANALYTICS_CATEGORY = "analytics";

export function configurePosthogFromBanner(_config: BannerConfig) {
  if (initialized) return;

  const apiKey = import.meta.env.PUBLIC_POSTHOG_API_KEY;
  const apiHost = import.meta.env.PUBLIC_POSTHOG_API_HOST;
  const uiHost = import.meta.env.PUBLIC_POSTHOG_UI_HOST || "https://us.posthog.com";

  // Preserve the Probo PostHog integration, but never send ZebraByte analytics
  // through the upstream Probo proxy. Tracking only starts when a ZebraByte-owned
  // project key and API host are explicitly configured.
  if (!apiKey || !apiHost) {
    if (import.meta.env.DEV) {
      console.info(
        "[posthog] Disabled: configure PUBLIC_POSTHOG_API_KEY and PUBLIC_POSTHOG_API_HOST for ZebraByte.",
      );
    }
    return;
  }

  initialized = true;

  const consent = getConsent();
  const analyticsAllowed = consent.getAll()[ANALYTICS_CATEGORY] === true;

  posthog.init(apiKey, {
    api_host: apiHost,
    ui_host: uiHost,
    defaults: "2026-01-30",
    cookieless_mode: analyticsAllowed ? "on_reject" : "always",
    opt_out_capturing_by_default: !analyticsAllowed,
    person_profiles: "identified_only",
    capture_pageview: true,
    autocapture: true,
    capture_heatmaps: true,
    respect_dnt: true,
    debug: import.meta.env.DEV,
  });

  if (analyticsAllowed) identifyStableAnonId();

  consent.subscribe((data) => {
    if (data[ANALYTICS_CATEGORY]) {
      posthog.opt_in_capturing();
      identifyStableAnonId();
    } else {
      posthog.opt_out_capturing();
    }
  });

  loadToolbarFromCache();
}

function identifyStableAnonId() {
  const KEY = "zebrabyte_distinct_id";
  let id: string | null = null;
  try {
    id = localStorage.getItem(KEY);
    if (!id) {
      id = "anon-" + crypto.randomUUID();
      localStorage.setItem(KEY, id);
    }
  } catch {
    return;
  }
  posthog.identify(id);
}

let toolbarPayload: string | null = null;

export function captureToolbarPayloadFromHash() {
  const fromHash = new URLSearchParams(window.location.hash.substring(1)).get(
    "__posthog",
  );
  if (fromHash) toolbarPayload = fromHash;
}

export function loadToolbarFromCache() {
  if (!initialized || !toolbarPayload) return;
  posthog.loadToolbar(JSON.parse(toolbarPayload));
}
