import type { AstroIntegration } from "astro";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { publicBrandText, publicBrandUrl } from "../src/lib/public-brand.ts";

// Public prose uses the historical brand with normal capitalization. Lowercase
// `probo-*` tokens can legitimately remain inside compatibility slugs and
// historical technical identifiers, so they are not identity claims by
// themselves.
const legacyVisibleBrandPattern = /(?:\bProbo\b|\bGetProbo\b)/;
const legacyExternalDomainPattern =
  /(?:https?:\/\/)?(?:[a-z0-9-]+\.)?(?:getprobo\.com|probo\.com|probostatus\.com)/i;

function sanitizePublicOutput(content: string): string {
  return publicBrandText(publicBrandUrl(content))
    .replace(
      /Documentation for ZebraByte, the open-source compliance management platform\.?/gi,
      "Documentation for the ZebraByte compliance and security platform.",
    )
    .replace(
      /ZebraByte is an open-source platform/gi,
      "ZebraByte is a compliance platform",
    )
    .replace(
      /ZebraByte is open-source/gi,
      "ZebraByte is delivered through its Cloud SaaS platform",
    )
    .replace(/\bopen-source ZebraByte\b/gi, "ZebraByte")
    .replace(/\bZebraByte open-source\b/gi, "ZebraByte");
}

type ProtectedText = {
  content: string;
  restore: (value: string) => string;
};

