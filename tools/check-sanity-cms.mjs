import fs from "node:fs/promises";

const paths = {
  rootPackage: "package.json",
  studioPackage: "sanity-studio/package.json",
  studioConfig: "sanity-studio/sanity.config.ts",
  studioCli: "sanity-studio/sanity.cli.ts",
  studioEnv: "sanity-studio/.env.example",
  studioWrangler: "sanity-studio/wrangler.jsonc",
  schema: "sanity-studio/schemaTypes/index.ts",
  localized: "sanity-studio/schemaTypes/localized.ts",
  shared: "sanity-studio/schemaTypes/shared.ts",
  sections: "sanity-studio/schemaTypes/sections.ts",
  documents: "sanity-studio/schemaTypes/documents.ts",
  policy: "sanity-studio/schemaTypes/policy.ts",
  siteSync: "tools/sync-sanity-site.mjs",
  blogSync: "tools/sync-zebrabyte-blog-v2.mjs",
  optimizedBlogSync: "tools/sync-zebrabyte-blog-optimized.mjs",
};

const entries = Object.fromEntries(
  await Promise.all(Object.entries(paths).map(async ([key, file]) => [key, await fs.readFile(file, "utf8")])),
);

function requireText(sourceName, text, expected) {
  if (!text.includes(expected)) {
    throw new Error(`[sanity-cms] ${sourceName} is missing required contract: ${expected}`);
  }
}

requireText(paths.studioPackage, entries.studioPackage, '"sanity"');
requireText(paths.studioPackage, entries.studioPackage, '"@sanity/vision"');
for (const patchedDependency of [
  '"js-yaml": "3.15.1"',
  '"smol-toml": "1.8.0"',
  '"uuid": "11.1.1"',
]) {
  requireText(paths.studioPackage, entries.studioPackage, patchedDependency);
}

for (const expected of [
  "title: 'ZebraByte CMS'",
  "SANITY_STUDIO_PROJECT_ID",
  "SANITY_STUDIO_DATASET",
  "SANITY_STUDIO_PREVIEW_URL",
  "resolveTrustedPreviewUrl",
  "presentationTool({",
  "allowOrigins:",
  "http://localhost:*",
  "http://127.0.0.1:*",
  "https://stag.zebrabyte.ro",
  "documentId('siteSettings')",
  "documentId('mainNavigation')",
]) {
  requireText(paths.studioConfig, entries.studioConfig, expected);
}
if (/allowOrigins\s*:\s*\[[^\]]*www\.zebrabyte\.ro/s.test(entries.studioConfig)) {
  throw new Error("[sanity-cms] Public production must not be a trusted draft-preview origin.");
}
requireText(paths.studioConfig, entries.studioConfig, "yj548pxh");
requireText(paths.studioConfig, entries.studioConfig, "production");
requireText(paths.studioConfig, entries.studioConfig, "must target ZebraByte staging or localhost");
requireText(paths.studioCli, entries.studioCli, "SANITY_STUDIO_PROJECT_ID");
requireText(paths.studioCli, entries.studioCli, "SANITY_STUDIO_DATASET");
requireText(paths.studioEnv, entries.studioEnv, "SANITY_STUDIO_PREVIEW_URL=https://stag.zebrabyte.ro");

requireText(paths.studioWrangler, entries.studioWrangler, '"name": "zebrabyte-cms"');
requireText(paths.studioWrangler, entries.studioWrangler, '"directory": "./dist"');
requireText(paths.studioWrangler, entries.studioWrangler, '"not_found_handling": "single-page-application"');
if (/"name"\s*:\s*"zebrabyte-website"/.test(entries.studioWrangler)) {
  throw new Error("[sanity-cms] Studio must not target the public website Worker.");
}

