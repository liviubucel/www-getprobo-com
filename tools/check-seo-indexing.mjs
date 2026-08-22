import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const DIST_DIR = path.resolve("dist");
const PUBLIC_ORIGIN = "https://www.zebrabyte.ro";

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else files.push(full);
  }
  return files;
}

function tags(html, name) {
  return html.match(new RegExp(`<${name}\\b[^>]*>`, "gi")) ?? [];
}

function attr(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}=["']([^"']*)["']`, "i"));
  return match?.[1] ?? null;
}

function hasNoIndex(html) {
  return tags(html, "meta").some((tag) => {
    return attr(tag, "name")?.toLowerCase() === "robots" &&
      (attr(tag, "content") ?? "").toLowerCase().split(/[\\s,]+/).includes("noindex");
  });
}

function canonicalFrom(html) {
  const tag = tags(html, "link").find(
    (candidate) => attr(candidate, "rel")?.toLowerCase() === "canonical",
  );
  return tag ? attr(tag, "href") : null;
}

const files = await walk(DIST_DIR);
const sitemapUrls = new Set();
for (const file of files.filter((file) => /sitemap.*\.xml$/i.test(file))) {
  const xml = await readFile(file, "utf8");
  if (!/<urlset\b/i.test(xml)) continue;
  for (const match of xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)) {
    sitemapUrls.add(match[1].trim());
  }
}

const htmlPages = [];
for (const file of files.filter((file) => file.endsWith(".html"))) {
  const html = await readFile(file, "utf8");
  const canonical = canonicalFrom(html);
  htmlPages.push({
    file: path.relative(DIST_DIR, file),
    canonical,
    noindex: hasNoIndex(html),
  });
}

const invalidCanonicalHosts = htmlPages.filter(({ canonical }) => {
  if (!canonical) return false;
  try {
    const url = new URL(canonical);
    return url.origin === PUBLIC_ORIGIN ? false : url.hostname.endsWith("zebrabyte.ro");
  } catch {
    return true;
  }
});

const indexableCanonicals = new Set(
  htmlPages
    .filter((page) => !page.noindex && page.canonical)
    .map((page) => page.canonical),
);

const noindexCanonicals = new Map();
for (const page of htmlPages.filter((page) => page.noindex && page.canonical)) {
  const list = noindexCanonicals.get(page.canonical) ?? [];
  list.push(page.file);
  noindexCanonicals.set(page.canonical, list);
}

const conflicts = [];
for (const [canonical, sourceFiles] of noindexCanonicals) {
  // A noindex compatibility alias may canonicalize to a separate, indexable page.
  // That canonical URL should remain discoverable in the sitemap.
  if (indexableCanonicals.has(canonical)) continue;
  if (sitemapUrls.has(canonical)) conflicts.push({ canonical, sourceFiles });
}

if (invalidCanonicalHosts.length) {
  console.error("SEO indexing check failed: ZebraByte canonical URLs use a non-public host:");
  for (const page of invalidCanonicalHosts) {
    console.error(`- ${page.canonical} (${page.file})`);
  }
  process.exit(1);
}

if (conflicts.length) {
  console.error("SEO indexing check failed: noindex canonical URLs are present in the sitemap:");
  for (const conflict of conflicts) {
    console.error(`- ${conflict.canonical} <- ${conflict.sourceFiles.join(", ")}`);
  }
  process.exit(1);
}

console.log(
  `SEO indexing check passed: ${htmlPages.length} HTML files, ${sitemapUrls.size} sitemap URLs, ${noindexCanonicals.size} noindex canonicals.`,
);
