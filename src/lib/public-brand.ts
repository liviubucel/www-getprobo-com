export function publicBrandText(value: string | undefined | null): string {
  if (!value) return "";

  return value
    .replace(/https?:\/\/status\.probo\.com/gi, "https://status.zebrabyte.ro")
    .replace(/https?:\/\/probostatus\.com/gi, "https://status.zebrabyte.ro")
    .replace(/https?:\/\/compliance\.probo\.com/gi, "https://trust.zebrabyte.ro")
    .replace(/https?:\/\/(?:[a-z0-9-]+\.)?getprobo\.com/gi, "https://www.zebrabyte.ro")
    .replace(/https?:\/\/(?:[a-z0-9-]+\.)?probo\.com/gi, "https://www.zebrabyte.ro")
    .replace(/brew install getprobo\/tap\/prb/gi, "# Install prb from the ZebraByte deployment package")
    .replace(/go install github\.com\/getprobo\/probo\/cmd\/prb@latest/gi, "# Install prb from the ZebraByte deployment package")
    .replace(/\bPROBO_([A-Z0-9_]+)/g, "ZEBRABYTE_$1")
    .replace(/\bprobo-agent\b/gi, "zebrabyte-device-agent")
    .replace(/\bProbo Agent\b/gi, "ZebraByte Device Agent")
    .replace(/\/docs\/product\/probo-agent\b/gi, "/docs/product/device-agent")
    .replace(/\bThe latest news from Probo\b/gi, "The latest news from ZebraByte")
    .replace(/\bfrom the Probo team\b/gi, "from the ZebraByte team")
    .replace(/\bNew updates and improvements to Probo\b/gi, "New updates and improvements to ZebraByte")
    .replace(/\bLatest product updates and new features from Probo\b/gi, "Latest product updates and new features from ZebraByte")
    .replace(/\bInspiring stories, real Probo customers\b/gi, "Inspiring stories from the platform reference library")
    .replace(
      /\bReal Probo customers share how they got SOC 2 and ISO 27001 certified faster, without hiring a dedicated compliance team\.?/gi,
      "Case studies from the platform reference library explore SOC 2, ISO 27001 and practical compliance programs.",
    )
    .replace(
      /Compare the top 5 compliance automation tools for 2026\. Discover why open[- ]source Probo ranks #1 and how its(?: hands-on)? service eliminates the DIY compliance burden\.?/gi,
      "Compare leading compliance automation approaches for 2026, including software-led tools and managed compliance services.",
    )
    .replace(
      /it's why we're ranking Probo as the #1 compliance automation tool this year\./gi,
      "it's why managed compliance deserves to be evaluated alongside software-only automation tools.",
    )
    .replace(/#1 Probo — Open Source with Full Hands-On Service/gi, "ZebraByte — Managed Compliance with Full Hands-On Service")
    .replace(/#1 Probo\b/gi, "ZebraByte managed compliance")
    .replace(/The Probo Difference: You Don't Even Need to Use the Tool/gi, "The Managed Compliance Difference: You Don't Need to Run the Tool Alone")
    .replace(/Minimal \(2-3 hrs\/month\)/gi, "Low (scope-dependent)")
    .replace(
      /Honest comparison of 7 Vanta alternatives for compliance automation\. Probo is the only open-source,?\s*(?:free-tier )?option with a dedicated compliance officer included\.?/gi,
      "Honest comparison of 7 Vanta alternatives covering software-led and managed-compliance operating models.",
    )
    .replace(/7 Platforms Compared Honestly \(Including a Free One\)/gi, "7 Platforms Compared Honestly")
    .replace(/Vanta Alternatives in 2026: 7 Platforms Compared Honestly \(Including a Free One\)/gi, "Vanta Alternatives in 2026: 7 Platforms Compared Honestly")
    .replace(/\bSOC 2 Type 1 vs Type 2: Which Certification Do You Need\?/gi, "SOC 2 Type 1 vs Type 2: Which Report Do You Need?")
    .replace(/\bachieving SOC 2 certification\b/gi, "SOC 2 readiness and reporting")
    .replace(/\bSOC 2 certification\b/gi, "SOC 2 report")
    .replace(/\bSOC 2 certificate\b/gi, "SOC 2 report")
    .replace(/\bProbo CLI\b/gi, "ZebraByte CLI")
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
    .replace(/\bProbo\b/gi, "the platform")
    .replace(/\bgetprobo\b/gi, "ZebraByte")
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
    .replace(/\bthe platform went through YC(?: in Spring 25)?\b/gi, "the platform serves fast-moving technology teams")
    .replace(/\bthe platform is YC-backed\b/gi, "the platform")
    .replace(/\bYC company\b/gi, "technology company")
    .replace(/\bYC startup\b/gi, "early-stage technology company");
}

export function publicBrandUrl(value: string | undefined | null): string {
  if (!value) return "";

  return value
    .replace(/https?:\/\/status\.probo\.com/gi, "https://status.zebrabyte.ro")
    .replace(/https?:\/\/probostatus\.com/gi, "https://status.zebrabyte.ro")
    .replace(/https?:\/\/compliance\.probo\.com/gi, "https://trust.zebrabyte.ro")
    .replace(/https?:\/\/(?:[a-z0-9-]+\.)?getprobo\.com/gi, "https://www.zebrabyte.ro")
    .replace(/https?:\/\/(?:[a-z0-9-]+\.)?probo\.com/gi, "https://www.zebrabyte.ro")
    .replace(/https?:\/\/github\.com\/getprobo\/probo(?:\/[^\s"']*)?/gi, "/docs")
    .replace(/https?:\/\/discord\.gg\/8qfdJYfvpY/gi, "/contact")
    .replace(/\/probo-newsletter\b/g, "/newsletter")
    .replace(/\/hub\/probo-vs-vanta\b/g, "/hub/zebrabyte-vs-vanta")
    .replace(/\/hub\/probo-vs-fractional-ciso\b/g, "/hub/zebrabyte-vs-fractional-ciso")
    .replace(/\/docs\/product\/probo-agent\b/g, "/docs/product/device-agent")
    .replace(/\/probo-logo-only\.svg\b/g, "/favicon.svg")
    .replace(/\/probo-logo(?:-light)?\.svg\b/g, "/images/zbt-negru.svg");
}
