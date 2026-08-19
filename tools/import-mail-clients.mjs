// Import ZebraByte client contacts into the private operational-mail directory.
//
// Usage:
//   npm run mail:clients:import -- path/to/clients.txt
//
// File format: one address per line, optionally followed by a comma and name:
//   client@example.com
//   jane@example.com,Jane Doe
//
// Required environment variables:
//   MAIL_ADMIN_SECRET
// Optional:
//   SITE_URL=https://www.zebrabyte.ro

import { readFile } from "node:fs/promises";

const [contactsFile] = process.argv.slice(2);
const siteUrl = process.env.SITE_URL || "https://www.zebrabyte.ro";
const secret = process.env.MAIL_ADMIN_SECRET;

if (!contactsFile) {
  console.error("Usage: npm run mail:clients:import -- path/to/clients.txt");
  process.exit(1);
}
if (!secret) {
  console.error("Missing MAIL_ADMIN_SECRET environment variable.");
  process.exit(1);
}

const contacts = await readFile(contactsFile, "utf8").catch((error) => {
  console.error("Could not read contacts file:", error instanceof Error ? error.message : error);
  process.exit(1);
});

const response = await fetch(new URL("/api/mail/clients/import", siteUrl), {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${secret}`,
  },
  body: JSON.stringify({ contacts }),
});

const data = await response.json().catch(() => ({}));
if (!response.ok || !data.success) {
  console.error("Client import failed:", data);
  process.exit(1);
}

console.log(JSON.stringify(data, null, 2));
