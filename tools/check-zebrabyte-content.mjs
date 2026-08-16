import fs from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";

const root = process.cwd();
const manifestPath = path.join(root, "src/content/blog/zebrabyte-generated/_manifest.json");
const generatedDir = path.dirname(manifestPath);
const legacyIndustryCount = 9;
const blogCategoryCount = 6;

function fail(message) {
  console.error(`[zebrabyte-content] ${message}`);
  process.exitCode = 1;
}

async function read(relativePath) {
  return fs.readFile(path.join(root, relativePath), "utf8");
}

function parseFrontmatter(content, slug) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error(`missing frontmatter for ${slug}`);
  const parsed = YAML.parse(match[1]);
  if (!parsed || typeof parsed !== "object") throw new Error(`invalid frontmatter for ${slug}`);
  return parsed;
}

function setDifference(left, right) {
  return [...left].filter((value) => !right.has(value));
}

function parseGeneratedRedirects(source) {
  const match = source.match(/Object\.freeze\((\{[\s\S]*\})\);/);
  if (!match) throw new Error("unable to parse generated redirect map");
  return JSON.parse(match[1]);
}

async function checkBlog() {
  let manifest;
  try {
    manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  } catch (error) {
    fail(`missing/invalid generated blog manifest: ${error instanceof Error ? error.message : error}`);
    return;
  }

  const documents = Number(manifest?.source?.documentCount ?? 0);
  const articles = Number(manifest?.source?.articleCount ?? 0);
  const covered = Number(manifest?.source?.coveredDocumentCount ?? 0);
  const duplicates = Number(manifest?.source?.duplicateDocumentCount ?? 0);
  const collisions = Number(manifest?.source?.slugCollisionCount ?? 0);
  const imported = Number(manifest?.importedCount ?? 0);
  const failures = Number(manifest?.failureCount ?? 0);
  const redirectCount = Number(manifest?.legacyRedirectCount ?? 0);

  if (documents <= 0) fail("Sanity migration produced zero published blog documents.");
  if (articles <= 0) fail("Sanity migration produced zero canonical blog articles.");
  if (failures !== 0) fail(`blog manifest contains ${failures} conversion failure(s).`);
  if (imported !== articles) fail(`canonical article parity failed: imported ${imported}/${articles}.`);
  if (covered !== documents) fail(`published-document coverage failed: ${covered}/${documents}.`);
  if (duplicates < 0 || collisions < 0) fail("invalid duplicate/collision counters in blog manifest.");

  const slugs = new Set();
  const legacyIds = new Set();
  for (const item of manifest.imported ?? []) {
    const slug = String(item?.slug ?? "");
    const itemLegacyIds = Array.isArray(item?.legacyIds) ? item.legacyIds.map(String) : [];
    if (!slug) {
      fail("manifest contains an imported entry without a slug.");
      continue;
    }
    if (slugs.has(slug)) fail(`duplicate canonical blog slug: ${slug}`);
    slugs.add(slug);
    if (itemLegacyIds.length === 0) fail(`canonical article ${slug} covers no legacy document IDs.`);

    for (const legacyId of itemLegacyIds) {
      if (legacyIds.has(legacyId)) fail(`legacy Sanity document is represented twice: ${legacyId}`);
      legacyIds.add(legacyId);
    }

    const file = path.join(generatedDir, `${slug}.mdx`);
    try {
      const content = await fs.readFile(file, "utf8");
      const frontmatter = parseFrontmatter(content, slug);
      if (frontmatter.slug !== slug) fail(`generated article ${slug} does not preserve its canonical public slug.`);
      if (frontmatter.source !== "zebrabyte") fail(`generated article ${slug} is missing ZebraByte source attribution.`);
      if (!frontmatter.legacyId) fail(`generated article ${slug} is missing its canonical legacy document ID.`);
      const frontmatterLegacyIds = new Set(Array.isArray(frontmatter.legacyIds) ? frontmatter.legacyIds.map(String) : []);
      if (frontmatterLegacyIds.size !== itemLegacyIds.length || itemLegacyIds.some((id) => !frontmatterLegacyIds.has(id))) {
        fail(`generated article ${slug} does not preserve all represented legacy document IDs.`);
      }
    } catch (error) {
      fail(`invalid generated MDX for ${slug}: ${error instanceof Error ? error.message : error}`);
    }
  }

  if (slugs.size !== articles) fail(`canonical slug uniqueness failed: ${slugs.size}/${articles}.`);
  if (legacyIds.size !== documents) fail(`legacy document ID coverage failed: ${legacyIds.size}/${documents}.`);

  try {
    const redirectSource = await read("worker/blog-legacy-redirects.ts");
    const redirects = parseGeneratedRedirects(redirectSource);
    if (Object.keys(redirects).length !== redirectCount) {
      fail(`legacy redirect parity failed: ${Object.keys(redirects).length}/${redirectCount}.`);
    }
    for (const target of Object.values(redirects)) {
      if (!slugs.has(String(target))) fail(`legacy redirect targets unknown canonical slug: ${target}`);
    }
  } catch (error) {
    fail(`invalid generated legacy redirect map: ${error instanceof Error ? error.message : error}`);
  }

  const packageJson = JSON.parse(await read("package.json"));
  if (packageJson?.scripts?.["sync:zebrabyte-blog"] !== "node tools/sync-zebrabyte-blog-v2.mjs") {
    fail("build pipeline is not using the canonical duplicate-safe ZebraByte blog importer.");
  }

  const blogRoute = await read("src/pages/blog/[id].astro");
  const blogIndex = await read("src/pages/blog.astro");
  const blogPagination = await read("src/pages/blog/page/[page].astro");
  const categoryRoute = await read("src/pages/blog/categorie/[category].astro");
  const categoryTaxonomy = await read("src/lib/blog-categories.ts");
  const rss = await read("src/pages/blog.xml.ts");
  const router = await read("worker/router.ts");

  if (!blogRoute.includes("getBlogSlug(post)")) fail("blog detail route is not using stable imported slugs.");
  if (!blogIndex.includes("getBlogHref(post)")) fail("blog index is not using stable imported slugs.");
  if (!blogPagination.includes("getBlogHref(post)")) fail("blog pagination is not using stable imported slugs.");
  if (!rss.includes("getBlogHref(post)")) fail("RSS is not using stable imported slugs.");

  const taxonomySlugs = new Set([...categoryTaxonomy.matchAll(/slug: "([a-z0-9-]+)"/g)].map((match) => match[1]));
  if (taxonomySlugs.size !== blogCategoryCount) fail(`expected ${blogCategoryCount} curated blog categories, found ${taxonomySlugs.size}.`);
  if (!blogIndex.includes("BlogCategoryNav") || !blogIndex.includes("getBlogCategory(post)")) fail("blog index is missing category navigation/classification.");
  if (!blogRoute.includes("articleSection: category.label")) fail("Article structured data is missing the blog category.");
  if (!categoryRoute.includes("getBlogCategory(post)") || !categoryRoute.includes("BlogCategoryNav")) fail("blog category archive route is incomplete.");

  if (!router.includes('from "./blog-legacy-redirects"')) fail("Worker is not consuming the generated legacy blog redirect map.");
  if (!router.includes("legacyWixBlogRedirects[legacyKey]")) fail("Worker legacy Wix redirect does not resolve exact mapped aliases.");
  if (!router.includes("legacyWixBlogRedirect") || !router.includes("blogul-nostru-1")) {
    fail("Worker is missing the legacy Wix blog redirect handler.");
  }

  console.log(
    `[zebrabyte-content] blog coverage OK: ${articles} canonical article(s) represent ${documents} published document(s); ${duplicates} duplicate copy/copies collapsed; ${collisions} true slug collision(s) disambiguated; ${redirectCount} exact legacy redirect(s).`,
  );
}

