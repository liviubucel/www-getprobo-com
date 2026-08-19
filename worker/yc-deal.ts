export interface YcDealEnv {
  N8N_YC_DEAL_WEBHOOK_URL?: string;
  WEBHOOK_AUTH_USERNAME?: string;
  WEBHOOK_AUTH_PASSWORD?: string;
}

const strictEmailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;

const copy = {
  ro: {
    required: "Completează adresa de email și linkul de verificare YC.",
    invalidEmail: "Adresa de email nu este validă.",
    invalidLink: "Linkul de verificare YC nu este valid.",
    unavailable: "Solicitarea nu poate fi procesată momentan. Încearcă din nou.",
  },
  en: {
    required: "Enter your email address and YC verification link.",
    invalidEmail: "The email address is not valid.",
    invalidLink: "The YC verification link is not valid.",
    unavailable: "The request cannot be processed right now. Please try again.",
  },
} as const;

export async function handleYcDealApi(
  request: Request,
  env: YcDealEnv,
): Promise<Response | null> {
  const url = new URL(request.url);
  const pathname = normalizeApiPath(url.pathname);
  if (pathname !== "/api/yc-deal" || request.method !== "POST") return null;

  const locale = localeFromRequest(request, url);
  const t = copy[locale];

  try {
    const contentLength = Number(request.headers.get("content-length") || "0");
    if (Number.isFinite(contentLength) && contentLength > 16_384) {
      return jsonResponse({ success: false, error: t.unavailable }, 413);
    }

    const data = await request.formData();
    const email = sanitize(data.get("email")?.toString() || "").toLowerCase();
    const link = sanitize(data.get("link")?.toString() || "");

    if (!email || !link) {
      return jsonResponse({ success: false, error: t.required }, 400);
    }

    if (email.length > 254 || !strictEmailRegex.test(email)) {
      return jsonResponse({ success: false, error: t.invalidEmail }, 400);
    }

    if (link.length > 1_000 || !isYcVerificationUrl(link)) {
      return jsonResponse({ success: false, error: t.invalidLink }, 400);
    }

    const webhookUrl = env.N8N_YC_DEAL_WEBHOOK_URL?.trim();
    const username = env.WEBHOOK_AUTH_USERNAME?.trim();
    const password = env.WEBHOOK_AUTH_PASSWORD || "";
    if (!webhookUrl || !username || !password || !isHttpsUrl(webhookUrl)) {
      console.error("YC deal webhook configuration is incomplete");
      return jsonResponse({ success: false, error: t.unavailable }, 503);
    }

    const auth = btoa(`${username}:${password}`);
    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({ email, link }),
    });

    if (!webhookResponse.ok) {
      console.error("YC deal webhook rejected submission:", webhookResponse.status);
      return jsonResponse({ success: false, error: t.unavailable }, 502);
    }

    return jsonResponse({ success: true }, 200);
  } catch (error) {
    console.error("YC deal submission failed:", error);
    return jsonResponse({ success: false, error: t.unavailable }, 500);
  }
}

function isYcVerificationUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    return (
      url.protocol === "https:" &&
      (hostname === "www.ycombinator.com" || hostname === "ycombinator.com") &&
      url.pathname.startsWith("/verify/") &&
      url.pathname.length > "/verify/".length
    );
  } catch {
    return false;
  }
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function sanitize(value: string): string {
  return value.replace(/[\u0000-\u001F\u007F]/g, "").trim();
}

function normalizeApiPath(pathname: string): string {
  if (pathname === "/en/api/yc-deal") return "/api/yc-deal";
  return pathname;
}

function localeFromRequest(request: Request, url: URL): "ro" | "en" {
  const explicit = url.searchParams.get("lang")?.toLowerCase();
  if (explicit === "en") return "en";
  if (explicit === "ro") return "ro";
  if (url.pathname === "/en" || url.pathname.startsWith("/en/")) return "en";
  const language = request.headers.get("Accept-Language")?.toLowerCase() || "";
  return language.startsWith("en") ? "en" : "ro";
}

function jsonResponse(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
