// Preview and confirm a one-off ZebraByte newsletter announcement.
//
// Preview:
//   npm run newsletter:announce -- "Titlu" body.html body.txt [ro|en] [scheduledAt]
//
// Confirm:
//   npm run newsletter:announce -- --confirm <preview-id>
//
// Requires NEWSLETTER_DISPATCH_SECRET. SITE_URL defaults to production.

import { readFile } from "node:fs/promises";

const args = process.argv.slice(2);
const siteUrl = process.env.SITE_URL || "https://www.zebrabyte.ro";
const secret = process.env.NEWSLETTER_DISPATCH_SECRET;

if (!secret) {
  console.error("Missing NEWSLETTER_DISPATCH_SECRET environment variable.");
  process.exit(1);
}

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${secret}`,
};

if (args[0] === "--confirm") {
  const previewId = args[1];
  if (!previewId) {
    console.error("Usage: npm run newsletter:announce -- --confirm <preview-id>");
    process.exit(1);
  }
  const response = await fetch(new URL("/api/newsletter/send-announcement", siteUrl), {
    method: "POST",
    headers,
    body: JSON.stringify({ previewId, confirm: true }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) {
    console.error("Announcement confirmation failed:", data);
    process.exit(1);
  }
  console.log(JSON.stringify(data, null, 2));
  process.exit(0);
}

const [title, htmlFile, textFile, requestedLocale = "ro", scheduledAt] = args;
const locale = requestedLocale === "en" ? "en" : "ro";
if (!title || !htmlFile || !textFile) {
  console.error('Usage: npm run newsletter:announce -- "Titlu" body.html body.txt [ro|en] [scheduledAt]');
  process.exit(1);
}

const [bodyHtml, bodyText] = await Promise.all([
  readFile(htmlFile, "utf8"),
  readFile(textFile, "utf8"),
]);

const response = await fetch(new URL("/api/newsletter/send-announcement", siteUrl), {
  method: "POST",
  headers,
  body: JSON.stringify({ title, bodyHtml, bodyText, locale, scheduledAt }),
});
const data = await response.json().catch(() => ({}));
if (!response.ok || !data.success) {
  console.error("Announcement preview failed:", data);
  process.exit(1);
}

console.log(JSON.stringify(data, null, 2));
if (data.preview?.id) {
  console.log(`\nReview the preview above, then confirm with:\n  npm run newsletter:announce -- --confirm ${data.preview.id}`);
}