async function checkIndustries() {
  const structural = await read("src/content/zebrabyte-industries.ts");
  const editorial = await read("src/content/zebrabyte-industry-editorial.ts");
  const index = await read("src/pages/industries.astro");
  const page = await read("src/components/ZebraByteIndustryPage.astro");
  const route = await read("src/pages/industrii/[slug].astro");

  const structuralSlugs = new Set(
    [...structural.matchAll(/^\s{4}slug: "([^"]+)",$/gm)].map((match) => match[1]),
  );
  const editorialSlugs = new Set(
    [...editorial.matchAll(/^  (?:(?:"([^"]+)")|([a-z0-9-]+)): \{$/gm)].map(
      (match) => match[1] ?? match[2],
    ),
  );

  if (structuralSlugs.size !== legacyIndustryCount) fail(`expected ${legacyIndustryCount} canonical industries, found ${structuralSlugs.size}.`);
  if (editorialSlugs.size !== legacyIndustryCount) fail(`expected ${legacyIndustryCount} adapted industry editorials, found ${editorialSlugs.size}.`);

  const missingEditorial = setDifference(structuralSlugs, editorialSlugs);
  const orphanEditorial = setDifference(editorialSlugs, structuralSlugs);
  if (missingEditorial.length) fail(`missing editorial content for: ${missingEditorial.join(", ")}`);
  if (orphanEditorial.length) fail(`editorial content without canonical industry: ${orphanEditorial.join(", ")}`);

  if (!index.includes("zebraByteIndustries.map")) fail("industry index is not generated from the canonical industry dataset.");
  if (!index.includes("/industrii/${industry.slug}")) fail("industry cards do not link to their dedicated pages.");
  if (!page.includes("editorial.focusAreas") || !page.includes("editorial.faqs")) fail("industry page component is missing migrated focus areas or FAQs.");
  if (!route.includes('"@type": "FAQPage"')) fail("industry route is missing FAQ structured data.");

  console.log(`[zebrabyte-content] industry parity OK: ${structuralSlugs.size}/${legacyIndustryCount} sectors enriched.`);
}

await checkBlog();
await checkIndustries();

if (process.exitCode) process.exit(process.exitCode);
console.log("[zebrabyte-content] all migration checks passed.");
