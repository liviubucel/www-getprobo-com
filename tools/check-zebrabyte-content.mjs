import fs from "node:fs/promises";
import path from "node:path";

const expectedIndustries = [
  "avocatura",
  "medical",
  "institutii-publice",
  "ecommerce",
  "imobiliare",
  "horeca",
  "logistica",
  "educatie",
  "ong",
];

const root = process.cwd();
const manifestPath = path.join(root, "src/content/blog/zebrabyte-generated/_manifest.json");
const generatedDir = path.dirname(manifestPath);

function fail(message) {
  console.error(`[zebrabyte-content] ${message}`);
  process.exitCode = 1;
}

async function read(relativePath) {
  return fs.readFile(path.join(root, relativePath), "utf8");
}

async function checkBlog() {
  let manifest;
  try {
    manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  } catch (error) {
    fail(`missing/invalid generated blog manifest: ${error instanceof Error ? error.message : error}`);
    return;
  }

  const unique = Number(manifest?.source?.uniqueSlugCount ?? 0);
  const imported = Number(manifest?.importedCount ?? 0);
  const failures = Number(manifest?.failureCount ?? 0);

  if (unique <= 0) fail("Sanity migration produced zero unique blog slugs.");
  if (failures !== 0) fail(`blog manifest contains ${failures} conversion failure(s).`);
  if (imported !== unique) fail(`blog parity failed: imported ${imported}/${unique} unique posts.`);

  const slugs = new Set();
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
      if (!content.includes(`slug: ${JSON.stringify(slug)}`)) {
        fail(`generated article ${slug} does not preserve its public slug.`);
      }
      if (!content.includes('source: "zebrabyte"')) {
        fail(`generated article ${slug} is missing ZebraByte source attribution.`);
      }
    } catch {
      fail(`missing generated MDX for ${slug}`);
    }
  }

  const blogRoute = await read("src/pages/blog/[id].astro");
  const blogIndex = await read("src/pages/blog.astro");
  const blogPagination = await read("src/pages/blog/page/[page].astro");
  const rss = await read("src/pages/blog.xml.ts");

  if (!blogRoute.includes("getBlogSlug(post)")) fail("blog detail route is not using stable imported slugs.");
  if (!blogIndex.includes("getBlogHref(post)")) fail("blog index is not using stable imported slugs.");
  if (!blogPagination.includes("getBlogHref(post)")) fail("blog pagination is not using stable imported slugs.");
  if (!rss.includes("getBlogHref(post)")) fail("RSS is not using stable imported slugs.");

  console.log(`[zebrabyte-content] blog parity OK: ${imported}/${unique} ZebraByte posts generated.`);
}

async function checkIndustries() {
  const structural = await read("src/content/zebrabyte-industries.ts");
  const editorial = await read("src/content/zebrabyte-industry-editorial.ts");
  const index = await read("src/pages/industries.astro");
  const page = await read("src/components/ZebraByteIndustryPage.astro");
  const route = await read("src/pages/industrii/[slug].astro");

  for (const slug of expectedIndustries) {
    if (!structural.includes(`slug: "${slug}"`)) fail(`missing structural industry: ${slug}`);
    const editorialKey = slug.includes("-") ? `"${slug}": {` : `${slug}: {`;
    if (!editorial.includes(editorialKey)) fail(`missing adapted editorial industry: ${slug}`);
  }

  const structuralMatches = [...structural.matchAll(/\n\s+slug: "([^"]+)",/g)].map((match) => match[1]);
  const uniqueStructural = new Set(structuralMatches);
  for (const slug of expectedIndustries) {
    if (!uniqueStructural.has(slug)) fail(`industry slug did not survive structural parsing: ${slug}`);
  }

  if (!index.includes("zebraByteIndustries.map")) fail("industry index is not generated from the canonical industry dataset.");
  if (!index.includes("/industrii/${industry.slug}")) fail("industry cards do not link to their dedicated pages.");
  if (!page.includes("editorial.focusAreas") || !page.includes("editorial.faqs")) {
    fail("industry page component is missing migrated focus areas or FAQs.");
  }
  if (!route.includes('"@type": "FAQPage"')) fail("industry route is missing FAQ structured data.");

  console.log(`[zebrabyte-content] industry parity OK: ${expectedIndustries.length}/${expectedIndustries.length} sectors enriched.`);
}

await checkBlog();
await checkIndustries();

if (process.exitCode) process.exit(process.exitCode);
console.log("[zebrabyte-content] all migration checks passed.");
