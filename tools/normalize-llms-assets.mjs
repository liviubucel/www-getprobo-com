import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const dist = path.join(process.cwd(), "dist");
const files = ["llms-docs.txt", "llms-full.txt"];

const replacements = [
  [/https:\/\/www\.probo\.com/g, "https://www.zebrabyte.ro"],
  [/https:\/\/probo\.com/g, "https://www.zebrabyte.ro"],
  [/https:\/\/compliance\.probo\.com/g, "https://trust.zebrabyte.ro"],
  [/https:\/\/status\.probo\.com/g, "https://status.zebrabyte.ro"],
  [/^# Probo Documentation$/gm, "# ZebraByte Documentation"],
  [
    /^> Documentation for Probo, the open-source compliance management platform\.$/gm,
    "> ZebraByte documentation for managed compliance, cyber security and security-first managed infrastructure.",
  ],
  // The public documentation must not expose upstream package/repository branding.
  // Keep the CLI name (`prb`) but direct readers to the ZebraByte deployment package.
  [/brew install getprobo\/tap\/prb/gi, "# Install prb from the ZebraByte deployment package"],
  [/go install github\.com\/getprobo\/probo\/cmd\/prb@latest/gi, "# Install prb from the ZebraByte deployment package"],
  [/github\.com\/getprobo\/probo(?:\/[^\s)`]*)?/gi, "www.zebrabyte.ro/docs"],
  [/\bPROBO_([A-Z0-9_]+)/g, "ZEBRABYTE_$1"],
  [/\bProbo CLI\b/gi, "ZebraByte CLI"],
  [/\bProbo Compliance Portal\b/gi, "ZebraByte Compliance Portal"],
  [/\bProbo Cloud\b/gi, "ZebraByte Cloud"],
  [/\bProbo Agent\b/gi, "ZebraByte Device Agent"],
  [/\bProbo\b/gi, "ZebraByte"],
  [/\bgetprobo\b/gi, "ZebraByte"],
];

let changed = 0;
for (const name of files) {
  const file = path.join(dist, name);
  let source;
  try {
    source = await readFile(file, "utf8");
  } catch (error) {
    throw new Error(`Missing generated LLM asset ${name}: ${error instanceof Error ? error.message : String(error)}`);
  }

  let next = source;
  for (const [pattern, replacement] of replacements) {
    next = next.replace(pattern, replacement);
  }

  if (/\b(?:Probo|GetProbo)\b/i.test(next)) {
    throw new Error(`${name} still contains legacy upstream branding after normalization.`);
  }
  if (/https?:\/\/(?:www\.)?probo\.com/i.test(next)) {
    throw new Error(`${name} still contains public probo.com URLs after normalization.`);
  }
  if (/github\.com\/getprobo\/probo/i.test(next)) {
    throw new Error(`${name} still contains the upstream GitHub repository after normalization.`);
  }

  if (next !== source) {
    await writeFile(file, next, "utf8");
    changed += 1;
  }
}

console.log(`[i18n] normalized ${changed}/${files.length} generated LLM asset(s) for ZebraByte.`);
