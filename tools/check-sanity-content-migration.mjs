import {readFile} from "node:fs/promises";
import {migrationDocuments, migrationVersion} from "./sanity-migration/content-v2.mjs";

const failures = [];
const requireCondition = (condition, message) => {
  if (!condition) failures.push(message);
};

const [
  runner,
  menuSource,
  homepageSource,
  managedComplianceSource,
  footerSource,
  homepageRenderer,
  managedComplianceRenderer,
  documentRenderer,
  sharedSchema,
  cmsContent,
] = await Promise.all([
  readFile("tools/migrate-site-content-to-sanity.mjs", "utf8"),
  readFile("src/content/menu.ts", "utf8"),
  readFile("src/pages/index.astro", "utf8"),
  readFile("src/pages/managed-compliance.astro", "utf8"),
  readFile("src/components/Footer.astro", "utf8"),
  readFile("src/components/cms/CmsHomepageRenderer.astro", "utf8"),
  readFile("src/components/cms/CmsManagedComplianceRenderer.astro", "utf8"),
  readFile("src/components/cms/CmsDocumentRenderer.astro", "utf8"),
  readFile("sanity-studio/schemaTypes/shared.ts", "utf8"),
  readFile("src/lib/cms/content.ts", "utf8"),
]);

requireCondition(migrationVersion === "zebrabyte-site-v2-20260822", "unexpected migration version");
requireCondition(migrationDocuments.length === 4, "phase-2 migration must contain settings, navigation, homepage and Managed Compliance");

const byId = new Map(migrationDocuments.map((document) => [document._id, document]));
const settings = byId.get("siteSettings");
const navigation = byId.get("mainNavigation");
const homepage = byId.get("page.homepage");
const managedCompliance = byId.get("page.managed-compliance");

requireCondition(Boolean(settings), "siteSettings seed is missing");
requireCondition(Boolean(navigation), "mainNavigation seed is missing");
requireCondition(Boolean(homepage), "homepage seed is missing");
requireCondition(Boolean(managedCompliance), "Managed Compliance seed is missing");
requireCondition(homepage?.path === "/", "homepage seed must own canonical path /");
requireCondition(managedCompliance?.path === "/managed-compliance", "Managed Compliance seed must own canonical path /managed-compliance");
requireCondition(homepage?.sections?.length === 5, "homepage seed must preserve five major content regions");
requireCondition(managedCompliance?.sections?.length === 9, "Managed Compliance seed must preserve nine major content regions");

for (const document of migrationDocuments) {
  requireCondition(!document._id.startsWith("drafts."), `seed source must keep canonical ID: ${document._id}`);
}

function walk(value, pointer = "seed") {
  if (value === null || value === undefined) return;
  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) walk(item, `${pointer}[${index}]`);
    return;
  }
  if (typeof value !== "object") return;
  if (["localizedString", "localizedText", "localizedRichText"].includes(value._type)) {
    requireCondition(value.ro !== undefined && value.ro !== "", `${pointer} missing Romanian value`);
    requireCondition(value.en !== undefined && value.en !== "", `${pointer} missing English value`);
  }
  for (const [key, child] of Object.entries(value)) walk(child, `${pointer}.${key}`);
}
walk(migrationDocuments);

const navigationJson = JSON.stringify(navigation);
for (const criticalPath of [
  "/compliance-platform",
  "/compliance-portal",
  "/managed-compliance",
  "/cyber-security",
  "/security-assessment",
  "/website-security",
  "/email-security",
  "/incident-response",
  "/secure-hosting",
  "/hub",
  "/blog",
  "/stories",
  "/tools",
  "/about",
  "/careers",
  "/docs",
]) {
  requireCondition(menuSource.includes(`href: "${criticalPath}"`), `current menu no longer contains ${criticalPath}`);
  requireCondition(navigationJson.includes(`"${criticalPath}"`), `Sanity navigation seed is missing ${criticalPath}`);
}

for (const footerPath of ["/legal", "/privacy", "/terms", "/dpa", "/legal/hosting-sla"]) {
  requireCondition(footerSource.includes(`href: "${footerPath}"`), `current footer no longer contains ${footerPath}`);
  requireCondition(navigationJson.includes(`"${footerPath}"`), `Sanity footer seed is missing ${footerPath}`);
}

const homepageJson = JSON.stringify(homepage);
for (const phrase of [
  "Conformitate și securitate,",
  "gestionate pentru tine.",
  "Pune conformitatea și securitatea pe pilot automat",
  "Expert dedicat pentru conformitate",
  "Conformitate care rulează în fundal",
  "Transformă controalele în securitate reală",
  "Lucrează dintr-un singur program",
]) {
  requireCondition(homepageSource.includes(phrase), `current homepage no longer contains protected phrase: ${phrase}`);
  requireCondition(homepageJson.includes(phrase), `Sanity homepage seed is missing protected phrase: ${phrase}`);
}

