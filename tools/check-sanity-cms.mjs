import fs from "node:fs/promises";

const paths = {
  studioPackage: "sanity-studio/package.json",
  studioConfig: "sanity-studio/sanity.config.ts",
  studioCli: "sanity-studio/sanity.cli.ts",
  studioEnv: "sanity-studio/.env.example",
  schema: "sanity-studio/schemaTypes/index.ts",
  sync: "tools/sync-zebrabyte-blog-v2.mjs",
};

const entries = Object.fromEntries(
  await Promise.all(
    Object.entries(paths).map(async ([key, file]) => [key, await fs.readFile(file, "utf8")]),
  ),
);

function requireText(sourceName, text, expected) {
  if (!text.includes(expected)) {
    throw new Error(`[sanity-cms] ${sourceName} is missing required contract: ${expected}`);
  }
}

requireText(paths.studioPackage, entries.studioPackage, '"sanity"');
requireText(paths.studioPackage, entries.studioPackage, '"@sanity/vision"');

// Sanity 6.10.1 currently pulls CLI-only transitives with known advisories.
// Pin patched legacy-compatible releases until upstream dependency ranges no
// longer resolve the vulnerable versions. CI then runs npm audit and a real
// Studio build, so an incompatible override cannot silently reach main.
for (const patchedDependency of [
  '"js-yaml": "3.15.1"',
  '"smol-toml": "1.8.0"',
  '"uuid": "11.1.1"',
]) {
  requireText(paths.studioPackage, entries.studioPackage, patchedDependency);
}

requireText(paths.studioConfig, entries.studioConfig, "title: 'ZebraByte CMS'");
requireText(paths.studioConfig, entries.studioConfig, "SANITY_STUDIO_PROJECT_ID");
requireText(paths.studioConfig, entries.studioConfig, "SANITY_STUDIO_DATASET");
requireText(paths.studioConfig, entries.studioConfig, "yj548pxh");
requireText(paths.studioConfig, entries.studioConfig, "production");
requireText(paths.studioCli, entries.studioCli, "SANITY_STUDIO_PROJECT_ID");
requireText(paths.studioCli, entries.studioCli, "SANITY_STUDIO_DATASET");

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

// The public site currently consumes the existing Content Lake at build time.
// Keep the Studio schema and the build importer locked to that same source until
// a deliberate migration is made in a separately reviewed change.
requireText(paths.sync, entries.sync, '"yj548pxh"');
requireText(paths.sync, entries.sync, '"production"');
requireText(paths.sync, entries.sync, '_type == "post"');
requireText(paths.sync, entries.sync, 'endpoint.searchParams.set("perspective", "published")');
requireText(paths.sync, entries.sync, 'path("drafts.**")');

// SANITY_STUDIO_* values are bundled into the browser. They may contain public
// project/dataset identifiers, but never bearer/deploy/read/write credentials.
for (const [name, text] of [
  [paths.studioConfig, entries.studioConfig],
  [paths.studioCli, entries.studioCli],
  [paths.studioEnv, entries.studioEnv],
  [paths.schema, entries.schema],
]) {
  const forbiddenAssignments = [
    /SANITY_STUDIO_[A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|KEY)\s*=/,
    /Authorization\s*[:=]\s*["'`]Bearer\s+/i,
  ];
  for (const pattern of forbiddenAssignments) {
    if (pattern.test(text)) {
      throw new Error(`[sanity-cms] ${name} appears to expose a secret in the browser-facing Studio.`);
    }
  }
}

console.log("[sanity-cms] Studio and build-time blog integration contract verified.");
