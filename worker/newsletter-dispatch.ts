import { newsletterPostEmail, type EmailLocale } from "./email-templates";
import { captureSentryException, type SentryEnv } from "./sentry";

interface EmailBinding {
  send: (message: {
    from: string;
    to: string;
    subject: string;
    text: string;
    html?: string;
  }) => Promise<void>;
}

interface KvListResult {
  keys: Array<{ name: string }>;
  list_complete: boolean;
  cursor?: string;
}

interface KvNamespace {
  get: (key: string) => Promise<string | null>;
  list: (options?: { prefix?: string; cursor?: string }) => Promise<KvListResult>;
}

export interface NewsletterDispatchEnv extends SentryEnv {
  EMAIL: EmailBinding;
  NEWSLETTER: KvNamespace;
  NEWSLETTER_FROM_EMAIL: string;
  NEWSLETTER_DISPATCH_SECRET?: string;
}

type ConfirmedSubscriber = { email: string; token: string };

const strictEmailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;

export async function handleNewsletterDispatchApi(
  request: Request,
  env: NewsletterDispatchEnv,
): Promise<Response | null> {
  const url = new URL(request.url);
  const pathname = normalizeApiPath(url.pathname);

  if (pathname === "/api/newsletter/send-announcement" && request.method === "POST") {
    return handleSendAnnouncement(request, env, url);
  }

  if (pathname === "/api/newsletter/notify-post" && request.method === "POST") {
    return handleNotifyPost(request, env, url);
  }

  return null;
}

async function handleSendAnnouncement(
  request: Request,
  env: NewsletterDispatchEnv,
  url: URL,
): Promise<Response> {
  if (!isAuthorized(request, env.NEWSLETTER_DISPATCH_SECRET)) {
    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
  }

  let body: {
    title?: string;
    bodyHtml?: string;
    bodyText?: string;
    locale?: EmailLocale;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonResponse({ success: false, error: "Invalid JSON body." }, 400);
  }

  const title = body.title?.trim() || "";
  const bodyHtml = body.bodyHtml?.trim() || "";
  const bodyText = body.bodyText?.trim() || "";
  const locale: EmailLocale = body.locale === "en" ? "en" : "ro";

  if (!title || !bodyHtml || !bodyText) {
    return jsonResponse(
      { success: false, error: "Missing title, bodyHtml or bodyText." },
      400,
    );
  }

  if (title.length > 200 || bodyHtml.length > 100_000 || bodyText.length > 50_000) {
    return jsonResponse({ success: false, error: "Newsletter content is too large." }, 413);
  }

  const subscribers = await listConfirmedSubscribers(env.NEWSLETTER);
  let sent = 0;
  let failed = 0;

  for (const { email, token } of subscribers) {
    const unsubscribeUrl = newsletterUnsubscribeUrl(url, email, token, locale);
    const message = announcementEmail(title, bodyHtml, bodyText, unsubscribeUrl, locale);

    try {
      await env.EMAIL.send({
        from: env.NEWSLETTER_FROM_EMAIL,
        to: email,
        subject: message.subject,
        text: message.text,
        html: message.html,
      });
      sent += 1;
    } catch (error) {
      failed += 1;
      console.error("[newsletter/send-announcement] Failed to send to a subscriber", error);
      await captureSentryException(env, error, {
        request,
        component: "newsletter.send-announcement",
      });
    }
  }

  return jsonResponse({ success: true, sent, failed, total: subscribers.length }, 200);
}