const managedJson = JSON.stringify(managedCompliance);
for (const phrase of [
  "Compliance,",
  "gestionat împreună cu tine.",
  "Programul rulează continuu, nu doar înainte de audit",
  "Cine face ce",
  "Un program, mai multe framework-uri",
  "Întrebări frecvente",
  "Construiește un program pe care îl poți menține după primul audit.",
]) {
  requireCondition(managedComplianceSource.includes(phrase), `current Managed Compliance page no longer contains protected phrase: ${phrase}`);
  requireCondition(managedJson.includes(phrase), `Sanity Managed Compliance seed is missing protected phrase: ${phrase}`);
}
for (const frameworkPath of ["/iso-27001", "/soc2", "/gdpr", "/nis2", "/accessibility"]) {
  requireCondition(managedComplianceSource.includes(`href: "${frameworkPath}"`), `current Managed Compliance page no longer contains ${frameworkPath}`);
  requireCondition(managedJson.includes(`"${frameworkPath}"`), `Sanity Managed Compliance seed is missing ${frameworkPath}`);
}

for (const componentContract of [
  'import Badges from "../Badges.svelte"',
  'import Logos from "../block/Logos.astro"',
  'import ComplianceTrack from "../block/ComplianceTrack.astro"',
  'import SaleArg from "../ui/SaleArg.astro"',
  'import ZebraByteTestimonials from "../block/ZebraByteTestimonials.astro"',
  'import Stories from "../block/Stories.astro"',
  "<animated-hero",
  "<Badges",
  "<ComplianceTrack />",
  "<SaleArg",
  "<ZebraByteTestimonials />",
  "<Stories />",
  "data-cms-homepage",
]) {
  requireCondition(homepageRenderer.includes(componentContract), `CMS homepage parity renderer missing ${componentContract}`);
}
requireCondition(
  documentRenderer.includes('document.path === "/"') && documentRenderer.includes("<CmsHomepageRenderer"),
  "homepage documents must use the dedicated production-parity renderer",
);
requireCondition(
  homepageRenderer.includes("variant={buttonVariant(hero.secondaryCta.style)}"),
  "secondary homepage CTA must respect its Sanity style instead of being forced secondary",
);

for (const componentContract of [
  'import Badges from "../Badges.svelte"',
  'import SaleArg from "../ui/SaleArg.astro"',
  'import ComplianceTrack from "../block/ComplianceTrack.astro"',
  'import Testimonials from "../block/Testimonials.astro"',
  'import Stories from "../block/Stories.astro"',
  "<animated-hero",
  "<ComplianceTrack />",
  "<SaleArg",
  "<Testimonials />",
  "<Stories />",
  "data-cms-managed-compliance",
  '"@type": "Service"',
]) {
  requireCondition(managedComplianceRenderer.includes(componentContract), `Managed Compliance parity renderer missing ${componentContract}`);
}
requireCondition(
  documentRenderer.includes('document.path === "/managed-compliance"') && documentRenderer.includes("<CmsManagedComplianceRenderer"),
  "Managed Compliance must use the dedicated production-parity renderer",
);

for (const mediaContract of [
  "name: 'videoFile'",
  "type: 'file'",
  "accept: 'video/*'",
]) {
  requireCondition(sharedSchema.includes(mediaContract), `Sanity media schema missing ${mediaContract}`);
}
requireCondition(cmsContent.includes("export function cmsFileUrl"), "CMS content adapter must resolve Sanity file assets");
requireCondition(homepageRenderer.includes("cmsFileUrl(media?.videoFile)"), "homepage renderer must prefer Sanity-uploaded video files");
requireCondition(managedComplianceRenderer.includes("cmsFileUrl(media?.videoFile)"), "Managed Compliance renderer must prefer Sanity-uploaded video files");

for (const expected of [
  "SANITY_API_WRITE_TOKEN",
  "--apply-drafts",
  "drafts.${document._id}",
  "createOrReplace",
  "Dry-run only",
  "Nothing was published",
  '["--apply", "--publish", "--production"]',
  "zebrabyte.site-migration.v2",
]) {
  requireCondition(runner.includes(expected), `migration runner missing safety contract: ${expected}`);
}

if (failures.length > 0) {
  console.error(`[sanity-content-migration] ${failures.length} contract violation(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("[sanity-content-migration] Draft-only migration, homepage and Managed Compliance production parity, bilingual content and CMS media contracts verified.");
