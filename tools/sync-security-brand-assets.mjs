import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

// Security/partner artwork is vendored in the repository on purpose.
// Production builds must be deterministic and must never depend on vendor
// websites being reachable (or allowing Cloudflare/GitHub CI egress).
const assets = [
  {
    label: "20i logo",
    input: "public/logos/partners/20i.svg",
    kind: "svg",
    minBytes: 500,
  },
  {
    label: "Xcitium logo",
    input: "public/logos/partners/xcitium.svg",
    kind: "svg",
    minBytes: 500,
  },
  {
    label: "ISO 9001 trust mark",
    input: "public/logos/compliance/iso-9001.svg",
    kind: "svg",
    minBytes: 300,
  },
  {
    label: "ISO 22301 trust mark",
    input: "public/logos/compliance/iso-22301.svg",
    kind: "svg",
    minBytes: 300,
  },
  {
    label: "ISO/IEC 27001 trust mark",
    input: "public/logos/compliance/iso-27001.svg",
    kind: "svg",
    minBytes: 300,
  },
  {
    label: "Cyber Essentials Plus trust mark",
    input: "public/logos/compliance/cyber-essentials-plus.webp",
    kind: "webp",
    minBytes: 500,
  },
  {
    label: "ISAE 3000 SOC 2 Type 2 trust mark",
    input: "public/logos/compliance/soc2-type2.webp",
    kind: "webp",
    minBytes: 500,
  },
];

function assertSvg(asset, bytes) {
  const preview = bytes.subarray(0, Math.min(bytes.length, 8_192)).toString("utf8").toLowerCase();
  if (!preview.includes("<svg")) {
    throw new Error(`${asset.label}: vendored file is not valid SVG markup`);
  }
}

function assertWebp(asset, bytes) {
  if (bytes.length < 12) {
    throw new Error(`${asset.label}: vendored WebP is truncated`);
  }

  const riff = bytes.subarray(0, 4).toString("ascii");
  const webp = bytes.subarray(8, 12).toString("ascii");
  if (riff !== "RIFF" || webp !== "WEBP") {
    throw new Error(`${asset.label}: vendored file does not have a valid WebP header`);
  }
}

for (const asset of assets) {
  const absolute = path.join(root, asset.input);
  let bytes;

  try {
    bytes = await readFile(absolute);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`${asset.label}: required vendored asset is missing (${detail})`);
  }

  if (bytes.byteLength < asset.minBytes) {
    throw new Error(`${asset.label}: vendored asset is unexpectedly small (${bytes.byteLength} bytes)`);
  }

  if (asset.kind === "svg") {
    assertSvg(asset, bytes);
  } else if (asset.kind === "webp") {
    assertWebp(asset, bytes);
  }

  console.log(`[security-assets] verified ${asset.label} -> ${asset.input} (${bytes.byteLength} bytes)`);
}
