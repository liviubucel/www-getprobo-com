import {
  contactConfirmationEmail,
  newsletterConfirmationEmail,
  type EmailLocale,
} from "./email-templates";

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

export interface FormsEnv {
  EMAIL: EmailBinding;
  NEWSLETTER: KvNamespace;
  TURNSTILE_SECRET_KEY: string;
  CONTACT_TO_EMAIL: string;
  CONTACT_FROM_EMAIL: string;
  NEWSLETTER_FROM_EMAIL: string;
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

const strictEmailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;
const phoneRegex = /^[+]?[\d\s().-]{6,20}$/;

const validContactServices = new Set([
  "Managed Compliance",
  "SOC 2",
  "ISO/IEC 27001",
  "GDPR & Privacy",
  "NIS2 & Compliance",
  "Cyber Security",
  "Security Assessment",
  "Website Security",
  "Email Security",
  "Incident / urgență de securitate",
  "Secure Managed Hosting",
  "Accessibility",
  "Altceva",
]);

const copy = {
  ro: {
    required: "Completează toate câmpurile obligatorii.",
    tooLong: "Unul dintre câmpuri este prea lung.",
    invalidEmail: "Adresa de email nu este validă.",
    invalidPhone: "Numărul de telefon nu este valid.",
    turnstile: "Verificarea de securitate a eșuat. Încearcă din nou.",
    contactFailed: "A apărut o eroare la trimitere.",
    consent: "Trebuie să fii de acord cu prelucrarea datelor pentru abonare.",
    subscribeFailed: "Abonarea nu a putut fi procesată.",
  },
  en: {
    required: "Please complete all required fields.",
    tooLong: "One of the fields is too long.",
    invalidEmail: "The email address is not valid.",
    invalidPhone: "The phone number is not valid.",
    turnstile: "The security verification failed. Please try again.",
    contactFailed: "An error occurred while sending your message.",
    consent: "You must agree to the data processing required for the subscription.",
    subscribeFailed: "Your subscription could not be processed.",
  },
} as const;

export async function handleZebraByteFormsApi(
  request: Request,
  env: FormsEnv,
): Promise<Response | null> {
  const url = new URL(request.url);
  const pathname = normalizeApiPath(url.pathname);
  const locale = localeFromRequest(request, url);

  if (pathname === "/api/contact" && request.method === "POST") {
    return handleContact(request, env, locale);
  }

  if (pathname === "/api/newsletter/subscribe" && request.method === "POST") {
    return handleNewsletterSubscribe(request, env, locale);
  }

  if (pathname === "/api/newsletter/confirm" && request.method === "GET") {
    return handleNewsletterConfirm(request, env, locale);
  }

  if (pathname === "/api/newsletter/unsubscribe" && request.method === "GET") {
    return handleNewsletterUnsubscribe(request, env, locale);
  }

  return null;
}

async function handleContact(
  request: Request,
  env: FormsEnv,
  locale: EmailLocale,
): Promise<Response> {
  const t = copy[locale];

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
      return jsonResponse({ success: false, error: t.required }, 400);
    }

    if (
      name.length > 100 ||
      email.length > 254 ||
      phone.length > 20 ||
      company.length > 150 ||
      rawService.length > 100 ||
      message.length > 5000
    ) {
      return jsonResponse({ success: false, error: t.tooLong }, 400);
    }

    if (!strictEmailRegex.test(email)) {
      return jsonResponse({ success: false, error: t.invalidEmail }, 400);
    }

    if (phone && !phoneRegex.test(phone)) {
      return jsonResponse({ success: false, error: t.invalidPhone }, 400);
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

    const subject = `Mesaj nou de pe zebrabyte.ro${service ? ` — ${service}` : ""}`;
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
    const html = lines
      .map((line) => `<p>${escapeHtml(line).replace(/\n/g, "<br>")}</p>`)
      .join("");

    await env.EMAIL.send({
      from: env.CONTACT_FROM_EMAIL,
      to: env.CONTACT_TO_EMAIL,
      replyTo: email,
      subject,
      text,
      html,
    });

    try {
      const confirmation = contactConfirmationEmail(name, message, locale);
      await env.EMAIL.send({
        from: env.CONTACT_FROM_EMAIL,
        to: email,
        subject: confirmation.subject,
        text: confirmation.text,
        html: confirmation.html,
      });
    } catch (error) {
      console.error("contact confirmation email failed:", error);
    }

    return jsonResponse({ success: true }, 200);
  } catch (error) {
    console.error("contact submission failed:", error);
    return jsonResponse({ success: false, error: t.contactFailed }, 500);
  }
}

