/**
 * Redirects an entire moved documentation section with a single wildcard
 * rule instead of one rule per file.
 * @param {string} fromPrefix
 * @param {string} toPrefix
 * @returns {Record<string, { status: 301; destination: string }>}
 */
function movedDocsRedirects(fromPrefix, toPrefix) {
  return {
    [fromPrefix]: redirect(toPrefix),
    [`${fromPrefix}/*`]: { status: 301, destination: `${toPrefix}/:splat` },
  };
}

/**
 * @param {string} destination
 * @returns {{ status: 301; destination: string }}
 */
const redirect = (destination) => ({ status: 301, destination });

/**
 * Single source of truth for public permanent redirects. The same table is
 * consumed by the Cloudflare Worker and by tools/generate-redirects.mjs.
 */
export const redirects = {
  "/sitemap.xml": redirect("/sitemap-index.xml"),
  "/subprocessors": redirect("https://trust.zebrabyte.ro/subprocessors"),
  "/compliance-guides": redirect("/hub"),
  "/compliance-guides/soc2": redirect("/soc2"),
  "/compliance-guides/iso27001": redirect("/iso-27001"),
  "/wall-of-trust": redirect("/love-from-customer"),
  "/blog/page/1": redirect("/blog"),
  "/probo-newsletter": redirect("/newsletter"),
  "/products/compliance-portal": redirect("/compliance-portal"),
  "/hub/probo-vs-vanta": redirect("/hub/zebrabyte-vs-vanta"),
  "/hub/probo-vs-fractional-ciso": redirect(
    "/hub/zebrabyte-vs-fractional-ciso",
  ),
  "/accesibilitate": redirect("/accessibility"),
  "/am-fost-atacat-cibernetic": redirect("/incident-response"),
  "/cyber-audit": redirect("/security-assessment"),
  "/securitate-website": redirect("/website-security"),
  "/hosting": redirect("/secure-hosting"),
  "/despre-noi": redirect("/about"),
  "/securitate": redirect("/security"),
  "/appointment": redirect("/programare"),
  "/industrii": redirect("/industries"),
  "/parteneriate": redirect("/partnerships"),

  // Retained French compatibility routes. Specific patterns must stay before
  // the catch-all so identifiers are preserved when a legacy URL is followed.
  "/fr": redirect("/"),
  "/fr/about": redirect("/about"),
  "/fr/blog": redirect("/blog"),
  "/fr/blog/[id]": redirect("/blog/[id]"),
  "/fr/blog/page/[page]": redirect("/blog/page/[page]"),
  "/fr/brand": redirect("/brand"),
  "/fr/compliance-guides": redirect("/hub"),
  "/fr/contact": redirect("/contact"),
  "/fr/cookie-policy": redirect("/cookie-policy"),
  "/fr/privacy": redirect("/privacy"),
  "/fr/stories": redirect("/stories"),
  "/fr/stories/[id]": redirect("/stories/[id]"),
  "/fr/terms": redirect("/terms"),
  "/fr/yc": redirect("/yc"),
  "/fr/*": redirect("/:splat"),

  ...movedDocsRedirects(
    "/docs/getting-started",
    "/docs/product/getting-started",
  ),
  ...movedDocsRedirects("/docs/cli", "/docs/developers/cli"),
  ...movedDocsRedirects("/docs/api", "/docs/developers/api"),
  ...Object.fromEntries(
    [
      ["controls", "control"],
      ["findings", "finding"],
      ["frameworks", "framework"],
      ["organizations", "org"],
      ["risks", "risk"],
      ["users", "user"],
      ["webhooks", "webhook"],
    ].map(([from, to]) => [
      `/docs/developers/cli/commands/${from}`,
      redirect(`/docs/developers/cli/commands/${to}`),
    ]),
  ),
  ...movedDocsRedirects("/docs/self-hosting", "/docs/deployment/self-hosting"),
  "/docs/developers/api/n8n/graphql": redirect(
    "/docs/developers/api/n8n/resources/execute",
  ),
  ...movedDocsRedirects(
    "/docs/configuration",
    "/docs/deployment/configuration",
  ),
  "/docs/product/probo-agent/contributing": redirect(
    "/docs/developers/api/agent/contributing",
  ),
  "/docs/product/probo-agent/installation": redirect(
    "/docs/product/probo-agent/macos",
  ),
  "/docs/product/probo-agent/desktop-install": redirect(
    "/docs/product/probo-agent/macos",
  ),
  "/docs/product/probo-agent/server-install": redirect(
    "/docs/product/probo-agent/linux",
  ),
  "/docs/product/access-review/infrastructure-security": redirect(
    "/docs/deployment/infrastructure-security",
  ),
  "/docs/product/access-review/clerk": redirect(
    "/docs/product/access-review/directory",
  ),
  ...Object.fromEntries(
    Object.entries({
      assets: "assets-and-data",
      audits: "audits-and-findings",
      controls: "frameworks-and-controls",
      "data-classification": "assets-and-data",
      documents: "documents-and-approvals",
      dpias: "privacy",
      findings: "audits-and-findings",
      frameworks: "frameworks-and-controls",
      measures: "measures-tasks-and-evidence",
      obligations: "obligations",
      organizations: "organizations",
      "processing-activities": "privacy",
      risks: "risks",
      "states-of-applicability": "statements-of-applicability",
      tasks: "measures-tasks-and-evidence",
      "third-parties": "third-parties",
      tias: "privacy",
      users: "identity-and-provisioning",
    }).map(([from, to]) => [
      `/docs/developers/api/mcp/tools/${from}`,
      redirect(`/docs/developers/api/mcp/tools/catalog/${to}`),
    ]),
  ),
};

