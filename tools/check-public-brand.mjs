import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const distDir = "dist";
const legacyVisibleBrandPattern = /(?:\bProbo\b|\bGetProbo\b)/;
const legacyExternalDomainPattern = /(?:https?:\/\/)?(?:[a-z0-9-]+\.)?(?:getprobo\.com|probo\.com|probostatus\.com)/i;

/*
 * PUBLIC IDENTITY AUDIT ONLY.
 *
 * Visible historical brand claims and external Probo domains are forbidden in
 * production output. Internal legacy slugs and historical technical identifiers
 * may remain for compatibility, SEO continuity, architecture and migration
 * reference. Never delete useful inherited content to satisfy this audit.
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
  const externalUrls = Array.from(
    withoutRuntimeOrCode.matchAll(
      /\b(href|action|formaction|src|poster)=(['"])(https?:\/\/[\s\S]*?)\2/gi,
    ),
  )
    .map((match) => match[3])
    .join("\n");
  return `${withoutRuntimeOrCode.replace(/<[^>]+>/g, " ")}\n${externalUrls}`;
}

function markdownAuditView(markdown) {
  const withoutCode = markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/~~~[\s\S]*?~~~/g, "")
    .replace(/`[^`\n]+`/g, "");
  const externalUrls = Array.from(
    withoutCode.matchAll(/https?:\/\/[^\s)<>'"\]]+/gi),
  )
    .map((match) => match[0])
    .join("\n");
  const visibleText = withoutCode.replace(
    /(?:https?:\/\/|\/)[^\s)<>'"\]]+/gi,
    " ",
  );
  return `${visibleText}\n${externalUrls}`;
}

function hasLeak(file, content) {
  if (file.endsWith(".xml")) return legacyExternalDomainPattern.test(content);
  const auditable = file.endsWith(".html")
    ? htmlAuditView(content)
    : file.endsWith(".md") || file.endsWith(".txt")
      ? markdownAuditView(content)
      : content;
  return legacyVisibleBrandPattern.test(auditable) || legacyExternalDomainPattern.test(auditable);
}

if (!existsSync(distDir)) {
  console.error("[public-brand] dist/ does not exist; run the production build first.");
  process.exit(1);
}

const leaks = [];
for (const file of findFiles(distDir)) {
  const content = readFileSync(file, "utf8");
  if (hasLeak(file, content)) leaks.push(relative(distDir, file));
}

if (leaks.length) {
  console.error(`[public-brand] FAIL: legacy upstream branding remains in ${leaks.length} public file(s). Rebrand/paraphrase; do not delete the content:`);
  for (const leak of leaks.slice(0, 40)) console.error(`  - ${leak}`);
  if (leaks.length > 40) console.error(`  - ...and ${leaks.length - 40} more`);
  process.exit(1);
}

console.log("[public-brand] PASS: no legacy upstream brand claims or external domains in generated public output.");