async function handleNewsletterSubscribe(
  request: Request,
  env: FormsEnv,
  locale: EmailLocale,
): Promise<Response> {
  const t = copy[locale];

  try {
    const data = await request.formData();
    const email = sanitize(data.get("email")?.toString() || "").toLowerCase();
    const consent = data.get("consent");
    const turnstileToken = data.get("cf-turnstile-response")?.toString() || "";

    if (!email || email.length > 254 || !strictEmailRegex.test(email)) {
      return jsonResponse({ success: false, error: t.invalidEmail }, 400);
    }

    if (!consent) {
      return jsonResponse({ success: false, error: t.consent }, 400);
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

    const key = newsletterSubscriberKey(email);
    const existing = await env.NEWSLETTER.get<NewsletterSubscriber>(key, "json");

    if (existing?.status === "confirmed") {
      return jsonResponse({ success: true, alreadySubscribed: true }, 200);
    }

    const token = existing?.token || crypto.randomUUID();
    if (!existing) {
      const subscriber: NewsletterSubscriber = {
        email,
        status: "pending",
        token,
        createdAt: new Date().toISOString(),
        consent: {
          at: new Date().toISOString(),
          ip: request.headers.get("CF-Connecting-IP") || "",
          userAgent: request.headers.get("User-Agent") || "",
        },
      };

      await env.NEWSLETTER.put(key, JSON.stringify(subscriber), {
        expirationTtl: 7 * 24 * 60 * 60,
      });
    }

    const requestUrl = new URL(request.url);
    const confirmUrl = new URL("/api/newsletter/confirm", requestUrl.origin);
    confirmUrl.searchParams.set("token", token);
    confirmUrl.searchParams.set("email", email);
    confirmUrl.searchParams.set("lang", locale);

    const confirmation = newsletterConfirmationEmail(confirmUrl.toString(), locale);
    await env.EMAIL.send({
      from: env.NEWSLETTER_FROM_EMAIL,
      to: email,
      subject: confirmation.subject,
      text: confirmation.text,
      html: confirmation.html,
    });

    return jsonResponse(
      { success: true, confirmationRequired: true, alreadySubscribed: false },
      200,
    );
  } catch (error) {
    console.error("newsletter subscribe failed:", error);
    return jsonResponse({ success: false, error: t.subscribeFailed }, 500);
  }
}

async function handleNewsletterConfirm(
  request: Request,
  env: FormsEnv,
  locale: EmailLocale,
): Promise<Response> {
  const url = new URL(request.url);
  const email = sanitize(url.searchParams.get("email") || "").toLowerCase();
  const token = sanitize(url.searchParams.get("token") || "");

  if (!email || !strictEmailRegex.test(email) || !token) {
    return redirectNewsletterResult(url.origin, "invalid", locale);
  }

  const key = newsletterSubscriberKey(email);
  const subscriber = await env.NEWSLETTER.get<NewsletterSubscriber>(key, "json");
  if (!subscriber || !timingSafeEqual(subscriber.token, token)) {
    return redirectNewsletterResult(url.origin, "invalid", locale);
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

  return redirectNewsletterResult(url.origin, "confirmed", locale);
}

async function handleNewsletterUnsubscribe(
  request: Request,
  env: FormsEnv,
  locale: EmailLocale,
): Promise<Response> {
  const url = new URL(request.url);
  const email = sanitize(url.searchParams.get("email") || "").toLowerCase();
  const token = sanitize(url.searchParams.get("token") || "");

  if (!email || !strictEmailRegex.test(email) || !token) {
    return redirectNewsletterResult(url.origin, "invalid", locale);
  }

  const key = newsletterSubscriberKey(email);
  const subscriber = await env.NEWSLETTER.get<NewsletterSubscriber>(key, "json");
  if (!subscriber || !timingSafeEqual(subscriber.token, token)) {
    return redirectNewsletterResult(url.origin, "invalid", locale);
  }

  await Promise.all([
    env.NEWSLETTER.delete(key),
    env.NEWSLETTER.delete(`confirmed:${email}`),
  ]);

  return redirectNewsletterResult(url.origin, "unsubscribed", locale);
}

async function verifyTurnstile(
  env: FormsEnv,
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

function localeFromRequest(request: Request, url: URL): EmailLocale {
  const explicit = url.searchParams.get("lang")?.toLowerCase();
  if (explicit === "en" || explicit === "ro") return explicit;
  if (url.pathname === "/en" || url.pathname.startsWith("/en/")) return "en";

  const acceptLanguage = request.headers.get("Accept-Language")?.toLowerCase() || "";
  const entries = acceptLanguage
    .split(",")
    .map((entry) => {
      const [tag, ...parameters] = entry.trim().split(";");
      const q = parameters.find((parameter) => parameter.trim().startsWith("q="));
      const quality = q ? Number.parseFloat(q.trim().slice(2)) : 1;
      return { tag, quality: Number.isFinite(quality) ? quality : 0 };
    })
    .sort((a, b) => b.quality - a.quality);

  for (const entry of entries) {
    if (entry.tag === "en" || entry.tag.startsWith("en-")) return "en";
    if (entry.tag === "ro" || entry.tag.startsWith("ro-")) return "ro";
  }

  return "ro";
}

function normalizeApiPath(pathname: string): string {
  if (pathname === "/en/api") return "/api";
  if (pathname.startsWith("/en/api/")) return pathname.slice(3);
  return pathname;
}

function newsletterSubscriberKey(email: string): string {
  return `sub:${email.toLowerCase()}`;
}

function redirectNewsletterResult(
  origin: string,
  status: string,
  locale: EmailLocale,
): Response {
  const target = new URL(
    locale === "en" ? "/en/newsletter/rezultat" : "/newsletter/rezultat",
    origin,
  );
  target.searchParams.set("status", status);
  return Response.redirect(target.toString(), 303);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return diff === 0;
}

function sanitize(value: string): string {
  return value.replace(/[\x00-\x1f\x7f]/g, "").trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
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
