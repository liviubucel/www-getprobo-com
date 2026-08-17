import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

// Only public, vendor-controlled sources belong here. ZebraByte-owned/private
// partner evidence (for example the Telekom certificate) is committed directly
// to the repository so a third-party/private raw URL can never break a build.
const assets = [
  {
    label: "20i logo",
    url: "https://www.20i.com/blog/wp-content/uploads/2021/03/20i_logo.svg",
    output: "public/logos/partners/20i.svg",
    accept: "image/svg+xml,image/*;q=0.9,*/*;q=0.1",
    minBytes: 500,
    allowedTypes: ["image/svg+xml", "text/xml", "application/xml", "text/plain", "application/octet-stream"],
  },
  {
    label: "Xcitium logo",
    url: "https://www.xcitium.com/assets/images/logo/logo-xcitium.svg",
    output: "public/logos/partners/xcitium.svg",
    accept: "image/svg+xml,image/*;q=0.9,*/*;q=0.1",
    minBytes: 500,
    allowedTypes: ["image/svg+xml", "text/xml", "application/xml", "text/plain", "application/octet-stream"],
  },
  {
    label: "ISO 9001 trust mark",
    url: "https://www.20i.com/blog/wp-content/uploads/2025/05/ISO-9001.svg",
    output: "public/logos/compliance/iso-9001.svg",
    accept: "image/svg+xml,image/*;q=0.9,*/*;q=0.1",
    minBytes: 300,
    allowedTypes: ["image/svg+xml", "text/xml", "application/xml", "text/plain", "application/octet-stream"],
  },
  {
    label: "ISO 22301 trust mark",
    url: "https://www.20i.com/blog/wp-content/uploads/2025/05/ISO-22301.svg",
    output: "public/logos/compliance/iso-22301.svg",
    accept: "image/svg+xml,image/*;q=0.9,*/*;q=0.1",
    minBytes: 300,
    allowedTypes: ["image/svg+xml", "text/xml", "application/xml", "text/plain", "application/octet-stream"],
  },
  {
    label: "ISO/IEC 27001 trust mark",
    url: "https://www.20i.com/blog/wp-content/uploads/2025/05/ISO-27001.svg",
    output: "public/logos/compliance/iso-27001.svg",
    accept: "image/svg+xml,image/*;q=0.9,*/*;q=0.1",
    minBytes: 300,
    allowedTypes: ["image/svg+xml", "text/xml", "application/xml", "text/plain", "application/octet-stream"],
  },
  {
    label: "Cyber Essentials Plus trust mark",
    url: "https://www.20i.com/blog/wp-content/smush-webp/2025/05/cyberEssentials_PLUS-300x142.png.webp",
    output: "public/logos/compliance/cyber-essentials-plus.webp",
    accept: "image/webp,image/*;q=0.9,*/*;q=0.1",
    minBytes: 500,
    allowedTypes: ["image/webp", "application/octet-stream"],
  },
  {
    label: "ISAE 3000 SOC 2 Type 2 trust mark",
    url: "https://www.20i.com/blog/wp-content/smush-webp/2025/05/soc2-logo-300x300.png.webp",
    output: "public/logos/compliance/soc2-type2.webp",
    accept: "image/webp,image/*;q=0.9,*/*;q=0.1",
    minBytes: 500,
    allowedTypes: ["image/webp", "application/octet-stream"],
  },
];

async function downloadAsset(asset) {
  const response = await fetch(asset.url, {
    redirect: "follow",
    headers: {
      Accept: asset.accept,
      "User-Agent": "ZebraByte-Website-Build/1.0 (+https://www.zebrabyte.ro/security)",
    },
  });

  if (!response.ok) {
    throw new Error(`${asset.label}: upstream returned HTTP ${response.status}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  const contentType = (response.headers.get("content-type") || "")
    .split(";", 1)[0]
    .trim()
    .toLowerCase();

  if (bytes.byteLength < asset.minBytes) {
    throw new Error(`${asset.label}: upstream payload is unexpectedly small (${bytes.byteLength} bytes)`);
  }

  if (contentType && !asset.allowedTypes.includes(contentType)) {
    throw new Error(`${asset.label}: unexpected content type ${JSON.stringify(contentType)}`);
  }

  if (asset.output.endsWith(".svg")) {
    const preview = bytes.subarray(0, Math.min(bytes.length, 4_096)).toString("utf8").toLowerCase();
    if (!preview.includes("<svg")) {
      throw new Error(`${asset.label}: response is not valid SVG markup`);
    }
  }

  const absolute = path.join(root, asset.output);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, bytes);
  console.log(`[security-assets] synced ${asset.label} -> ${asset.output} (${bytes.byteLength} bytes)`);
}

for (const asset of assets) {
  await downloadAsset(asset);
}
