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
        href: "/products/compliance-portal",
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
        description: "Evaluare, hardening, monitorizare și răspuns la incidente",
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
      href: "/products/compliance-portal",
      asset: "/navigation/browser.svg",
      alt: "Previzualizare Compliance Portal ZebraByte",
      variant: "product",
    },
  },
  {
    label: "Resurse",
    items: [
      {
        label: "Povești de la clienți",
        description: "Cum lucrează echipele cu ZebraByte pentru securitate și conformitate",
        href: "/stories",
        icon: "quotes",
      },
      {
        label: "Blog",
        description: "Analize și ghiduri de la echipa ZebraByte",
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
        description: "Experiențe reale ale organizațiilor care lucrează cu ZebraByte",
        href: "/love-from-customer",
        icon: "heart",
      },
      {
        label: "Changelog",
        description: "Cele mai recente îmbunătățiri ale platformei și serviciilor",
        href: "/changelog",
        icon: "clock-counter-clockwise",
      },
      {
        label: "Download",
        description: "Descarcă ZebraByte Agent",
        href: "/download",
        icon: "code",
      },
    ],
    feature: {
      eyebrow: "Customer stories",
      title: "Cum construiești un program ISO 27001 care funcționează în practică",
      href: "/stories/ahrefs-iso",
      asset: "/navigation/ahrefs.webp",
      alt: "Echipă colaborând într-un program de conformitate",
      variant: "story",
    },
  },
  {
    label: "Companie",
    items: [
      {
        label: "Despre",
        description: "Echipa și viziunea din spatele ZebraByte",
        href: "/about",
        icon: "users-three",
      },
      {
        label: "Cariere",
        description: "Alătură-te echipei ZebraByte",
        href: "/careers",
        icon: "briefcase",
      },
      {
        label: "Brand assets",
        description: "Logo-uri și resurse vizuale oficiale ZebraByte",
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
      eyebrow: "Ghid complet",
      title: "Ce este SOC 2?",
      href: "/hub/soc2",
      asset: "/navigation/frameworks.svg",
      alt: "Framework-uri ISO 27001, SOC 2 și privacy",
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
    description: "Explorează platforma open-source ZebraByte",
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