for (const type of ["localizedString", "localizedText", "localizedRichText"]) {
  requireText(paths.localized, entries.localized, `name: '${type}'`);
}
for (const type of ["cmsLink", "seo", "faqItem", "mediaAsset", "statItem", "featureItem", "testimonialItem"]) {
  requireText(paths.shared, entries.shared, `name: '${type}'`);
}
for (const type of [
  "heroSection",
  "richTextSection",
  "featureGridSection",
  "mediaSection",
  "statsSection",
  "logoCloudSection",
  "testimonialsSection",
  "comparisonTableSection",
  "faqSection",
  "ctaSection",
  "pageSections",
]) {
  requireText(paths.sections, entries.sections, `name: '${type}'`);
}
for (const type of ["siteSettings", "navigation", "page", "hubArticle", "story", "job", "legalDocument"]) {
  requireText(paths.documents, entries.documents, `name: '${type}'`);
  requireText(paths.schema, entries.schema, type);
}

for (const expected of [
  "'/api'",
  "'/cdn-cgi'",
  "'/.well-known'",
  "'/en'",
  "validatePublicPath",
  "validateCmsHref",
  "validateHttpsUrl",
  "https:",
  "mailto:",
  "tel:",
]) {
  requireText(paths.policy, entries.policy, expected);
}
requireText(paths.documents, entries.documents, "custom(validatePublicPath)");
requireText(paths.shared, entries.shared, "custom(validateCmsHref)");
requireText(paths.schema, entries.schema, "custom(validateCmsHref)");
requireText(paths.shared, entries.shared, "Internal provenance note");
requireText(paths.documents, entries.documents, "Internal relationship/provenance note");

for (const expected of [
  ".api.sanity.io",
  'endpoint.searchParams.set("perspective", "published")',
  'requestCount: 1',
  '"siteSettings"',
  '"navigation"',
  '"pages"',
  '"posts"',
  '"hubArticles"',
  '"stories"',
  '"jobs"',
  '"legalDocuments"',
  "validateSnapshot(content)",
]) {
  requireText(paths.siteSync, entries.siteSync, expected);
}
requireText(paths.optimizedBlogSync, entries.optimizedBlogSync, ".sanity-cache/site-content.json");
requireText(paths.optimizedBlogSync, entries.optimizedBlogSync, "no second Content Lake query");
requireText(paths.rootPackage, entries.rootPackage, '"sync:sanity-site": "node tools/sync-sanity-site.mjs"');
const buildScript = JSON.parse(entries.rootPackage).scripts?.build || "";
if (!buildScript.startsWith("npm run sync:sanity-site && npm run sync:zebrabyte-blog")) {
  throw new Error("[sanity-cms] Website build must create the validated Sanity snapshot before blog generation.");
}

for (const field of [
  "name: 'title'",
  "name: 'slug'",
  "name: 'excerpt'",
  "name: 'publishedAt'",
  "name: 'author'",
  "name: 'tags'",
  "name: 'mainImage'",
  "name: 'body'",
]) {
  requireText(paths.schema, entries.schema, field);
}
requireText(paths.blogSync, entries.blogSync, '"yj548pxh"');
requireText(paths.blogSync, entries.blogSync, '"production"');
requireText(paths.blogSync, entries.blogSync, '_type == "post"');
requireText(paths.blogSync, entries.blogSync, 'endpoint.searchParams.set("perspective", "published")');
requireText(paths.blogSync, entries.blogSync, 'path("drafts.**")');

for (const [name, text] of [
  [paths.studioConfig, entries.studioConfig],
  [paths.studioCli, entries.studioCli],
  [paths.studioEnv, entries.studioEnv],
  [paths.schema, entries.schema],
  [paths.localized, entries.localized],
  [paths.shared, entries.shared],
  [paths.sections, entries.sections],
  [paths.documents, entries.documents],
  [paths.policy, entries.policy],
  [paths.studioWrangler, entries.studioWrangler],
]) {
  const forbiddenAssignments = [
    /SANITY_STUDIO_[A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|KEY)\s*=/,
    /Authorization\s*[:=]\s*["'`]Bearer\s+/i,
    /deploy_hooks\/[A-Za-z0-9_-]{12,}/i,
    /name:\s*["'`](?:customHtml|customCss|customJs|script|stylesheet)["'`]/i,
  ];
  for (const pattern of forbiddenAssignments) {
    if (pattern.test(text)) {
      throw new Error(`[sanity-cms] ${name} violates the CMS security boundary.`);
    }
  }
}

console.log("[sanity-cms] Security-first editorial, single-query delivery, staging-only preview, Studio, hosting, and legacy compatibility contracts verified.");
