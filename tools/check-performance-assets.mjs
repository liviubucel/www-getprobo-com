import fs from "node:fs/promises";
import path from "node:path";

const publicRoot = path.resolve("public");
const generatedBlogRoot = path.resolve("public/blog/zebrabyte-generated");

const limits = new Map([
  [".jpg", 1_500_000],
  [".jpeg", 1_500_000],
  [".png", 1_500_000],
  [".webp", 1_500_000],
  [".avif", 1_500_000],
  [".gif", 2_000_000],
]);

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

if (!(await exists(publicRoot))) {
  console.log("[performance-assets] public/ does not exist; nothing to check.");
  process.exit(0);
}

const files = await walk(publicRoot);
const violations = [];
const warnings = [];

for (const file of files) {
  const extension = path.extname(file).toLowerCase();
  const stat = await fs.stat(file);
  const relative = path.relative(process.cwd(), file).replaceAll(path.sep, "/");
  const generatedBlogAsset = file.startsWith(`${generatedBlogRoot}${path.sep}`);

  if (limits.has(extension) && stat.size > limits.get(extension)) {
    const label = `${relative} — ${(stat.size / 1024 / 1024).toFixed(2)} MiB`;
    if (generatedBlogAsset) violations.push(label);
    else warnings.push(label);
    continue;
  }

  if (extension === ".mp4" && stat.size > 12_000_000) {
    warnings.push(`${relative} — ${(stat.size / 1024 / 1024).toFixed(2)} MiB video`);
  }
}

if (warnings.length) {
  console.warn("[performance-assets] Legacy/public media above the preferred budget:");
  for (const warning of warnings) console.warn(`  - ${warning}`);
  console.warn("[performance-assets] These are warnings so existing Probo media does not block deployment; lazy loading remains required.");
}

if (violations.length) {
  console.error("[performance-assets] Generated ZebraByte blog images exceed the 1.5 MiB budget:");
  for (const violation of violations) console.error(`  - ${violation}`);
  console.error("The Sanity image sync must resize/compress these files before deployment.");
  process.exit(1);
}

console.log(`[performance-assets] ${files.length} public files checked; generated blog image budget passed.`);
