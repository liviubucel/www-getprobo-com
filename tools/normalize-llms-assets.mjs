import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const dist = path.join(process.cwd(), "dist");
const files = ["llms-docs.txt", "llms-full.txt"];

const replacements = [
  [/https:\/\/www\.probo\.com/g, "https://www.zebrabyte.ro"],
  [/https:\/\/probo\.com/g, "https://www.zebrabyte.ro"],
  [/^# Probo Documentation$/gm, "# ZebraByte Documentation"],
  [
    /^> Documentation for Probo, the open-source compliance management platform\.$/gm,
    "> ZebraByte documentation for managed compliance, cyber security and security-first managed infrastructure.",
  ],
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

  if (/https?:\/\/(?:www\.)?probo\.com/i.test(next)) {
    throw new Error(`${name} still contains public probo.com URLs after normalization.`);
  }
  if (/^# Probo Documentation$/m.test(next)) {
    throw new Error(`${name} still contains the legacy Probo documentation title.`);
  }

  if (next !== source) {
    await writeFile(file, next, "utf8");
    changed += 1;
  }
}

console.log(`[i18n] normalized ${changed}/${files.length} generated LLM asset(s) for ZebraByte.`);
