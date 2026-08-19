// Create a queued ZebraByte mail campaign through the private Worker API.
//
// Usage:
//   npm run mail:campaign -- path/to/campaign.json
//
// Required environment variables:
//   MAIL_ADMIN_SECRET
// Optional:
//   SITE_URL=https://www.zebrabyte.ro
//
// Example JSON:
// {
//   "subject": "Mentenanță programată",
//   "bodyHtml": "<p>...</p>",
//   "bodyText": "...",
//   "locale": "ro",
//   "messageType": "service",
//   "audience": "clients",
//   "sourceId": "maintenance-2026-08-19"
// }

import { readFile } from "node:fs/promises";

const [jsonFile] = process.argv.slice(2);
const siteUrl = process.env.SITE_URL || "https://www.zebrabyte.ro";
const secret = process.env.MAIL_ADMIN_SECRET;

if (!jsonFile) {
  console.error("Usage: npm run mail:campaign -- path/to/campaign.json");
  process.exit(1);
}
if (!secret) {
  console.error("Missing MAIL_ADMIN_SECRET environment variable.");
  process.exit(1);
}

let payload;
try {
  payload = JSON.parse(await readFile(jsonFile, "utf8"));
} catch (error) {
  console.error("Could not read/parse campaign JSON:", error instanceof Error ? error.message : error);
  process.exit(1);
}

const response = await fetch(new URL("/api/mail/campaigns", siteUrl), {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${secret}`,
    ...(payload.sourceId ? { "Idempotency-Key": String(payload.sourceId) } : {}),
  },
  body: JSON.stringify(payload),
});

const data = await response.json().catch(() => ({}));
if (!response.ok || !data.success) {
  console.error("Campaign creation failed:", data);
  process.exit(1);
}

console.log(JSON.stringify(data, null, 2));