async function handleNotifyPost(
  request: Request,
  env: NewsletterDispatchEnv,
  url: URL,
): Promise<Response> {
  if (!isAuthorized(request, env.NEWSLETTER_DISPATCH_SECRET)) {
    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
  }

  let body: { title?: string; excerpt?: string; slug?: string; locale?: EmailLocale };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonResponse({ success: false, error: "Invalid JSON body." }, 400);
  }

  const title = body.title?.trim() || "";
  const excerpt = body.excerpt?.trim() || "";
  const slug = body.slug?.trim().replace(/^\/+|\/+$/g, "") || "";
  const locale: EmailLocale = body.locale === "en" ? "en" : "ro";

  if (!title || !slug) {
    return jsonResponse({ success: false, error: "Missing title or slug." }, 400);
  }

  if (
    title.length > 200 ||
    excerpt.length > 2_000 ||
    slug.length > 240 ||
    !/^[a-z0-9][a-z0-9/_-]*$/i.test(slug)
  ) {
    return jsonResponse({ success: false, error: "Invalid post data." }, 400);
  }

  const postPath = locale === "en" ? `/en/blog/${slug}` : `/blog/${slug}`;
  const postUrl = new URL(postPath, url.origin).toString();
  const subscribers = await listConfirmedSubscribers(env.NEWSLETTER);
  let sent = 0;
  let failed = 0;

  for (const { email, token } of subscribers) {
    const unsubscribeUrl = newsletterUnsubscribeUrl(url, email, token, locale);
    const message = newsletterPostEmail(title, excerpt, postUrl, unsubscribeUrl, locale);

    try {
      await env.EMAIL.send({
        from: env.NEWSLETTER_FROM_EMAIL,
        to: email,
        subject: message.subject,
        text: message.text,
        html: message.html,
      });
      sent += 1;
    } catch (error) {
      failed += 1;
      console.error("[newsletter/notify-post] Failed to send to a subscriber", error);
      await captureSentryException(env, error, {
        request,
        component: "newsletter.notify-post",
      });
    }
  }

  return jsonResponse({ success: true, sent, failed, total: subscribers.length }, 200);
}

async function listConfirmedSubscribers(kv: KvNamespace): Promise<ConfirmedSubscriber[]> {
  const subscribers: ConfirmedSubscriber[] = [];
  let cursor: string | undefined;

  do {
    const page = await kv.list({ prefix: "confirmed:", ...(cursor ? { cursor } : {}) });
    for (const key of page.keys) {
      const email = key.name.slice("confirmed:".length).toLowerCase();
      if (!strictEmailRegex.test(email)) continue;
      const token = await kv.get(key.name);
      if (token) subscribers.push({ email, token });
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  return subscribers;
}

function newsletterUnsubscribeUrl(
  requestUrl: URL,
  email: string,
  token: string,
  locale: EmailLocale,
): string {
  const unsubscribeUrl = new URL("/api/newsletter/unsubscribe", requestUrl.origin);
  unsubscribeUrl.searchParams.set("token", token);
  unsubscribeUrl.searchParams.set("email", email);
  unsubscribeUrl.searchParams.set("lang", locale);
  return unsubscribeUrl.toString();
}

function announcementEmail(
  title: string,
  bodyHtml: string,
  bodyText: string,
  unsubscribeUrl: string,
  locale: EmailLocale,
): { subject: string; html: string; text: string } {
  const safeTitle = escapeHtml(title);
  const safeUnsubscribeUrl = escapeHtml(unsubscribeUrl);
  const footer =
    locale === "en"
      ? `You subscribed to the ZebraByte newsletter. <a href="${safeUnsubscribeUrl}" style="color:#5c5e60;">Unsubscribe</a>.`
      : `Primești acest email pentru că te-ai abonat la newsletter-ul ZebraByte. <a href="${safeUnsubscribeUrl}" style="color:#5c5e60;">Dezabonează-te</a>.`;

  const html = `<!doctype html>
<html lang="${locale}">
  <body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 0;">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background:#fdfcfb;border-radius:12px;overflow:hidden;">
          <tr><td style="background:#101214;padding:24px 32px;color:#fff;font-size:20px;font-weight:700;">ZebraByte</td></tr>
          <tr><td style="padding:32px;color:#0a0b0e;font-size:15px;line-height:1.6;"><h2 style="font-size:18px;margin:0 0 16px;">${safeTitle}</h2>${bodyHtml}</td></tr>
          <tr><td style="padding:20px 32px;border-top:1px solid #e5e7eb;color:#5c5e60;font-size:12px;line-height:1.5;">${footer}</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  return {
    subject: title,
    html,
    text: `${title}\n\n${bodyText}\n\n${locale === "en" ? "Unsubscribe" : "Dezabonare"}: ${unsubscribeUrl}`,
  };
}

function isAuthorized(request: Request, expectedSecret?: string): boolean {
  if (!expectedSecret) return false;
  const header = request.headers.get("Authorization") || "";
  return timingSafeEqual(header, `Bearer ${expectedSecret}`);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return diff === 0;
}

function normalizeApiPath(pathname: string): string {
  if (pathname === "/en/api") return "/api";
  if (pathname.startsWith("/en/api/")) return pathname.slice(3);
  return pathname;
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
