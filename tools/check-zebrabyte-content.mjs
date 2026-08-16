import fs from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";

const root = process.cwd();
const manifestPath = path.join(root, "src/content/blog/zebrabyte-generated/_manifest.json");
const generatedDir = path.dirname(manifestPath);
const legacyIndustryCount = 9;

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

async function checkBlog() {
  let manifest;
  try {
    manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  } catch (error) {
    fail(`missing/invalid generated blog manifest: ${error instanceof Error ? error.message : error}`);
    return;
  }

  const documents = Number(manifest?.source?.documentCount ?? 0);
  const unique = Number(manifest?.source?.uniqueSlugCount ?? 0);
  const imported = Number(manifest?.importedCount ?? 0);
  const failures = Number(manifest?.failureCount ?? 0);

  if (documents <= 0) fail("Sanity migration produced zero published blog documents.");
  if (unique !== documents) {
    fail(`published-document slug parity failed: ${unique}/${documents} have unique valid slugs.`);
  }
  if (failures !== 0) fail(`blog manifest contains ${failures} conversion failure(s).`);
  if (imported !== documents || imported !== unique) {
    fail(`blog parity failed: imported ${imported}/${documents} published documents (${unique} unique slugs).`);
  }

  const slugs = new Set();
  const legacyIds = new Set();
  for (const item of manifest.imported ?? []) {
    const slug = String(item?.slug ?? "");
    if (!slug) {
      fail("manifest contains an imported entry without a slug.");
      continue;
    }
    if (slugs.has(slug)) fail(`duplicate imported blog slug: ${slug}`);
    slugs.add(slug);

    const file = path.join(generatedDir, `${slug}.mdx`);
    try {
      const content = await fs.readFile(file, "utf8");
      const frontmatter = parseFrontmatter(content, slug);
      if (frontmatter.slug !== slug) {
        fail(`generated article ${slug} does not preserve its public slug.`);
      }
      if (frontmatter.source !== "zebrabyte") {
        fail(`generated article ${slug} is missing ZebraByte source attribution.`);
      }
      if (!frontmatter.legacyId) {
        fail(`generated article ${slug} is missing its legacy document ID.`);
      } else if (legacyIds.has(frontmatter.legacyId)) {
        fail(`duplicate legacy Sanity document ID: ${frontmatter.legacyId}`);
      } else {
        legacyIds.add(frontmatter.legacyId);
      }
    } catch (error) {
      fail(`invalid generated MDX for ${slug}: ${error instanceof Error ? error.message : error}`);
    }
  }

  if (slugs.size !== imported) fail(`manifest slug uniqueness failed: ${slugs.size}/${imported}.`);
  if (legacyIds.size !== imported) {
    fail(`legacy document ID parity failed: ${legacyIds.size}/${imported}.`);
  }

  const blogRoute = await read("src/pages/blog/[id].astro");
  const blogIndex = await read("src/pages/blog.astro");
  const blogPagination = await read("src/pages/blog/page/[page].astro");
  const rss = await read("src/pages/blog.xml.ts");

  if (!blogRoute.includes("getBlogSlug(post)")) fail("blog detail route is not using stable imported slugs.");
  if (!blogIndex.includes("getBlogHref(post)")) fail("blog index is not using stable imported slugs.");
  if (!blogPagination.includes("getBlogHref(post)")) fail("blog pagination is not using stable imported slugs.");
  if (!rss.includes("getBlogHref(post)")) fail("RSS is not using stable imported slugs.");

  console.log(
    `[zebrabyte-content] strict blog parity OK: ${imported}/${documents} published ZebraByte posts generated.`,
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

  if (structuralSlugs.size !== legacyIndustryCount) {
    fail(`expected ${legacyIndustryCount} canonical industries, found ${structuralSlugs.size}.`);
  }
  if (editorialSlugs.size !== legacyIndustryCount) {
    fail(`expected ${legacyIndustryCount} adapted industry editorials, found ${editorialSlugs.size}.`);
  }

  const missingEditorial = setDifference(structuralSlugs, editorialSlugs);
  const orphanEditorial = setDifference(editorialSlugs, structuralSlugs);
  if (missingEditorial.length) fail(`missing editorial content for: ${missingEditorial.join(", ")}`);
  if (orphanEditorial.length) fail(`editorial content without canonical industry: ${orphanEditorial.join(", ")}`);

  if (!index.includes("zebraByteIndustries.map")) fail("industry index is not generated from the canonical industry dataset.");
  if (!index.includes("/industrii/${industry.slug}")) fail("industry cards do not link to their dedicated pages.");
  if (!page.includes("editorial.focusAreas") || !page.includes("editorial.faqs")) {
    fail("industry page component is missing migrated focus areas or FAQs.");
  }
  if (!route.includes('"@type": "FAQPage"')) fail("industry route is missing FAQ structured data.");

  console.log(`[zebrabyte-content] industry parity OK: ${structuralSlugs.size}/${legacyIndustryCount} sectors enriched.`);
}

await checkBlog();
await checkIndustries();

if (process.exitCode) process.exit(process.exitCode);
console.log("[zebrabyte-content] all migration checks passed.");
