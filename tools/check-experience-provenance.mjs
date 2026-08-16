import { readFile } from "node:fs/promises";

const failures = [];
const read = (path) => readFile(path, "utf8");

function requireText(content, needle, label) {
  if (!content.includes(needle)) failures.push(`${label}: missing ${JSON.stringify(needle)}`);
}

function forbidText(content, needle, label) {
  if (content.includes(needle)) failures.push(`${label}: forbidden ${JSON.stringify(needle)}`);
}

const [
  about,
  team,
  logos,
  home,
  love,
  contact,
  industryPage,
  industryService,
  legacyPage,
  baseline,
] = await Promise.all([
  read("src/pages/about.astro"),
  read("src/components/block/Team.astro"),
  read("src/components/block/Logos.astro"),
  read("src/pages/index.astro"),
  read("src/pages/love-from-customer.astro"),
  read("src/pages/contact.astro"),
  read("src/components/ZebraByteIndustryPage.astro"),
  read("src/components/ZebraByteIndustryServicePage.astro"),
  read("src/components/ZebraByteLegacyPage.astro"),
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
requireText(
  baseline,
  "Generated ZebraByte landing pages",
  "generated landing-page visual contract",
);
requireText(
  baseline,
  "Avoid turning every paragraph, outcome, contact method or related link into its own floating",
  "repeated card-chrome rule",
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

requireText(contact, 'class="divide-y border-y"', "contact editorial rail");
requireText(contact, 'id="contact-form"', "contact first-party form");
requireText(contact, "data-turnstile-container", "contact Turnstile verification");
forbidText(contact, '<div class="rounded-xl border p-6">', "contact repeated floating cards");

requireText(industryPage, 'class="divide-y border-y"', "industry editorial list rhythm");
requireText(industryPage, "grid gap-px overflow-hidden rounded-2xl border bg-border", "industry framed peer grid");
forbidText(industryPage, 'class="rounded-xl border p-5 sm:p-6"', "industry outcome card repetition");

requireText(industryService, "grid gap-px overflow-hidden rounded-2xl border bg-border", "industry service framed peer grids");
forbidText(industryService, 'class="bg-level-0 rounded-xl border p-6"', "industry service risk card repetition");
forbidText(industryService, 'class="group rounded-xl border p-6 transition-colors hover:bg-subtle"', "industry service sibling card repetition");

requireText(legacyPage, "grid gap-px overflow-hidden rounded-2xl border bg-border", "legacy page framed peer grid");
requireText(legacyPage, 'class="mt-6 border-y py-4 text-sm leading-relaxed sm:py-5"', "legacy note editorial treatment");
forbidText(legacyPage, 'class="group rounded-xl border p-6 transition-colors hover:bg-subtle"', "legacy related card repetition");
forbidText(legacyPage, "mt-5 rounded-xl border bg-active p-5", "legacy note floating-card treatment");

if (failures.length) {
  console.error(`[provenance] ${failures.length} provenance/baseline violation(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("[provenance] ZebraByte design/content provenance contract OK");
