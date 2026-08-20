import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const distDir = "dist";
const legacyVisibleBrandPattern = /(?:\bProbo\b|\bGetProbo\b)/i;
const legacyExternalDomainPattern = /(?:https?:\/\/)?(?:[a-z0-9-]+\.)?(?:getprobo\.com|probo\.com|probostatus\.com)/i;
const legacyMediaAssetPattern = /(?:^|[/_.-])(?:get)?probo(?:[/_.-]|$)/i;
const mediaExtensionPattern = /\.(?:svg|png|jpe?g|webp|gif|avif|mp4|webm)(?:[?#].*)?$/i;
const absoluteUrlPattern = /https?:\/\/[^\s)<>'"\]]+/gi;

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

function compactContext(value, index, length) {
  const start = Math.max(0, index - 80);
  const end = Math.min(value.length, index + length + 80);
  return value.slice(start, end).replace(/\s+/g, " ").trim();
}

function visibleBrandLeak(text) {
  const brand = legacyVisibleBrandPattern.exec(text);
  if (!brand) return null;
  return {
    kind: "visible-brand",
    token: brand[0],
    context: compactContext(text, brand.index, brand[0].length),
  };
}

function upstreamUrlLeak(urls) {
  for (const url of urls) {
    const match = legacyExternalDomainPattern.exec(url);
    if (match) {
      return { kind: "external-domain", token: match[0], context: url };
    }
  }
  return null;
}

function htmlAuditView(html) {
  const withoutRuntimeOrCode = html.replace(
    /<(script|style|textarea|pre|code)\b[^>]*>[\s\S]*?<\/\1>/gi,
    "",
  );
  const refs = collectAttributeValues(withoutRuntimeOrCode, [
    "href",
    "action",
    "formaction",
    "src",
    "poster",
  ]);
  return {
    visibleText: withoutRuntimeOrCode.replace(/<[^>]+>/g, " "),
    externalUrls: refs.filter((value) => /^https?:\/\//i.test(value)),
    localMediaRefs: refs.filter(
      (value) => !/^https?:\/\//i.test(value) && mediaExtensionPattern.test(value),
    ),
  };
}

function markdownAuditView(markdown) {
  const withoutCode = markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/~~~[\s\S]*?~~~/g, "")
    .replace(/<(pre|code)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/`[^`\n]+`/g, "");
  const externalUrls = Array.from(withoutCode.matchAll(absoluteUrlPattern)).map((match) => match[0]);
  const visibleText = withoutCode
    .replace(absoluteUrlPattern, " ")
    .replace(/\]\([^)]*\)/g, "]")
    // Package/repository identifiers are implementation provenance, not a public brand claim.
    // Keep them auditable in source while excluding them from visible-brand detection.
    .replace(/@probo\/[a-z0-9._/-]+/gi, " ")
    .replace(/\bgetprobo\/probo(?:\/[a-z0-9._/-]+)*/gi, " ")
    // Preserve legacy route slugs for SEO/compatibility without treating the URL itself as prose.
    .replace(/\/[a-z0-9][^\s)<>'"\]]*/gi, " ");
  return { visibleText, externalUrls };
}

function svgAuditView(svg) {
  const withoutRuntimeOrStyle = svg.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "");
  const refs = collectAttributeValues(withoutRuntimeOrStyle, ["href", "xlink:href", "src"]);
  return {
    visibleText: withoutRuntimeOrStyle.replace(/<[^>]+>/g, " "),
    externalUrls: refs.filter((value) => /^https?:\/\//i.test(value)),
    localMediaRefs: refs.filter(
      (value) => !/^https?:\/\//i.test(value) && mediaExtensionPattern.test(value),
    ),
  };
}

function xmlAuditView(xml) {
  const externalUrls = Array.from(xml.matchAll(absoluteUrlPattern)).map((match) => match[0]);
  const visibleText = xml
    .replace(absoluteUrlPattern, " ")
    .replace(/<[^>]+>/g, " ");
  return { visibleText, externalUrls };
}

function structuredLeak(view) {
  const visible = visibleBrandLeak(view.visibleText);
  if (visible) return visible;
  const upstream = upstreamUrlLeak(view.externalUrls ?? []);
  if (upstream) return upstream;
  const media = (view.localMediaRefs ?? []).find((ref) => legacyMediaAssetPattern.test(ref));
  if (media) return { kind: "media-ref", token: media, context: media };
  return null;
}

function findLeak(file, content) {
  if (file.endsWith(".html")) return structuredLeak(htmlAuditView(content));
  if (file.endsWith(".svg")) return structuredLeak(svgAuditView(content));
  if (file.endsWith(".xml")) return structuredLeak(xmlAuditView(content));
  if (file.endsWith(".md") || file.endsWith(".txt")) return structuredLeak(markdownAuditView(content));
  return visibleBrandLeak(content);
}

if (!existsSync(distDir)) {
  console.error("[public-brand] dist/ does not exist; run the production build first.");
  process.exit(1);
}

const leaks = [];
for (const file of findFiles(distDir)) {
  const content = readFileSync(file, "utf8");
  const leak = findLeak(file, content);
  if (leak) leaks.push({ file: relative(distDir, file), ...leak });
}

if (leaks.length) {
  console.error(`[public-brand] FAIL: legacy upstream branding remains in ${leaks.length} public file(s):`);
  for (const leak of leaks.slice(0, 60)) {
    console.error(`  - ${leak.file}`);
    console.error(`    ${leak.kind}: ${leak.token}`);
    console.error(`    context: ${leak.context}`);
  }
  if (leaks.length > 60) console.error(`  - ...and ${leaks.length - 60} more`);
  process.exit(1);
}

console.log("[public-brand] PASS: no legacy upstream brand claims, upstream domains, or branded public media references in generated output.");
