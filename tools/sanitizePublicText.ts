import type { AstroIntegration } from "astro";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { publicBrandText, publicBrandUrl } from "../src/lib/public-brand.ts";

const legacyPublicBrandPattern =
  /(?:\bprobo\b|\bgetprobo\b|probo[-_.\/]|(?:[a-z0-9-]+\.)?probo\.com|probostatus\.com)/i;

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
      "ZebraByte is available through its managed platform experience",
    )
    .replace(/\bopen-source ZebraByte\b/gi, "ZebraByte")
    .replace(/\bZebraByte open-source\b/gi, "ZebraByte");
}

function sanitizeHtmlOutput(content: string): string {
  // Structured data is public metadata, so sanitize it before protecting the
  // remaining runtime blocks from text replacement.
  let html = content.replace(
    /<script([^>]*type=["']application\/ld\+json["'][^>]*)>([\s\S]*?)<\/script>/gi,
    (_match, attrs: string, json: string) =>
      `<script${attrs}>${sanitizePublicOutput(json)}</script>`,
  );

  // JavaScript, CSS and textarea payloads can contain runtime identifiers and
  // must remain byte-for-byte intact. Visible <code>/<pre> content is public
  // documentation and is intentionally sanitized like the rest of the page.
  const protectedBlocks: string[] = [];
  html = html.replace(
    /<(script|style|textarea)\b[^>]*>[\s\S]*?<\/\1>/gi,
    (block) => {
      const marker = `___ZBT_PROTECTED_BLOCK_${protectedBlocks.length}___`;
      protectedBlocks.push(block);
      return marker;
    },
  );

  html = sanitizePublicOutput(html);

  protectedBlocks.forEach((block, index) => {
    html = html.replace(`___ZBT_PROTECTED_BLOCK_${index}___`, block);
  });

  return html;
}

function publicAuditView(content: string): string {
  return content.replace(
    /<(script|style|textarea)\b[^>]*>[\s\S]*?<\/\1>/gi,
    "",
  );
}

function hasLegacyPublicBrand(file: string, content: string): boolean {
  const auditable = file.endsWith(".html") ? publicAuditView(content) : content;
  return legacyPublicBrandPattern.test(auditable);
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
        const files = findPublicFiles(distDir);
        const leaks: string[] = [];

        for (const file of files) {
          const content = readFileSync(file, "utf-8");
          const sanitized = file.endsWith(".html")
            ? sanitizeHtmlOutput(content)
            : sanitizePublicOutput(content);
          if (sanitized !== content) writeFileSync(file, sanitized);
          writeDeviceAgentAlias(distDir, file);

          if (hasLegacyPublicBrand(file, sanitized)) {
            leaks.push(relative(distDir, file));
          }
        }

        if (leaks.length) {
          const preview = leaks.slice(0, 12).join(", ");
          // Keep the audit visible in build logs, but never strand production
          // on an old deployment because a legacy branding token survived in a
          // generated document. Public output is still sanitized above.
          console.warn(
            `[sanitize-public-zebrabyte-text] Legacy Probo branding still detected after sanitization: ${preview}${leaks.length > 12 ? ` (+${leaks.length - 12} more)` : ""}`,
          );
        }

        console.log(
          `[sanitize-public-zebrabyte-text] Sanitized and audited ${files.length} generated public files`,
        );
      },
    },
  };
}
