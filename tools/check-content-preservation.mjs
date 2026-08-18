import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { join } from "node:path";

const protectedFiles = new Map([
  ["src/pages/hub.astro", 3_000],
  ["src/pages/hub/ai-coding-tools-soc2-compliance.astro", 10_000],
  ["src/pages/hub/cloud-security-best-practices.astro", 10_000],
  ["src/pages/hub/compliance-recommender.astro", 8_000],
  ["src/pages/hub/evaluate-soc2-report-quality.astro", 10_000],
  ["src/pages/hub/iso-27001-after-soc-2-the-30-percent-shortcut.astro", 8_000],
  ["src/pages/hub/iso27001-certification-cost.astro", 8_000],
  ["src/pages/hub/iso27001.astro", 10_000],
  ["src/pages/hub/nis2-compliance-checklist-tech-companies-2026.astro", 10_000],
  ["src/pages/hub/nis2-compliance.astro", 10_000],
  ["src/pages/hub/nis2-tech-teams.astro", 10_000],
  ["src/pages/hub/soc2-type1-vs-type2.astro", 10_000],
  ["src/pages/hub/soc2.astro", 10_000],
  ["src/pages/hub/third-party-risk-management.astro", 8_000],
  ["src/pages/hub/top-compliance-automation-tools-2026.astro", 10_000],
  ["src/pages/hub/top-compliance-officer-services-2026.astro", 8_000],
  ["src/pages/hub/top-grc-tools-2026.astro", 10_000],
  ["src/pages/hub/vanta-alternatives-2026.astro", 10_000],
  ["src/pages/hub/what-is-compliance-software.astro", 8_000],
  ["src/pages/hub/which-compliance-framework.astro", 10_000],
  ["src/pages/hub/zebrabyte-vs-vanta.astro", 2_000],
  ["src/pages/hub/zebrabyte-vs-fractional-ciso.astro", 2_000],
  ["src/pages/whats-next/ISO27001.astro", 10_000],
  ["src/pages/whats-next/soc2.astro", 10_000],
  ["src/pages/compliance-portal.astro", 8_000],
  ["src/pages/products/compliance-portal.astro", 8_000],
  ["src/pages/yc.astro", 2_000],
  ["src/pages/stories.astro", 1_000],
  ["src/pages/love-from-customer.astro", 2_000],
]);

const protectedPublicPaths = new Set([
  "/hub/ai-coding-tools-soc2-compliance",
  "/hub/cloud-security-best-practices",
  "/hub/compliance-recommender",
  "/hub/evaluate-soc2-report-quality",
  "/hub/iso-27001-after-soc-2-the-30-percent-shortcut",
  "/hub/iso27001-certification-cost",
  "/hub/iso27001",
  "/hub/nis2-compliance-checklist-tech-companies-2026",
  "/hub/nis2-compliance",
  "/hub/nis2-tech-teams",
  "/hub/soc2-type1-vs-type2",
  "/hub/soc2",
  "/hub/third-party-risk-management",
  "/hub/top-compliance-automation-tools-2026",
  "/hub/top-compliance-officer-services-2026",
  "/hub/top-grc-tools-2026",
  "/hub/vanta-alternatives-2026",
  "/hub/what-is-compliance-software",
  "/hub/which-compliance-framework",
  "/whats-next/ISO27001",
  "/whats-next/iso27001",
  "/whats-next/soc2",
  "/docs",
  "/docs/*",
  "/changelog",
  "/stories",
  "/stories/*",
  "/love-from-customer",
  "/yc",
  "/products/compliance-portal",
]);

// Conservative lower bounds, deliberately below the current complete source
// counts. Their purpose is to catch broad collection deletion/filtering, not to
// prevent legitimate editorial additions or one-off replacements.
const protectedCollectionMinimums = new Map([
  ["src/content/blog", 50],
  ["src/content/docs", 40],
  ["src/content/changelog", 10],
  ["src/content/stories", 6],
  ["src/content/wall", 10],
  ["src/content/jobs", 2],
]);

const failures = [];

function countMdx(dir) {
  if (!existsSync(dir)) return 0;
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) total += countMdx(fullPath);
    else if (entry.isFile() && entry.name.endsWith(".mdx")) total += 1;
  }
  return total;
}

for (const [file, minBytes] of protectedFiles) {
  if (!existsSync(file)) {
    failures.push(`${file}: missing`);
    continue;
  }

  const size = statSync(file).size;
  if (size < minBytes) {
    failures.push(`${file}: unexpectedly reduced to ${size} bytes (minimum protected baseline ${minBytes})`);
  }
}

for (const [dir, minimum] of protectedCollectionMinimums) {
  const count = countMdx(dir);
  if (count < minimum) {
    failures.push(`${dir}: only ${count} MDX file(s) remain (minimum protected baseline ${minimum})`);
  }
}

const contentConfigFile = "src/content.config.ts";
if (!existsSync(contentConfigFile)) {
  failures.push(`${contentConfigFile}: missing; cannot verify inherited collection publication policy`);
} else {
  const contentConfig = readFileSync(contentConfigFile, "utf8");
  const broadCollectionLoaders = ["blog", "stories", "changelog", "wall"];

  for (const collection of broadCollectionLoaders) {
    const collectionStart = contentConfig.indexOf(`const ${collection} = defineCollection`);
    if (collectionStart === -1) {
      failures.push(`${contentConfigFile}: ${collection} collection definition is missing`);
      continue;
    }

    const nextCollection = contentConfig.indexOf("const ", collectionStart + 10);
    const block = contentConfig.slice(
      collectionStart,
      nextCollection === -1 ? contentConfig.length : nextCollection,
    );

    if (!/pattern:\s*["']\*\*\/\*\.mdx["']/.test(block)) {
      failures.push(`${contentConfigFile}: ${collection} no longer publishes the complete inherited MDX collection`);
    }
  }

  if (!/const docs = defineCollection\([\s\S]*?loader:\s*docsLoader\(\)/.test(contentConfig)) {
    failures.push(`${contentConfigFile}: docs no longer use the complete Starlight docsLoader()`);
  }
}

const wallPage = "src/pages/love-from-customer.astro";
if (existsSync(wallPage)) {
  const source = readFileSync(wallPage, "utf8");
  if (/post\.id\.startsWith\(["']zebrabyte-["']\)/.test(source)) {
    failures.push(`${wallPage}: inherited reference insights are being filtered out`);
  }
}

const redirectsFile = "public/_redirects";
if (!existsSync(redirectsFile)) {
  failures.push(`${redirectsFile}: missing; cannot verify that protected product content remains publicly reachable`);
} else {
  const redirects = readFileSync(redirectsFile, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  for (const line of redirects) {
    const [source, destination, status] = line.split(/\s+/);
    if (!protectedPublicPaths.has(source)) continue;

    failures.push(
      `${redirectsFile}: protected public path ${source} is redirected to ${destination || "<missing destination>"}${status ? ` (${status})` : ""}`,
    );
  }
}

if (failures.length) {
  console.error("[content-preservation] FAIL: protected inherited product content was removed, materially reduced, filtered out, or hidden behind a redirect.");
  console.error("[content-preservation] Preserve the page/collection and rebrand, paraphrase or contextualize it in place. Do not delete, suppress or redirect useful content to satisfy brand, SEO, performance, or release audits.");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

const collectionSummary = [...protectedCollectionMinimums.keys()]
  .map((dir) => `${dir}=${countMdx(dir)}`)
  .join(", ");
console.log(`[content-preservation] PASS: ${protectedFiles.size} protected product surfaces remain present and publicly reachable; collection floors passed (${collectionSummary}).`);
