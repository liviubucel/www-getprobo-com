export function publicBrandText(value: string | undefined | null): string {
  if (!value) return "";

  return value
    .replace(/https?:\/\/(?:www\.)?getprobo\.com/gi, "https://www.zebrabyte.ro")
    .replace(/https?:\/\/(?:www\.)?probo\.com/gi, "https://www.zebrabyte.ro")
    .replace(/https?:\/\/compliance\.probo\.com/gi, "https://trust.zebrabyte.ro")
    .replace(/\bProbo Agent\b/g, "ZebraByte Device Agent")
    .replace(/\bprobo-agent\b/g, "zebrabyte-device-agent")
    .replace(/\bProbo vs Vanta\b/gi, "ZebraByte vs Vanta")
    .replace(
      /\bProbo vs Hiring a Fractional CISO\b/gi,
      "ZebraByte vs Hiring a Fractional CISO",
    )
    .replace(/\bWhy Probo\b/gi, "Why ZebraByte")
    .replace(/\bProbo is an open-source compliance platform\b/gi, "ZebraByte is a compliance platform")
    .replace(/\bProbo is built on an open-source compliance platform\b/gi, "ZebraByte provides a compliance platform")
    .replace(/\bProbo's open-source compliance platform\b/gi, "the ZebraByte compliance platform")
    .replace(/\bProbo's open-source platform\b/gi, "the ZebraByte platform")
    .replace(/\bopen-source Probo\b/gi, "the platform")
    .replace(/\bProbo open-source\b/gi, "the platform")
    .replace(/\bProbo is the only open-source,?\s*/gi, "The platform is a ")
    // Unqualified historical brand mentions are neutralized instead of being
    // rewritten as ZebraByte. This avoids changing third-party quotes into
    // statements that falsely claim a ZebraByte customer relationship.
    .replace(/\bProbo\b/g, "the platform")
    .replace(/\bPROBO\b/g, "THE PLATFORM")
    .replace(/\bZebraByte is an open-source compliance platform\b/gi, "ZebraByte is a compliance platform")
    .replace(/\bZebraByte is built on an open-source compliance platform\b/gi, "ZebraByte provides a compliance platform")
    .replace(/\bZebraByte's open-source compliance platform\b/gi, "the ZebraByte compliance platform")
    .replace(/\bZebraByte's open-source platform\b/gi, "the ZebraByte platform")
    .replace(/\bZebraByte is the only open-source,?\s*/gi, "ZebraByte is a ")
    .replace(/\bopen-source ZebraByte\b/gi, "ZebraByte")
    .replace(/\bopen[ -]source compliance platform\b/gi, "compliance platform")
    .replace(/\bopen[ -]source platform\b/gi, "platform")
    .replace(/\bopen[ -]source software\b/gi, "software")
    .replace(/\bopen[ -]source project\b/gi, "platform project")
    .replace(/\bMIT-licensed compliance platform\b/gi, "compliance platform")
    .replace(/\bMIT-licensed platform\b/gi, "platform")
    .replace(/\bYC-backed ZebraByte\b/gi, "ZebraByte")
    .replace(/\bY Combinator-backed ZebraByte\b/gi, "ZebraByte")
    .replace(/\bZebraByte,? backed by Y Combinator\b/gi, "ZebraByte")
    .replace(/\bZebraByte went through YC(?: in Spring 25)?\b/gi, "ZebraByte serves fast-moving technology teams")
    .replace(/\bYC company\b/gi, "technology company")
    .replace(/\bYC startup\b/gi, "early-stage technology company");
}

export function publicBrandUrl(value: string | undefined | null): string {
  if (!value) return "";

  return value
    .replace(/https?:\/\/compliance\.probo\.com/gi, "https://trust.zebrabyte.ro")
    .replace(/https?:\/\/(?:www\.)?getprobo\.com/gi, "https://www.zebrabyte.ro")
    .replace(/https?:\/\/(?:www\.)?probo\.com/gi, "https://www.zebrabyte.ro")
    .replace(/https?:\/\/github\.com\/getprobo\/probo(?:\/[^\s]*)?/gi, "/docs")
    .replace(/https?:\/\/discord\.gg\/8qfdJYfvpY/gi, "/contact")
    .replace(/\/probo-newsletter\b/g, "/newsletter")
    .replace(/\/hub\/probo-vs-vanta\b/g, "/hub/zebrabyte-vs-vanta")
    .replace(/\/hub\/probo-vs-fractional-ciso\b/g, "/hub/zebrabyte-vs-fractional-ciso")
    .replace(/\/docs\/product\/probo-agent\b/g, "/docs/product/device-agent")
    .replace(/\/probo-logo-only\.svg\b/g, "/favicon.svg")
    .replace(/\/probo-logo(?:-light)?\.svg\b/g, "/images/zbt-negru.svg");
}
