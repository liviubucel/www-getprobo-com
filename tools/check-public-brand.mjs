import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const distDir = "dist";
const legacyPattern = /(?:\bprobo\b|\bgetprobo\b|probo[-_.\/]|(?:[a-z0-9-]+\.)?probo\.com|probostatus\.com)/i;

/*
 * PUBLIC IDENTITY AUDIT ONLY.
 *
 * This checker detects legacy Probo branding in generated public text/links.
 * A failure must be remediated by rebranding/paraphrasing the affected public
 * copy or URL while preserving the underlying page, subject coverage, feature,
 * documentation, Hub/blog article, changelog/history or workflow.
 *
 * NEVER delete useful inherited content merely to make this checker pass.
 * See AGENTS.md: Core product rule — preserve, rebrand, extend.
 */

function findFiles(dir) {
  if (!existsSync(dir)) return [];
  const result = [];
  for (const entry of readdirSync(dir)) {
    const file = join(dir, entry);
    const stat = statSync(file);
    if (stat.isDirectory()) result.push(...findFiles(file));
    else if (/\.(?:html|md|txt|xml)$/i.test(entry)) result.push(file);
  }
  return result;
}

function htmlAuditView(html) {
  const withoutRuntime = html.replace(
    /<(script|style|textarea)\b[^>]*>[\s\S]*?<\/\1>/gi,
    "",
  );
  const publicUrls = Array.from(
    withoutRuntime.matchAll(
      /\b(href|action|formaction|src|poster)=(['"])([\s\S]*?)\2/gi,
    ),
  )
    .map((match) => ({ name: match[1].toLowerCase(), value: match[3] }))
    .filter(({ name, value }) =>
      (name !== "src" && name !== "poster") || /^https?:\/\//i.test(value),
    )
    .map(({ value }) => value)
    .join("\n");

  return `${withoutRuntime.replace(/<[^>]+>/g, " ")}\n${publicUrls}`;
}

if (!existsSync(distDir)) {
  console.error("[public-brand] dist/ does not exist; run the production build first.");
  process.exit(1);
}

const leaks = [];
for (const file of findFiles(distDir)) {
  const content = readFileSync(file, "utf8");
  const auditable = file.endsWith(".html") ? htmlAuditView(content) : content;
  if (legacyPattern.test(auditable)) leaks.push(relative(distDir, file));
}

if (leaks.length) {
  console.error(`[public-brand] FAIL: legacy upstream branding remains in ${leaks.length} public file(s). Rebrand/paraphrase; do not delete the content:`);
  for (const leak of leaks.slice(0, 40)) console.error(`  - ${leak}`);
  if (leaks.length > 40) console.error(`  - ...and ${leaks.length - 40} more`);
  process.exit(1);
}

console.log(`[public-brand] PASS: no legacy upstream branding in generated public text/links.`);
