import { readFile, readdir } from "node:fs/promises";
import { parse as parseYaml } from "yaml";

const failures = [];
const read = (path) => readFile(path, "utf8");

function requireText(content, needle, label) {
  if (!content.includes(needle)) failures.push(`${label}: missing ${JSON.stringify(needle)}`);
}

function forbidText(content, needle, label) {
  if (content.includes(needle)) failures.push(`${label}: forbidden ${JSON.stringify(needle)}`);
}

function sameArray(a, b) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function parseFrontmatter(content, filename) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    failures.push(`wall provenance: ${filename} has no YAML frontmatter`);
    return {};
  }
  try {
    return parseYaml(match[1]) ?? {};
  } catch (error) {
    failures.push(`wall provenance: ${filename} has invalid YAML (${error instanceof Error ? error.message : String(error)})`);
    return {};
  }
}

const [
  about,
  team,
  logos,
  home,
  love,
  contact,
  industryPage,
  industryService,
  legacyPage,
  wallCard,
  contentConfig,
  baseline,
  wallProvenanceRaw,
] = await Promise.all([
  read("src/pages/about.astro"),
  read("src/components/block/Team.astro"),
  read("src/components/block/Logos.astro"),
  read("src/pages/index.astro"),
  read("src/pages/love-from-customer.astro"),
  read("src/pages/contact.astro"),
  read("src/components/ZebraByteIndustryPage.astro"),
  read("src/components/ZebraByteIndustryServicePage.astro"),
  read("src/components/ZebraByteLegacyPage.astro"),
  read("src/components/WallCard.astro"),
  read("src/content.config.ts"),
  read("docs/architecture/experience-baseline.md"),
  read("docs/architecture/wall-provenance.json"),
]);

requireText(
  baseline,
  "7e7e7b5c18c621aae125488342a215a641c830b9",
  "golden Probo design baseline",
);
requireText(
  baseline,
  "design and behavior reference, not a content authority",
  "baseline design/content boundary",
);
requireText(baseline, "Invalid inherited content", "baseline provenance classification");
requireText(
  baseline,
  "Never present Probo customer logos as ZebraByte social proof",
  "baseline social-proof provenance rule",
);
requireText(
  baseline,
  "Generated ZebraByte landing pages",
  "generated landing-page visual contract",
);
requireText(
  baseline,
  "Avoid turning every paragraph, outcome, contact method or related link into its own floating",
  "repeated card-chrome rule",
);
requireText(
  baseline,
  "wall-provenance.json",
  "customer review provenance manifest rule",
);
requireText(
  baseline,
  "verbatim",
  "customer review verbatim rule",
);

requireText(about, 'import Team from "../components/block/Team.astro"', "About inherited section rhythm");
requireText(about, "<Team />", "About capability/team geometry");
requireText(about, "/images/zbt-negru.svg", "About ZebraByte hero identity");
requireText(about, 'width="3242"', "About ZebraByte wordmark intrinsic width");
requireText(about, 'height="1166"', "About ZebraByte wordmark intrinsic height");
forbidText(about, 'width="420"', "About distorted ZebraByte wordmark ratio");
forbidText(about, "../assets/about.png", "About Probo team photo provenance");
forbidText(about, "const principles =", "About invented principles replacement");

requireText(team, 'import MenuIcon from "../MenuIcon.astro"', "About capability visual language");
requireText(team, "sm:flex-row sm:gap-20", "About primary two-column geometry");
requireText(team, "sm:grid-cols-4", "About secondary grid geometry");
forbidText(team, "../../assets/about/", "About Probo people assets");
forbidText(team, "Antoine Bourchardy", "About Probo people provenance");
forbidText(team, "Bryan Frimin", "About Probo people provenance");
forbidText(team, "Platform archive", "About legacy archive presentation");
forbidText(team, "rounded-xl border p-6 sm:p-8", "About invented bordered-card replacement");

requireText(logos, 'LogosScroll from "../LogosScroll.svelte"', "reference logo marquee motion");
requireText(logos, "client:load", "reference logo marquee hydration");
requireText(logos, "const companies = [", "reference logo marquee inherited company set");
requireText(logos, 'image: "ahrefs.svg"', "reference logo marquee Ahrefs asset");
requireText(logos, 'image: "trace_for_good.svg"', "reference logo marquee Trace for Good asset");
requireText(logos, 'image: "typebot.svg"', "reference logo marquee Typebot asset");
requireText(logos, 'image: "wafer_logo.svg"', "reference logo marquee Wafer asset");
requireText(logos, 'src={`/clients/${company.image}`}', "reference logo marquee client asset rendering");
forbidText(logos, 'import MenuIcon from "../MenuIcon.astro"', "reference logo marquee capability-icon replacement");
forbidText(logos, "/managed-compliance", "reference logo marquee capability-link replacement");

requireText(
  home,
  "Organizații din biblioteca de referință a platformei",
  "homepage neutral reference-logo context",
);
forbidText(home, "Trusted by", "homepage unsupported customer-proof label");
forbidText(home, "Clienți ZebraByte", "homepage unsupported customer-proof label");

