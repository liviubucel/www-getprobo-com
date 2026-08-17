type PublicStatus = "operational" | "degraded" | "outage" | "no_data";

type StatusPayload = {
  overall?: unknown;
  updatedAt?: unknown;
  generatedAt?: unknown;
  services?: unknown;
  events?: unknown;
  freshness?: unknown;
  publicationMode?: unknown;
};

const PRIMARY_STATUS_API = "https://status.zebrabyte.ro/api/status";
const FAILOVER_STATUS_API = "https://zebra-byte-status-web.vercel.app/api/status";
const FETCH_TIMEOUT_MS = 4_500;
const VALID_STATUSES = new Set<PublicStatus>([
  "operational",
  "degraded",
  "outage",
  "no_data",
]);

function normalizeStatus(value: unknown): PublicStatus | null {
  return typeof value === "string" && VALID_STATUSES.has(value as PublicStatus)
    ? (value as PublicStatus)
    : null;
}

async function fetchStatus(url: string): Promise<{
  overall: PublicStatus;
  updatedAt: string | null;
  freshness: string | null;
  publicationMode: string | null;
} | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "ZebraByte-Website-Status/1.0",
      },
      cache: "no-store",
      redirect: "error",
      signal: controller.signal,
    });
    if (!response.ok) return null;

    const payload = (await response.json()) as StatusPayload;
    const overall = normalizeStatus(payload.overall);
    if (!overall) return null;

    const rawUpdatedAt =
      typeof payload.updatedAt === "string"
        ? payload.updatedAt
        : typeof payload.generatedAt === "string"
          ? payload.generatedAt
          : null;
    const updatedAt =
      rawUpdatedAt && Number.isFinite(Date.parse(rawUpdatedAt))
        ? new Date(rawUpdatedAt).toISOString()
        : null;

    return {
      overall,
      updatedAt,
      freshness:
        typeof payload.freshness === "string" ? payload.freshness.slice(0, 32) : null,
      publicationMode:
        typeof payload.publicationMode === "string"
          ? payload.publicationMode.slice(0, 48)
          : null,
    };
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
): Promise<Response | null> {
  const url = new URL(request.url);
  if (url.pathname !== "/api/status") return null;

  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response(null, {
      status: 405,
      headers: { Allow: "GET, HEAD" },
    });
  }

  const primary = await fetchStatus(PRIMARY_STATUS_API);
  let chosen = primary;
  let source = "primary";

  if (!primary || primary.overall === "no_data") {
    const failover = await fetchStatus(FAILOVER_STATUS_API);
    if (failover && (!primary || failover.overall !== "no_data")) {
      chosen = failover;
      source = "failover";
    }
  }

  if (!chosen) {
    return jsonResponse({
      overall: "no_data",
      updatedAt: null,
      source: "unavailable",
      freshness: null,
      publicationMode: null,
    });
  }

  const payload = {
    overall: chosen.overall,
    updatedAt: chosen.updatedAt,
    source,
    freshness: chosen.freshness,
    publicationMode: chosen.publicationMode,
  };

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

  return jsonResponse(payload);
}
