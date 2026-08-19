export interface UpmindWebhookGuardEnv {
  UPMIND_WEBHOOK_ALLOWED_IPS?: string;
}

function normalizeApiPath(pathname: string): string {
  if (pathname === "/en/api") return "/api";
  if (pathname.startsWith("/en/api/")) return pathname.slice(3);
  return pathname;
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export function guardUpmindWebhookSource(
  request: Request,
  env: UpmindWebhookGuardEnv,
): Response | null {
  const url = new URL(request.url);
  const pathname = normalizeApiPath(url.pathname);
  if (pathname !== "/api/mail/upmind-webhook" || request.method !== "POST") {
    return null;
  }

  const configured = env.UPMIND_WEBHOOK_ALLOWED_IPS?.trim();
  if (!configured) {
    return jsonResponse({ success: false, error: "Webhook source allowlist is not configured." }, 503);
  }

  const allowed = new Set(
    configured
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
  const sourceIp = request.headers.get("CF-Connecting-IP")?.trim() || "";

  if (!sourceIp || !allowed.has(sourceIp)) {
    return jsonResponse({ success: false, error: "Forbidden." }, 403);
  }

  return null;
}
