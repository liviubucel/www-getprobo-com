import app from "./index";
import { legacyWixBlogRedirects } from "./blog-legacy-redirects";
import { isEnglishPath, stripEnglishPrefix, toEnglishPath } from "./i18n";
import {
  apiLocaleFromRequest,
  localizeApiResponse,
  withLocalizedEmailEnv,
} from "./i18n-api";
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

const localizablePublicTextPath = /^\/(?:llms|llms-docs|llms-full)\.txt$/i;

// These pages are authored natively in Romanian. Returning the static asset body
// directly keeps Cloudflare streaming intact and lets the browser discover CSS,
// images and scripts immediately instead of waiting for a full HTML translation pass.
const nativeRomanianHtmlPaths = new Set([
  "/",
  "/hub",
  "/hub/compliance-recommender",
  "/blog",
  "/changelog",
  "/tools",
  "/contact",
  "/newsletter",
  "/recenzii-video",
]);

function normalizedPathname(pathname: string): string {
  if (pathname === "/") return "/";
  return pathname.replace(/\/+$/, "") || "/";
}

function isNativeRomanianHtmlPath(pathname: string): boolean {
  const normalized = normalizedPathname(pathname);
  if (nativeRomanianHtmlPaths.has(normalized)) return true;
  if (/^\/blog\/page\/\d+$/i.test(normalized)) return true;
  if (/^\/blog\/categorie\/[^/]+$/i.test(normalized)) return true;
  return false;
}

function isLocalizablePublicTextPath(pathname: string): boolean {
  return localizablePublicTextPath.test(stripEnglishPrefix(pathname));
}

function localizableKind(response: Response, publicUrl?: URL): LocalizableKind {
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
  if (
    publicUrl &&
    contentType.includes("text/plain") &&
    isLocalizablePublicTextPath(publicUrl.pathname)
  ) {
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

function rewriteLocalizedTextLinks(value: string, locale: TargetLocale): string {
  return value.replace(
    /https:\/\/(?:www\.)?zebrabyte\.ro(?:\/[^\s)\]}>"']*)?/gi,
    (raw) => {
      try {
        const url = new URL(raw);
        url.hostname = "www.zebrabyte.ro";
        url.pathname =
          locale === "en"
            ? toEnglishPath(url.pathname || "/")
            : stripEnglishPrefix(url.pathname || "/");
        return url.toString();
      } catch {
        return raw;
      }
    },
  );
}

async function localizeResponse(
  response: Response,
  locale: TargetLocale,
  env: WorkerEnv,
  publicUrl: URL,
): Promise<Response> {
  const kind = localizableKind(response, publicUrl);
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
    if (isLocalizablePublicTextPath(publicUrl.pathname)) {
      localized = rewriteLocalizedTextLinks(localized, locale);
    }
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

function legacyWixBlogRedirect(request: Request): Response | null {
  if (request.method !== "GET" && request.method !== "HEAD") return null;

  const url = new URL(request.url);
  const english = isEnglishPath(url.pathname);
  const normalizedPath = english ? stripEnglishPrefix(url.pathname) : url.pathname;
  const match = normalizedPath.match(
    /^\/(?:ro\/)?blog\/blogul-nostru-1\/([a-z0-9][a-z0-9-]*?)-(\d+)\/?$/i,
  );
  if (!match) return null;

  const baseSlug = match[1].toLowerCase();
  const legacyKey = `${baseSlug}-${match[2]}`;
  const targetSlug = legacyWixBlogRedirects[legacyKey] ?? baseSlug;
  url.pathname = english ? `/en/blog/${targetSlug}` : `/blog/${targetSlug}`;
  return Response.redirect(url.toString(), 301);
}

function isApiRequestPath(pathname: string): boolean {
  const normalized = isEnglishPath(pathname) ? stripEnglishPrefix(pathname) : pathname;
  return normalized === "/api" || normalized.startsWith("/api/");
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const frenchRedirect = legacyFrenchRedirect(request);
    if (frenchRedirect) return frenchRedirect;

    const wixBlogRedirect = legacyWixBlogRedirect(request);
    if (wixBlogRedirect) return wixBlogRedirect;

    const url = new URL(request.url);
    const english = isEnglishPath(url.pathname);
    const apiRequest = isApiRequestPath(url.pathname);
    const apiLocale = apiRequest ? apiLocaleFromRequest(request, english) : null;
    const requestEnv = apiLocale ? withLocalizedEmailEnv(env, apiLocale) : env;

    if (!english) {
      const response = await app.fetch(request, requestEnv);
      if (apiLocale) return localizeApiResponse(response, apiLocale, env);
      const kind = localizableKind(response, url);
      if (request.method === "HEAD") {
        return kind ? withContentLanguage(response, "ro") : response;
      }
      if (kind === "html" && isNativeRomanianHtmlPath(url.pathname)) {
        return withContentLanguage(response, "ro");
      }
      return localizeResponse(response, "ro", env, url);
    }

    const upstreamUrl = new URL(request.url);
    upstreamUrl.pathname = stripEnglishPrefix(url.pathname);
    const upstreamRequest = new Request(upstreamUrl, request);
    const response = await app.fetch(upstreamRequest, requestEnv);

    if (apiLocale) return localizeApiResponse(response, apiLocale, env);
    if (request.method === "HEAD") {
      return localizableKind(response, url) ? withContentLanguage(response, "en") : response;
    }
    return localizeResponse(response, "en", env, url);
  },
};
