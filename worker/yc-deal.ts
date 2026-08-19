export interface YcDealEnv {
  TURNSTILE_SECRET_KEY: string;
  N8N_YC_DEAL_WEBHOOK_URL: string;
  WEBHOOK_AUTH_USERNAME: string;
  WEBHOOK_AUTH_PASSWORD: string;
}

const strictEmailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;
const ycVerifyRegex = /^https:\/\/www\.ycombinator\.com\/verify\/[A-Za-z0-9._~!$&'()*+,;=:@%/?#-]+$/;

const copy = {
  ro: {
    required: "Completează emailul și linkul de verificare YC.",
    invalidEmail: "Adresa de email nu este validă.",
    invalidLink: "Linkul de verificare YC nu este valid.",
    turnstile: "Verificarea de securitate a eșuat. Încearcă din nou.",
    unavailable: "Solicitarea nu poate fi procesată momentan. Încearcă din nou.",
  },
  en: {
    required: "Enter your email and YC verification link.",
    invalidEmail: "The email address is not valid.",
    invalidLink: "The YC verification link is not valid.",
    turnstile: "Security verification failed. Please try again.",
    unavailable: "Your request cannot be processed right now. Please try again.",
  },
} as const;

type Locale = keyof typeof copy;

export async function handleYcDealApi(
  request: Request,
  env: YcDealEnv,
): Promise<Response | null> {
  const url = new URL(request.url);
  const pathname = url.pathname.startsWith("/en/api/")
    ? url.pathname.slice(3)
    : url.pathname;

  if (pathname !== "/api/yc-deal" || request.method !== "POST") return null;

  const locale = requestLocale(request);
  const t = copy[locale];

  try {
    const data = await request.formData();
    const email = sanitize(data.get("email")?.toString() || "").toLowerCase();
    const link = sanitize(data.get("link")?.toString() || "");
    const turnstileToken = data.get("cf-turnstile-response")?.toString() || "";

    if (!email || !link) {
      return jsonResponse({ success: false, error: t.required }, 400);
    }

    if (email.length > 254 || !strictEmailRegex.test(email)) {
      return jsonResponse({ success: false, error: t.invalidEmail }, 400);
    }

    if (link.length > 1000 || !ycVerifyRegex.test(link)) {
      return jsonResponse({ success: false, error: t.invalidLink }, 400);
    }

    if (
      !(await verifyTurnstile(
        env,
        turnstileToken,
        request.headers.get("CF-Connecting-IP") || "",
      ))
    ) {
      return jsonResponse({ success: false, error: t.turnstile }, 400);
    }

    if (
      !env.N8N_YC_DEAL_WEBHOOK_URL ||
      !env.WEBHOOK_AUTH_USERNAME ||
      !env.WEBHOOK_AUTH_PASSWORD
    ) {
      console.error("YC deal webhook configuration is incomplete");
      return jsonResponse({ success: false, error: t.unavailable }, 503);
    }

    const auth = btoa(`${env.WEBHOOK_AUTH_USERNAME}:${env.WEBHOOK_AUTH_PASSWORD}`);
    const webhookResponse = await fetch(env.N8N_YC_DEAL_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({ email, link }),
    });

    if (!webhookResponse.ok) {
      console.error("YC deal webhook failed:", webhookResponse.status);
      return jsonResponse({ success: false, error: t.unavailable }, 502);
    }

    return jsonResponse({ success: true }, 200);
  } catch (error) {
    console.error("YC deal submission failed:", error);
    return jsonResponse({ success: false, error: t.unavailable }, 500);
  }
}

async function verifyTurnstile(
  env: Pick<YcDealEnv, "TURNSTILE_SECRET_KEY">,
  token: string,
  remoteIp: string,
): Promise<boolean> {
  if (!env.TURNSTILE_SECRET_KEY || !token) return false;

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: env.TURNSTILE_SECRET_KEY,
          response: token,
          remoteip: remoteIp,
        }),
      },
    );
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch (error) {
    console.error("YC Turnstile verification failed:", error);
    return false;
  }
}

function requestLocale(request: Request): Locale {
  const language = request.headers.get("Accept-Language")?.toLowerCase() || "";
  return language.startsWith("en") ? "en" : "ro";
}

function sanitize(value: string): string {
  return value.replace(/[\x00-\x1f\x7f]/g, "").trim();
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
