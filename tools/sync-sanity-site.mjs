import fs from "node:fs/promises";
import path from "node:path";

const projectId =
  process.env.SANITY_PROJECT_ID || process.env.ZEBRABYTE_LEGACY_SANITY_PROJECT_ID || "yj548pxh";
const dataset = process.env.SANITY_DATASET || process.env.ZEBRABYTE_LEGACY_SANITY_DATASET || "production";
const token = process.env.SANITY_API_READ_TOKEN || process.env.ZEBRABYTE_LEGACY_SANITY_READ_TOKEN || "";
const apiVersion = "2026-08-22";
const timeoutMs = 25_000;
const maxResponseBytes = 32 * 1024 * 1024;
const snapshotPath = path.resolve(".sanity-cache/site-content.json");

const GROQ = `{
  "siteSettings": *[_type == "siteSettings"],
  "navigation": *[_type == "navigation"],
  "pages": *[_type == "page"] | order(path asc),
  "posts": *[_type == "post"] | order(publishedAt desc) {
    ...,
    "slug": slug.current,
    "mainImageUrl": mainImage.asset->url,
    "mainImageAlt": mainImage.alt
  },
  "hubArticles": *[_type == "hubArticle"] | order(publishedAt desc) {
    ...,
    "slug": slug.current
  },
  "stories": *[_type == "story"] | order(publishedAt desc) {
    ...,
    "slug": slug.current
  },
  "jobs": *[_type == "job"] | order(_updatedAt desc) {
    ...,
    "slug": slug.current
  },
  "legalDocuments": *[_type == "legalDocument"] | order(path asc)
}`;

const RESERVED_PUBLIC_PREFIXES = ["/api", "/cdn-cgi", "/.well-known", "/en"];
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PUBLIC_PATH_PATTERN = /^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?$/;

function hasReservedPrefix(pathname) {
  return RESERVED_PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function assertPublicPath(value, context) {
  if (typeof value !== "string" || !PUBLIC_PATH_PATTERN.test(value)) {
    throw new Error(`[sanity-sync] ${context} has an invalid canonical public path: ${String(value)}`);
  }
  if (hasReservedPrefix(value)) {
    throw new Error(`[sanity-sync] ${context} attempts to claim a runtime-reserved route: ${value}`);
  }
}

function assertCmsHref(value, context) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`[sanity-sync] ${context} contains an empty link destination.`);
  }
  const href = value.trim();

  if (href.startsWith("#")) {
    if (!/^#[a-z0-9-]+$/.test(href)) {
      throw new Error(`[sanity-sync] ${context} contains an invalid anchor: ${href}`);
    }
    return;
  }

  if (href.startsWith("/")) {
    const url = new URL(href, "https://www.zebrabyte.ro");
    if (url.origin !== "https://www.zebrabyte.ro" || hasReservedPrefix(url.pathname)) {
      throw new Error(`[sanity-sync] ${context} contains a disallowed internal destination: ${href}`);
    }
    return;
  }

  let url;
  try {
    url = new URL(href);
  } catch {
    throw new Error(`[sanity-sync] ${context} contains an invalid destination: ${href}`);
  }
  if (!["https:", "mailto:", "tel:"].includes(url.protocol)) {
    throw new Error(`[sanity-sync] ${context} contains a non-approved URL scheme: ${url.protocol}`);
  }
}

function assertHttpsUrl(value, context) {
  if (value === undefined || value === null || value === "") return;
  let url;
  try {
    url = new URL(String(value));
  } catch {
    throw new Error(`[sanity-sync] ${context} contains an invalid URL.`);
  }
  if (url.protocol !== "https:") {
    throw new Error(`[sanity-sync] ${context} must use HTTPS.`);
  }
}

function assertSingleton(documents, expectedId, label) {
  if (!Array.isArray(documents)) throw new Error(`[sanity-sync] ${label} payload is not an array.`);
  if (documents.length > 1) {
    throw new Error(`[sanity-sync] ${label} must be a singleton; found ${documents.length} published documents.`);
  }
  if (documents.length === 1 && documents[0]?._id !== expectedId) {
    throw new Error(`[sanity-sync] ${label} must use document id ${expectedId}.`);
  }
}

function assertUnique(values, label) {
  const seen = new Set();
  for (const value of values) {
    if (seen.has(value)) throw new Error(`[sanity-sync] duplicate ${label}: ${value}`);
    seen.add(value);
  }
}

