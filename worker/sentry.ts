export interface SentryEnv {
  SENTRY_DSN?: string;
  SENTRY_ENVIRONMENT?: string;
}

type SentryContext = {
  request?: Request;
  component?: string;
  level?: "error" | "warning" | "info";
  status?: number;
  pagePath?: string;
};

type ClientErrorPayload = {
  type?: string;
  message?: string;
  stack?: string;
  pagePath?: string;
};

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const TOKEN_PATTERN = /(?:token|secret|authorization|password)=?[^\s&]+/gi;

function redact(value: string): string {
  return value
    .replace(EMAIL_PATTERN, "[redacted-email]")
    .replace(TOKEN_PATTERN, "[redacted-secret]")
    .slice(0, 8000);
}

function errorDetails(error: unknown): { type: string; message: string; stack?: string } {
  if (error instanceof Error) {
    return {
      type: error.name || "Error",
      message: redact(error.message || "Unknown error"),
      ...(error.stack ? { stack: redact(error.stack) } : {}),
    };
  }

  return {
    type: "Error",
    message: redact(typeof error === "string" ? error : "Unknown error"),
  };
}

function parseDsn(dsn: string): { endpoint: string } | null {
  try {
    const url = new URL(dsn);
    const publicKey = url.username;
    const projectId = url.pathname.replace(/^\/+|\/+$/g, "");
    if (!publicKey || !projectId || !url.hostname) return null;

    const endpoint = `${url.protocol}//${url.hostname}/api/${projectId}/envelope/?sentry_version=7&sentry_key=${encodeURIComponent(publicKey)}&sentry_client=zebrabyte-worker%2F1.0`;
    return { endpoint };
  } catch {
    return null;
  }
}

function requestMetadata(request?: Request): Record<string, string> | undefined {
  if (!request) return undefined;
  const url = new URL(request.url);
  return {
    method: request.method,
    url: `${url.origin}${url.pathname}`,
  };
}

export async function handleSentryClientApi(
  request: Request,
  env: SentryEnv,
): Promise<Response | null> {
  const url = new URL(request.url);
  const pathname = url.pathname.startsWith("/en/api/") ? url.pathname.slice(3) : url.pathname;
  if (pathname !== "/api/monitoring/client-error" || request.method !== "POST") {
    return null;
  }

  const contentLength = Number(request.headers.get("Content-Length") || "0");
  if (contentLength > 12_000) {
    return new Response(null, { status: 413 });
  }

  const origin = request.headers.get("Origin");
  if (origin) {
    try {
      const originUrl = new URL(origin);
      if (originUrl.origin !== url.origin) {
        return new Response(null, { status: 403 });
      }
    } catch {
      return new Response(null, { status: 403 });
    }
  }

  const fetchSite = request.headers.get("Sec-Fetch-Site")?.toLowerCase();
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "same-site") {
    return new Response(null, { status: 403 });
  }

  let payload: ClientErrorPayload;
  try {
    payload = (await request.json()) as ClientErrorPayload;
  } catch {
    return new Response(null, { status: 400 });
  }

  const message = redact(payload.message?.trim() || "").slice(0, 2000);
  if (!message) return new Response(null, { status: 400 });

  const error = new Error(message);
  error.name = redact(payload.type?.trim() || "BrowserError").slice(0, 100);
  if (payload.stack) error.stack = redact(payload.stack).slice(0, 6000);

  const pagePath = payload.pagePath?.trim() || "";
  const safePagePath = /^\/[A-Za-z0-9/_\-.]*$/.test(pagePath)
    ? pagePath.slice(0, 500)
    : undefined;

  await captureSentryException(env, error, {
    request,
    component: "browser.client",
    ...(safePagePath ? { pagePath: safePagePath } : {}),
  });

  return new Response(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function captureSentryException(
  env: SentryEnv,
  error: unknown,
  context: SentryContext = {},
): Promise<void> {
  const dsn = env.SENTRY_DSN?.trim();
  if (!dsn) return;

  const parsed = parseDsn(dsn);
  if (!parsed) {
    console.error("Invalid SENTRY_DSN configuration");
    return;
  }

  const details = errorDetails(error);
  const eventId = crypto.randomUUID().replace(/-/g, "");
  const now = new Date().toISOString();
  const request = requestMetadata(context.request);

  const event = {
    event_id: eventId,
    timestamp: now,
    platform: "javascript",
    level: context.level ?? "error",
    environment: env.SENTRY_ENVIRONMENT || "production",
    logger: "zebrabyte.cloudflare-worker",
    message: details.message,
    exception: {
      values: [
        {
          type: details.type,
          value: details.message,
        },
      ],
    },
    tags: {
      runtime: "cloudflare-worker",
      ...(context.component ? { component: context.component } : {}),
      ...(context.status ? { http_status: String(context.status) } : {}),
      ...(context.pagePath ? { page_path: context.pagePath } : {}),
    },
    ...(request ? { request } : {}),
    ...(details.stack ? { extra: { stack: details.stack } } : {}),
  };

  const envelope = [
    JSON.stringify({ event_id: eventId, sent_at: now }),
    JSON.stringify({ type: "event" }),
    JSON.stringify(event),
  ].join("\n");

  try {
    const response = await fetch(parsed.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-sentry-envelope" },
      body: envelope,
    });

    if (!response.ok) {
      console.error("Sentry envelope rejected:", response.status);
    }
  } catch (reportingError) {
    console.error("Sentry reporting failed:", reportingError);
  }
}

export async function captureSentryMessage(
  env: SentryEnv,
  message: string,
  context: SentryContext = {},
): Promise<void> {
  await captureSentryException(env, new Error(redact(message)), context);
}
