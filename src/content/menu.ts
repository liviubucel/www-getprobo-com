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
    label: "Produse & servicii",
    items: [
      {
        label: "Serviciu Compliance Officer",
        description: "Conformitate gestionată cap-coadă de specialiști",
        href: "/",
        icon: "handshake",
      },
      {
        label: "Compliance Portal",
        description: "Distribuie în siguranță documente și dovezi de conformitate",
        href: "/compliance-portal",
        icon: "shield-check",
      },
      {
        label: "Platformă open-source",
        description: "Rulează platforma de compliance în propria infrastructură",
        href: "/docs/deployment/self-hosting/docker-compose",
        icon: "code",
      },
      {
        label: "Cyber Security",
        description: "Assessment, website/email security, hardening și incident response",
        href: "/cyber-security",
        icon: "shield-check",
      },
      {
        label: "Secure Managed Hosting",
        description: "Hosting administrat pentru proiecte care cer securitate reală",
        href: "/secure-hosting",
        icon: "code",
      },
      {
        label: "Accesibilitate digitală",
        description: "WCAG, evaluare și remediere pentru experiențe digitale incluzive",
        href: "/accessibility",
        icon: "users-three",
      },
    ],
    feature: {
      eyebrow: "În platforma ZebraByte",
      title: "Compliance Portal",
      href: "/compliance-portal",
      asset: "/navigation/browser.svg",
      alt: "Previzualizare Compliance Portal ZebraByte",
      variant: "product",
    },
  },
  {
    label: "Conformitate",
    items: [
      {
        label: "GDPR & Privacy",
        description: "Privacy governance, măsuri tehnice, evidențe și procese GDPR",
        href: "/gdpr",
        icon: "shield-check",
      },
      {
        label: "NIS2 Readiness",
        description: "Risk management, governance, incidente și evidence pentru NIS2",
        href: "/nis2",
        icon: "shield-check",
      },
      {
        label: "ISO/IEC 27001",
        description: "ISMS readiness, controale, riscuri și audit preparation",
        href: "/iso-27001",
        icon: "shield-check",
      },
      {
        label: "Compliance Portal",
        description: "Trust, documente, approvals și evidence într-un singur loc",
        href: "/compliance-portal",
        icon: "code",
      },
    ],
    feature: {
      eyebrow: "Framework-uri",
      title: "Security & compliance, gestionate continuu",
      href: "/iso-27001",
      asset: "/navigation/frameworks.svg",
      alt: "Framework-uri de securitate și conformitate",
      variant: "guide",
    },
  },
  {
    label: "Resurse",
    items: [
      {
        label: "Povești de la clienți",
        description: "ZebraByte case studies și biblioteca originală Probo",
        href: "/stories",
        icon: "quotes",
      },
      {
        label: "Blog",
        description: "Analize ZebraByte și arhiva editorială upstream Probo",
        href: "/blog",
        icon: "article",
      },
      {
        label: "Ghiduri & instrumente",
        description: "Resurse practice pentru securitate, privacy și compliance",
        href: "/hub",
        icon: "compass",
      },
      {
        label: "Ce spun clienții",
        description: "Recenzii ZebraByte și wall-ul original Probo",
        href: "/love-from-customer",
        icon: "heart",
      },
      {
        label: "Changelog",
        description: "Istoricul platformei și viitoarele îmbunătățiri ZebraByte",
        href: "/changelog",
        icon: "clock-counter-clockwise",
      },
      {
        label: "Download",
        description: "Descarcă endpoint posture agent-ul open-source",
        href: "/download",
        icon: "code",
      },
    ],
    feature: {
      eyebrow: "ZebraByte case study",
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
        label: "Despre",
        description: "ZebraByte și istoria vizuală upstream Probo",
        href: "/about",
        icon: "users-three",
      },
      {
        label: "Industries",
        description: "Security și compliance adaptate sectoarelor cu riscuri diferite",
        href: "/industries",
        icon: "compass",
      },
      {
        label: "Cariere",
        description: "Alătură-te echipei ZebraByte și vezi joburile upstream Probo",
        href: "/careers",
        icon: "briefcase",
      },
      {
        label: "Brand assets",
        description: "Identitatea ZebraByte și biblioteca originală Probo",
        href: "/brand",
        icon: "paint-brush",
      },
      {
        label: "Security",
        description: "Vezi postura noastră de securitate și conformitate",
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
      eyebrow: "Partnerships",
      title: "Construiește peste ZebraByte + Probo",
      href: "/partnerships",
      asset: "/navigation/frameworks.svg",
      alt: "Parteneriate ZebraByte pentru agenții și integratori",
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
        description: "Înțelege ZebraByte și conceptele de bază ale platformei",
        href: "/docs",
        icon: "book-open-text",
      },
      {
        label: "Product",
        description: "Explorează capabilitățile GRC și compliance",
        href: "/docs/product",
        icon: "shield-check",
      },
      {
        label: "Developers",
        description: "GraphQL, CLI, MCP, n8n, webhooks și integrări",
        href: "/docs/developers",
        icon: "code",
      },
      {
        label: "Deployment",
        description: "Cloud, self-hosting și configurarea platformei",
        href: "/docs/deployment",
        icon: "compass",
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
    label: "GitHub",
    description: "Sursa website-ului ZebraByte și upstream-ul open-source",
    href: "https://github.com/liviubucel/www-getprobo-com",
    icon: "github-logo",
  },
  {
    label: "Portal clienți",
    description: "Accesează contul și serviciile ZebraByte",
    href: "https://portal.zebrabyte.ro",
    icon: "shield-check",
  },
];
