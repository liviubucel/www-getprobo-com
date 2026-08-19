import {
  handleMailPlatformApi,
  type MailPlatformEnv,
} from "./mail-platform";

export interface NewsletterQueueCompatEnv extends MailPlatformEnv {
  NEWSLETTER_DISPATCH_SECRET?: string;
}

type Locale = "ro" | "en";

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

function timingSafeBearer(request: Request, secret?: string): boolean {
  if (!secret) return false;
  const actual = request.headers.get("Authorization") || "";
  const expected = `Bearer ${secret}`;
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let index = 0; index < actual.length; index += 1) {
    diff |= actual.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return diff === 0;
}

function safeHtmlText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

function internalCampaignRequest(
  original: Request,
  env: NewsletterQueueCompatEnv,
  payload: Record<string, unknown>,
): Request | null {
  if (!env.MAIL_ADMIN_SECRET || !env.MAIL_QUEUE) return null;

  const url = new URL(original.url);
  url.pathname = "/api/mail/campaigns";
  url.search = "";

  const headers = new Headers({
    "Content-Type": "application/json",
    Authorization: `Bearer ${env.MAIL_ADMIN_SECRET}`,
  });
  const idempotencyKey = original.headers.get("Idempotency-Key")?.trim();
  if (idempotencyKey) headers.set("Idempotency-Key", idempotencyKey);

  return new Request(url.toString(), {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
}

export async function handleNewsletterQueueCompatApi(
  request: Request,
  env: NewsletterQueueCompatEnv,
): Promise<Response | null> {
  const url = new URL(request.url);
  const pathname = normalizeApiPath(url.pathname);

  if (
    request.method !== "POST" ||
    (pathname !== "/api/newsletter/send-announcement" &&
      pathname !== "/api/newsletter/notify-post")
  ) {
    return null;
  }

  if (!timingSafeBearer(request, env.NEWSLETTER_DISPATCH_SECRET)) {
    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
  }
  if (!env.MAIL_ADMIN_SECRET || !env.MAIL_QUEUE) {
    return jsonResponse(
      { success: false, error: "Queued newsletter delivery is not configured." },
      503,
    );
  }

  if (pathname === "/api/newsletter/send-announcement") {
    let body: {
      title?: string;
      bodyHtml?: string;
      bodyText?: string;
      locale?: Locale;
    };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return jsonResponse({ success: false, error: "Invalid JSON body." }, 400);
    }

    const internal = internalCampaignRequest(request, env, {
      subject: body.title,
      bodyHtml: body.bodyHtml,
      bodyText: body.bodyText,
      locale: body.locale === "en" ? "en" : "ro",
      messageType: "marketing",
      audience: "subscribers",
      test: false,
    });
    if (!internal) return jsonResponse({ success: false, error: "Mail queue unavailable." }, 503);
    return handleMailPlatformApi(internal, env);
  }

  let body: {
    title?: string;
    excerpt?: string;
    slug?: string;
    locale?: Locale;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonResponse({ success: false, error: "Invalid JSON body." }, 400);
  }

  const title = body.title?.trim() || "";
  const excerpt = body.excerpt?.trim() || "";
  const slug = body.slug?.trim().replace(/^\/+|\/+$/g, "") || "";
  const locale: Locale = body.locale === "en" ? "en" : "ro";

  if (!title || !slug || title.length > 200 || excerpt.length > 2_000 || slug.length > 240) {
    return jsonResponse({ success: false, error: "Invalid post data." }, 400);
  }
  if (!/^[a-z0-9][a-z0-9/_-]*$/i.test(slug)) {
    return jsonResponse({ success: false, error: "Invalid post data." }, 400);
  }

  const postPath = locale === "en" ? `/en/blog/${slug}` : `/blog/${slug}`;
  const postUrl = new URL(postPath, url.origin).toString();
  const cta = locale === "en" ? "Read the article" : "Citește articolul";
  const introduction = locale === "en" ? "We published a new article:" : "Am publicat un articol nou:";
  const bodyHtml = [
    `<p>${introduction}</p>`,
    excerpt ? `<p>${safeHtmlText(excerpt)}</p>` : "",
    `<p><a href="${safeHtmlText(postUrl)}">${cta}</a></p>`,
  ].filter(Boolean).join("");
  const bodyText = `${introduction}\n\n${excerpt ? `${excerpt}\n\n` : ""}${cta}: ${postUrl}`;

  const internal = internalCampaignRequest(request, env, {
    subject: title,
    bodyHtml,
    bodyText,
    locale,
    messageType: "marketing",
    audience: "subscribers",
    test: false,
    sourceId: `blog:${locale}:${slug}`,
  });
  if (!internal) return jsonResponse({ success: false, error: "Mail queue unavailable." }, 503);
  return handleMailPlatformApi(internal, env);
}
