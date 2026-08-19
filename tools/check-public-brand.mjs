import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const distDir = "dist";
const legacyVisibleBrandPattern = /(?:\bProbo\b|\bGetProbo\b)/i;
const legacyExternalDomainPattern = /(?:https?:\/\/)?(?:[a-z0-9-]+\.)?(?:getprobo\.com|probo\.com|probostatus\.com)/i;
const legacyMediaAssetPattern = /(?:^|[/_.-])(?:get)?probo(?:[/_.-]|$)/i;
const mediaExtensionPattern = /\.(?:svg|png|jpe?g|webp|gif|avif|mp4|webm)(?:[?#].*)?$/i;

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

function textLeak(text) {
  const brand = legacyVisibleBrandPattern.exec(text);
  if (brand) {
    return { kind: "visible-brand", token: brand[0], context: compactContext(text, brand.index, brand[0].length) };
  }
  const domain = legacyExternalDomainPattern.exec(text);
  if (domain) {
    return { kind: "external-domain", token: domain[0], context: compactContext(text, domain.index, domain[0].length) };
  }
  return null;
}

function htmlAuditView(html) {
  const withoutRuntimeOrCode = html.replace(
    /<(script|style|textarea|pre|code)\b[^>]*>[\s\S]*?<\/\1>/gi,
    "",
  );
  const externalUrls = collectAttributeValues(withoutRuntimeOrCode, ["href", "action", "formaction", "src", "poster"]).filter((value) => /^https?:\/\//i.test(value));
  const localMediaRefs = collectAttributeValues(withoutRuntimeOrCode, ["src", "poster"]).filter(
    (value) => !/^https?:\/\//i.test(value) && mediaExtensionPattern.test(value),
  );
  const visibleText = withoutRuntimeOrCode.replace(/<[^>]+>/g, " ");
  return { text: `${visibleText}\n${externalUrls.join("\n")}`, mediaRefs: localMediaRefs };
}

function markdownAuditView(markdown) {
  const withoutCode = markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/~~~[\s\S]*?~~~/g, "")
    .replace(/`[^`\n]+`/g, "");
  const externalUrls = Array.from(withoutCode.matchAll(/https?:\/\/[^\s)<>'"\]]+/gi)).map((match) => match[0]).join("\n");
  const visibleText = withoutCode.replace(/(?:https?:\/\/|\/)[^\s)<>'"\]]+/gi, " ");
  return `${visibleText}\n${externalUrls}`;
}

function svgAuditView(svg) {
  const withoutRuntimeOrStyle = svg.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "");
  const refs = collectAttributeValues(withoutRuntimeOrStyle, ["href", "xlink:href", "src"]);
  const visibleText = withoutRuntimeOrStyle.replace(/<[^>]+>/g, " ");
  return {
    text: `${visibleText}\n${refs.filter((value) => /^https?:\/\//i.test(value)).join("\n")}`,
    mediaRefs: refs.filter((value) => !/^https?:\/\//i.test(value) && mediaExtensionPattern.test(value)),
  };
}

function findLeak(file, content) {
  if (file.endsWith(".xml")) return textLeak(content);

  if (file.endsWith(".html")) {
    const audit = htmlAuditView(content);
    const text = textLeak(audit.text);
    if (text) return text;
    const media = audit.mediaRefs.find((ref) => legacyMediaAssetPattern.test(ref));
    if (media) return { kind: "media-ref", token: media, context: media };
    return null;
  }

  if (file.endsWith(".svg")) {
    const audit = svgAuditView(content);
    const text = textLeak(audit.text);
    if (text) return text;
    const media = audit.mediaRefs.find((ref) => legacyMediaAssetPattern.test(ref));
    if (media) return { kind: "media-ref", token: media, context: media };
    return null;
  }

  const auditable = file.endsWith(".md") || file.endsWith(".txt") ? markdownAuditView(content) : content;
  return textLeak(auditable);
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

console.log("[public-brand] PASS: no legacy upstream brand claims, external domains, or branded SVG/media references in generated public output.");
