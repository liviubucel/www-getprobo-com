import fs from "node:fs/promises";
import path from "node:path";

const roots = [
  path.resolve("public/blog/zebrabyte-generated"),
  path.resolve("public"),
];

const limits = new Map([
  [".jpg", 1_500_000],
  [".jpeg", 1_500_000],
  [".png", 1_500_000],
  [".webp", 1_500_000],
  [".avif", 1_500_000],
  [".gif", 2_000_000],
]);

const ignoredPrefixes = [
  path.resolve("public/blog/zebrabyte-generated") + path.sep,
];

async function exists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function walk(directory, files = []) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(absolute, files);
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}

const scanned = new Set();
const violations = [];
const warnings = [];

for (const root of roots) {
  if (!(await exists(root))) continue;
  for (const file of await walk(root)) {
    if (scanned.has(file)) continue;
    scanned.add(file);

    const extension = path.extname(file).toLowerCase();
    const stat = await fs.stat(file);
    const relative = path.relative(process.cwd(), file).replaceAll(path.sep, "/");

    if (limits.has(extension) && stat.size > limits.get(extension)) {
      violations.push(`${relative} — ${(stat.size / 1024 / 1024).toFixed(2)} MiB`);
      continue;
    }

    if (extension === ".mp4" && stat.size > 12_000_000) {
      warnings.push(`${relative} — ${(stat.size / 1024 / 1024).toFixed(2)} MiB video`);
    }
  }
}

if (warnings.length) {
  console.warn("[performance-assets] Large video files (allowed because videos are lazy-loaded):");
  for (const warning of warnings) console.warn(`  - ${warning}`);
}

if (violations.length) {
  console.error("[performance-assets] Oversized raster assets found:");
  for (const violation of violations) console.error(`  - ${violation}`);
  console.error("Compress/resize these assets before deployment or explicitly revise the performance budget.");
  process.exit(1);
}

console.log(`[performance-assets] ${scanned.size} public files checked; raster asset budget passed.`);
