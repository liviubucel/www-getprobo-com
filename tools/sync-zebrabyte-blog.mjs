import fs from "node:fs/promises";
import path from "node:path";

const projectId = process.env.ZEBRABYTE_LEGACY_SANITY_PROJECT_ID || "yj548pxh";
const dataset = process.env.ZEBRABYTE_LEGACY_SANITY_DATASET || "production";
const token = process.env.ZEBRABYTE_LEGACY_SANITY_READ_TOKEN || process.env.SANITY_API_READ_TOKEN || "";
const apiVersion = "2025-01-01";

const contentDir = path.resolve("src/content/blog/zebrabyte-generated");
const imageDir = path.resolve("public/blog/zebrabyte-generated");
const manifestPath = path.join(contentDir, "_manifest.json");
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

function yamlString(value) {
  return JSON.stringify(String(value ?? ""));
}

function blockPlainText(block) {
  if (!block || block._type !== "block" || !Array.isArray(block.children)) return "";
  return clean(block.children.map((child) => child?.text ?? "").join(""));
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

function normalizeHref(href, knownSlugs) {
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

  let pathname = url.pathname.replace(/\/+$/, "") || "/";
  const oldPost = pathname.match(/^\/blog\/blogul-nostru-1\/(.+?)-(\d+)$/i);
  if (oldPost) {
    const candidate = safeSlug(oldPost[1]);
    return knownSlugs.has(candidate) ? `/blog/${candidate}` : "/blog";
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

function renderSpan(span, markDefs, knownSlugs) {
  const raw = String(span?.text ?? "");
  const marks = Array.isArray(span?.marks) ? span.marks : [];
  const defs = new Map((markDefs ?? []).map((def) => [def?._key, def]));

  if (marks.includes("code")) return renderInlineCode(raw);

  let text = escapeMdxText(raw);
  for (const mark of marks) {
    if (mark === "strong") {
      text = `**${text}**`;
    } else if (mark === "em") {
      text = `*${text}*`;
    } else {
      const def = defs.get(mark);
      if (def?._type === "link" && def.href) {
        const href = normalizeHref(def.href, knownSlugs);
        if (href) {
          const safeLabel = text.replace(/([\[\]])/g, "\\$1");
          const safeHref = String(href)
            .replace(/\(/g, "%28")
            .replace(/\)/g, "%29")
            .replace(/\s/g, "%20");
          text = `[${safeLabel}](${safeHref})`;
        }
      }
    }
  }
  return text;
}

function renderPortableText(body, knownSlugs) {
  const out = [];
  let previousWasList = false;

  for (const block of body ?? []) {
    if (!block || block._type !== "block") continue;
    const children = Array.isArray(block.children) ? block.children : [];
    const markDefs = Array.isArray(block.markDefs) ? block.markDefs : [];
    const rawText = children.map((child) => child?.text ?? "").join("");

    const allCode =
      children.length > 0 &&
      children.every((child) => (child?.marks ?? []).includes("code"));
    if (allCode) {
      if (out.length && previousWasList) out.push("");
      out.push(renderCodeFence(rawText));
      previousWasList = false;
      continue;
    }

    const text = children
      .map((child) => renderSpan(child, markDefs, knownSlugs))
      .join("")
      .trim();
    if (!text) continue;

    if (block.listItem) {
      const level = Math.max(1, Number(block.level) || 1);
      const indent = "  ".repeat(level - 1);
      const marker = block.listItem === "number" ? "1." : "-";
      out.push(`${indent}${marker} ${text}`);
      previousWasList = true;
      continue;
    }

    if (out.length && previousWasList) out.push("");
    previousWasList = false;

    const style = block.style || "normal";
    if (/^h[1-6]$/.test(style)) {
      const sourceLevel = Number(style.slice(1));
      const level = Math.min(6, Math.max(2, sourceLevel));
      out.push(`${"#".repeat(level)} ${text}`);
    } else if (style === "blockquote") {
      out.push(text.split("\n").map((line) => `> ${line}`).join("\n"));
    } else {
      out.push(text);
    }
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
  const pathname = new URL(sourceUrl).pathname;
  const ext = path.extname(pathname).replace(/^\./, "").toLowerCase();
  return /^[a-z0-9]{2,5}$/.test(ext) ? ext : "jpg";
}

async function downloadImage(post, slug) {
  if (!post.mainImageUrl) return undefined;
  try {
    const response = await fetch(post.mainImageUrl, {
      headers: { "User-Agent": "ZebraByteBlogMigration/1.0" },
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
    console.warn(
      `[blog-sync] image fallback for ${slug}: ${error instanceof Error ? error.message : error}`,
    );
    return post.mainImageUrl;
  }
}

async function fetchPosts() {
  const endpoint = new URL(
    `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}`,
  );
  endpoint.searchParams.set("query", GROQ);
  endpoint.searchParams.set("perspective", "published");

  const headers = { "User-Agent": "ZebraByteBlogMigration/1.0" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(endpoint, {
    headers,
    signal: AbortSignal.timeout(sanityTimeoutMs),
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error(`Sanity query failed (${response.status}): ${detail}`);
  }

  const payload = await response.json();
  if (!Array.isArray(payload.result)) {
    throw new Error("Sanity response did not contain a result array.");
  }
  return payload.result;
}

async function mapWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;

  async function run() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => run()),
  );
  return results;
}

function validatePublishedPosts(documents) {
  if (documents.length === 0) {
    throw new Error("Sanity returned no published ZebraByte blog posts.");
  }

  const bySlug = new Map();
  const structuralFailures = [];

  for (const post of documents) {
    const id = clean(post?._id) || "unknown-document";
    const rawTitle = clean(post?.title);
    const rawSlug = clean(post?.slug);
    const slug = safeSlug(rawSlug);
    const publishedAt = new Date(post?.publishedAt);

    const reasons = [];
    if (!rawTitle) reasons.push("missing title");
    if (!rawSlug) reasons.push("missing public slug");
    if (!slug) reasons.push("slug normalizes to empty");
    if (!post?.publishedAt || Number.isNaN(publishedAt.valueOf())) {
      reasons.push("missing/invalid publishedAt");
    }
    if (!Array.isArray(post?.body) || post.body.length === 0) {
      reasons.push("missing/empty Portable Text body");
    }

    if (reasons.length) {
      structuralFailures.push({ id, slug: rawSlug || null, error: reasons.join(", ") });
      continue;
    }

    if (bySlug.has(slug)) {
      const existing = bySlug.get(slug);
      structuralFailures.push({
        id,
        slug,
        error: `duplicate public slug; already used by ${existing._id}`,
      });
      continue;
    }

    bySlug.set(slug, { ...post, slug });
  }

  if (structuralFailures.length) {
    const detail = structuralFailures
      .map((failure) => `  - ${failure.id}${failure.slug ? ` (${failure.slug})` : ""}: ${failure.error}`)
      .join("\n");
    throw new Error(
      `Published ZebraByte blog dataset is not one-to-one importable (${structuralFailures.length} problem(s)):\n${detail}`,
    );
  }

  if (bySlug.size !== documents.length) {
    throw new Error(
      `Strict blog parity failed before conversion: ${bySlug.size}/${documents.length} published documents have unique valid slugs.`,
    );
  }

  return bySlug;
}

async function main() {
  await fs.rm(contentDir, { recursive: true, force: true });
  await fs.rm(imageDir, { recursive: true, force: true });
  await fs.mkdir(contentDir, { recursive: true });
  await fs.mkdir(imageDir, { recursive: true });

  const documents = await fetchPosts();
  const bySlug = validatePublishedPosts(documents);

  const knownSlugs = new Set(bySlug.keys());
  const failures = [];
  const imported = [];
  const entries = [...bySlug.entries()];

  await mapWithConcurrency(entries, imageDownloadConcurrency, async ([slug, post]) => {
    try {
      const body = renderPortableText(post.body, knownSlugs);
      if (!body) throw new Error("empty Portable Text body after conversion");

      const excerpt = buildExcerpt(post);
      if (excerpt.length < 120) {
        throw new Error(`excerpt is only ${excerpt.length} characters`);
      }

      const ogImage = await downloadImage(post, slug);
      const publishedDate = new Date(post.publishedAt);
      const modifiedDate = new Date(post._updatedAt || post.publishedAt);
      if (Number.isNaN(publishedDate.valueOf())) throw new Error("invalid publishedAt");
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
        `tags: ${JSON.stringify(Array.isArray(post.tags) ? post.tags : [])}`,
      ];
      if (ogImage) frontmatter.push(`ogImage: ${yamlString(ogImage)}`);
      frontmatter.push("---", "", body, "");

      await fs.writeFile(
        path.join(contentDir, `${slug}.mdx`),
        frontmatter.join("\n"),
        "utf8",
      );
      imported.push({ slug, title: post.title, id: post._id, image: Boolean(ogImage) });
    } catch (error) {
      failures.push({
        slug,
        id: post._id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  imported.sort((a, b) => a.slug.localeCompare(b.slug));
  failures.sort((a, b) => a.slug.localeCompare(b.slug));

  const manifest = {
    source: {
      projectId,
      dataset,
      documentCount: documents.length,
      uniqueSlugCount: bySlug.size,
    },
    importedCount: imported.length,
    failureCount: failures.length,
    imported,
    failures,
    generatedAt: new Date().toISOString(),
  };
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log(
    `[blog-sync] published Sanity docs: ${documents.length}; unique slugs: ${bySlug.size}; imported: ${imported.length}`,
  );

  if (failures.length) {
    console.error(`[blog-sync] ${failures.length} article(s) failed conversion:`);
    for (const failure of failures) {
      console.error(`  - ${failure.slug}: ${failure.error}`);
    }
    process.exitCode = 1;
  }

  if (imported.length !== documents.length || imported.length !== bySlug.size) {
    throw new Error(
      `Blog migration incomplete: imported ${imported.length}/${documents.length} published documents (${bySlug.size} unique slugs).`,
    );
  }
}

await main();
