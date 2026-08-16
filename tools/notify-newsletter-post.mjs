// Notify confirmed ZebraByte newsletter subscribers about a published article.
//
// Usage:
//   npm run newsletter:notify-post -- "Titlu articol" article-slug "Excerpt optional" [ro|en]
//
// Requires NEWSLETTER_DISPATCH_SECRET. SITE_URL defaults to production.

const [title, slug, excerpt = "", requestedLocale = "ro"] = process.argv.slice(2);
const siteUrl = process.env.SITE_URL || "https://www.zebrabyte.ro";
const secret = process.env.NEWSLETTER_DISPATCH_SECRET;
const locale = requestedLocale === "en" ? "en" : "ro";

if (!title || !slug) {
  console.error(
    'Usage: npm run newsletter:notify-post -- "Titlu articol" article-slug "Excerpt optional" [ro|en]',
  );
  process.exit(1);
}

if (!secret) {
  console.error("Missing NEWSLETTER_DISPATCH_SECRET environment variable.");
  process.exit(1);
}

const response = await fetch(new URL("/api/newsletter/notify-post", siteUrl), {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${secret}`,
  },
  body: JSON.stringify({ title, slug, excerpt, locale }),
});

const data = await response.json();
if (!response.ok || !data.success) {
  console.error("Failed to notify newsletter subscribers:", data);
  process.exit(1);
}

console.log(`Sent to ${data.sent}/${data.total} subscribers (${data.failed ?? 0} failed).`);
