import {cmsLink, localizedString, localizedText} from "./helpers.mjs";

export const siteSettingsDocument = {
  _id: "siteSettings",
  _type: "siteSettings",
  siteName: "ZebraByte",
  tagline: localizedString("Cybersecurity & Compliance", "Cybersecurity & Compliance"),
  defaultSeo: {
    _type: "seo",
    title: localizedString(
      "ZebraByte | Conformitate administrată & securitate cibernetică",
      "ZebraByte | Managed compliance & cybersecurity",
    ),
    description: localizedText(
      "Conformitate administrată, securitate cibernetică și găzduire securizată într-un singur program ZebraByte.",
      "Managed compliance, cybersecurity and secure managed hosting in one ZebraByte programme.",
    ),
    noIndex: false,
    structuredDataType: "WebPage",
  },
  primaryEmail: "contact@zebrabyte.ro",
  securityEmail: "contact@zebrabyte.ro",
  statusUrl: "https://status.zebrabyte.ro",
  trustCenterUrl: "https://trust.zebrabyte.ro",
  socialLinks: [],
  headerPrimaryCta: cmsLink({
    labelRo: "Discută cu un expert",
    labelEn: "Talk to an expert",
    href: "/contact",
    style: "primary",
  }),
  mobileSecondaryCta: cmsLink({
    labelRo: "Vezi Platforma GRC",
    labelEn: "See the GRC Platform",
    href: "/compliance-platform",
    style: "secondary",
  }),
  footerCopyright: localizedString(
    "Copyright © 2023-2026 ZEBRABYTE LIMITED. Toate drepturile rezervate.",
    "Copyright © 2023-2026 ZEBRABYTE LIMITED. All rights reserved.",
  ),
  footerLegalLine: localizedString(
    "Nr. companie 15194067 · ICO ZB748706",
    "Company no. 15194067 · ICO ZB748706",
  ),
  announcement: {
    enabled: false,
    tone: "info",
  },
};
