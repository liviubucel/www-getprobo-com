import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const failures = [];
const warnings = [];

async function read(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

function requireText(source, needle, label) {
  if (!source.includes(needle)) failures.push(`${label}: missing ${JSON.stringify(needle)}`);
}

async function walk(directory) {
  const absolute = path.join(root, directory);
  try {
    const entries = await readdir(absolute);
    const files = [];
    for (const entry of entries) {
      const relative = path.join(directory, entry);
      const info = await stat(path.join(root, relative));
      if (info.isDirectory()) files.push(...(await walk(relative)));
      else files.push(relative);
    }
    return files;
  } catch {
    return [];
  }
}

const wrangler = await read("wrangler.jsonc");
requireText(wrangler, '"binding": "AI"', "Workers AI binding");
requireText(wrangler, '"main": "./worker/router.ts"', "Worker router");

const astroConfig = await read("astro.config.mjs");
for (const marker of [
  "locales:",
  "root:",
  'label: "Română"',
  'lang: "ro"',
]) {
  requireText(astroConfig, marker, "Starlight Romanian root locale");
}

const router = await read("worker/router.ts");
for (const marker of [
  "normalizeRomanianMarkup",
  "translateEnglishMarkup",
  "localizePlainText",
  "localizeDateMarkup",
  "finalizeHtmlLocale",
  "Content-Language",
  "apiLocaleFromRequest",
  "localizeApiResponse",
  "withLocalizedEmailEnv",
]) {
  requireText(router, marker, "Locale router");
}

const apiI18n = await read("worker/i18n-api.ts");
for (const marker of [
  "Accept-Language",
  "Content-Language",
  "withLocalizedEmailEnv",
  "localizeApiResponse",
  'params.set("lang", locale)',
  "/en/newsletter/rezultat",
]) {
  requireText(apiI18n, marker, "API/email localization");
}

const explicitLocaleIndex = apiI18n.indexOf('url.searchParams.get("lang")');
const englishPathIndex = apiI18n.indexOf('if (englishPath) return "en"');
if (explicitLocaleIndex === -1 || englishPathIndex === -1 || explicitLocaleIndex > englishPathIndex) {
  failures.push("API locale precedence must honor explicit ?lang= before /en and Accept-Language fallbacks.");
}

const translator = await read("worker/i18n-ai.ts");
requireText(translator, "@cf/meta/m2m100-1.2b", "AI translation model");
requireText(translator, "i18n:v3:text", "Translation cache");
requireText(translator, "i18n:v3:page", "Page translation cache");

const documentLocale = await read("worker/i18n-document.ts");
for (const marker of [
  'hreflang="ro"',
  'hreflang="en"',
  'hreflang="x-default"',
  "og:locale",
  "localizeTurnstileWidgets",
  "data-language",
]) {
  requireText(documentLocale, marker, "SEO/third-party locale finalizer");
}

const switcher = await read("src/components/LanguageSwitcher.astro");
for (const marker of ["/en", "RO", "EN", "installBrowserI18nObserver"]) {
  requireText(switcher, marker, "Language switcher");
}

const browserI18n = await read("src/lib/browser-i18n.ts");
const browserI18nLower = browserI18n.toLocaleLowerCase();
for (const marker of [
  "MutationObserver",
  "browserT",
  "getBrowserLocale",
  "Copy to clipboard",
  "Failed to copy",
  "Load more results",
  "pagefind-ui__result-link",
  "pageSummary",
  "zbtLocalizedHref",
  "pagefindInFlight.delete",
]) {
  requireText(browserI18n, marker, "Browser runtime/Pagefind i18n");
}

const hydratedContracts = [
  ["src/components/DealForm.svelte", ["browserT", "getBrowserLocale", "Accept-Language"]],
  ["src/components/DownloadAgent.svelte", ["browserT"]],
  ["src/lib/device-agent-release.ts", ["browserT", "getBrowserLocale", "Accept-Language"]],
  ["src/components/block/Sharer.svelte", ["browserT", "copied = true", "onDestroy"]],
  ["src/components/docs/mermaid-init.ts", ["browserT"]],
  ["src/components/docs/MobileMenuToggle.astro", ["browserT", "Deschide meniul documentației", "Open documentation menu"]],
  ["src/components/docs/ThemeToggle.astro", ["Temă luminoasă", "Temă întunecată", "Tema sistemului"]],
  ["src/components/ui/Slider.svelte", ["browserT", "i18n:", "Previous slide", "Slide-ul anterior"]],
  ["src/components/LogosScroll.svelte", ["browserT", "i18n:"]],
  ["src/components/block/TestimonialsScroll.svelte", ["browserT", "i18n:"]],
  ["src/components/ZebraByteStatus.svelte", ["browserT", "All systems are operational"]],
  ["src/components/FrameworkBadge.svelte", ["browserT", "framework badge", "badge de conformitate"]],
];
for (const [file, markers] of hydratedContracts) {
  const source = await read(file);
  for (const marker of markers) requireText(source, marker, `Hydrated localization (${file})`);
}

const footer = await read("src/components/Footer.astro");
for (const marker of ["Resurse", "Acasă", "Studii de caz", "Conformitate și juridic", "Toate drepturile rezervate."]) {
  requireText(footer, marker, "Canonical Romanian footer");
}
const curatedEnglish = await read("worker/i18n.ts");
for (const marker of [
  '"Acasă": "Home"',
  '"Păreri de la clienți ⭐": "Love from Customers ⭐"',
  '"Jurnal de modificări": "Changelog"',
  '"Conformitate și juridic": "Compliance & Legal"',
  '"Centru de încredere": "Trust Center"',
]) {
  requireText(curatedEnglish, marker, "Deterministic English footer");
}

const sourceFiles = [
  ...(await walk("src/pages")),
  ...(await walk("src/components")),
  ...(await walk("src/layouts")),
  ...(await walk("src/lib")),
].filter((file) => /\.(?:astro|ts|svelte|js|mjs)$/.test(file));

const staleFrenchFiles = [];
const hardCodedUsLocaleFiles = [];
const uncoveredRuntimeLiterals = [];
const unlocalizedSplideFiles = [];
const runtimeLiteralPatterns = [
  /(?:textContent|innerText)\s*=\s*["'`]([^"'`\n]+)["'`]/g,
  /setAttribute\(\s*["'](?:title|aria-label|placeholder)["']\s*,\s*["'`]([^"'`\n]+)["'`]\s*\)/g,
  /alert\(\s*["'`]([^"'`\n]+)["'`]\s*\)/g,
];

for (const file of sourceFiles) {
  const source = await read(file);
  if (/href\s*=\s*["']\/fr(?:\/|["'])/i.test(source)) staleFrenchFiles.push(file);
  if (/(?:Intl\.DateTimeFormat|Intl\.NumberFormat|toLocaleString)\(\s*["']en-US["']/i.test(source)) {
    hardCodedUsLocaleFiles.push(file);
  }
  if (source.includes("new Splide(") && (!source.includes("browserT(") || !source.includes("i18n:"))) {
    unlocalizedSplideFiles.push(file);
  }

  for (const pattern of runtimeLiteralPatterns) {
    pattern.lastIndex = 0;
    for (const match of source.matchAll(pattern)) {
      const literal = match[1]?.trim();
      if (!literal || !/[A-Za-zĂÂÎȘȚăâîșț]/u.test(literal)) continue;
      if (!browserI18nLower.includes(literal.toLocaleLowerCase())) {
        uncoveredRuntimeLiterals.push(`${file}: ${JSON.stringify(literal)}`);
      }
    }
  }
}

if (staleFrenchFiles.length) {
  failures.push(`Legacy /fr links remain in public source: ${staleFrenchFiles.join(", ")}`);
}
if (hardCodedUsLocaleFiles.length) {
  failures.push(`Hard-coded en-US formatting remains in public source: ${hardCodedUsLocaleFiles.join(", ")}`);
}
if (unlocalizedSplideFiles.length) {
  failures.push(`Splide instances without explicit RO/EN accessibility i18n: ${unlocalizedSplideFiles.join(", ")}`);
}
if (uncoveredRuntimeLiterals.length) {
  failures.push(
    `Uncovered runtime UI literals remain (use browserT or register the exact pair): ${uncoveredRuntimeLiterals.join(" | ")}`,
  );
}

for (const legacyFile of ["src/components/OpenStatus.svelte", "src/lib/probo-agent-release.ts"]) {
  if (sourceFiles.includes(legacyFile)) failures.push(`Unused legacy localization source still exists: ${legacyFile}`);
}

const distHtml = (await walk("dist")).filter((file) => file.endsWith(".html"));
if (distHtml.length === 0) {
  failures.push("No generated HTML found in dist; run this check after astro build.");
} else {
  let htmlDocuments = 0;
  let oldFrenchLang = 0;
  let docsDeclaredRomanian = 0;
  for (const file of distHtml) {
    const source = await read(file);
    if (/<html\b/i.test(source)) htmlDocuments += 1;
    if (/<html\b[^>]*\blang=["']fr(?:-[^"']+)?["']/i.test(source)) oldFrenchLang += 1;
    if (file.includes(`${path.sep}docs${path.sep}`) && /<html\b[^>]*\blang=["']ro["']/i.test(source)) {
      docsDeclaredRomanian += 1;
    }
  }
  if (oldFrenchLang) failures.push(`${oldFrenchLang} generated HTML documents still declare French locale.`);
  if (htmlDocuments === 0) failures.push("Generated dist contains no complete HTML documents.");
  if (distHtml.some((file) => file.includes(`${path.sep}docs${path.sep}`)) && docsDeclaredRomanian === 0) {
    failures.push("Generated documentation does not declare Romanian as the canonical root locale.");
  }
  console.log(`[i18n] inspected ${htmlDocuments} generated HTML documents.`);
}

const sitemapFiles = (await walk("dist")).filter((file) => /sitemap[^/]*\.xml$/i.test(file));
let romanianSitemapUrls = 0;
let englishSitemapUrls = 0;
for (const file of sitemapFiles) {
  const source = await read(file);
  if (!/<urlset\b/i.test(source)) continue;
  const locs = [...source.matchAll(/<loc>(https:\/\/www\.zebrabyte\.ro[^<]*)<\/loc>/g)].map((match) => match[1]);
  for (const loc of locs) {
    const pathname = new URL(loc).pathname;
    if (pathname === "/en" || pathname.startsWith("/en/")) englishSitemapUrls += 1;
    else romanianSitemapUrls += 1;
  }
}
if (romanianSitemapUrls === 0) failures.push("Sitemap contains no Romanian/root URLs.");
if (englishSitemapUrls === 0) failures.push("Sitemap contains no English /en URLs.");
if (romanianSitemapUrls > 0 && englishSitemapUrls !== romanianSitemapUrls) {
  failures.push(`Sitemap locale mismatch: ${romanianSitemapUrls} RO URLs vs ${englishSitemapUrls} EN URLs.`);
}
console.log(`[i18n] sitemap audit: ${romanianSitemapUrls} RO URLs / ${englishSitemapUrls} EN URLs.`);

for (const warning of warnings) console.warn(`[i18n] warning: ${warning}`);

if (failures.length) {
  for (const failure of failures) console.error(`[i18n] error: ${failure}`);
  process.exitCode = 1;
} else {
  console.log("[i18n] RO/EN localization architecture checks passed.");
}