function normalizePathname(pathname) {
  if (pathname === "/") return "/";
  return pathname.replace(/\/+$/, "") || "/";
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function resolveParameterizedRedirect(source, destination, pathname) {
  const names = [];
  let cursor = 0;
  let pattern = "^";
  for (const match of source.matchAll(/\[([^\]]+)\]/g)) {
    pattern += escapeRegExp(source.slice(cursor, match.index));
    pattern += "([^/]+)";
    names.push(match[1]);
    cursor = match.index + match[0].length;
  }
  pattern += `${escapeRegExp(source.slice(cursor))}$`;

  const match = pathname.match(new RegExp(pattern));
  if (!match) return null;

  let resolved = destination;
  names.forEach((name, index) => {
    const value = match[index + 1] ?? "";
    resolved = resolved.replaceAll(`[${name}]`, value).replaceAll(`:${name}`, value);
  });
  return resolved;
}

/**
 * Resolve one pathname using the exact same redirect table used to generate
 * public/_redirects. This is required when Cloudflare runs the Worker before
 * static assets, because asset redirect rules are not guaranteed to execute.
 * @param {string} pathname
 * @returns {{ status: 301; destination: string } | null}
 */
export function resolveRedirect(pathname) {
  const normalized = normalizePathname(pathname);
  const exact = redirects[normalized];
  if (exact && !normalized.includes("[") && !normalized.endsWith("/*")) {
    return exact;
  }

  for (const [source, rule] of Object.entries(redirects)) {
    if (source.endsWith("/*")) {
      const prefix = source.slice(0, -2);
      if (!normalized.startsWith(`${prefix}/`)) continue;
      const splat = normalized.slice(prefix.length + 1);
      return {
        ...rule,
        destination: rule.destination.replaceAll(":splat", splat),
      };
    }

    if (!source.includes("[")) continue;
    const destination = resolveParameterizedRedirect(
      source,
      rule.destination,
      normalized,
    );
    if (destination) return { ...rule, destination };
  }

  return null;
}

export function cloudflareRedirectLines() {
  return Object.entries(redirects).map(([from, { destination, status }]) => {
    const source = from.replaceAll(/\[([^\]]+)\]/g, ":$1");
    const target = destination.replaceAll(/\[([^\]]+)\]/g, ":$1");
    return `${source} ${target} ${status}`;
  });
}
