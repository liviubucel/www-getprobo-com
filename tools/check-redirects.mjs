import { redirects, resolveRedirect } from "../src/lib/redirects.mjs";

const expected = new Map([
  ["/products/compliance-portal", "/compliance-portal"],
  ["/compliance-guides/soc2", "/soc2"],
  ["/compliance-guides/iso27001", "/iso-27001"],
  ["/probo-newsletter", "/newsletter"],
  ["/hub/probo-vs-vanta", "/hub/zebrabyte-vs-vanta"],
  ["/subprocessors", "https://trust.zebrabyte.ro/subprocessors"],
  ["/docs/cli/login", "/docs/developers/cli/login"],
  ["/fr/blog/example", "/blog/example"],
  ["/fr/anything-legacy", "/anything-legacy"],
]);

const failures = [];

for (const [pathname, destination] of expected) {
  const resolved = resolveRedirect(pathname);
  if (!resolved || resolved.status !== 301 || resolved.destination !== destination) {
    failures.push(
      `${pathname}: expected 301 -> ${destination}, got ${JSON.stringify(resolved)}`,
    );
  }
}

for (const [source, rule] of Object.entries(redirects)) {
  if (source === rule.destination) failures.push(`${source}: redirect points to itself`);
  if (rule.status !== 301) failures.push(`${source}: expected permanent 301 status`);
}

if (failures.length) {
  console.error("[redirects] Redirect contract failed:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`[redirects] ${Object.keys(redirects).length} redirect rules verified.`);
