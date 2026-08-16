import fs from "node:fs/promises";
import path from "node:path";

const projectId = process.env.ZEBRABYTE_LEGACY_SANITY_PROJECT_ID || "yj548pxh";
const dataset = process.env.ZEBRABYTE_LEGACY_SANITY_DATASET || "production";
const token = process.env.ZEBRABYTE_LEGACY_SANITY_READ_TOKEN || process.env.SANITY_API_READ_TOKEN || "";
const apiVersion = "2025-01-01";

const contentDir = path.resolve("src/content/blog/zebrabyte-generated");
const imageDir = path.resolve("public/blog/zebrabyte-generated");
const manifestPath = path.join(contentDir, "_manifest.json");
const redirectModulePath = path.resolve("worker/blog-legacy-redirects.ts");
const imageDownloadConcurrency = 6;
const sanityTimeoutMs = 20_000;
const imageTimeoutMs = 12_000;
const maxImageBytes = 16 * 1024 * 1024;

const GROQ = `*[_type == "post" && !(_id in path("drafts.**"))] | order(publishedAt desc) {
  _id,
  _updatedAt,
  title,
  "slug": slug.current,
  excerpt,
  publishedAt,
  author,
  tags,
  "mainImageUrl": mainImage.asset->url,
  "mainImageAlt": mainImage.alt,
  body
}`;

