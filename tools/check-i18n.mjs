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

const router = await read("worker/router.ts");
for (const marker of [
  "normalizeRomanianMarkup",
  "translateEnglishMarkup",
  "localizePlainText",
  "localizeDateMarkup",
  "finalizeHtmlLocale",
  "Content-Language",
]) {
  requireText(router, marker, "Locale router");
}

const translator = await read("worker/i18n-ai.ts");
requireText(translator, "@cf/meta/m2m100-1.2b", "AI translation model");
requireText(translator, "i18n:v3:text", "Translation cache");
requireText(translator, "i18n:v3:page", "Page translation cache");

const documentLocale = await read("worker/i18n-document.ts");
for (const marker of ['hreflang="ro"', 'hreflang="en"', 'hreflang="x-default"', "og:locale"]) {
  requireText(documentLocale, marker, "SEO locale finalizer");
}

const switcher = await read("src/components/LanguageSwitcher.astro");
for (const marker of ["/en", "RO", "EN", "installBrowserI18nObserver"]) {
  requireText(switcher, marker, "Language switcher");
}

const browserI18n = await read("src/lib/browser-i18n.ts");
for (const marker of ["MutationObserver", "browserT", "getBrowserLocale"]) {
  requireText(browserI18n, marker, "Browser runtime i18n");
}

const sourceFiles = [
  ...(await walk("src/pages")),
  ...(await walk("src/components")),
  ...(await walk("src/layouts")),
].filter((file) => /\.(?:astro|ts|svelte|js|mjs)$/.test(file));

const staleFrenchFiles = [];
const dynamicLiteralFiles = [];
for (const file of sourceFiles) {
  const source = await read(file);
  if (/href\s*=\s*["']\/fr(?:\/|["'])/i.test(source)) staleFrenchFiles.push(file);
  if (/textContent\s*=\s*["'`][A-Za-zĂÂÎȘȚăâîșț]/u.test(source)) dynamicLiteralFiles.push(file);
}

if (staleFrenchFiles.length) {
  failures.push(`Legacy /fr links remain in public source: ${staleFrenchFiles.join(", ")}`);
}

if (dynamicLiteralFiles.length) {
  warnings.push(
    `Runtime text literals detected in ${dynamicLiteralFiles.length} files; global browser i18n observer must remain enabled: ${dynamicLiteralFiles.join(", ")}`,
  );
}

const distHtml = (await walk("dist")).filter((file) => file.endsWith(".html"));
if (distHtml.length === 0) {
  failures.push("No generated HTML found in dist; run this check after astro build.");
} else {
  let htmlDocuments = 0;
  let oldFrenchLang = 0;
  for (const file of distHtml) {
    const source = await read(file);
    if (/<html\b/i.test(source)) htmlDocuments += 1;
    if (/<html\b[^>]*\blang=["']fr(?:-[^"']+)?["']/i.test(source)) oldFrenchLang += 1;
  }
  if (oldFrenchLang) failures.push(`${oldFrenchLang} generated HTML documents still declare French locale.`);
  if (htmlDocuments === 0) failures.push("Generated dist contains no complete HTML documents.");
  console.log(`[i18n] inspected ${htmlDocuments} generated HTML documents.`);
}

for (const warning of warnings) console.warn(`[i18n] warning: ${warning}`);

if (failures.length) {
  for (const failure of failures) console.error(`[i18n] error: ${failure}`);
  process.exitCode = 1;
} else {
  console.log("[i18n] RO/EN localization architecture checks passed.");
}
