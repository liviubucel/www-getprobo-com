import { readFile } from "node:fs/promises";

const failures = [];
const read = (path) => readFile(path, "utf8");

function requireText(content, needle, label) {
  if (!content.includes(needle)) failures.push(`${label}: missing ${JSON.stringify(needle)}`);
}

function forbidText(content, needle, label) {
  if (content.includes(needle)) failures.push(`${label}: forbidden ${JSON.stringify(needle)}`);
}

const [about, team, logos, home, love, baseline] = await Promise.all([
  read("src/pages/about.astro"),
  read("src/components/block/Team.astro"),
  read("src/components/block/Logos.astro"),
  read("src/pages/index.astro"),
  read("src/pages/love-from-customer.astro"),
  read("docs/architecture/experience-baseline.md"),
]);

requireText(
  baseline,
  "7e7e7b5c18c621aae125488342a215a641c830b9",
  "golden Probo design baseline",
);
requireText(
  baseline,
  "design and behavior reference, not a content authority",
  "baseline design/content boundary",
);
requireText(baseline, "Invalid inherited content", "baseline provenance classification");
requireText(
  baseline,
  "Never present Probo customer logos as ZebraByte social proof",
  "baseline social-proof provenance rule",
);

requireText(about, 'import Team from "../components/block/Team.astro"', "About inherited section rhythm");
requireText(about, "<Team />", "About capability/team geometry");
requireText(about, "/images/zbt-negru.svg", "About ZebraByte hero identity");
forbidText(about, "../assets/about.png", "About Probo team photo provenance");
forbidText(about, "const principles =", "About invented principles replacement");

requireText(team, 'import MenuIcon from "../MenuIcon.astro"', "About capability visual language");
requireText(team, "sm:flex-row sm:gap-20", "About primary two-column geometry");
requireText(team, "sm:grid-cols-4", "About secondary grid geometry");
forbidText(team, "../../assets/about/", "About Probo people assets");
forbidText(team, "Antoine Bourchardy", "About Probo people provenance");
forbidText(team, "Bryan Frimin", "About Probo people provenance");
forbidText(team, "Platform archive", "About legacy archive presentation");
forbidText(team, "rounded-xl border p-6 sm:p-8", "About invented bordered-card replacement");

requireText(logos, 'LogosScroll from "../LogosScroll.svelte"', "capability marquee motion");
requireText(logos, "client:load", "capability marquee hydration");
requireText(logos, "/managed-compliance", "capability marquee first-party content");
requireText(logos, "/cyber-security", "capability marquee first-party content");
requireText(logos, "/secure-hosting", "capability marquee first-party content");
forbidText(logos, "https://ahrefs.com", "Probo customer social-proof provenance");
forbidText(logos, "traceforgood.com", "Probo customer social-proof provenance");
forbidText(logos, "typebot.io", "Probo customer social-proof provenance");
forbidText(logos, "Morphik", "Probo customer social-proof provenance");

forbidText(home, "Organizații din biblioteca de referință a platformei", "homepage inherited customer-logo workaround");
requireText(
  home,
  "Conformitate, securitate și infrastructură într-un singur program",
  "homepage capability marquee context",
);

requireText(love, 'post.id.startsWith("zebrabyte-")', "customer wall ZebraByte-only source filter");
forbidText(love, 'import Logos from "../components/block/Logos.astro"', "customer wall inherited company marquee");
forbidText(love, "wider platform reference library", "customer wall inherited social-proof workaround");

if (failures.length) {
  console.error(`[provenance] ${failures.length} provenance/baseline violation(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("[provenance] ZebraByte design/content provenance contract OK");
