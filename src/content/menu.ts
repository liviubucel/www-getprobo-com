export type MenuIconName =
  | "article"
  | "book-open-text"
  | "briefcase"
  | "clock-counter-clockwise"
  | "code"
  | "compass"
  | "github-logo"
  | "handshake"
  | "heart"
  | "paint-brush"
  | "quotes"
  | "shield-check"
  | "users-three";

export type MenuItem = {
  label: string;
  description: string;
  href: string;
  icon: MenuIconName;
};

export type MenuFeature = {
  eyebrow: string;
  title: string;
  href: string;
  asset: string;
  alt: string;
  variant: "product" | "story" | "guide";
};

export type MenuGroup = {
  label: string;
  href?: string;
  showLabel?: boolean;
  items: MenuItem[];
  feature: MenuFeature;
};

export const menuGroups: MenuGroup[] = [
  {
    label: "Compliance",
    items: [
      {
        label: "Managed Compliance",
        description: "Compliance gestionat end-to-end de un expert dedicat",
        href: "/managed-compliance",
        icon: "handshake",
      },
      {
        label: "Compliance Portal",
        description: "Documente, evidence și trust sharing într-un singur loc",
        href: "/compliance-portal",
        icon: "shield-check",
      },
      {
        label: "SOC 2",
        description: "Controls, evidence și audit readiness continuă",
        href: "/soc2",
        icon: "shield-check",
      },
      {
        label: "ISO/IEC 27001",
        description: "ISMS, risk treatment, controale și audit readiness",
        href: "/iso-27001",
        icon: "shield-check",
      },
      {
        label: "GDPR & Privacy",
        description: "Privacy governance, evidence și măsuri tehnice",
        href: "/gdpr",
        icon: "shield-check",
      },
      {
        label: "NIS2 Readiness",
        description: "Risk management, governance și incident readiness",
        href: "/nis2",
        icon: "shield-check",
      },
      {
        label: "Accessibility",
        description: "Instrumente gratuite WCAG integrate în compliance",
        href: "/accessibility",
        icon: "users-three",
      },
    ],
    feature: {
      eyebrow: "Managed Compliance",
      title: "Compliance, gestionat pentru tine",
      href: "/managed-compliance",
      asset: "/navigation/browser.svg",
      alt: "Platforma ZebraByte pentru compliance gestionat",
      variant: "product",
    },
  },
  {
    label: "Cyber Security",
    items: [
      {
        label: "Cyber Security",
        description: "Program complet de securitate pentru organizație",
        href: "/cyber-security",
        icon: "shield-check",
      },
      {
        label: "Security Assessment",
        description: "Expunere, configurări, vulnerabilități și plan de remediere",
        href: "/security-assessment",
        icon: "shield-check",
      },
      {
        label: "Website Security",
        description: "WAF, DDoS, malware, hardening și recovery",
        href: "/website-security",
        icon: "shield-check",
      },
      {
        label: "Email Security",
        description: "SPF, DKIM, DMARC, anti-spoofing și account hardening",
        href: "/email-security",
        icon: "shield-check",
      },
      {
        label: "Incident Response",
        description: "Triage, containment, eradication și recovery",
        href: "/incident-response",
        icon: "shield-check",
      },
      {
        label: "Secure Managed Hosting",
        description: "Hosting administrat doar în model security-first",
        href: "/secure-hosting",
        icon: "code",
      },
    ],
    feature: {
      eyebrow: "Security-first infrastructure",
      title: "Protecție tehnică legată direct de compliance",
      href: "/cyber-security",
      asset: "/navigation/frameworks.svg",
      alt: "Cyber Security ZebraByte",
      variant: "guide",
    },
  },
  {
    label: "Resurse",
    items: [
      {
        label: "Stories",
        description: "Studii de caz ZebraByte",
        href: "/stories",
        icon: "quotes",
      },
      {
        label: "Insights",
        description: "Security, privacy și compliance",
        href: "/blog",
        icon: "article",
      },
      {
        label: "Hub",
        description: "Ghiduri și resurse practice",
        href: "/hub",
        icon: "compass",
      },
      {
        label: "Free Tools",
        description: "Instrumente gratuite pentru security și compliance",
        href: "/tools",
        icon: "shield-check",
      },
      {
        label: "Recenzii",
        description: "Feedback de la clienții ZebraByte",
        href: "/love-from-customer",
        icon: "heart",
      },
    ],
    feature: {
      eyebrow: "Security case study",
      title: "De la website compromis la infrastructură securizată",
      href: "/stories/zebrabyte-malware-recovery",
      asset: "/navigation/browser.svg",
      alt: "Studiu de caz ZebraByte privind recuperarea și securizarea unui website",
      variant: "story",
    },
  },
  {
    label: "Companie",
    items: [
      {
        label: "Despre ZebraByte",
        description: "Misiune, poziționare și modul în care lucrăm",
        href: "/about",
        icon: "users-three",
      },
      {
        label: "De ce ZebraByte",
        description: "Security-first, privacy și ownership clar",
        href: "/decezebrabyte",
        icon: "shield-check",
      },
      {
        label: "Industries",
        description: "Security și compliance adaptate riscului sectorial",
        href: "/industries",
        icon: "compass",
      },
      {
        label: "Partnerships",
        description: "Parteneriate pentru security și compliance",
        href: "/partnerships",
        icon: "handshake",
      },
      {
        label: "Security",
        description: "Postura noastră de securitate și conformitate",
        href: "https://trust.zebrabyte.ro",
        icon: "shield-check",
      },
      {
        label: "Contact",
        description: "Discută cu echipa ZebraByte",
        href: "/contact",
        icon: "handshake",
      },
    ],
    feature: {
      eyebrow: "ZebraByte",
      title: "Cyber security + compliance, într-un singur program",
      href: "/decezebrabyte",
      asset: "/navigation/frameworks.svg",
      alt: "ZebraByte security and compliance",
      variant: "guide",
    },
  },
  {
    label: "Docs",
    href: "/docs",
    showLabel: false,
    items: [
      {
        label: "Overview",
        description: "Concepte și capabilități ale platformei",
        href: "/docs",
        icon: "book-open-text",
      },
      {
        label: "Product",
        description: "Controale, evidence și funcțiile de compliance",
        href: "/docs/product",
        icon: "shield-check",
      },
      {
        label: "Developers",
        description: "API, automatizări și integrări",
        href: "/docs/developers",
        icon: "code",
      },
    ],
    feature: {
      eyebrow: "Documentație",
      title: "Înțelege și operează platforma ZebraByte",
      href: "/docs",
      asset: "/navigation/browser.svg",
      alt: "Previzualizare documentație ZebraByte",
      variant: "product",
    },
  },
];

export const directMenuItems: MenuItem[] = [
  {
    label: "Portal clienți",
    description: "Accesează contul și serviciile ZebraByte",
    href: "https://portal.zebrabyte.ro",
    icon: "shield-check",
  },
];
