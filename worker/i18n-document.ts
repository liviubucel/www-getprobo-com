import { stripEnglishPrefix, toEnglishPath } from "./i18n";
import type { TargetLocale } from "./i18n-ai";

const PUBLIC_ORIGIN = "https://www.zebrabyte.ro";

function escapeHtmlAttribute(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function normalizePublicPath(pathname: string): string {
  let path = stripEnglishPrefix(pathname || "/");
  path = path.replace(/\.html$/, "");
  if (path === "/index") path = "/";
  return path || "/";
}

function absoluteUrl(pathname: string): string {
  const url = new URL(PUBLIC_ORIGIN);
  url.pathname = pathname;
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, pathname === "/" ? "/" : "");
}

function upsertHeadTag(html: string, pattern: RegExp, tag: string): string {
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace(/<\/head>/i, `${tag}\n</head>`);
}

function removeAlternateLanguageLinks(html: string): string {
  return html.replace(
    /<link\b(?=[^>]*\brel=["']alternate["'])(?=[^>]*\bhreflang=["'][^"']+["'])[^>]*>\s*/gi,
    "",
  );
}

export function finalizeHtmlLocale(
  html: string,
  locale: TargetLocale,
  requestUrl: URL,
): string {
  const rootPath = normalizePublicPath(requestUrl.pathname);
  const englishPath = toEnglishPath(rootPath);
  const romanianCanonical = absoluteUrl(rootPath);
  const englishCanonical = absoluteUrl(englishPath);
  const currentCanonical = locale === "en" ? englishCanonical : romanianCanonical;

  let result = html;
  if (/<html\b[^>]*\blang=["'][^"']*["']/i.test(result)) {
    result = result.replace(/<html\b([^>]*?)\blang=["'][^"']*["']([^>]*)>/i, `<html$1lang="${locale}"$2>`);
  } else {
    result = result.replace(/<html\b([^>]*)>/i, `<html$1 lang="${locale}">`);
  }

  const canonicalTag = `<link rel="canonical" href="${escapeHtmlAttribute(currentCanonical)}" />`;
  result = upsertHeadTag(
    result,
    /<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/i,
    canonicalTag,
  );

  const ogLocale = locale === "en" ? "en_GB" : "ro_RO";
  result = upsertHeadTag(
    result,
    /<meta\b(?=[^>]*(?:property|name)=["']og:locale["'])[^>]*>/i,
    `<meta property="og:locale" content="${ogLocale}" />`,
  );
  result = upsertHeadTag(
    result,
    /<meta\b(?=[^>]*(?:property|name)=["']og:url["'])[^>]*>/i,
    `<meta property="og:url" content="${escapeHtmlAttribute(currentCanonical)}" />`,
  );

  result = removeAlternateLanguageLinks(result);
  const alternates = [
    `<link rel="alternate" hreflang="ro" href="${escapeHtmlAttribute(romanianCanonical)}" />`,
    `<link rel="alternate" hreflang="en" href="${escapeHtmlAttribute(englishCanonical)}" />`,
    `<link rel="alternate" hreflang="x-default" href="${escapeHtmlAttribute(romanianCanonical)}" />`,
  ].join("\n");
  result = result.replace(/<\/head>/i, `${alternates}\n</head>`);

  return result;
}
