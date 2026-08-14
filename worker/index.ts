const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const strictEmailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;
const phoneRegex = /^[+]?[\d\s().-]{6,20}$/;
const ycVerifyRegex = /^https:\/\/www\.ycombinator\.com\/verify\/.+$/;

const validContactServices = new Set([
  "Cyber Security",
  "GDPR & Privacy",
  "NIS2 & Compliance",
  "Secure Managed Hosting",
  "Accesibilitate digitală",
  "Incident / urgență de securitate",
  "Platformă open-source",
  "Altceva",
]);

interface EmailBinding {
  send: (message: {
    from: string;
    to: string;
    replyTo?: string;
    subject: string;
    text: string;
    html?: string;
  }) => Promise<void>;
}

interface Env {
  ASSETS: {
    fetch: (request: Request | URL | string) => Promise<Response>;
  };
  EMAIL: EmailBinding;
  TURNSTILE_SECRET_KEY: string;
  CONTACT_TO_EMAIL: string;
  CONTACT_FROM_EMAIL: string;
  N8N_YC_DEAL_WEBHOOK_URL: string;
  WEBHOOK_AUTH_USERNAME: string;
  WEBHOOK_AUTH_PASSWORD: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/contact" && request.method === "POST") {
      return handleContact(request, env);
    }

    if (url.pathname === "/api/yc-deal" && request.method === "POST") {
      return handleYcDeal(request, env);
    }

    const isMarkdownAlternate =
      url.pathname.endsWith(".md") && !url.pathname.startsWith("/md/");

    if (
      url.pathname.startsWith("/api/") ||
      url.pathname.startsWith("/_astro/") ||
      url.pathname.startsWith("/static/") ||
      (url.pathname.match(/\.\w+$/) && !isMarkdownAlternate)
    ) {
      return env.ASSETS.fetch(request);
    }

    const accept = request.headers.get("Accept")?.toLowerCase() || "";
    if (isMarkdownAlternate || accept.includes("text/markdown")) {
      const requestPath = isMarkdownAlternate
        ? url.pathname.slice(0, -3)
        : url.pathname;
      const path = requestPath === "/" ? "" : requestPath.replace(/\/+$/, "");
      const candidates = path
        ? [`/md${path}.md`, `/md${path}/index.md`]
        : ["/md/index.md"];

      for (const candidate of candidates) {
        const response = await env.ASSETS.fetch(new URL(candidate, url.origin));

        if (response.ok) {
          const headers = new Headers(response.headers);
          headers.set("Content-Type", "text/markdown; charset=utf-8");
          addVaryAccept(headers);

          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers,
          });
        }
      }
    }

    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    addVaryAccept(headers);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};

async function handleContact(request: Request, env: Env): Promise<Response> {
  try {
    const data = await request.formData();

    const name = sanitize(data.get("name")?.toString() || "");
    const email = sanitize(data.get("email")?.toString() || "");
    const phone = sanitize(data.get("phone")?.toString() || "");
    const company = sanitize(data.get("company")?.toString() || "");
    const rawService = sanitize(data.get("service")?.toString() || "");
    const service = validContactServices.has(rawService) ? rawService : "";
    const message = sanitize(data.get("message")?.toString() || "");
    const consent = data.get("consent");
    const turnstileToken = data.get("cf-turnstile-response")?.toString() || "";

    if (!name || !email || !message || !consent) {
      return jsonResponse(
        { success: false, error: "Completează toate câmpurile obligatorii." },
        400,
      );
    }

    if (
      name.length > 100 ||
      email.length > 254 ||
      phone.length > 20 ||
      company.length > 150 ||
      message.length > 5000
    ) {
      return jsonResponse(
        { success: false, error: "Unul dintre câmpuri este prea lung." },
        400,
      );
    }

    if (!strictEmailRegex.test(email)) {
      return jsonResponse(
        { success: false, error: "Adresa de email nu este validă." },
        400,
      );
    }

    if (phone && !phoneRegex.test(phone)) {
      return jsonResponse(
        { success: false, error: "Numărul de telefon nu este valid." },
        400,
      );
    }

    if (!env.TURNSTILE_SECRET_KEY) {
      console.error("contact: TURNSTILE_SECRET_KEY is missing");
      return jsonResponse(
        {
          success: false,
          error: "Formularul este temporar indisponibil. Încearcă din nou mai târziu.",
        },
        503,
      );
    }

    const verifyResponse = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: env.TURNSTILE_SECRET_KEY,
          response: turnstileToken,
          remoteip: request.headers.get("CF-Connecting-IP") || "",
        }),
      },
    );

    const verifyData = (await verifyResponse.json()) as { success?: boolean };
    if (!verifyData.success) {
      return jsonResponse(
        {
          success: false,
          error: "Verificarea de securitate a eșuat. Încearcă din nou.",
        },
        400,
      );
    }

    const subject = `Mesaj nou ZebraByte${service ? ` — ${service}` : ""}`;
    const lines = [
      `Nume: ${name}`,
      `Email: ${email}`,
      phone && `Telefon: ${phone}`,
      company && `Companie: ${company}`,
      service && `Serviciu: ${service}`,
      "",
      "Mesaj:",
      message,
    ].filter(Boolean) as string[];

    const text = lines.join("\n");
    const html = lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("");

    await env.EMAIL.send({
      from: env.CONTACT_FROM_EMAIL,
      to: env.CONTACT_TO_EMAIL,
      replyTo: email,
      subject,
      text,
      html,
    });

    try {
      await env.EMAIL.send({
        from: env.CONTACT_FROM_EMAIL,
        to: email,
        subject: "Am primit mesajul tău — ZebraByte",
        text: `Salut ${name},\n\nAm primit mesajul tău și echipa ZebraByte îl va analiza.\n\nMesajul trimis:\n${message}\n\nZebraByte`,
        html: `<p>Salut ${escapeHtml(name)},</p><p>Am primit mesajul tău și echipa ZebraByte îl va analiza.</p><p><strong>Mesajul trimis:</strong></p><p>${escapeHtml(message)}</p><p>ZebraByte</p>`,
      });
    } catch (error) {
      console.error("contact confirmation email failed:", error);
    }

    return jsonResponse({ success: true }, 200);
  } catch (error) {
    console.error("contact submission failed:", error);
    return jsonResponse(
      { success: false, error: "A apărut o eroare la trimitere." },
      500,
    );
  }
}

async function handleYcDeal(request: Request, env: Env): Promise<Response> {
  try {
    const data = await request.formData();
    const email = data.get("email")?.toString();
    const link = data.get("link")?.toString();

    if (!email || !link) {
      return jsonResponse(
        { error: "email and verification link are required" },
        400,
      );
    }

    if (!emailRegex.test(email)) {
      return jsonResponse({ error: "invalid email format" }, 400);
    }

    if (!ycVerifyRegex.test(link)) {
      return jsonResponse({ error: "invalid verification link" }, 400);
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
      console.error(
        "cannot process yc deal submission:",
        await webhookResponse.text(),
      );
      return jsonResponse({ error: "internal server error" }, 500);
    }

    return jsonResponse({}, 200);
  } catch (error) {
    console.error("cannot process yc deal submission:", error);
    return jsonResponse({ error: "internal server error" }, 500);
  }
}

function sanitize(value: string): string {
  return value.replace(/[\x00-\x1f\x7f]/g, "").trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function addVaryAccept(headers: Headers): void {
  const vary = headers.get("Vary");
  const values = vary
    ? vary
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    : [];

  if (!values.some((value) => value.toLowerCase() === "accept")) {
    headers.set("Vary", [...values, "Accept"].join(", "));
  }
}