function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function safeSlug(value) {
  return clean(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizedIdentity(value) {
  return clean(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function yamlString(value) {
  return JSON.stringify(String(value ?? ""));
}

function blockPlainText(block) {
  if (!block || block._type !== "block" || !Array.isArray(block.children)) return "";
  return clean(block.children.map((child) => child?.text ?? "").join(""));
}

function postContentIdentity(post) {
  const body = (post.body ?? []).map(blockPlainText).filter(Boolean).join("\n");
  return normalizedIdentity(`${post.title}\n${body}`);
}

function buildExcerpt(post) {
  const chunks = [];
  if (clean(post.excerpt)) chunks.push(clean(post.excerpt));
  for (const block of post.body ?? []) {
    const text = blockPlainText(block);
    if (text && !chunks.includes(text)) chunks.push(text);
    if (chunks.join(" ").length >= 180) break;
  }

  let excerpt = clean(chunks.join(" "));
  if (excerpt.length > 190) {
    const cut = excerpt.slice(0, 187);
    const boundary = cut.lastIndexOf(" ");
    excerpt = `${cut.slice(0, boundary > 130 ? boundary : 187).trim()}…`;
  }
  if (excerpt.length < 120) {
    excerpt = clean(
      `${excerpt} Articol din arhiva editorială ZebraByte, păstrat pentru context, analiză tehnică și recomandări practice de securitate digitală.`,
    );
  }
  return excerpt;
}

function legacyOdooNumber(id) {
  return clean(id).match(/^post-odoo-(\d+)$/i)?.[1] ?? null;
}

function canonicalPreference(post) {
  return [
    legacyOdooNumber(post._id) ? 1 : 0,
    new Date(post.publishedAt).valueOf(),
    clean(post._id),
  ];
}

function compareCanonicalCandidates(a, b) {
  const aa = canonicalPreference(a);
  const bb = canonicalPreference(b);
  if (aa[0] !== bb[0]) return aa[0] - bb[0];
  if (aa[1] !== bb[1]) return aa[1] - bb[1];
  return aa[2].localeCompare(bb[2]);
}

function uniqueResolvedSlug(baseSlug, post, usedSlugs) {
  const date = new Date(post.publishedAt);
  const year = String(date.getUTCFullYear());
  const isoDate = date.toISOString().slice(0, 10);
  const candidates = [`${baseSlug}-${year}`, `${baseSlug}-${isoDate}`];
  for (const candidate of candidates) {
    if (!usedSlugs.has(candidate)) return candidate;
  }
  let index = 2;
  while (usedSlugs.has(`${baseSlug}-${isoDate}-${index}`)) index += 1;
  return `${baseSlug}-${isoDate}-${index}`;
}

function resolvePublishedPosts(documents) {
  if (documents.length === 0) throw new Error("Sanity returned no published ZebraByte blog posts.");

  const structuralFailures = [];
  const valid = [];
  for (const post of documents) {
    const id = clean(post?._id) || "unknown-document";
    const title = clean(post?.title);
    const rawSlug = clean(post?.slug);
    const baseSlug = safeSlug(rawSlug);
    const publishedAt = new Date(post?.publishedAt);
    const reasons = [];

    if (!title) reasons.push("missing title");
    if (!rawSlug) reasons.push("missing public slug");
    if (!baseSlug) reasons.push("slug normalizes to empty");
    if (!post?.publishedAt || Number.isNaN(publishedAt.valueOf())) reasons.push("missing/invalid publishedAt");
    if (!Array.isArray(post?.body) || post.body.length === 0) reasons.push("missing/empty Portable Text body");

    if (reasons.length) {
      structuralFailures.push({ id, slug: rawSlug || null, error: reasons.join(", ") });
      continue;
    }
    valid.push({ ...post, baseSlug });
  }

  if (structuralFailures.length) {
    const detail = structuralFailures
      .map((failure) => `  - ${failure.id}${failure.slug ? ` (${failure.slug})` : ""}: ${failure.error}`)
      .join("\n");
    throw new Error(
      `Published ZebraByte blog dataset contains ${structuralFailures.length} structurally invalid document(s):\n${detail}`,
    );
  }

  const byOriginalSlug = new Map();
  for (const post of valid) {
    const group = byOriginalSlug.get(post.baseSlug) ?? [];
    group.push(post);
    byOriginalSlug.set(post.baseSlug, group);
  }

  const resolved = new Map();
  const redirects = new Map();
  const duplicateGroups = [];
  let duplicateDocumentCount = 0;
  let slugCollisionCount = 0;

  for (const [baseSlug, slugGroup] of [...byOriginalSlug.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const byContent = new Map();
    for (const post of slugGroup) {
      const identity = postContentIdentity(post);
      const group = byContent.get(identity) ?? [];
      group.push(post);
      byContent.set(identity, group);
    }

    const contentGroups = [...byContent.values()].map((group) => group.sort(compareCanonicalCandidates));
    contentGroups.sort((a, b) => compareCanonicalCandidates(a[0], b[0]));
    if (contentGroups.length > 1) slugCollisionCount += contentGroups.length - 1;

    for (let groupIndex = 0; groupIndex < contentGroups.length; groupIndex += 1) {
      const identicalDocs = contentGroups[groupIndex];
      const canonical = identicalDocs[0];
      const resolvedSlug =
        groupIndex === 0 && !resolved.has(baseSlug)
          ? baseSlug
          : uniqueResolvedSlug(baseSlug, canonical, new Set(resolved.keys()));
      const legacyIds = identicalDocs.map((post) => clean(post._id)).sort();

      resolved.set(resolvedSlug, {
        ...canonical,
        slug: resolvedSlug,
        baseSlug,
        legacyIds,
      });

      for (const post of identicalDocs) {
        const number = legacyOdooNumber(post._id);
        if (number) redirects.set(`${baseSlug}-${number}`, resolvedSlug);
      }

      if (identicalDocs.length > 1) {
        duplicateDocumentCount += identicalDocs.length - 1;
        duplicateGroups.push({
          canonicalSlug: resolvedSlug,
          canonicalId: clean(canonical._id),
          duplicateIds: legacyIds.filter((id) => id !== clean(canonical._id)),
        });
      }
    }
  }

  const coveredDocumentCount = [...resolved.values()].reduce(
    (count, article) => count + article.legacyIds.length,
    0,
  );
  if (coveredDocumentCount !== documents.length) {
    throw new Error(`Published document coverage failed: ${coveredDocumentCount}/${documents.length}.`);
  }

  return {
    resolved,
    redirects,
    duplicateGroups,
    duplicateDocumentCount,
    slugCollisionCount,
    originalSlugCount: byOriginalSlug.size,
    coveredDocumentCount,
  };
}

function normalizeHref(href, knownSlugs, legacyRedirects) {
  if (!href) return null;
  let url;
  try {
    url = new URL(href, "https://www.zebrabyte.ro");
  } catch {
    return null;
  }

  if (!/(^|\.)zebrabyte\.(ro|co\.uk)$/i.test(url.hostname)) {
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : String(href);
  }

  let pathname = url.pathname.replace(/^\/ro(?=\/)/i, "").replace(/\/+$/, "") || "/";
  const oldPost = pathname.match(/^\/blog\/blogul-nostru-1\/(.+?)-(\d+)$/i);
  if (oldPost) {
    const baseSlug = safeSlug(oldPost[1]);
    const legacyKey = `${baseSlug}-${oldPost[2]}`;
    const resolvedSlug = legacyRedirects.get(legacyKey) ?? (knownSlugs.has(baseSlug) ? baseSlug : null);
    return resolvedSlug ? `/blog/${resolvedSlug}` : "/blog";
  }

  const routes = new Map([
    ["/cyber-audit", "/security-assessment"],
    ["/securitate-website", "/website-security"],
    ["/hosting", "/secure-hosting"],
    ["/serviciigdprromania", "/managed-compliance"],
    ["/wordpress-maintenance", "/website-security"],
    ["/despre-noi", "/about"],
  ]);
  pathname = routes.get(pathname) ?? pathname;
  return `${pathname}${url.search}${url.hash}`;
}

function escapeMdxText(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/{/g, "&#123;")
    .replace(/}/g, "&#125;");
}

function renderInlineCode(value) {
  const raw = String(value ?? "");
  const runs = raw.match(/`+/g) ?? [];
  const fence = "`".repeat(Math.max(1, ...runs.map((run) => run.length + 1)));
  const needsPadding = /^`|`$|^\s|\s$/.test(raw);
  return `${fence}${needsPadding ? " " : ""}${raw}${needsPadding ? " " : ""}${fence}`;
}

function renderCodeFence(value) {
  const raw = String(value ?? "");
  const runs = raw.match(/`+/g) ?? [];
  const fence = "`".repeat(Math.max(3, ...runs.map((run) => run.length + 1)));
  return `${fence}\n${raw}\n${fence}`;
}

function renderSpan(span, markDefs, knownSlugs, legacyRedirects) {
  const raw = String(span?.text ?? "");
  const marks = Array.isArray(span?.marks) ? span.marks : [];
  const defs = new Map((markDefs ?? []).map((def) => [def?._key, def]));
  if (marks.includes("code")) return renderInlineCode(raw);

  let text = escapeMdxText(raw);
  for (const mark of marks) {
    if (mark === "strong") text = `**${text}**`;
    else if (mark === "em") text = `*${text}*`;
    else {
      const def = defs.get(mark);
      if (def?._type === "link" && def.href) {
        const href = normalizeHref(def.href, knownSlugs, legacyRedirects);
        if (href) {
          const safeLabel = text.replace(/([\[\]])/g, "\\$1");
          const safeHref = String(href).replace(/\(/g, "%28").replace(/\)/g, "%29").replace(/\s/g, "%20");
          text = `[${safeLabel}](${safeHref})`;
        }
      }
    }
  }
  return text;
}

function renderPortableText(body, knownSlugs, legacyRedirects) {
  const out = [];
  let previousWasList = false;
  for (const block of body ?? []) {
    if (!block || block._type !== "block") continue;
    const children = Array.isArray(block.children) ? block.children : [];
    const markDefs = Array.isArray(block.markDefs) ? block.markDefs : [];
    const rawText = children.map((child) => child?.text ?? "").join("");
    const allCode = children.length > 0 && children.every((child) => (child?.marks ?? []).includes("code"));

    if (allCode) {
      if (out.length && previousWasList) out.push("");
      out.push(renderCodeFence(rawText));
      previousWasList = false;
      continue;
    }

    const text = children
      .map((child) => renderSpan(child, markDefs, knownSlugs, legacyRedirects))
      .join("")
      .trim();
    if (!text) continue;

    if (block.listItem) {
      const level = Math.max(1, Number(block.level) || 1);
      out.push(`${"  ".repeat(level - 1)}${block.listItem === "number" ? "1." : "-"} ${text}`);
      previousWasList = true;
      continue;
    }

    if (out.length && previousWasList) out.push("");
    previousWasList = false;
    const style = block.style || "normal";
    if (/^h[1-6]$/.test(style)) {
      const level = Math.min(6, Math.max(2, Number(style.slice(1))));
      out.push(`${"#".repeat(level)} ${text}`);
    } else if (style === "blockquote") {
      out.push(text.split("\n").map((line) => `> ${line}`).join("\n"));
    } else out.push(text);
  }
  return out.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
}

function extensionFromContentType(contentType, sourceUrl) {
  const type = String(contentType ?? "").split(";")[0].trim().toLowerCase();
  const byType = new Map([
    ["image/jpeg", "jpg"],
    ["image/png", "png"],
    ["image/webp", "webp"],
    ["image/gif", "gif"],
    ["image/svg+xml", "svg"],
  ]);
  if (byType.has(type)) return byType.get(type);
  const ext = path.extname(new URL(sourceUrl).pathname).replace(/^\./, "").toLowerCase();
  return /^[a-z0-9]{2,5}$/.test(ext) ? ext : "jpg";
}

async function downloadImage(post, slug) {
  if (!post.mainImageUrl) return undefined;
  try {
    const response = await fetch(post.mainImageUrl, {
      headers: { "User-Agent": "ZebraByteBlogMigration/2.0" },
      signal: AbortSignal.timeout(imageTimeoutMs),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const declaredLength = Number(response.headers.get("content-length") || 0);
    if (declaredLength > maxImageBytes) throw new Error(`asset exceeds ${maxImageBytes} bytes`);

    const ext = extensionFromContentType(response.headers.get("content-type"), post.mainImageUrl);
    const filename = `${slug}.${ext}`;
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength > maxImageBytes) throw new Error(`asset exceeds ${maxImageBytes} bytes`);
    await fs.writeFile(path.join(imageDir, filename), buffer);
    return `/blog/zebrabyte-generated/${filename}`;
  } catch (error) {
    console.warn(`[blog-sync] image fallback for ${slug}: ${error instanceof Error ? error.message : error}`);
    return post.mainImageUrl;
  }
}

async function fetchPosts() {
  const endpoint = new URL(`https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}`);
  endpoint.searchParams.set("query", GROQ);
  endpoint.searchParams.set("perspective", "published");
  const headers = { "User-Agent": "ZebraByteBlogMigration/2.0" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(endpoint, { headers, signal: AbortSignal.timeout(sanityTimeoutMs) });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error(`Sanity query failed (${response.status}): ${detail}`);
  }
  const payload = await response.json();
  if (!Array.isArray(payload.result)) throw new Error("Sanity response did not contain a result array.");
  return payload.result;
}

async function mapWithConcurrency(items, limit, worker) {
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const index = cursor++;
      await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => run()));
}

async function writeRedirectModule(redirects) {
  const object = Object.fromEntries([...redirects.entries()].sort(([a], [b]) => a.localeCompare(b)));
  const content = [
    "// Generated by tools/sync-zebrabyte-blog-v2.mjs. Do not edit manually.",
    `export const legacyWixBlogRedirects: Readonly<Record<string, string>> = Object.freeze(${JSON.stringify(object, null, 2)});`,
    "",
  ].join("\n");
  await fs.writeFile(redirectModulePath, content, "utf8");
}

async function main() {
  await fs.rm(contentDir, { recursive: true, force: true });
  await fs.rm(imageDir, { recursive: true, force: true });
  await fs.mkdir(contentDir, { recursive: true });
  await fs.mkdir(imageDir, { recursive: true });

  const documents = await fetchPosts();
  const resolution = resolvePublishedPosts(documents);
  await writeRedirectModule(resolution.redirects);

  const knownSlugs = new Set(resolution.resolved.keys());
  const failures = [];
  const imported = [];
  const entries = [...resolution.resolved.entries()];

  await mapWithConcurrency(entries, imageDownloadConcurrency, async ([slug, post]) => {
    try {
      const body = renderPortableText(post.body, knownSlugs, resolution.redirects);
      if (!body) throw new Error("empty Portable Text body after conversion");
      const excerpt = buildExcerpt(post);
      if (excerpt.length < 120) throw new Error(`excerpt is only ${excerpt.length} characters`);

      const ogImage = await downloadImage(post, slug);
      const publishedDate = new Date(post.publishedAt);
      const modifiedDate = new Date(post._updatedAt || post.publishedAt);
      if (Number.isNaN(modifiedDate.valueOf())) throw new Error("invalid dateModified");

      const frontmatter = [
        "---",
        `title: ${yamlString(post.title)}`,
        `slug: ${yamlString(slug)}`,
        `date: ${publishedDate.toISOString().slice(0, 10)}`,
        `dateModified: ${modifiedDate.toISOString().slice(0, 10)}`,
        `excerpt: ${yamlString(excerpt)}`,
        "author:",
        `  name: ${yamlString(post.author || "ZebraByte")}`,
        `source: "zebrabyte"`,
        `legacyId: ${yamlString(post._id)}`,
        `legacyIds: ${JSON.stringify(post.legacyIds)}`,
        `tags: ${JSON.stringify(Array.isArray(post.tags) ? post.tags : [])}`,
      ];
      if (ogImage) frontmatter.push(`ogImage: ${yamlString(ogImage)}`);
      frontmatter.push("---", "", body, "");
      await fs.writeFile(path.join(contentDir, `${slug}.mdx`), frontmatter.join("\n"), "utf8");
      imported.push({
        slug,
        originalSlug: post.baseSlug,
        title: post.title,
        id: post._id,
        legacyIds: post.legacyIds,
        image: Boolean(ogImage),
      });
    } catch (error) {
      failures.push({ slug, id: post._id, error: error instanceof Error ? error.message : String(error) });
    }
  });

  imported.sort((a, b) => a.slug.localeCompare(b.slug));
  failures.sort((a, b) => a.slug.localeCompare(b.slug));
  const coveredDocumentCount = imported.reduce((count, item) => count + item.legacyIds.length, 0);

  const manifest = {
    source: {
      projectId,
      dataset,
      documentCount: documents.length,
      originalSlugCount: resolution.originalSlugCount,
      articleCount: resolution.resolved.size,
      duplicateDocumentCount: resolution.duplicateDocumentCount,
      slugCollisionCount: resolution.slugCollisionCount,
      coveredDocumentCount,
    },
    importedCount: imported.length,
    failureCount: failures.length,
    legacyRedirectCount: resolution.redirects.size,
    duplicateGroups: resolution.duplicateGroups,
    imported,
    failures,
    generatedAt: new Date().toISOString(),
  };
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log(
    `[blog-sync] published docs: ${documents.length}; canonical articles: ${resolution.resolved.size}; deduplicated copies: ${resolution.duplicateDocumentCount}; slug collisions: ${resolution.slugCollisionCount}; redirects: ${resolution.redirects.size}`,
  );
  for (const group of resolution.duplicateGroups) {
    console.log(`[blog-sync] canonicalized duplicate(s) ${group.duplicateIds.join(", ")} -> /blog/${group.canonicalSlug}`);
  }

  if (failures.length) {
    for (const failure of failures) console.error(`[blog-sync] ${failure.slug}: ${failure.error}`);
    throw new Error(`${failures.length} canonical article(s) failed conversion.`);
  }
  if (imported.length !== resolution.resolved.size) {
    throw new Error(`Article parity failed: ${imported.length}/${resolution.resolved.size} canonical articles generated.`);
  }
  if (coveredDocumentCount !== documents.length) {
    throw new Error(`Published document coverage failed: ${coveredDocumentCount}/${documents.length}.`);
  }
}

await main();
