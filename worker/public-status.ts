type PublicStatus = "operational" | "degraded" | "outage" | "no_data";

type FooterStatusPayload = {
  overall?: unknown;
  updatedAt?: unknown;
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

function normalizeStatus(value: unknown): PublicStatus {
  return typeof value === "string" && VALID_STATUSES.has(value as PublicStatus)
    ? (value as PublicStatus)
    : "no_data";
}

function normalizeUpdatedAt(value: unknown): string | null {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) return null;
  return new Date(value).toISOString();
}

async function readWorkerStatus(env?: PublicStatusEnv): Promise<{
  overall: PublicStatus;
  updatedAt: string | null;
  source: "binding" | "binding-unavailable";
}> {
  if (!env?.STATUS_ENGINE?.getStatus) {
    return { overall: "no_data", updatedAt: null, source: "binding-unavailable" };
  }

  try {
    const payload = await env.STATUS_ENGINE.getStatus();
    return {
      overall: normalizeStatus(payload?.overall),
      updatedAt: normalizeUpdatedAt(payload?.updatedAt),
      source: "binding",
    };
  } catch {
    return { overall: "no_data", updatedAt: null, source: "binding-unavailable" };
  }
}

async function readPublicFallback(): Promise<{
  overall: PublicStatus;
  updatedAt: string | null;
  source: "public-fallback";
} | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FALLBACK_TIMEOUT_MS);

  try {
    const response = await fetch(STATUS_FALLBACK_API, {
      headers: {
        Accept: "application/json",
        "User-Agent": "ZebraByte-Website-Status/2.0",
      },
      cache: "no-store",
      redirect: "follow",
      signal: controller.signal,
    });
    if (!response.ok) return null;

    const payload = (await response.json()) as FooterStatusPayload;
    const overall = normalizeStatus(payload?.overall);
    if (overall === "no_data") return null;

    return {
      overall,
      updatedAt: normalizeUpdatedAt(payload?.updatedAt),
      source: "public-fallback",
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
  const payload =
    bindingPayload.overall === "no_data"
      ? (await readPublicFallback()) ?? bindingPayload
      : bindingPayload;

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
