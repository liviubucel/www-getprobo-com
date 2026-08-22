import {readdir, readFile} from "node:fs/promises";
import path from "node:path";
import {migrationDocuments, migrationVersion} from "./sanity-migration/content-v2.mjs";

const pagesRoot = path.resolve("src/pages");

async function walk(directory) {
  const entries = await readdir(directory, {withFileTypes: true});
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(absolute));
    else files.push(absolute);
  }
  return files;
}

function routeForFile(file) {
  const relative = path.relative(pagesRoot, file).replaceAll(path.sep, "/");
  if (!relative.endsWith(".astro")) return null;
  if (relative.startsWith("_cms/")) return null;
  if (relative === "404.astro") return null;
  if (/\[[^\]]+\]/.test(relative)) return null;

  const route = `/${relative.replace(/\.astro$/, "").replace(/\/index$/, "")}`;
  return route === "/index" ? "/" : route;
}

function classifySource(source, route) {
  if (route === "/") return "editorial";
  if (
    source.includes("getStaticPaths") ||
    source.includes("getCollection(") ||
    source.includes("getEntry(")
  ) return "collection";
  if (
    source.includes("<form") ||
    source.includes("fetch(\"/api/") ||
    source.includes("fetch('/api/") ||
    source.includes("Turnstile") ||
    source.includes("turnstile")
  ) return "interactive";
  return "editorial";
}

const seededPaths = new Set(
  migrationDocuments
    .filter((document) => document._type === "page" && typeof document.path === "string")
    .map((document) => document.path),
);

const rows = [];
for (const file of await walk(pagesRoot)) {
  const route = routeForFile(file);
  if (!route) continue;
  const source = await readFile(file, "utf8");
  rows.push({
    route,
    kind: classifySource(source, route),
    seeded: seededPaths.has(route),
    file: path.relative(process.cwd(), file).replaceAll(path.sep, "/"),
  });
}
rows.sort((a, b) => a.route.localeCompare(b.route));

const counts = rows.reduce(
  (acc, row) => {
    acc.total += 1;
    acc[row.kind] += 1;
    if (row.seeded) acc.seeded += 1;
    if (row.kind === "editorial" && row.seeded) acc.seededEditorial += 1;
    return acc;
  },
  {total: 0, editorial: 0, interactive: 0, collection: 0, seeded: 0, seededEditorial: 0},
);

const editorialPercent = counts.editorial
  ? Math.round((counts.seededEditorial / counts.editorial) * 1000) / 10
  : 100;

console.log(`[sanity-coverage] migration=${migrationVersion}`);
console.log(
  `[sanity-coverage] static routes=${counts.total}; editorial=${counts.editorial}; interactive=${counts.interactive}; collection=${counts.collection}; seeded=${counts.seeded}; seeded-editorial=${counts.seededEditorial}/${counts.editorial} (${editorialPercent}%).`,
);

for (const row of rows.filter((row) => !row.seeded)) {
  console.log(`[sanity-coverage] pending ${row.kind.padEnd(11)} ${row.route} <- ${row.file}`);
}

console.log(
  "[sanity-coverage] Interactive/collection routes are not considered complete merely by seeding copy; their executable or collection behavior remains code-owned and needs a CMS-aware adapter before route handover.",
);
