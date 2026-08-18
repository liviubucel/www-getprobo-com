import { existsSync, readFileSync, statSync } from "node:fs";

const protectedFiles = new Map([
  ["src/pages/hub.astro", 3_000],
  ["src/pages/hub/ai-coding-tools-soc2-compliance.astro", 10_000],
  ["src/pages/hub/cloud-security-best-practices.astro", 10_000],
  ["src/pages/hub/compliance-recommender.astro", 8_000],
  ["src/pages/hub/evaluate-soc2-report-quality.astro", 10_000],
  ["src/pages/hub/iso-27001-after-soc-2-the-30-percent-shortcut.astro", 8_000],
  ["src/pages/hub/iso27001-certification-cost.astro", 8_000],
  ["src/pages/hub/iso27001.astro", 10_000],
  ["src/pages/hub/nis2-compliance-checklist-tech-companies-2026.astro", 10_000],
  ["src/pages/hub/nis2-compliance.astro", 10_000],
  ["src/pages/hub/nis2-tech-teams.astro", 10_000],
  ["src/pages/hub/soc2-type1-vs-type2.astro", 10_000],
  ["src/pages/hub/soc2.astro", 10_000],
  ["src/pages/hub/third-party-risk-management.astro", 8_000],
  ["src/pages/hub/top-compliance-automation-tools-2026.astro", 10_000],
  ["src/pages/hub/top-compliance-officer-services-2026.astro", 8_000],
  ["src/pages/hub/top-grc-tools-2026.astro", 10_000],
  ["src/pages/hub/vanta-alternatives-2026.astro", 10_000],
  ["src/pages/hub/what-is-compliance-software.astro", 8_000],
  ["src/pages/hub/which-compliance-framework.astro", 10_000],
  ["src/pages/hub/zebrabyte-vs-vanta.astro", 2_000],
  ["src/pages/hub/zebrabyte-vs-fractional-ciso.astro", 2_000],
  ["src/pages/whats-next/ISO27001.astro", 10_000],
  ["src/pages/whats-next/soc2.astro", 10_000],
  ["src/pages/compliance-portal.astro", 8_000],
]);

const protectedPublicPaths = new Set([
  "/hub/ai-coding-tools-soc2-compliance",
  "/hub/cloud-security-best-practices",
  "/hub/compliance-recommender",
  "/hub/evaluate-soc2-report-quality",
  "/hub/iso-27001-after-soc-2-the-30-percent-shortcut",
  "/hub/iso27001-certification-cost",
  "/hub/iso27001",
  "/hub/nis2-compliance-checklist-tech-companies-2026",
  "/hub/nis2-compliance",
  "/hub/nis2-tech-teams",
  "/hub/soc2-type1-vs-type2",
  "/hub/soc2",
  "/hub/third-party-risk-management",
  "/hub/top-compliance-automation-tools-2026",
  "/hub/top-compliance-officer-services-2026",
  "/hub/top-grc-tools-2026",
  "/hub/vanta-alternatives-2026",
  "/hub/what-is-compliance-software",
  "/hub/which-compliance-framework",
  "/whats-next/ISO27001",
  "/whats-next/iso27001",
  "/whats-next/soc2",
  "/docs",
  "/docs/*",
]);

const failures = [];

for (const [file, minBytes] of protectedFiles) {
  if (!existsSync(file)) {
    failures.push(`${file}: missing`);
    continue;
  }

  const size = statSync(file).size;
  if (size < minBytes) {
    failures.push(`${file}: unexpectedly reduced to ${size} bytes (minimum protected baseline ${minBytes})`);
  }
}

const redirectsFile = "public/_redirects";
if (!existsSync(redirectsFile)) {
  failures.push(`${redirectsFile}: missing; cannot verify that protected product content remains publicly reachable`);
} else {
  const redirects = readFileSync(redirectsFile, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  for (const line of redirects) {
    const [source, destination, status] = line.split(/\s+/);
    if (!protectedPublicPaths.has(source)) continue;

    failures.push(
      `${redirectsFile}: protected public path ${source} is redirected to ${destination || "<missing destination>"}${status ? ` (${status})` : ""}`,
    );
  }
}

if (failures.length) {
  console.error("[content-preservation] FAIL: protected inherited product content was removed, materially reduced, or hidden behind a redirect.");
  console.error("[content-preservation] Preserve the page and rebrand/paraphrase it in place. Do not delete or redirect useful content to satisfy brand, SEO, performance, or release audits.");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`[content-preservation] PASS: ${protectedFiles.size} protected product surfaces remain present and publicly reachable.`);