function protectMarkdownTechnicalReferences(content: string): ProtectedText {
  const protectedValues: Array<{ value: string; kind: "code" | "url" }> = [];
  const protect = (value: string, kind: "code" | "url") => {
    const marker = `___ZBT_PROTECTED_MD_${protectedValues.length}___`;
    protectedValues.push({ value, kind });
    return marker;
  };

  let result = content.replace(/```[\s\S]*?```/g, (value) => protect(value, "code"));
  result = result.replace(/~~~[\s\S]*?~~~/g, (value) => protect(value, "code"));
  result = result.replace(/`[^`\n]+`/g, (value) => protect(value, "code"));

  // Preserve route identity (including legacy slugs) while still rebranding
  // known external Probo domains and explicit branded aliases via publicBrandUrl.
  result = result.replace(
    /(?:https?:\/\/|\/)[^\s)<>'"\]]+/gi,
    (value) => protect(value, "url"),
  );

  return {
    content: result,
    restore: (value: string) => {
      let restored = value;
      protectedValues.forEach((entry, index) => {
        const marker = `___ZBT_PROTECTED_MD_${index}___`;
        const replacement =
          entry.kind === "url" ? publicBrandUrl(entry.value) : entry.value;
        restored = restored.replace(marker, replacement);
      });
      return restored;
    },
  };
}

function sanitizeMarkdownOutput(content: string): string {
  const protectedMarkdown = protectMarkdownTechnicalReferences(content);
  return protectedMarkdown.restore(sanitizePublicOutput(protectedMarkdown.content));
}

function markdownAuditView(content: string): string {
  const withoutCode = content
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

function sanitizeTag(tag: string): string {
  let result = tag.replace(
    /\b(href|action|formaction)=(['"])([\s\S]*?)\2/gi,
    (_match, name: string, quote: string, value: string) =>
      `${name}=${quote}${publicBrandUrl(value)}${quote}`,
  );

  result = result.replace(
    /\b(src|poster)=(['"])(https?:\/\/[\s\S]*?)\2/gi,
    (_match, name: string, quote: string, value: string) =>
      `${name}=${quote}${publicBrandUrl(value)}${quote}`,
  );

  return result.replace(
    /\b(alt|title|aria-label|placeholder)=(['"])([\s\S]*?)\2/gi,
    (_match, name: string, quote: string, value: string) =>
      `${name}=${quote}${sanitizePublicOutput(value)}${quote}`,
  );
}

function sanitizeHtmlOutput(content: string): string {
  let html = content.replace(
    /<script([^>]*type=["']application\/ld\+json["'][^>]*)>([\s\S]*?)<\/script>/gi,
    (_match, attrs: string, json: string) =>
      `<script${attrs}>${sanitizePublicOutput(json)}</script>`,
  );

  const protectedBlocks: string[] = [];
  html = html.replace(
    /<(script|style|textarea|pre|code)\b[^>]*>[\s\S]*?<\/\1>/gi,
    (block) => {
      const marker = `___ZBT_PROTECTED_BLOCK_${protectedBlocks.length}___`;
      protectedBlocks.push(block);
      return marker;
    },
  );

  const protectedTags: string[] = [];
  html = html.replace(/<[^>]+>/g, (tag) => {
    const marker = `___ZBT_PROTECTED_TAG_${protectedTags.length}___`;
    protectedTags.push(sanitizeTag(tag));
    return marker;
  });

  html = sanitizePublicOutput(html);

  protectedTags.forEach((tag, index) => {
    html = html.replace(`___ZBT_PROTECTED_TAG_${index}___`, tag);
  });
  protectedBlocks.forEach((block, index) => {
    html = html.replace(`___ZBT_PROTECTED_BLOCK_${index}___`, block);
  });

  return html;
}

function publicAuditView(content: string): string {
  const withoutRuntimeOrCode = content.replace(
    /<(script|style|textarea|pre|code)\b[^>]*>[\s\S]*?<\/\1>/gi,
    "",
  );

  const externalPublicUrls = Array.from(
    withoutRuntimeOrCode.matchAll(
      /\b(href|action|formaction|src|poster)=(['"])(https?:\/\/[\s\S]*?)\2/gi,
    ),
  )
    .map((match) => match[3])
    .join("\n");

  const visibleText = withoutRuntimeOrCode.replace(/<[^>]+>/g, " ");
  return `${visibleText}\n${externalPublicUrls}`;
}

function hasLegacyPublicBrand(file: string, content: string): boolean {
  if (file.endsWith(".xml")) {
    return legacyExternalDomainPattern.test(content);
  }

  const auditable = file.endsWith(".html")
    ? publicAuditView(content)
    : file.endsWith(".md") || file.endsWith(".txt")
      ? markdownAuditView(content)
      : content;

  return (
    legacyVisibleBrandPattern.test(auditable) ||
    legacyExternalDomainPattern.test(auditable)
  );
}

function findPublicFiles(dir: string): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) return results;

  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      results.push(...findPublicFiles(fullPath));
      continue;
    }

    if (/\.(?:html|md|txt|xml)$/i.test(entry)) results.push(fullPath);
  }

  return results;
}

function findMarkdownFiles(dir: string): string[] {
  return findPublicFiles(dir).filter((file) => file.endsWith(".md"));
}

function builtHtmlExistsForMarkdown(distDir: string, markdownFile: string): boolean {
  const mdDir = join(distDir, "md");
  const rel = relative(mdDir, markdownFile).replace(/\\/g, "/");
  if (!rel.endsWith(".md")) return true;

  const route = rel.slice(0, -3).replace(/\/index$/, "");
  const candidates = route
    ? [join(distDir, `${route}.html`), join(distDir, route, "index.html")]
    : [join(distDir, "index.html")];

  return candidates.some((candidate) => existsSync(candidate));
}

function pruneEmptyDirectories(dir: string, preserveRoot = true): void {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) pruneEmptyDirectories(fullPath, false);
  }
  if (!preserveRoot && readdirSync(dir).length === 0) {
    rmSync(dir, { recursive: true, force: true });
  }
}

function publicRouteForMarkdown(distDir: string, file: string): string {
  const rel = relative(join(distDir, "md"), file).replace(/\\/g, "/");
  const route = rel.replace(/\.md$/, "").replace(/\/index$/, "");
  return route ? `/${route}` : "/";
}

function canonicalPublicUrl(route: string): string {
  return route === "/"
    ? "https://www.zebrabyte.ro/"
    : `https://www.zebrabyte.ro${route}`;
}

