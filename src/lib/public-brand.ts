export function publicBrandText(value: string | undefined | null): string {
  if (!value) return "";

  return value
    .replace(/https?:\/\/(?:www\.)?probo\.com/gi, "https://www.zebrabyte.ro")
    .replace(/https?:\/\/compliance\.probo\.com/gi, "https://trust.zebrabyte.ro")
    .replace(/\bProbo Agent\b/g, "ZebraByte Device Agent")
    .replace(/\bprobo-agent\b/g, "zebrabyte-device-agent")
    .replace(/\bProbo is an open-source compliance platform\b/gi, "ZebraByte is a compliance platform")
    .replace(/\bProbo is built on an open-source compliance platform\b/gi, "ZebraByte provides a compliance platform")
    .replace(/\bProbo's open-source compliance platform\b/gi, "the ZebraByte compliance platform")
    .replace(/\bProbo's open-source platform\b/gi, "the ZebraByte platform")
    .replace(/\bopen-source Probo\b/gi, "ZebraByte")
    .replace(/\bProbo open-source\b/gi, "ZebraByte")
    .replace(/\bProbo is the only open-source,?\s*/gi, "ZebraByte is a ")
    .replace(/\bProbo\b/g, "ZebraByte")
    .replace(/\bPROBO\b/g, "ZEBRABYTE")
    .replace(/\bZebraByte is an open-source compliance platform\b/gi, "ZebraByte is a compliance platform")
    .replace(/\bZebraByte is built on an open-source compliance platform\b/gi, "ZebraByte provides a compliance platform")
    .replace(/\bZebraByte's open-source compliance platform\b/gi, "the ZebraByte compliance platform")
    .replace(/\bZebraByte's open-source platform\b/gi, "the ZebraByte platform")
    .replace(/\bZebraByte is the only open-source,?\s*/gi, "ZebraByte is a ")
    .replace(/\bopen-source ZebraByte\b/gi, "ZebraByte")
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
    .replace(/https?:\/\/(?:www\.)?probo\.com/gi, "https://www.zebrabyte.ro")
    .replace(/https?:\/\/github\.com\/getprobo\/probo(?:\/[^\s]*)?/gi, "/docs")
    .replace(/https?:\/\/discord\.gg\/8qfdJYfvpY/gi, "/contact")
    .replace(/\/hub\/probo-vs-vanta\b/g, "/hub/zebrabyte-vs-vanta")
    .replace(/\/hub\/probo-vs-fractional-ciso\b/g, "/hub/zebrabyte-vs-fractional-ciso")
    .replace(/\/docs\/product\/probo-agent\b/g, "/docs/product/device-agent")
    .replace(/\/probo-logo-only\.svg\b/g, "/favicon.svg")
    .replace(/\/probo-logo(?:-light)?\.svg\b/g, "/images/zbt-negru.svg");
}
