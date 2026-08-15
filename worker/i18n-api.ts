import {
  localizePlainText,
  normalizeRomanianMarkup,
  translateEnglishMarkup,
  type TargetLocale,
  type TranslationEnv,
} from "./i18n-ai";

type EmailMessage = {
  from: string;
  to: string;
  replyTo?: string;
  subject: string;
  text: string;
  html?: string;
};

type EmailBinding = {
  send: (message: EmailMessage) => Promise<void>;
};

type EnvWithEmail = TranslationEnv & {
  EMAIL: EmailBinding;
};

const semanticJsonKeys = new Set([
  "error",
  "message",
  "detail",
  "description",
  "title",
  "reason",
]);

export function apiLocaleFromRequest(
  request: Request,
  englishPath = false,
): TargetLocale {
  const url = new URL(request.url);
  const explicit = url.searchParams.get("lang")?.toLowerCase();
  if (explicit === "en" || explicit === "ro") return explicit;
  if (englishPath) return "en";

  const acceptLanguage = request.headers.get("Accept-Language")?.toLowerCase() ?? "";
  const languages = acceptLanguage
    .split(",")
    .map((entry) => {
      const [tag, ...parameters] = entry.trim().split(";");
      const q = parameters
        .map((parameter) => parameter.trim())
        .find((parameter) => parameter.startsWith("q="));
      const quality = q ? Number.parseFloat(q.slice(2)) : 1;
      return { tag, quality: Number.isFinite(quality) ? quality : 0 };
    })
    .sort((a, b) => b.quality - a.quality);

  for (const language of languages) {
    if (language.tag === "ro" || language.tag.startsWith("ro-")) return "ro";
    if (language.tag === "en" || language.tag.startsWith("en-")) return "en";
  }

  return "ro";
}

function addVaryAcceptLanguage(headers: Headers) {
  const existing = headers.get("Vary")
    ?.split(",")
    .map((value) => value.trim())
    .filter(Boolean) ?? [];

  if (!existing.some((value) => value.toLowerCase() === "accept-language")) {
    headers.set("Vary", [...existing, "Accept-Language"].join(", "));
  }
}

function withLocaleHeaders(response: Response, locale: TargetLocale): Headers {
  const headers = new Headers(response.headers);
  headers.set("Content-Language", locale);
  addVaryAcceptLanguage(headers);
  return headers;
}

function rewriteNewsletterLocaleLinks(value: string, locale: TargetLocale): string {
  return value.replace(
    /(\/api\/newsletter\/(?:confirm|unsubscribe)\?)([^\s"'<>]*)/g,
    (_match, prefix: string, rawQuery: string) => {
      const htmlEscaped = rawQuery.includes("&amp;");
      const query = rawQuery.replace(/&amp;/g, "&");
      const params = new URLSearchParams(query);
      params.set("lang", locale);
      const serialized = params.toString();
      return `${prefix}${htmlEscaped ? serialized.replace(/&/g, "&amp;") : serialized}`;
    },
  );
}

async function localizeEmailText(
  text: string,
  locale: TargetLocale,
  env: TranslationEnv,
): Promise<string> {
  const withLocaleLinks = rewriteNewsletterLocaleLinks(text, locale);
  const protectedUrls = withLocaleLinks.replace(
    /(https?:\/\/[^\s<>]+)/g,
    (url) => `\`${url}\``,
  );
  const localized = await localizePlainText(protectedUrls, locale, env);
  return localized.replace(/`(https?:\/\/[^`]+)`/g, "$1");
}

async function localizeEmailHtml(
  html: string,
  locale: TargetLocale,
  env: TranslationEnv,
): Promise<string> {
  const withLocaleLinks = rewriteNewsletterLocaleLinks(html, locale);
  const wrapperStart = '<div data-zbt-email-i18n="1">';
  const wrapperEnd = "</div>";
  const wrapped = `${wrapperStart}${withLocaleLinks}${wrapperEnd}`;
  const localized =
    locale === "en"
      ? await translateEnglishMarkup(wrapped, env)
      : await normalizeRomanianMarkup(wrapped, env);

  const start = localized.indexOf(wrapperStart);
  const end = localized.lastIndexOf(wrapperEnd);
  if (start === -1 || end === -1 || end < start) return withLocaleLinks;
  return localized.slice(start + wrapperStart.length, end);
}

async function localizeEmailMessage(
  message: EmailMessage,
  locale: TargetLocale,
  env: TranslationEnv,
): Promise<EmailMessage> {
  const subject = await localizePlainText(message.subject, locale, env);
  const text = await localizeEmailText(message.text, locale, env);
  const html = message.html
    ? await localizeEmailHtml(message.html, locale, env)
    : undefined;

  return {
    ...message,
    subject,
    text,
    ...(html ? { html } : {}),
  };
}

export function withLocalizedEmailEnv<T extends EnvWithEmail>(
  env: T,
  locale: TargetLocale,
): T {
  const baseEmail = env.EMAIL;
  const localizedEmail: EmailBinding = {
    async send(message) {
      const localized = await localizeEmailMessage(message, locale, env);
      await baseEmail.send(localized);
    },
  };

  return {
    ...env,
    EMAIL: localizedEmail,
  } as T;
}

async function localizeJsonNode(
  value: unknown,
  locale: TargetLocale,
  env: TranslationEnv,
  key?: string,
): Promise<unknown> {
  if (typeof value === "string") {
    if (!key || !semanticJsonKeys.has(key)) return value;
    return localizePlainText(value, locale, env);
  }

  if (Array.isArray(value)) {
    return Promise.all(value.map((item) => localizeJsonNode(item, locale, env, key)));
  }

  if (!value || typeof value !== "object") return value;

  const result: Record<string, unknown> = {};
  for (const [childKey, childValue] of Object.entries(value as Record<string, unknown>)) {
    result[childKey] = await localizeJsonNode(childValue, locale, env, childKey);
  }
  return result;
}

function localizeNewsletterRedirect(
  response: Response,
  locale: TargetLocale,
): Response | null {
  if (response.status < 300 || response.status >= 400) return null;
  const location = response.headers.get("Location");
  if (!location) return null;

  const target = new URL(location);
  if (target.pathname !== "/newsletter/rezultat") return null;
  target.pathname = locale === "en" ? "/en/newsletter/rezultat" : "/newsletter/rezultat";

  const headers = withLocaleHeaders(response, locale);
  headers.set("Location", target.toString());
  return new Response(null, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function localizeApiResponse(
  response: Response,
  locale: TargetLocale,
  env: TranslationEnv,
): Promise<Response> {
  const redirect = localizeNewsletterRedirect(response, locale);
  if (redirect) return redirect;

  const headers = withLocaleHeaders(response, locale);
  if (response.status === 204 || response.status === 304 || !response.body) {
    return new Response(null, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  const contentType = response.headers.get("Content-Type")?.toLowerCase() ?? "";

  if (contentType.includes("application/json")) {
    const raw = await response.text();
    try {
      const parsed = JSON.parse(raw);
      const localized = await localizeJsonNode(parsed, locale, env);
      headers.delete("Content-Length");
      headers.delete("Content-Encoding");
      headers.delete("ETag");
      return new Response(JSON.stringify(localized), {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch {
      return new Response(raw, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }
  }

  if (contentType.includes("text/plain")) {
    const raw = await response.text();
    const localized = await localizePlainText(raw, locale, env);
    headers.delete("Content-Length");
    headers.delete("Content-Encoding");
    headers.delete("ETag");
    return new Response(localized, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
