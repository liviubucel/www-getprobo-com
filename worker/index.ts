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

interface KvNamespace {
  get: <T = string>(key: string, type?: "json") => Promise<T | null>;
  put: (
    key: string,
    value: string,
    options?: { expirationTtl?: number },
  ) => Promise<void>;
  delete: (key: string) => Promise<void>;
}

interface NewsletterSubscriber {
  email: string;
  status: "pending" | "confirmed";
  token: string;
  createdAt: string;
  confirmedAt?: string;
  consent: {
    at: string;
    ip: string;
    userAgent: string;
  };
}

interface Env {
  ASSETS: {
    fetch: (request: Request | URL | string) => Promise<Response>;
  };
  EMAIL: EmailBinding;
  NEWSLETTER: KvNamespace;
  TURNSTILE_SECRET_KEY: string;
  CONTACT_TO_EMAIL: string;
  CONTACT_FROM_EMAIL: string;
  NEWSLETTER_FROM_EMAIL: string;
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

    if (url.pathname === "/api/newsletter/subscribe" && request.method === "POST") {
      return handleNewsletterSubscribe(request, env);
    }

    if (url.pathname === "/api/newsletter/confirm" && request.method === "GET") {
      return handleNewsletterConfirm(request, env);
    }

    if (url.pathname === "/api/newsletter/unsubscribe" && request.method === "GET") {
      return handleNewsletterUnsubscribe(request, env);
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

    const turnstileOk = await verifyTurnstile(
      env,
      turnstileToken,
      request.headers.get("CF-Connecting-IP") || "",
    );
    if (!turnstileOk) {
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

async function handleNewsletterSubscribe(
  request: Request,
  env: Env,
): Promise<Response> {
  try {
    const data = await request.formData();
    const email = sanitize(data.get("email")?.toString() || "").toLowerCase();
    const consent = data.get("consent");
    const turnstileToken = data.get("cf-turnstile-response")?.toString() || "";

    if (!email || email.length > 254 || !strictEmailRegex.test(email)) {
      return jsonResponse(
        { success: false, error: "Adresa de email nu este validă." },
        400,
      );
    }

    if (!consent) {
      return jsonResponse(
        {
          success: false,
          error: "Trebuie să fii de acord cu prelucrarea datelor pentru abonare.",
        },
        400,
      );
    }

    const turnstileOk = await verifyTurnstile(
      env,
      turnstileToken,
      request.headers.get("CF-Connecting-IP") || "",
    );
    if (!turnstileOk) {
      return jsonResponse(
        {
          success: false,
          error: "Verificarea de securitate a eșuat. Încearcă din nou.",
        },
        400,
      );
    }

    const key = newsletterSubscriberKey(email);
    const existing = await env.NEWSLETTER.get<NewsletterSubscriber>(key, "json");
    if (existing?.status === "confirmed") {
      return jsonResponse({ success: true, alreadySubscribed: true }, 200);
    }

    const token = existing?.token || crypto.randomUUID();
    const subscriber: NewsletterSubscriber = {
      email,
      status: "pending",
      token,
      createdAt: existing?.createdAt || new Date().toISOString(),
      consent: {
        at: new Date().toISOString(),
        ip: request.headers.get("CF-Connecting-IP") || "",
        userAgent: request.headers.get("User-Agent") || "",
      },
    };

    await env.NEWSLETTER.put(key, JSON.stringify(subscriber), {
      expirationTtl: 7 * 24 * 60 * 60,
    });

    const url = new URL(request.url);
    const confirmUrl = new URL("/api/newsletter/confirm", url.origin);
    confirmUrl.searchParams.set("token", token);
    confirmUrl.searchParams.set("email", email);

    const unsubscribeUrl = new URL("/api/newsletter/unsubscribe", url.origin);
    unsubscribeUrl.searchParams.set("token", token);
    unsubscribeUrl.searchParams.set("email", email);

    await env.EMAIL.send({
      from: env.NEWSLETTER_FROM_EMAIL,
      to: email,
      subject: "Confirmă abonarea la ZebraByte",
      text: `Confirmă abonarea la newsletter-ul ZebraByte:\n${confirmUrl.toString()}\n\nDacă nu ai solicitat această abonare, ignoră mesajul.`,
      html: `<p>Confirmă abonarea la newsletter-ul ZebraByte.</p><p><a href="${escapeHtml(confirmUrl.toString())}">Confirmă abonarea</a></p><p>Dacă nu ai solicitat această abonare, poți ignora mesajul.</p><p style="font-size:12px;color:#666">Unsubscribe: <a href="${escapeHtml(unsubscribeUrl.toString())}">${escapeHtml(unsubscribeUrl.toString())}</a></p>`,
    });

    return jsonResponse({ success: true, confirmationRequired: true }, 200);
  } catch (error) {
    console.error("newsletter subscribe failed:", error);
    return jsonResponse(
      { success: false, error: "Abonarea nu a putut fi procesată." },
      500,
    );
  }
}

async function handleNewsletterConfirm(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url);
  const email = sanitize(url.searchParams.get("email") || "").toLowerCase();
  const token = sanitize(url.searchParams.get("token") || "");

  if (!email || !strictEmailRegex.test(email) || !token) {
    return redirectNewsletterResult(url.origin, "invalid");
  }

  const key = newsletterSubscriberKey(email);
  const subscriber = await env.NEWSLETTER.get<NewsletterSubscriber>(key, "json");
  if (!subscriber || subscriber.token !== token) {
    return redirectNewsletterResult(url.origin, "invalid");
  }

  const confirmed: NewsletterSubscriber = {
    ...subscriber,
    status: "confirmed",
    confirmedAt: subscriber.confirmedAt || new Date().toISOString(),
  };

  await Promise.all([
    env.NEWSLETTER.put(key, JSON.stringify(confirmed)),
    env.NEWSLETTER.put(`confirmed:${email}`, token),
  ]);

  return redirectNewsletterResult(url.origin, "confirmed");
}

async function handleNewsletterUnsubscribe(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url);
  const email = sanitize(url.searchParams.get("email") || "").toLowerCase();
  const token = sanitize(url.searchParams.get("token") || "");

  if (!email || !strictEmailRegex.test(email) || !token) {
    return redirectNewsletterResult(url.origin, "invalid");
  }

  const key = newsletterSubscriberKey(email);
  const subscriber = await env.NEWSLETTER.get<NewsletterSubscriber>(key, "json");
  if (!subscriber || subscriber.token !== token) {
    return redirectNewsletterResult(url.origin, "invalid");
  }

  await Promise.all([
    env.NEWSLETTER.delete(key),
    env.NEWSLETTER.delete(`confirmed:${email}`),
  ]);

  return redirectNewsletterResult(url.origin, "unsubscribed");
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

async function verifyTurnstile(
  env: Env,
  token: string,
  remoteIp: string,
): Promise<boolean> {
  if (!env.TURNSTILE_SECRET_KEY || !token) {
    console.error("Turnstile secret or token missing");
    return false;
  }

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
    console.error("Turnstile verification failed:", error);
    return false;
  }
}

function newsletterSubscriberKey(email: string): string {
  return `sub:${email.toLowerCase()}`;
}

function redirectNewsletterResult(origin: string, status: string): Response {
  const target = new URL("/newsletter/rezultat", origin);
  target.searchParams.set("status", status);
  return Response.redirect(target.toString(), 303);
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
