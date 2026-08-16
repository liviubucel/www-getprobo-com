// Send a one-off ZebraByte announcement to every confirmed newsletter subscriber.
//
// Usage:
//   npm run newsletter:announce -- "Titlu anunț" path/to/body.html path/to/body.txt [ro|en]
//
// Requires NEWSLETTER_DISPATCH_SECRET. SITE_URL defaults to production.

import { readFile } from "node:fs/promises";

const [title, htmlFile, textFile, requestedLocale = "ro"] = process.argv.slice(2);
const siteUrl = process.env.SITE_URL || "https://www.zebrabyte.ro";
const secret = process.env.NEWSLETTER_DISPATCH_SECRET;
const locale = requestedLocale === "en" ? "en" : "ro";

if (!title || !htmlFile || !textFile) {
  console.error(
    'Usage: npm run newsletter:announce -- "Titlu anunț" path/to/body.html path/to/body.txt [ro|en]',
  );
  process.exit(1);
}

if (!secret) {
  console.error("Missing NEWSLETTER_DISPATCH_SECRET environment variable.");
  process.exit(1);
}

const [bodyHtml, bodyText] = await Promise.all([
  readFile(htmlFile, "utf8"),
  readFile(textFile, "utf8"),
]);

const response = await fetch(new URL("/api/newsletter/send-announcement", siteUrl), {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${secret}`,
  },
  body: JSON.stringify({ title, bodyHtml, bodyText, locale }),
});

const data = await response.json();
if (!response.ok || !data.success) {
  console.error("Failed to send announcement:", data);
  process.exit(1);
}

console.log(`Sent to ${data.sent}/${data.total} subscribers (${data.failed ?? 0} failed).`);
