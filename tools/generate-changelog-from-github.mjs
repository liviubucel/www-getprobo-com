import fs from "node:fs/promises";
import path from "node:path";

const eventPath = process.argv[2] || process.env.GITHUB_EVENT_PATH;
if (!eventPath) throw new Error("Missing GitHub event payload path.");

const eventName = process.env.GITHUB_EVENT_NAME || "";
const event = JSON.parse(await fs.readFile(eventPath, "utf8"));
const changelogDir = path.resolve("src/content/changelog");

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
  const patterns = [
    /(?:^|\n)##\s+Changelog(?:\s+public)?\s*\n([\s\S]*?)(?=\n##\s+|$)/i,
    /(?:^|\n)##\s+Noutăți\s+publice\s*\n([\s\S]*?)(?=\n##\s+|$)/i,
  ];
  for (const pattern of patterns) {
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

function makeDescription(title, candidate) {
  let description = stripMarkdown(candidate);
  if (description.length > 310) {
    const cut = description.slice(0, 307);
    const boundary = cut.lastIndexOf(" ");
    description = `${cut.slice(0, boundary > 180 ? boundary : 307).trim()}…`;
  }

  if (description.length < 120) {
    const prefix = description ? `${description} ` : "";
    description = clean(
      `${prefix}Actualizarea „${title}” face parte din îmbunătățirile continue ZebraByte pentru platformă, securitate, conformitate și experiența de utilizare.`,
    );
  }
  if (description.length < 120) {
    description = `${description} Schimbarea este disponibilă în versiunea curentă ZebraByte.`;
  }
  return description;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function labelsFromPullRequest(pullRequest) {
  return (pullRequest?.labels ?? []).map((label) => clean(label?.name).toLowerCase()).filter(Boolean);
}

function markersFromBody(body) {
  return [...String(body ?? "").matchAll(/changelog:(publish|feature|platform|security|compliance|integration|integrations|docs|documentation|privacy|infrastructure|iam|access-review|skip)/gi)]
    .map((match) => `changelog:${match[1].toLowerCase()}`);
}

function manualTags(inputs) {
  const primary = clean(inputs.category) || "Platformă";
  const extras = String(inputs.extra_tags ?? "")
    .split(",")
    .map(clean)
    .filter(Boolean);
  return unique([primary, ...extras]);
}

async function alreadyExists(title) {
  const files = await fs.readdir(changelogDir);
  const expected = `title: ${JSON.stringify(title)}`;
  for (const file of files) {
    if (!file.endsWith(".mdx")) continue;
    const source = await fs.readFile(path.join(changelogDir, file), "utf8");
    if (source.includes(expected)) return file;
  }
  return null;
}

async function setOutput(name, value) {
  if (!process.env.GITHUB_OUTPUT) return;
  await fs.appendFile(process.env.GITHUB_OUTPUT, `${name}=${String(value).replace(/\n/g, " ")}\n`);
}

async function addSummary(lines) {
  if (!process.env.GITHUB_STEP_SUMMARY) return;
  await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, `${lines.join("\n")}\n`);
}

let title = "";
let descriptionSource = "";
let bodySource = "";
let tags = [];
let date = new Date().toISOString().slice(0, 10);
let sourceLabel = "manual";

if (eventName === "pull_request" || event.pull_request) {
  const pr = event.pull_request;
  if (!pr?.merged) {
    await setOutput("created", "false");
    console.log("Pull request was closed without merge; no changelog entry created.");
    process.exit(0);
  }

  const labels = unique([...labelsFromPullRequest(pr), ...markersFromBody(pr.body)]);
  if (labels.includes("changelog:skip")) {
    await setOutput("created", "false");
    console.log("changelog:skip found; no changelog entry created.");
    process.exit(0);
  }

  const requested = labels.some((label) => label === "changelog:publish" || categoryLabels.has(label));
  if (!requested) {
    await setOutput("created", "false");
    console.log("No changelog:* publication label or marker found; nothing to publish.");
    process.exit(0);
  }

  tags = unique(labels.map((label) => categoryLabels.get(label)));
  if (tags.length === 0) tags = ["Platformă"];

  title = cleanTitle(pr.title);
  const publicSection = extractPublicSection(pr.body);
  descriptionSource = publicSection || pr.body || "";
  bodySource = publicSection || "";
  date = pr.merged_at ? new Date(pr.merged_at).toISOString().slice(0, 10) : date;
  sourceLabel = `PR #${pr.number}`;
} else if (eventName === "workflow_dispatch" || event.inputs) {
  const inputs = event.inputs ?? {};
  title = cleanTitle(inputs.title);
  descriptionSource = inputs.description || "";
  bodySource = inputs.details || "";
  tags = manualTags(inputs);
  sourceLabel = "manual dispatch";
} else {
  await setOutput("created", "false");
  console.log(`Unsupported event ${eventName || "unknown"}; nothing to publish.`);
  process.exit(0);
}

const existing = await alreadyExists(title);
if (existing) {
  await setOutput("created", "false");
  await setOutput("path", `src/content/changelog/${existing}`);
  console.log(`Changelog entry with the same title already exists: ${existing}`);
  process.exit(0);
}

const description = makeDescription(title, descriptionSource);
const publicBody = stripMarkdown(bodySource);
const body = publicBody.length >= 80
  ? publicBody
  : `${description}\n\nSchimbarea este disponibilă în versiunea curentă ZebraByte.`;

await fs.mkdir(changelogDir, { recursive: true });
let filename = `${date}-${slugify(title)}.mdx`;
try {
  await fs.access(path.join(changelogDir, filename));
  const suffix = event.pull_request?.number ? `-pr-${event.pull_request.number}` : `-${Date.now()}`;
  filename = `${date}-${slugify(title)}${suffix}.mdx`;
} catch {
  // Expected when the generated filename is available.
}

const filePath = path.join(changelogDir, filename);
const frontmatter = [
  "---",
  `title: ${JSON.stringify(title)}`,
  `description: ${JSON.stringify(description)}`,
  `date: ${date}`,
  `tags: ${JSON.stringify(tags)}`,
  "---",
  "",
].join("\n");

await fs.writeFile(filePath, `${frontmatter}${body.trim()}\n`, "utf8");

const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, "/");
await setOutput("created", "true");
await setOutput("path", relativePath);
await setOutput("title", title);
await setOutput("slug", filename.replace(/\.mdx$/, ""));
await addSummary([
  "## ZebraByte changelog publication",
  "",
  `- Source: ${sourceLabel}`,
  `- Title: ${title}`,
  `- Categories: ${tags.join(", ")}`,
  `- File: \`${relativePath}\``,
]);

console.log(`Created ${relativePath}`);
