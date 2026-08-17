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
}> {
  if (!env?.STATUS_ENGINE?.getStatus) {
    return { overall: "no_data", updatedAt: null };
  }

  try {
    const payload = await env.STATUS_ENGINE.getStatus();
    return {
      overall: normalizeStatus(payload?.overall),
      updatedAt: normalizeUpdatedAt(payload?.updatedAt),
    };
  } catch {
    return { overall: "no_data", updatedAt: null };
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

  const payload = await readWorkerStatus(env);

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
