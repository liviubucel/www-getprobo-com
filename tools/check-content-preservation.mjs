import { existsSync, statSync } from "node:fs";

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

if (failures.length) {
  console.error("[content-preservation] FAIL: protected inherited product content was removed or materially reduced.");
  console.error("[content-preservation] Rebrand/paraphrase or extend the content; do not delete it to satisfy brand, SEO, performance, or release audits.");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`[content-preservation] PASS: ${protectedFiles.size} protected product surfaces are present above their minimum content baselines.`);