function pruneGeneratedMarkdownAndRebuildLlms(distDir: string): void {
  const mdDir = join(distDir, "md");
  if (!existsSync(mdDir)) return;

  let removed = 0;
  for (const file of findMarkdownFiles(mdDir)) {
    if (builtHtmlExistsForMarkdown(distDir, file)) continue;
    rmSync(file, { force: true });
    removed += 1;
  }
  pruneEmptyDirectories(mdDir);

  const retained = findMarkdownFiles(mdDir).sort();
  const indexLines = [
    "# ZebraByte",
    "",
    "> Public ZebraByte website content available in Markdown format.",
    "",
    ...retained.map((file) => {
      const route = publicRouteForMarkdown(distDir, file);
      const rel = relative(mdDir, file).replace(/\\/g, "/");
      return `- [${route}](${canonicalPublicUrl(route)}) — [Markdown](https://www.zebrabyte.ro/md/${rel})`;
    }),
    "",
  ];
  writeFileSync(join(distDir, "llms.txt"), indexLines.join("\n"));

  const fullParts = [
    "# ZebraByte public content",
    "",
    "> Canonical site: https://www.zebrabyte.ro/",
    "",
    ...retained.flatMap((file) => {
      const route = publicRouteForMarkdown(distDir, file);
      return [
        `## ${route}`,
        "",
        `Canonical URL: ${canonicalPublicUrl(route)}`,
        "",
        readFileSync(file, "utf-8").trim(),
        "",
      ];
    }),
  ];
  writeFileSync(join(distDir, "llms-full.txt"), fullParts.join("\n"));

  console.log(
    `[sanitize-public-zebrabyte-text] Pruned ${removed} unpublished Markdown file(s); rebuilt LLM indexes from ${retained.length} public route(s)`,
  );
}

function writeDeviceAgentAlias(distDir: string, file: string): void {
  const rel = relative(distDir, file);
  if (!rel.includes("probo-agent")) return;

  const brandedRel = rel.replaceAll("probo-agent", "device-agent");
  const brandedPath = join(distDir, brandedRel);
  mkdirSync(dirname(brandedPath), { recursive: true });
  writeFileSync(brandedPath, readFileSync(file, "utf-8"));
}

export function sanitizePublicText(): AstroIntegration {
  return {
    name: "sanitize-public-zebrabyte-text",
    hooks: {
      "astro:build:done": ({ dir }) => {
        const distDir = fileURLToPath(dir);

        pruneGeneratedMarkdownAndRebuildLlms(distDir);

        const files = findPublicFiles(distDir);
        const leaks: string[] = [];

        for (const file of files) {
          const content = readFileSync(file, "utf-8");
          const sanitized = file.endsWith(".html")
            ? sanitizeHtmlOutput(content)
            : file.endsWith(".md") || file.endsWith(".txt")
              ? sanitizeMarkdownOutput(content)
              : file.endsWith(".xml")
                ? publicBrandUrl(content)
                : sanitizePublicOutput(content);

          if (sanitized !== content) writeFileSync(file, sanitized);
          writeDeviceAgentAlias(distDir, file);

          if (hasLegacyPublicBrand(file, sanitized)) {
            leaks.push(relative(distDir, file));
          }
        }

        if (leaks.length) {
          const preview = leaks.slice(0, 12).join(", ");
          throw new Error(
            `[sanitize-public-zebrabyte-text] Production brand gate failed. Legacy Probo branding remains in: ${preview}${leaks.length > 12 ? ` (+${leaks.length - 12} more)` : ""}`,
          );
        }

        console.log(
          `[sanitize-public-zebrabyte-text] Production brand gate passed across ${files.length} generated public files`,
        );
      },
    },
  };
}