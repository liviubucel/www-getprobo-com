import fs from "node:fs/promises";
import path from "node:path";

const repo = process.env.ZEBRABYTE_CHANGELOG_GITHUB_REPO || "liviubucel/www-getprobo-com";
const changelogDir = path.resolve("src/content/changelog");
const generatedPrefix = "github-";
const maxPages = 10;

const categoryLabels = new Map([
  ["changelog:feature", "Platformă"],
  ["changelog:platform", "Platformă"],
  ["changelog:security", "Securitate"],
  ["changelog:compliance", "Conformitate"],
  ["changelog:integration", "Integrări"],
  ["changelog:integrations", "Integrări"],
  ["changelog:docs", "Documentație"],
  ["changelog:documentation", "Documentație"],
  ["changelog:privacy", "Confidențialitate"],
  ["changelog:infrastructure", "Infrastructură"],
  ["changelog:iam", "IAM"],
  ["changelog:access-review", "Revizuire acces"],
]);

function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function stripMarkdown(value) {
  return clean(
    String(value ?? "")
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/<!--([\s\S]*?)-->/g, " ")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/^\s*[-*+]\s+/gm, "")
      .replace(/^\s*\d+\.\s+/gm, "")
      .replace(/[`*_~>|]/g, " ")
      .replace(/<[^>]+>/g, " "),
  );
}

function extractPublicSection(body) {
  const source = String(body ?? "");
  for (const pattern of [
    /(?:^|\n)##\s+Changelog(?:\s+public)?\s*\n([\s\S]*?)(?=\n##\s+|$)/i,
    /(?:^|\n)##\s+Noutăți\s+publice\s*\n([\s\S]*?)(?=\n##\s+|$)/i,
  ]) {
    const match = source.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return "";
}

function cleanTitle(value) {
  const title = clean(value)
    .replace(/^(feat(?:ure)?|fix|chore|docs|refactor|perf|release)(\([^)]*\))?:\s*/i, "")
    .replace(/^changelog:\s*/i, "");
  if (!title) return "Actualizare ZebraByte";
  return title.charAt(0).toUpperCase() + title.slice(1);
}

function slugify(value) {
  return clean(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72)
    .replace(/-+$/g, "") || "actualizare-zebrabyte";
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function makeDescription(title, candidate) {
  let description = stripMarkdown(candidate);
  if (description.length > 310) {
    const cut = description.slice(0, 307);
    const boundary = cut.lastIndexOf(" ");
    description = `${cut.slice(0, boundary > 180 ? boundary : 307).trim()}…`;
  }
  if (description.length < 120) {
    description = clean(
      `${description ? `${description} ` : ""}Actualizarea „${title}” face parte din îmbunătățirile continue ZebraByte pentru platformă, securitate, conformitate și experiența de utilizare.`,
    );
  }
  if (description.length < 120) {
    description = `${description} Schimbarea este disponibilă în versiunea curentă ZebraByte.`;
  }
  return description;
}

function publicationMetadata(pr) {
  if (!pr?.merged_at || pr.base?.ref !== "main") return null;

  const body = String(pr.body ?? "");
  const labels = unique([
    ...(pr.labels ?? []).map((label) => clean(label?.name).toLowerCase()),
    ...[...body.matchAll(/changelog:(publish|feature|platform|security|compliance|integration|integrations|docs|documentation|privacy|infrastructure|iam|access-review|skip)/gi)]
      .map((match) => `changelog:${match[1].toLowerCase()}`),
  ]);

  if (labels.includes("changelog:skip")) return null;
  if (!labels.some((label) => label === "changelog:publish" || categoryLabels.has(label))) return null;

  const tags = unique(labels.map((label) => categoryLabels.get(label)));
  return {
    tags: tags.length ? tags : ["Platformă"],
    publicSection: extractPublicSection(body),
  };
}

async function githubJson(url) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "ZebraByte-Changelog-Build-Sync/1.0",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = process.env.ZEBRABYTE_CHANGELOG_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`GitHub API ${response.status}: ${await response.text()}`);
  }
  return response.json();
}

async function fetchMergedPullRequests() {
  const result = [];
  for (let page = 1; page <= maxPages; page += 1) {
    const url = `https://api.github.com/repos/${repo}/pulls?state=closed&sort=created&direction=desc&per_page=100&page=${page}`;
    const batch = await githubJson(url);
    if (!Array.isArray(batch)) throw new Error("Unexpected GitHub pull request response.");
    result.push(...batch);
    if (batch.length < 100) break;
  }
  return result.filter((pr) => pr.merged_at && pr.base?.ref === "main");
}

async function staticTitles() {
  const titles = new Set();
  for (const file of await fs.readdir(changelogDir)) {
    if (!file.endsWith(".mdx") || file.startsWith(generatedPrefix)) continue;
    const source = await fs.readFile(path.join(changelogDir, file), "utf8");
    const match = source.match(/^title:\s*(.+)$/m);
    if (!match) continue;
    try {
      titles.add(JSON.parse(match[1]));
    } catch {
      titles.add(match[1].replace(/^['"]|['"]$/g, ""));
    }
  }
  return titles;
}

async function clearGeneratedEntries() {
  for (const file of await fs.readdir(changelogDir)) {
    if (file.startsWith(generatedPrefix) && file.endsWith(".mdx")) {
      await fs.unlink(path.join(changelogDir, file));
    }
  }
}

async function main() {
  await fs.mkdir(changelogDir, { recursive: true });

  let pullRequests;
  try {
    pullRequests = await fetchMergedPullRequests();
  } catch (error) {
    // Changelog sync must never take the public website down. Existing static
    // entries still build normally; the next successful deployment catches up.
    console.warn(`[changelog-sync] GitHub sync skipped: ${error instanceof Error ? error.message : error}`);
    return;
  }

  const existingTitles = await staticTitles();
  await clearGeneratedEntries();

  let generated = 0;
  const usedNames = new Set();
  for (const pr of pullRequests.sort((a, b) => new Date(a.merged_at).valueOf() - new Date(b.merged_at).valueOf())) {
    const metadata = publicationMetadata(pr);
    if (!metadata) continue;

    const title = cleanTitle(pr.title);
    if (existingTitles.has(title)) continue;

    const date = new Date(pr.merged_at).toISOString().slice(0, 10);
    const description = makeDescription(title, metadata.publicSection || pr.body || "");
    const publicBody = stripMarkdown(metadata.publicSection);
    const body = publicBody.length >= 80
      ? publicBody
      : `${description}\n\nSchimbarea este disponibilă în versiunea curentă ZebraByte.`;

    let baseName = `${generatedPrefix}${date}-${slugify(title)}`;
    if (usedNames.has(baseName)) baseName = `${baseName}-pr-${pr.number}`;
    usedNames.add(baseName);

    const source = [
      "---",
      `title: ${JSON.stringify(title)}`,
      `description: ${JSON.stringify(description)}`,
      `date: ${date}`,
      `tags: ${JSON.stringify(metadata.tags)}`,
      "---",
      "",
      body.trim(),
      "",
    ].join("\n");

    await fs.writeFile(path.join(changelogDir, `${baseName}.mdx`), source, "utf8");
    generated += 1;
  }

  console.log(`[changelog-sync] ${generated} GitHub changelog entr${generated === 1 ? "y" : "ies"} generated for this build.`);
}

await main();