// Inherited wall entries are deliberately preserved as neutral reference insights.
// The page must never regress to a ZebraByte-only source filter just to simplify
// provenance or brand checks.
requireText(love, 'getCollection("wall")', "customer wall complete collection source");
requireText(love, "Feedback & Reference Insights", "customer wall mixed provenance framing");
forbidText(love, 'post.id.startsWith("zebrabyte-")', "customer wall inherited reference suppression");
forbidText(love, 'import Logos from "../components/block/Logos.astro"', "customer wall inherited company marquee");
forbidText(love, "wider platform reference library", "customer wall inherited social-proof workaround");

requireText(contact, 'class="divide-y border-y"', "contact editorial rail");
requireText(contact, 'id="contact-form"', "contact first-party form");
requireText(contact, "data-turnstile-container", "contact Turnstile verification");
forbidText(contact, '<div class="rounded-xl border p-6">', "contact repeated floating cards");

requireText(industryPage, 'class="divide-y border-y"', "industry editorial list rhythm");
requireText(industryPage, "grid gap-px overflow-hidden rounded-2xl border bg-border", "industry framed peer grid");
forbidText(industryPage, 'class="rounded-xl border p-5 sm:p-6"', "industry outcome card repetition");

requireText(industryService, "grid gap-px overflow-hidden rounded-2xl border bg-border", "industry service framed peer grids");
forbidText(industryService, 'class="bg-level-0 rounded-xl border p-6"', "industry service risk card repetition");
forbidText(industryService, 'class="group rounded-xl border p-6 transition-colors hover:bg-subtle"', "industry service sibling card repetition");

requireText(legacyPage, "grid gap-px overflow-hidden rounded-2xl border bg-border", "legacy page framed peer grid");
requireText(legacyPage, 'class="mt-6 border-y py-4 text-sm leading-relaxed sm:py-5"', "legacy note editorial treatment");
forbidText(legacyPage, 'class="group rounded-xl border p-6 transition-colors hover:bg-subtle"', "legacy related card repetition");
forbidText(legacyPage, "mt-5 rounded-xl border bg-active p-5", "legacy note floating-card treatment");

requireText(contentConfig, 'source: z.enum(["linkedin", "google", "trustpilot"]).optional()', "wall source schema");
requireText(contentConfig, "Link to the original source post or review", "wall source URL semantics");
requireText(wallCard, 'd.source === "google"', "wall Google source label");
requireText(wallCard, 'd.source === "trustpilot"', "wall Trustpilot source label");
requireText(wallCard, 'd.source === "linkedin"', "wall LinkedIn source label");
requireText(wallCard, '"Reference insight"', "wall inherited reference label");
forbidText(wallCard, 'aria-label="External social post"', "wall generic source pretending to be LinkedIn");

let wallProvenance;
try {
  wallProvenance = JSON.parse(wallProvenanceRaw);
} catch (error) {
  failures.push(`wall provenance manifest: invalid JSON (${error instanceof Error ? error.message : String(error)})`);
  wallProvenance = { entries: {} };
}

if (wallProvenance.sourceRepository !== "liviubucel/Zebrabyte-Web") {
  failures.push("wall provenance manifest: sourceRepository must remain liviubucel/Zebrabyte-Web");
}
if (wallProvenance.sourceCommit !== "5e2d1224921dc80e692a9debf450f61ba1c31a73") {
  failures.push("wall provenance manifest: unexpected source commit; verify review provenance before changing it");
}
if (wallProvenance.sourceFile !== "src/data/reviews.ts") {
  failures.push("wall provenance manifest: unexpected source file");
}

const wallFiles = (await readdir("src/content/wall"))
  .filter((filename) => filename.startsWith("zebrabyte-") && filename.endsWith(".mdx"))
  .sort();
const manifestFiles = Object.keys(wallProvenance.entries ?? {}).sort();
if (!sameArray(wallFiles, manifestFiles)) {
  failures.push(
    `wall provenance: ZebraByte wall files do not match manifest (files=${JSON.stringify(wallFiles)}, manifest=${JSON.stringify(manifestFiles)})`,
  );
}

for (const filename of manifestFiles) {
  const expected = wallProvenance.entries[filename];
  const content = await read(`src/content/wall/${filename}`);
  const data = parseFrontmatter(content, filename);

  if (data.company !== "ZebraByte UK") {
    failures.push(`wall provenance: ${filename} must use ZebraByte UK as the card identity`);
  }
  if (data.logo !== "zebrabyte-mark.svg") {
    failures.push(`wall provenance: ${filename} must use the first-party ZebraByte mark`);
  }
  if (data.author !== expected.author) {
    failures.push(`wall provenance: ${filename} author differs from pinned source`);
  }
  if (data.post !== expected.quote) {
    failures.push(`wall provenance: ${filename} quote is not verbatim from pinned source`);
  }
  if (data.source !== expected.source) {
    failures.push(`wall provenance: ${filename} source differs from pinned source`);
  }
  if ((data.postUrl ?? null) !== (expected.sourceUrl ?? null)) {
    failures.push(`wall provenance: ${filename} source URL differs from pinned source`);
  }
  for (const unsupportedMetric of ["followers", "likes", "comments"]) {
    if (data[unsupportedMetric] != null) {
      failures.push(`wall provenance: ${filename} has unsourced ${unsupportedMetric} metadata`);
    }
  }
}

if (failures.length) {
  console.error(`[provenance] ${failures.length} provenance/baseline violation(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("[provenance] ZebraByte design/content provenance contract OK");
