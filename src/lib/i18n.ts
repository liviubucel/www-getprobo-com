/**
 * Canonical URL for the Romanian source document.
 *
 * The public site uses Romanian at the root and English under `/en`. English
 * requests are served by the Cloudflare Worker from the same source document,
 * then receive their own canonical/hreflang metadata at the edge. Legacy `/fr`
 * paths are normalized to the root equivalent for backwards compatibility.
 */
export function getCanonicalUrl(url: URL): string {
  const baseUrl = url.origin;
  let pathname = url.pathname;

  pathname = pathname.replace(/\.html$/, "");

  if (pathname === "/index") {
    pathname = "/";
  }

  for (const prefix of ["/en", "/fr"]) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      pathname = pathname.slice(prefix.length) || "/";
      break;
    }
  }

  return `${baseUrl}${pathname}`;
}
