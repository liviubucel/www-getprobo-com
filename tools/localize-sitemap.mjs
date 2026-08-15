import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const dist = path.join(root, "dist");
const siteOrigin = "https://www.zebrabyte.ro";

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(absolute));
    else files.push(absolute);
  }
  return files;
}

function englishUrl(value) {
  const url = new URL(value);
  if (url.origin !== siteOrigin) return null;
  if (url.pathname === "/en" || url.pathname.startsWith("/en/")) return url.toString();
  url.pathname = url.pathname === "/" ? "/en" : `/en${url.pathname}`;
  return url.toString();
}

function replaceLoc(block, nextLoc) {
  return block.replace(/<loc>[^<]+<\/loc>/, `<loc>${nextLoc}</loc>`);
}

const files = (await walk(dist)).filter((file) => /sitemap[^/]*\.xml$/i.test(file));
let sourceCount = 0;
let englishCount = 0;
let changedFiles = 0;

for (const file of files) {
  const xml = await readFile(file, "utf8");
  if (!/<urlset\b/i.test(xml)) continue;

  const blocks = [...xml.matchAll(/<url>[^]*?<\/url>/g)].map((match) => match[0]);
  if (blocks.length === 0) continue;

  const existing = new Set(
    blocks
      .map((block) => block.match(/<loc>([^<]+)<\/loc>/)?.[1])
      .filter(Boolean),
  );
  const additions = [];

  for (const block of blocks) {
    const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1];
    if (!loc) continue;
    const parsed = new URL(loc);
    if (parsed.pathname === "/en" || parsed.pathname.startsWith("/en/")) {
      englishCount += 1;
      continue;
    }

    sourceCount += 1;
    const localized = englishUrl(loc);
    if (!localized || existing.has(localized)) continue;
    additions.push(replaceLoc(block, localized));
    existing.add(localized);
    englishCount += 1;
  }

  if (additions.length === 0) continue;
  const next = xml.replace(/<\/urlset>/i, `${additions.join("")}\n</urlset>`);
  await writeFile(file, next, "utf8");
  changedFiles += 1;
}

if (files.length === 0) {
  throw new Error("No sitemap XML files were generated.");
}
if (sourceCount > 0 && englishCount === 0) {
  throw new Error("No English sitemap URLs were generated.");
}

console.log(`[i18n] sitemap: ${sourceCount} RO URLs, ${englishCount} EN URLs across ${changedFiles} localized file(s).`);
