import { resolveRedirect } from "../src/lib/redirects.mjs";
import { isEnglishPath, stripEnglishPrefix, toEnglishPath } from "./i18n";

export function configuredRedirect(request: Request): Response | null {
  if (request.method !== "GET" && request.method !== "HEAD") return null;

  const url = new URL(request.url);
  const english = isEnglishPath(url.pathname);
  const lookupPath = english ? stripEnglishPrefix(url.pathname) : url.pathname;
  const rule = resolveRedirect(lookupPath);
  if (!rule) return null;

  const target = new URL(rule.destination, url.origin);
  if (english && target.origin === url.origin) {
    target.pathname = toEnglishPath(target.pathname);
  }
  if (!target.search && url.search) target.search = url.search;

  return new Response(null, {
    status: rule.status,
    headers: {
      Location: target.toString(),
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
