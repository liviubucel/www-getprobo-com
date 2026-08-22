import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const read = (file) => readFile(path.join(root, file), "utf8");
const failures = [];

const [wrangler, staticHeaders, workerHeaders, workerMain] = await Promise.all([
  read("wrangler.jsonc"),
  read("public/_headers"),
  read("worker/security-headers.ts"),
  read("worker/main.ts"),
]);

if (!/"run_worker_first"\s*:\s*true/.test(wrangler)) {
  failures.push("Expected assets.run_worker_first=true; review this guard if routing changes.");
}

const requiredHeaders = [
  ["Content-Security-Policy", "default-src 'self'"],
  ["X-Frame-Options", "DENY"],
  ["X-Content-Type-Options", "nosniff"],
  ["Referrer-Policy", "strict-origin-when-cross-origin"],
  ["Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()"],
  ["Strict-Transport-Security", "max-age=31536000; includeSubDomains"],
];

for (const [name, marker] of requiredHeaders) {
  if (!staticHeaders.includes(name) || !staticHeaders.includes(marker)) {
    failures.push(`public/_headers is missing ${name}.`);
  }
  if (!workerHeaders.includes(name) || !workerHeaders.includes(marker)) {
    failures.push(`worker/security-headers.ts is missing ${name}.`);
  }
}

if (!workerMain.includes('import { withWorkerSecurityHeaders } from "./security-headers"')) {
  failures.push("worker/main.ts does not import the Worker security-header finalizer.");
}
if (!workerMain.includes("const securedResponse = withWorkerSecurityHeaders(response);")) {
  failures.push("Worker responses are not passed through withWorkerSecurityHeaders().");
}

const fetchStart = workerMain.indexOf("  async fetch(");
const queueStart = workerMain.indexOf("  async queue(");
if (fetchStart === -1 || queueStart === -1 || queueStart <= fetchStart) {
  failures.push("Unable to locate Worker fetch handler for response-finalization audit.");
} else {
  const fetchBlock = workerMain.slice(fetchStart, queueStart);
  const returnLines = fetchBlock
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("return "));
  const unfinalized = returnLines.filter(
    (line) => !line.includes("finalizeHttpResponse(request,"),
  );
  if (unfinalized.length) {
    failures.push(`Unfinalized Worker fetch return(s): ${unfinalized.join(" | ")}`);
  }
}

if (failures.length) {
  console.error("[worker-security-headers] Security header contract failed:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log("[worker-security-headers] Worker/static security-header contract verified.");