function assertSlugCollection(documents, label) {
  const slugs = [];
  for (const document of documents ?? []) {
    const slug = String(document?.slug ?? "").trim();
    if (!SLUG_PATTERN.test(slug)) {
      throw new Error(`[sanity-sync] ${label} ${document?._id ?? "unknown"} has an invalid slug: ${slug}`);
    }
    slugs.push(slug);
  }
  assertUnique(slugs, `${label} slug`);
}

function walkForDestinations(value, pointer = "content") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkForDestinations(item, `${pointer}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;

  for (const [key, child] of Object.entries(value)) {
    const next = `${pointer}.${key}`;
    if (key === "href" && typeof child === "string") assertCmsHref(child, next);
    if (key === "canonicalPath" && child) assertPublicPath(child, next);
    if (["supportUrl", "statusUrl", "trustCenterUrl", "videoUrl", "applyUrl"].includes(key)) {
      assertHttpsUrl(child, next);
    }
    walkForDestinations(child, next);
  }
}

function validateSnapshot(content) {
  if (!content || typeof content !== "object") throw new Error("[sanity-sync] Content Lake result is not an object.");

  for (const key of [
    "siteSettings",
    "navigation",
    "pages",
    "posts",
    "hubArticles",
    "stories",
    "jobs",
    "legalDocuments",
  ]) {
    if (!Array.isArray(content[key])) throw new Error(`[sanity-sync] Missing array result: ${key}`);
  }

  assertSingleton(content.siteSettings, "siteSettings", "Site settings");
  assertSingleton(content.navigation, "mainNavigation", "Navigation");

  const routes = [];
  for (const document of [...content.pages, ...content.legalDocuments]) {
    assertPublicPath(document?.path, `${document?._type ?? "document"} ${document?._id ?? "unknown"}`);
    routes.push(document.path);
  }
  assertUnique(routes, "CMS public route");

  // New CMS-native collections use the strict slug contract. Historical blog
  // documents are intentionally validated by the existing legacy importer,
  // which already normalizes old slugs and resolves duplicate/collision groups.
  assertSlugCollection(content.hubArticles, "HUB article");
  assertSlugCollection(content.stories, "story");
  assertSlugCollection(content.jobs, "job");

  // Apply the strict new editorial URL policy only to CMS-native content.
  // Legacy blog entries may contain historical http links; their renderer keeps
  // them as inert link destinations and does not treat them as executable HTML.
  walkForDestinations({
    siteSettings: content.siteSettings,
    navigation: content.navigation,
    pages: content.pages,
    hubArticles: content.hubArticles,
    stories: content.stories,
    jobs: content.jobs,
    legalDocuments: content.legalDocuments,
  });
}

async function fetchPublishedSnapshot() {
  const endpoint = new URL(`https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}`);
  endpoint.searchParams.set("query", GROQ);
  endpoint.searchParams.set("perspective", "published");

  const headers = {
    Accept: "application/json",
    "User-Agent": "ZebraByteSanityBuild/1.0",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(endpoint, {
    headers,
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await response.text();
  if (Buffer.byteLength(text, "utf8") > maxResponseBytes) {
    throw new Error(`[sanity-sync] Content Lake response exceeded ${maxResponseBytes} bytes.`);
  }
  if (!response.ok) {
    throw new Error(`[sanity-sync] Content Lake query failed (${response.status}): ${text.slice(0, 500)}`);
  }

  const payload = JSON.parse(text);
  if (!payload?.result) throw new Error("[sanity-sync] Content Lake response did not include a result.");
  return payload.result;
}

const content = await fetchPublishedSnapshot();
validateSnapshot(content);

const counts = Object.fromEntries(
  Object.entries(content).map(([key, value]) => [key, Array.isArray(value) ? value.length : 0]),
);

await fs.mkdir(path.dirname(snapshotPath), {recursive: true});
await fs.writeFile(
  snapshotPath,
  `${JSON.stringify(
    {
      schemaVersion: 1,
      fetchedAt: new Date().toISOString(),
      source: {projectId, dataset, apiVersion, perspective: "published", requestCount: 1},
      counts,
      content,
    },
    null,
    2,
  )}\n`,
  "utf8",
);

console.log(
  `[sanity-sync] Published snapshot validated with one Content Lake query: ${Object.entries(counts)
    .map(([key, count]) => `${key}=${count}`)
    .join(", ")}.`,
);
