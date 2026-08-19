// Preview and explicitly confirm a ZebraByte mail campaign.
//
// Preview:
//   npm run mail:campaign -- path/to/campaign.json
//
// Confirm a preview:
//   npm run mail:campaign -- --confirm <preview-id>
//
// Required environment variables:
//   MAIL_ADMIN_SECRET
// Optional:
//   SITE_URL=https://www.zebrabyte.ro

import { readFile } from "node:fs/promises";

const args = process.argv.slice(2);
const siteUrl = process.env.SITE_URL || "https://www.zebrabyte.ro";
const secret = process.env.MAIL_ADMIN_SECRET;

if (!secret) {
  console.error("Missing MAIL_ADMIN_SECRET environment variable.");
  process.exit(1);
}

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${secret}`,
};

if (args[0] === "--confirm") {
  const previewId = args[1];
  if (!previewId) {
    console.error("Usage: npm run mail:campaign -- --confirm <preview-id>");
    process.exit(1);
  }

  const response = await fetch(new URL("/api/mail/campaigns/confirm", siteUrl), {
    method: "POST",
    headers,
    body: JSON.stringify({ previewId }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) {
    console.error("Campaign confirmation failed:", data);
    process.exit(1);
  }
  console.log(JSON.stringify(data, null, 2));
  process.exit(0);
}

const [jsonFile] = args;
if (!jsonFile) {
  console.error("Usage: npm run mail:campaign -- path/to/campaign.json");
  process.exit(1);
}

let payload;
try {
  payload = JSON.parse(await readFile(jsonFile, "utf8"));
} catch (error) {
  console.error("Could not read/parse campaign JSON:", error instanceof Error ? error.message : error);
  process.exit(1);
}

const response = await fetch(new URL("/api/mail/campaigns/preview", siteUrl), {
  method: "POST",
  headers,
  body: JSON.stringify(payload),
});
const data = await response.json().catch(() => ({}));
if (!response.ok || !data.success) {
  console.error("Campaign preview failed:", data);
  process.exit(1);
}

console.log(JSON.stringify(data, null, 2));
if (data.preview?.id) {
  console.log(`\nReview the preview above, then confirm with:\n  npm run mail:campaign -- --confirm ${data.preview.id}`);
}
