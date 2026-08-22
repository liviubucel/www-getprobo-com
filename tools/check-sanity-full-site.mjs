import fs from "node:fs/promises";

const files = {
  sections: "sanity-studio/schemaTypes/sections.ts",
  documents: "sanity-studio/schemaTypes/documents.ts",
  policy: "sanity-studio/schemaTypes/policy.ts",
  sync: "tools/sync-sanity-site.mjs",
  content: "src/lib/cms/content.ts",
  pageRenderer: "src/components/cms/CmsPageRenderer.astro",
  documentRenderer: "src/components/cms/CmsDocumentRenderer.astro",
  hiddenRoute: "src/pages/_cms/[locale]/[...cmsPath].astro",
  layout: "src/layouts/Layout.astro",
  header: "src/components/Header.astro",
  footer: "src/components/Footer.astro",
  mobileMenu: "src/components/MobileMenu.astro",
  router: "worker/router.ts",
  manifest: "worker/cms-managed-routes.ts",
  sitemap: "tools/localize-sitemap.mjs",
  astroConfig: "astro.config.mjs",
};

const sources = Object.fromEntries(
  await Promise.all(Object.entries(files).map(async ([key, file]) => [key, await fs.readFile(file, "utf8")])),
);

function requireText(key, expected) {
  if (!sources[key].includes(expected)) {
    throw new Error(`[sanity-full-site] ${files[key]} missing contract: ${expected}`);
  }
}

for (const section of [
  "heroSection",
  "richTextSection",
  "featureGridSection",
  "mediaSection",
  "mediaGridSection",
  "statsSection",
  "logoCloudSection",
  "testimonialsSection",
  "comparisonTableSection",
  "cardGridSection",
  "stepsSection",
  "pricingSection",
  "faqSection",
  "ctaSection",
  "siteBlockSection",
  "pageSections",
]) {
  requireText("sections", `name: '${section}'`);
}
requireText("sections", "name: 'enabled'");
requireText("sections", "complianceTrack");
requireText("sections", "zebrabyteTestimonials");

for (const contract of [
  "headerPrimaryCta",
  "mobileSecondaryCta",
  "footerCopyright",
  "footerLegalLine",
  "Header mega-menu",
  "Feature card",
  "showHeader",
  "showFooter",
  "showFooterFrameworks",
]) {
  requireText("documents", contract);
}

requireText("policy", "'/_cms'");
for (const reserved of ["/api", "/cdn-cgi", "/.well-known", "/en", "/_cms"]) {
  if (!sources.sync.includes(`"${reserved}"`)) {
    throw new Error(`[sanity-full-site] sync route policy missing reserved prefix ${reserved}`);
  }
}

for (const contract of [
  "routeManifestPath",
  "collectManagedRoutes",
  "assertRequiredSingleton",
  "managedRoutes",
  "worker/cms-managed-routes.ts",
  'perspective", "published',
]) {
  requireText("sync", contract);
}

for (const contract of [
  "getCmsSiteSettings",
  "getCmsNavigation",
  "getCmsManagedDocuments",
  "getCmsDocumentByPath",
  "portableTextToHtml",
  "escapeHtml",
  "safeHref",
  "cdn.sanity.io/images",
]) {
  requireText("content", contract);
}

for (const section of [
  'section._type === "heroSection"',
  'section._type === "featureGridSection"',
  'section._type === "mediaGridSection"',
  'section._type === "pricingSection"',
  'section._type === "faqSection"',
  'section._type === "siteBlockSection"',
]) {
  requireText("pageRenderer", section);
}
requireText("documentRenderer", 'document._type === "page"');
requireText("documentRenderer", 'document._type === "legalDocument"');
requireText("documentRenderer", 'document._type === "hubArticle"');
requireText("documentRenderer", 'document._type === "story"');
requireText("documentRenderer", 'document._type === "job"');

for (const contract of [
  '(["ro", "en"] as CmsLocale[])',
  "getCmsManagedDocuments()",
  "canonicalPath={canonicalPath}",
  "cmsManaged",
]) {
  requireText("hiddenRoute", contract);
}

for (const contract of [
  'locale?: CmsLocale',
  'canonicalPath?: string',
  'showHeader?: boolean',
  'showFooter?: boolean',
  'html lang={locale}',
  'getCmsSiteSettings(locale)',
]) {
  requireText("layout", contract);
}
requireText("header", "getCmsNavigation(locale)");
requireText("header", "getCmsSiteSettings(locale)");
requireText("header", "groups={groups}");
requireText("mobileMenu", "groups?: MenuGroup[]");
requireText("footer", "getCmsNavigation(locale)");
requireText("footer", "getCmsSiteSettings(locale)");

for (const contract of [
  'import { cmsManagedRoutes } from "./cms-managed-routes"',
  'const internalCmsPrefix = "/_cms"',
  "cmsManagedResponse",
  "cmsManagedRoutes.has(canonicalPath)",
  'headers.set("X-ZebraByte-Content-Source", "sanity")',
  "isInternalCmsPath(url.pathname)",
]) {
  requireText("router", contract);
}
requireText("manifest", "cmsManagedRoutes");
requireText("astroConfig", 'pathname === "/_cms"');
requireText("sitemap", "cmsSitemapRoutes");
requireText("sitemap", "CMS route(s)");

// The browser-rendered CMS surface must stay data-only. Executable author input
// is not part of the full-site-management contract.
for (const [key, source] of Object.entries({
  sections: sources.sections,
  documents: sources.documents,
})) {
  for (const forbidden of ["customHtml", "customCss", "customJs", "javascript:", "<script"]) {
    if (source.includes(forbidden)) {
      throw new Error(`[sanity-full-site] ${files[key]} exposes forbidden executable author input: ${forbidden}`);
    }
  }
}

console.log("[sanity-full-site] Full-site CMS routing, bilingual rendering, global chrome, page builder and security contracts verified.");
