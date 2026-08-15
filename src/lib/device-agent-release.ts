export type AgentOs = "macos" | "linux" | "windows" | "freebsd" | "unknown";
export type AgentArch = "x86_64" | "arm64" | "unknown";

export type DetectedPlatform = {
  os: AgentOs;
  arch: AgentArch;
};

export type ReleaseAsset = {
  id: string;
  os: Exclude<AgentOs, "unknown">;
  arch: "x86_64" | "arm64" | "universal";
  format: "pkg" | "tar.gz" | "zip";
  size: number;
  url: string;
};

export type DeviceAgentRelease = {
  version: string;
  assets: ReleaseAsset[];
};

type NavigatorUAData = {
  platform: string;
  getHighEntropyValues: (
    hints: string[],
  ) => Promise<{ architecture?: string; bitness?: string }>;
};

export function listBinaryAssets(release: DeviceAgentRelease): ReleaseAsset[] {
  return release.assets;
}

export async function fetchLatestDeviceAgentRelease(): Promise<DeviceAgentRelease> {
  const response = await fetch("/api/device-agent/latest", {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Release request failed (${response.status})`);
  }

  return (await response.json()) as DeviceAgentRelease;
}

function normalizeArch(
  value: string | undefined,
  bitness?: string,
): AgentArch {
  if (!value) return "unknown";
  const normalized = value.toLowerCase();
  if (normalized === "x86") return bitness === "64" ? "x86_64" : "unknown";
  if (normalized === "arm") return bitness === "64" ? "arm64" : "unknown";
  if (normalized.includes("arm64") || normalized.includes("aarch64")) return "arm64";
  if (
    normalized.includes("x86_64") ||
    normalized.includes("amd64") ||
    normalized.includes("x64") ||
    normalized.includes("win64") ||
    normalized.includes("wow64") ||
    normalized.includes("intel")
  ) {
    return "x86_64";
  }
  return "unknown";
}

function detectOsFromString(value: string): AgentOs {
  const normalized = value.toLowerCase();
  if (normalized.includes("mac") || normalized.includes("darwin")) return "macos";
  if (normalized.includes("win")) return "windows";
  if (normalized.includes("freebsd")) return "freebsd";
  if (normalized.includes("linux") || normalized.includes("cros")) return "linux";
  return "unknown";
}

export async function detectPlatform(): Promise<DetectedPlatform> {
  if (typeof navigator === "undefined") {
    return { os: "unknown", arch: "unknown" };
  }

  const uaData = (navigator as Navigator & { userAgentData?: NavigatorUAData })
    .userAgentData;

  let hintsArch: AgentArch = "unknown";
  if (uaData) {
    try {
      const { architecture, bitness } = await uaData.getHighEntropyValues([
        "architecture",
        "bitness",
      ]);
      hintsArch = normalizeArch(architecture, bitness);
    } catch {
      // Fall through to standard UA parsing.
    }
  }

  const os = detectOsFromString(
    uaData?.platform || navigator.platform || navigator.userAgent,
  );
  let arch =
    [
      hintsArch,
      normalizeArch(navigator.userAgent),
      normalizeArch(navigator.platform),
    ].find((value) => value !== "unknown") ?? "unknown";

  if (os === "windows" && arch === "unknown") arch = "x86_64";

  return { os, arch };
}

export function resolvePrimaryAsset(
  release: DeviceAgentRelease,
  platform: DetectedPlatform,
): ReleaseAsset | null {
  if (platform.os === "unknown") return null;

  if (platform.os === "macos") {
    return (
      release.assets.find(
        (asset) => asset.os === "macos" && asset.format === "pkg",
      ) ?? null
    );
  }

  if (platform.arch === "unknown") return null;
  return (
    release.assets.find(
      (asset) => asset.os === platform.os && asset.arch === platform.arch,
    ) ?? null
  );
}

export function platformLabel(platform: DetectedPlatform): string {
  const osLabels: Record<AgentOs, string> = {
    macos: "macOS",
    linux: "Linux",
    windows: "Windows",
    freebsd: "FreeBSD",
    unknown: "your platform",
  };

  if (platform.os === "macos" || platform.arch === "unknown") {
    return osLabels[platform.os];
  }
  return `${osLabels[platform.os]} (${platform.arch})`;
}

export function describeAsset(asset: ReleaseAsset): string {
  const osLabels: Record<ReleaseAsset["os"], string> = {
    macos: "macOS",
    linux: "Linux",
    windows: "Windows",
    freebsd: "FreeBSD",
  };
  const arch = asset.arch === "universal" ? "universal" : asset.arch;
  return `${osLabels[asset.os]} (${asset.format}, ${arch})`;
}
