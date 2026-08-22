import fs from "node:fs/promises";

const paths = {
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
  sync: "tools/sync-zebrabyte-blog-v2.mjs",
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
  "presentationTool({",
  "allowOrigins:",
  "https://stag.zebrabyte.ro",
  "https://www.zebrabyte.ro",
  "documentId('siteSettings')",
  "documentId('mainNavigation')",
]) {
  requireText(paths.studioConfig, entries.studioConfig, expected);
}
requireText(paths.studioConfig, entries.studioConfig, "yj548pxh");
requireText(paths.studioConfig, entries.studioConfig, "production");
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

// The legacy blog contract remains available while the rest of the site migrates.
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

requireText(paths.sync, entries.sync, '"yj548pxh"');
requireText(paths.sync, entries.sync, '"production"');
requireText(paths.sync, entries.sync, '_type == "post"');
requireText(paths.sync, entries.sync, 'endpoint.searchParams.set("perspective", "published")');
requireText(paths.sync, entries.sync, 'path("drafts.**")');

// Browser-facing Studio files may contain public project/dataset/origin values,
// but never bearer/deploy/read/write credentials or raw script/style injection.
for (const [name, text] of [
  [paths.studioConfig, entries.studioConfig],
  [paths.studioCli, entries.studioCli],
  [paths.studioEnv, entries.studioEnv],
  [paths.schema, entries.schema],
  [paths.localized, entries.localized],
  [paths.shared, entries.shared],
  [paths.sections, entries.sections],
  [paths.documents, entries.documents],
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

console.log("[sanity-cms] Full editorial source-of-truth, Studio, hosting, and legacy blog contracts verified.");
