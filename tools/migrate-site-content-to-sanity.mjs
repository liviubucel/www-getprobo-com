import process from "node:process";
import {migrationDocuments, migrationVersion} from "./sanity-migration/content-v1.mjs";

const projectId = process.env.SANITY_PROJECT_ID || "yj548pxh";
const dataset = process.env.SANITY_DATASET || "production";
const token = process.env.SANITY_API_WRITE_TOKEN || "";
const applyDrafts = process.argv.includes("--apply-drafts");
const printJson = process.argv.includes("--json");

if (process.argv.some((arg) => ["--apply", "--publish", "--production"].includes(arg))) {
  throw new Error(
    "This migration intentionally supports drafts only. Use --apply-drafts, review in Studio/staging, then publish manually.",
  );
}

const allowedTypes = new Set(["siteSettings", "navigation", "page"]);
const requiredIds = new Set(["siteSettings", "mainNavigation", "page.homepage"]);
const reservedPathPrefixes = ["/api", "/cdn-cgi", "/.well-known", "/en", "/_cms"];

function assert(condition, message) {
  if (!condition) throw new Error(`[sanity-migration] ${message}`);
}

function isLocalized(value) {
  return value && typeof value === "object" && ["localizedString", "localizedText", "localizedRichText"].includes(value._type);
}

function validateTree(value, pointer = "document") {
  if (value === null || value === undefined) return;
  if (Array.isArray(value)) {
    const objectKeys = new Set();
    for (const [index, item] of value.entries()) {
      if (item && typeof item === "object" && !Array.isArray(item)) {
        assert(typeof item._key === "string" && item._key.length > 0, `${pointer}[${index}] is missing a stable _key.`);
        assert(!objectKeys.has(item._key), `${pointer} contains duplicate _key ${item._key}.`);
        objectKeys.add(item._key);
      }
      validateTree(item, `${pointer}[${index}]`);
    }
    return;
  }
  if (typeof value !== "object") return;

  if (isLocalized(value)) {
    assert(value.ro !== undefined && value.ro !== null && value.ro !== "", `${pointer} is missing Romanian content.`);
    assert(value.en !== undefined && value.en !== null && value.en !== "", `${pointer} is missing English content.`);
  }

  if (value.href !== undefined) {
    const href = String(value.href).trim();
    assert(
      href.startsWith("/") || href.startsWith("#") || href.startsWith("https://") || href.startsWith("mailto:") || href.startsWith("tel:"),
      `${pointer}.href uses an unsafe or unsupported destination: ${href}`,
    );
  }

  for (const [key, child] of Object.entries(value)) {
    if (key === "_id") continue;
    validateTree(child, `${pointer}.${key}`);
  }
}

function validateDocuments(documents) {
  const ids = new Set();
  for (const document of documents) {
    assert(document && typeof document === "object", "Every migration entry must be an object.");
    assert(typeof document._id === "string" && document._id.length > 0, "Every migration document requires _id.");
    assert(!document._id.startsWith("drafts."), `Source document ${document._id} must use its canonical ID, not a draft ID.`);
    assert(!ids.has(document._id), `Duplicate document ID: ${document._id}`);
    ids.add(document._id);
    assert(allowedTypes.has(document._type), `Unexpected document type ${document._type} for ${document._id}.`);

    if (document._type === "page") {
      const pagePath = String(document.path || "");
      assert(pagePath.startsWith("/"), `${document._id} must have an absolute public path.`);
      assert(
        !reservedPathPrefixes.some((prefix) => pagePath === prefix || pagePath.startsWith(`${prefix}/`)),
        `${document._id} attempts to claim reserved path ${pagePath}.`,
      );
    }

    validateTree(document, document._id);
  }

  for (const requiredId of requiredIds) {
    assert(ids.has(requiredId), `Migration batch is missing required document ${requiredId}.`);
  }
}

function asDraft(document) {
  return {
    ...structuredClone(document),
    _id: `drafts.${document._id}`,
  };
}

validateDocuments(migrationDocuments);
const draftDocuments = migrationDocuments.map(asDraft);

const summary = draftDocuments.map((document) => ({
  id: document._id,
  type: document._type,
  path: document.path || null,
  sections: Array.isArray(document.sections) ? document.sections.length : null,
}));

console.log(`[sanity-migration] ${migrationVersion}`);
console.log(`[sanity-migration] target=${projectId}/${dataset}; mode=${applyDrafts ? "apply-drafts" : "dry-run"}; documents=${draftDocuments.length}`);
for (const item of summary) {
  console.log(
    `[sanity-migration] ${item.id} (${item.type})${item.path ? ` path=${item.path}` : ""}${item.sections !== null ? ` sections=${item.sections}` : ""}`,
  );
}

if (printJson) {
  console.log(JSON.stringify(draftDocuments, null, 2));
}

if (!applyDrafts) {
  console.log("[sanity-migration] Dry-run only. No Content Lake mutation was attempted.");
  process.exit(0);
}

assert(token.length > 0, "SANITY_API_WRITE_TOKEN is required for --apply-drafts.");

const endpoint = new URL(
  `https://${projectId}.api.sanity.io/v2025-02-19/data/mutate/${encodeURIComponent(dataset)}`,
);
endpoint.searchParams.set("returnIds", "true");
endpoint.searchParams.set("tag", "zebrabyte.site-migration.v1");

const response = await fetch(endpoint, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    mutations: draftDocuments.map((document) => ({createOrReplace: document})),
  }),
});

const payloadText = await response.text();
let payload;
try {
  payload = payloadText ? JSON.parse(payloadText) : null;
} catch {
  payload = payloadText;
}

if (!response.ok) {
  throw new Error(
    `[sanity-migration] Content Lake mutation failed (${response.status} ${response.statusText}): ${typeof payload === "string" ? payload : JSON.stringify(payload)}`,
  );
}

const mutatedIds = Array.isArray(payload?.results)
  ? payload.results.map((result) => result?.id || result?.documentId).filter(Boolean)
  : [];
console.log(
  `[sanity-migration] Draft migration committed. transaction=${payload?.transactionId || "unknown"}; mutated=${mutatedIds.length || draftDocuments.length}.`,
);
console.log("[sanity-migration] Nothing was published. Review the drafts in ZebraByte CMS/staging and publish manually after parity checks.");
