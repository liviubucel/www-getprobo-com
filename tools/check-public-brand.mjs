import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const distDir = "dist";
const legacyPattern = /(?:\bprobo\b|\bgetprobo\b|probo[-_.\/]|(?:[a-z0-9-]+\.)?probo\.com|probostatus\.com)/i;

/*
 * PUBLIC IDENTITY AUDIT ONLY.
 *
 * This checker detects legacy Probo branding in generated public editorial
 * text/links. A failure must be remediated by rebranding/paraphrasing the
 * affected public copy or URL while preserving the underlying page, subject
 * coverage, feature, documentation, Hub/blog article, changelog/history or
 * workflow.
 *
 * Historical technical identifiers inside code examples and local hashed asset
 * filenames are not public brand claims. They must remain intact when needed for
 * architecture/migration reference and are excluded from this identity audit.
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
  const withoutRuntimeOrCode = html.replace(
    /<(script|style|textarea|pre|code)\b[^>]*>[\s\S]*?<\/\1>/gi,
    "",
  );
  const publicUrls = Array.from(
    withoutRuntimeOrCode.matchAll(
      /\b(href|action|formaction|src|poster)=(['"])([\s\S]*?)\2/gi,
    ),
  )
    .map((match) => ({ name: match[1].toLowerCase(), value: match[3] }))
    .filter(({ name, value }) => {
      const external = /^https?:\/\//i.test(value);

      if (name === "src" || name === "poster") return external;

      if (
        name === "href" &&
        !external &&
        (/(?:^|\/)\_astro\//i.test(value) ||
          /\.(?:css|m?js|map|svg|png|jpe?g|webp|gif|ico|woff2?|ttf|otf)(?:[?#]|$)/i.test(value))
      ) {
        return false;
      }

      return true;
    })
    .map(({ value }) => value)
    .join("\n");

  return `${withoutRuntimeOrCode.replace(/<[^>]+>/g, " ")}\n${publicUrls}`;
}

function markdownAuditView(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/~~~[\s\S]*?~~~/g, "")
    .replace(/`[^`\n]+`/g, "");
}

if (!existsSync(distDir)) {
  console.error("[public-brand] dist/ does not exist; run the production build first.");
  process.exit(1);
}

const leaks = [];
for (const file of findFiles(distDir)) {
  const content = readFileSync(file, "utf8");
  const auditable = file.endsWith(".html")
    ? htmlAuditView(content)
    : file.endsWith(".md")
      ? markdownAuditView(content)
      : content;
  if (legacyPattern.test(auditable)) leaks.push(relative(distDir, file));
}

if (leaks.length) {
  console.error(`[public-brand] FAIL: legacy upstream branding remains in ${leaks.length} public file(s). Rebrand/paraphrase; do not delete the content:`);
  for (const leak of leaks.slice(0, 40)) console.error(`  - ${leak}`);
  if (leaks.length > 40) console.error(`  - ...and ${leaks.length - 40} more`);
  process.exit(1);
}

console.log(`[public-brand] PASS: no legacy upstream branding in generated public editorial text/links.`);
