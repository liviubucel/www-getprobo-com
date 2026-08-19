import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const distDir = "dist";
const legacyVisibleBrandPattern = /(?:\bProbo\b|\bGetProbo\b)/i;
const legacyExternalDomainPattern = /(?:https?:\/\/)?(?:[a-z0-9-]+\.)?(?:getprobo\.com|probo\.com|probostatus\.com)/i;
const legacyMediaAssetPattern = /(?:^|[/_.-])(?:get)?probo(?:[/_.-]|$)/i;
const mediaExtensionPattern = /\.(?:svg|png|jpe?g|webp|gif|avif|mp4|webm)(?:[?#].*)?$/i;

/*
 * PUBLIC IDENTITY AUDIT ONLY.
 *
 * Visible historical brand claims, external Probo domains and public-facing
 * media references carrying the upstream brand are forbidden in production
 * output. Internal legacy slugs and historical technical identifiers may remain
 * for compatibility, SEO continuity, architecture and migration reference.
 * Never delete useful inherited content merely to satisfy this audit.
 */

function findFiles(dir) {
  if (!existsSync(dir)) return [];
  const result = [];
  for (const entry of readdirSync(dir)) {
    const file = join(dir, entry);
    const stat = statSync(file);
    if (stat.isDirectory()) result.push(...findFiles(file));
    else if (/\.(?:html|md|txt|xml|svg)$/i.test(entry)) result.push(file);
  }
  return result;
}

function collectAttributeValues(markup, names) {
  const namePattern = names.join("|");
  return Array.from(
    markup.matchAll(new RegExp(`\\b(?:${namePattern})=(['\"])([\\s\\S]*?)\\1`, "gi")),
  ).map((match) => match[2]);
}

function htmlAuditView(html) {
  const withoutRuntimeOrCode = html.replace(
    /<(script|style|textarea|pre|code)\b[^>]*>[\s\S]*?<\/\1>/gi,
    "",
  );

  const externalUrls = collectAttributeValues(withoutRuntimeOrCode, [
    "href",
    "action",
    "formaction",
    "src",
    "poster",
  ]).filter((value) => /^https?:\/\//i.test(value));

  // Local route slugs may intentionally retain historical identifiers for
  // compatibility. Only audit local src/poster media references for upstream
  // branding so public assets cannot silently reintroduce a Probo logo/video.
  const localMediaRefs = collectAttributeValues(withoutRuntimeOrCode, ["src", "poster"]).filter(
    (value) => !/^https?:\/\//i.test(value) && mediaExtensionPattern.test(value),
  );

  const visibleText = withoutRuntimeOrCode.replace(/<[^>]+>/g, " ");
  return {
    text: `${visibleText}\n${externalUrls.join("\n")}`,
    mediaRefs: localMediaRefs,
  };
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

function svgAuditView(svg) {
  const withoutRuntimeOrStyle = svg.replace(
    /<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,
    "",
  );
  const refs = collectAttributeValues(withoutRuntimeOrStyle, ["href", "xlink:href", "src"]);
  const visibleText = withoutRuntimeOrStyle.replace(/<[^>]+>/g, " ");
  return {
    text: `${visibleText}\n${refs.filter((value) => /^https?:\/\//i.test(value)).join("\n")}`,
    mediaRefs: refs.filter(
      (value) => !/^https?:\/\//i.test(value) && mediaExtensionPattern.test(value),
    ),
  };
}

function hasLeak(file, content) {
  if (file.endsWith(".xml")) return legacyExternalDomainPattern.test(content);

  if (file.endsWith(".html")) {
    const audit = htmlAuditView(content);
    return (
      legacyVisibleBrandPattern.test(audit.text) ||
      legacyExternalDomainPattern.test(audit.text) ||
      audit.mediaRefs.some((ref) => legacyMediaAssetPattern.test(ref))
    );
  }

  if (file.endsWith(".svg")) {
    const audit = svgAuditView(content);
    return (
      legacyVisibleBrandPattern.test(audit.text) ||
      legacyExternalDomainPattern.test(audit.text) ||
      audit.mediaRefs.some((ref) => legacyMediaAssetPattern.test(ref))
    );
  }

  const auditable = file.endsWith(".md") || file.endsWith(".txt")
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
  console.error(`[public-brand] FAIL: legacy upstream branding remains in ${leaks.length} public file(s). Rebrand/paraphrase the visible output or media reference; do not delete useful content:`);
  for (const leak of leaks.slice(0, 40)) console.error(`  - ${leak}`);
  if (leaks.length > 40) console.error(`  - ...and ${leaks.length - 40} more`);
  process.exit(1);
}

console.log("[public-brand] PASS: no legacy upstream brand claims, external domains, or branded SVG/media references in generated public output.");
