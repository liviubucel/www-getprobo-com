type PublicStatus = "operational" | "degraded" | "outage" | "no_data";

type FooterStatusPayload = {
  overall?: unknown;
  updatedAt?: unknown;
  primaryServiceId?: unknown;
  affectedCount?: unknown;
  services?: unknown;
};

type StatusResult = {
  overall: PublicStatus;
  updatedAt: string | null;
  primaryServiceId: string | null;
  affectedCount: number;
  source: "binding" | "binding-unavailable" | "public-fallback";
};

export type PublicStatusEnv = {
  STATUS_ENGINE?: {
    getStatus: () => Promise<FooterStatusPayload>;
  };
};

const STATUS_FALLBACK_API = "https://status.zebrabyte.ro/api/status";
const FALLBACK_TIMEOUT_MS = 4_500;
const VALID_STATUSES = new Set<PublicStatus>([
  "operational",
  "degraded",
  "outage",
  "no_data",
]);
const FOOTER_SERVICE_PRIORITY = [
  "client-portal",
  "managed-hosting",
  "authentication",
  "payments-billing",
  "compliance-console",
  "cookie-consent",
  "accessibility-widget",
  "files-documents",
  "zbt-edge-network",
  "zbt-dns-routing",
  "zbt-workers-apis",
  "zbt-security-waf",
  "zbt-data-storage",
  "zbt-ai-services",
  "zbt-email-services",
] as const;
const FOOTER_PUBLIC_SERVICE_IDS = new Set<string>(FOOTER_SERVICE_PRIORITY);

function normalizeStatus(value: unknown): PublicStatus {
  return typeof value === "string" && VALID_STATUSES.has(value as PublicStatus)
    ? (value as PublicStatus)
    : "no_data";
}

function normalizeUpdatedAt(value: unknown): string | null {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) return null;
  return new Date(value).toISOString();
}

function normalizeAffectedCount(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number.NaN;
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, FOOTER_SERVICE_PRIORITY.length) : 0;
}

function normalizePrimaryServiceId(value: unknown): string | null {
  return typeof value === "string" && FOOTER_PUBLIC_SERVICE_IDS.has(value) ? value : null;
}

function deriveServiceContext(payload: FooterStatusPayload, overall: PublicStatus): {
  primaryServiceId: string | null;
  affectedCount: number;
} {
  if (overall !== "outage" && overall !== "degraded") {
    return { primaryServiceId: null, affectedCount: 0 };
  }

  const directPrimary = normalizePrimaryServiceId(payload.primaryServiceId);
  const directCount = normalizeAffectedCount(payload.affectedCount);
  if (directPrimary && directCount > 0) {
    return { primaryServiceId: directPrimary, affectedCount: directCount };
  }

  const services = Array.isArray(payload.services) ? payload.services : [];
  const byId = new Map<string, PublicStatus>();
  for (const rawService of services) {
    if (!rawService || typeof rawService !== "object") continue;
    const service = rawService as { id?: unknown; status?: unknown };
    const id = normalizePrimaryServiceId(service.id);
    if (!id) continue;
    const status = normalizeStatus(service.status);
    if (status !== "outage" && status !== "degraded") continue;
    byId.set(id, status);
  }

  const affectedIds = FOOTER_SERVICE_PRIORITY.filter((id) => byId.has(id));
  const preferredStatus = overall === "outage" ? "outage" : "degraded";
  const primaryServiceId =
    affectedIds.find((id) => byId.get(id) === preferredStatus) ?? affectedIds[0] ?? null;

  return {
    primaryServiceId,
    affectedCount: affectedIds.length,
  };
}

function normalizePayload(
  payload: FooterStatusPayload,
  source: StatusResult["source"],
): StatusResult {
  const overall = normalizeStatus(payload.overall);
  const context = deriveServiceContext(payload, overall);
  return {
    overall,
    updatedAt: normalizeUpdatedAt(payload.updatedAt),
    ...context,
    source,
  };
}

async function readWorkerStatus(env?: PublicStatusEnv): Promise<StatusResult> {
  if (!env?.STATUS_ENGINE?.getStatus) {
    return {
      overall: "no_data",
      updatedAt: null,
      primaryServiceId: null,
      affectedCount: 0,
      source: "binding-unavailable",
    };
  }

  try {
    const payload = await env.STATUS_ENGINE.getStatus();
    return normalizePayload(payload, "binding");
  } catch {
    return {
      overall: "no_data",
      updatedAt: null,
      primaryServiceId: null,
      affectedCount: 0,
      source: "binding-unavailable",
    };
  }
}

async function readPublicFallback(): Promise<StatusResult | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FALLBACK_TIMEOUT_MS);

  try {
    const response = await fetch(STATUS_FALLBACK_API, {
      headers: {
        Accept: "application/json",
        "User-Agent": "ZebraByte-Website-Status/3.0",
      },
      cache: "no-store",
      redirect: "follow",
      signal: controller.signal,
    });
    if (!response.ok) return null;

    const payload = (await response.json()) as FooterStatusPayload;
    const normalized = normalizePayload(payload, "public-fallback");
    if (normalized.overall === "no_data") return null;
    return normalized;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function jsonResponse(
  payload: Record<string, unknown>,
  status = 200,
): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=20, stale-while-revalidate=60",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    },
  });
}

export async function handlePublicStatusApi(
  request: Request,
  env?: PublicStatusEnv,
): Promise<Response | null> {
  const url = new URL(request.url);
  if (url.pathname !== "/api/status") return null;

  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response(null, {
      status: 405,
      headers: { Allow: "GET, HEAD" },
    });
  }

  const bindingPayload = await readWorkerStatus(env);
  let selected = bindingPayload;

  if (bindingPayload.overall === "no_data") {
    selected = (await readPublicFallback()) ?? bindingPayload;
  } else if (
    (bindingPayload.overall === "outage" || bindingPayload.overall === "degraded") &&
    (!bindingPayload.primaryServiceId || bindingPayload.affectedCount < 1)
  ) {
    // Backward-compatible bridge: an older status Worker may return only the overall
    // state. Pull public service context without replacing the authoritative binding
    // status, and stop doing this automatically once the RPC exposes context itself.
    const fallback = await readPublicFallback();
    if (fallback && fallback.overall === bindingPayload.overall) {
      selected = {
        ...bindingPayload,
        primaryServiceId: fallback.primaryServiceId,
        affectedCount: fallback.affectedCount,
      };
    }
  }

  if (request.method === "HEAD") {
    return new Response(null, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=20, stale-while-revalidate=60",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  // Deliberately do not expose source/provider implementation details in the public
  // website endpoint. The footer needs only the public state and compact context.
  return jsonResponse({
    overall: selected.overall,
    updatedAt: selected.updatedAt,
    primaryServiceId: selected.primaryServiceId,
    affectedCount: selected.affectedCount,
  });
}
