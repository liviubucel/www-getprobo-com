import app from "./index";
import { isEnglishPath, stripEnglishPrefix } from "./i18n";
import { localizeDateMarkup } from "./i18n-dates";
import { finalizeHtmlLocale } from "./i18n-document";
import {
  localizePlainText,
  normalizeRomanianMarkup,
  translateEnglishMarkup,
  type TranslationEnv,
  type TargetLocale,
} from "./i18n-ai";

type WorkerEnv = Parameters<typeof app.fetch>[1] & TranslationEnv;

type LocalizableKind = "html" | "xml" | "markdown" | null;

function localizableKind(response: Response): LocalizableKind {
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (contentType.includes("text/html") || contentType.includes("application/xhtml+xml")) {
    return "html";
  }
  if (
    contentType.includes("application/xml") ||
    contentType.includes("text/xml") ||
    contentType.includes("application/rss+xml") ||
    contentType.includes("application/atom+xml")
  ) {
    return "xml";
  }
  if (contentType.includes("text/markdown") || contentType.includes("text/x-markdown")) {
    return "markdown";
  }
  return null;
}

function withContentLanguage(response: Response, locale: TargetLocale): Response {
  const headers = new Headers(response.headers);
  headers.set("Content-Language", locale);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function localizeResponse(
  response: Response,
  locale: TargetLocale,
  env: WorkerEnv,
  publicUrl: URL,
): Promise<Response> {
  const kind = localizableKind(response);
  if (!kind) return response;
  if (response.status === 204 || response.status === 304) {
    return withContentLanguage(response, locale);
  }

  const source = await response.text();
  let localized = source;

  if (kind === "html" || kind === "xml") {
    localized =
      locale === "en"
        ? await translateEnglishMarkup(source, env)
        : await normalizeRomanianMarkup(source, env);
  } else {
    localized = await localizePlainText(source, locale, env);
  }

  localized = localizeDateMarkup(localized, locale);
  if (kind === "html") localized = finalizeHtmlLocale(localized, locale, publicUrl);

  const headers = new Headers(response.headers);
  headers.set("Content-Language", locale);
  headers.delete("Content-Length");
  headers.delete("Content-Encoding");
  headers.delete("ETag");

  return new Response(localized, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function legacyFrenchRedirect(request: Request): Response | null {
  const url = new URL(request.url);
  if (url.pathname !== "/fr" && !url.pathname.startsWith("/fr/")) return null;
  url.pathname = url.pathname === "/fr" ? "/" : url.pathname.slice(3) || "/";
  return Response.redirect(url.toString(), 308);
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const frenchRedirect = legacyFrenchRedirect(request);
    if (frenchRedirect) return frenchRedirect;

    const url = new URL(request.url);
    const english = isEnglishPath(url.pathname);

    if (!english) {
      const response = await app.fetch(request, env);
      if (request.method === "HEAD") {
        return localizableKind(response) ? withContentLanguage(response, "ro") : response;
      }
      return localizeResponse(response, "ro", env, url);
    }

    const upstreamUrl = new URL(request.url);
    upstreamUrl.pathname = stripEnglishPrefix(url.pathname);
    const upstreamRequest = new Request(upstreamUrl, request);
    const response = await app.fetch(upstreamRequest, env);

    if (request.method === "HEAD") {
      return localizableKind(response) ? withContentLanguage(response, "en") : response;
    }
    return localizeResponse(response, "en", env, url);
  },
};
