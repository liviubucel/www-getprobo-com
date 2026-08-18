export type MenuIconName =
  | "article"
  | "book-open-text"
  | "briefcase"
  | "clock-counter-clockwise"
  | "code"
  | "compass"
  | "handshake"
  | "heart"
  | "magnifying-glass"
  | "monitor"
  | "notepad"
  | "paint-brush"
  | "quotes"
  | "shield-check"
  | "sparkle"
  | "terminal-window"
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
    label: "Conformitate",
    items: [
      {
        label: "Platforma GRC",
        description: "Controale, riscuri, dovezi și audit într-un singur workspace",
        href: "/compliance-platform",
        icon: "shield-check",
      },
      {
        label: "Managed Compliance",
        description: "Platformă și expert ZebraByte pentru operarea programului",
        href: "/managed-compliance",
        icon: "handshake",
      },
      {
        label: "Trust Center",
        description: "Portal extern pentru documente și security reviews",
        href: "/compliance-portal",
        icon: "monitor",
      },
      {
        label: "Framework-uri & reglementări",
        description: "SOC 2, ISO 27001, GDPR, NIS2 și accesibilitate",
        href: "/compliance",
        icon: "book-open-text",
      },
    ],
    feature: {
      eyebrow: "Trust Center",
      title: "Partajează assurance fără să expui workspace-ul intern",
      href: "/compliance-portal",
      asset: "/trust-center/browser.svg",
      alt: "Trust Center ZebraByte",
      variant: "product",
    },
  },
  {
    label: "Securitate",
    items: [
      {
        label: "Evaluare de securitate",
        description: "Expunere, configurări și plan de remediere",
        href: "/security-assessment",
        icon: "magnifying-glass",
      },
      {
        label: "Securitate site web",
        description: "WAF, DDoS, hardening și recovery",
        href: "/website-security",
        icon: "monitor",
      },
      {
        label: "Securitate email",
        description: "SPF, DKIM, DMARC și identity hardening",
        href: "/email-security",
        icon: "shield-check",
      },
      {
        label: "Răspuns la incidente",
        description: "Triage, containment, recovery și lessons learned",
        href: "/incident-response",
        icon: "clock-counter-clockwise",
      },
      {
        label: "Hosting securizat administrat",
        description: "Infrastructură, monitoring, backup și recovery",
        href: "/secure-hosting",
        icon: "terminal-window",
      },
    ],
    feature: {
      eyebrow: "Cyber Security",
      title: "De la finding la control operat",
      href: "/cyber-security",
      asset: "/navigation/frameworks.svg",
      alt: "Program ZebraByte de securitate cibernetică",
      variant: "guide",
    },
  },
  {
    label: "Resurse",
    items: [
      {
        label: "Hub",
        description: "Ghiduri și comparații pentru security și compliance",
        href: "/hub",
        icon: "book-open-text",
      },
      {
        label: "Blog",
        description: "Analize și actualizări din ecosistemul ZebraByte",
        href: "/blog",
        icon: "article",
      },
      {
        label: "Studii de caz",
        description: "Povești și reference cases din bibliotecă",
        href: "/stories",
        icon: "quotes",
      },
      {
        label: "Instrumente gratuite",
        description: "Scanări și utilitare pentru security și compliance",
        href: "/tools",
        icon: "compass",
      },
      {
        label: "Noutăți produs",
        description: "Funcții noi și schimbări importante ale platformei",
        href: "/changelog",
        icon: "clock-counter-clockwise",
      },
    ],
    feature: {
      eyebrow: "Hub ZebraByte",
      title: "Ghiduri, comparații și resurse practice",
      href: "/hub",
      asset: "/navigation/ahrefs.webp",
      alt: "Biblioteca ZebraByte de resurse și studii de caz",
      variant: "story",
    },
  },
  {
    label: "Companie",
    items: [
      {
        label: "Despre noi",
        description: "Misiunea și modul în care construim ZebraByte",
        href: "/about",
        icon: "users-three",
      },
      {
        label: "Industrii",
        description: "Security și compliance adaptate contextului sectorului",
        href: "/industries",
        icon: "compass",
      },
      {
        label: "Parteneriate",
        description: "Referral, co-delivery, adviser și white-label",
        href: "/partnerships",
        icon: "handshake",
      },
      {
        label: "Cariere",
        description: "Roluri și oportunități în echipa ZebraByte",
        href: "/careers",
        icon: "briefcase",
      },
      {
        label: "Securitate ZebraByte",
        description: "Postura și practicile noastre operaționale de securitate",
        href: "/security",
        icon: "shield-check",
      },
    ],
    feature: {
      eyebrow: "Despre ZebraByte",
      title: "Cybersecurity & Compliance, într-un singur program",
      href: "/about",
      asset: "/og-zebrabyte.svg",
      alt: "ZebraByte",
      variant: "story",
    },
  },
  {
    label: "Documentație",
    href: "/docs",
    showLabel: false,
    items: [
      {
        label: "Începe aici",
        description: "Concepte și capabilități ale platformei",
        href: "/docs",
        icon: "book-open-text",
      },
      {
        label: "Produs",
        description: "Controls, risk, privacy, audit și evidence",
        href: "/docs/product",
        icon: "shield-check",
      },
      {
        label: "Dezvoltatori",
        description: "GraphQL, CLI, MCP, n8n și webhooks",
        href: "/docs/developers",
        icon: "code",
      },
      {
        label: "Cloud & arhitectură",
        description: "SaaS Cloud, securitate și referințe de arhitectură",
        href: "/docs/deployment",
        icon: "compass",
      },
    ],
    feature: {
      eyebrow: "Documentație",
      title: "Înțelege, integrează și operează platforma ZebraByte",
      href: "/docs",
      asset: "/navigation/docs.svg",
      alt: "Documentația ZebraByte",
      variant: "product",
    },
  },
];

export const directMenuItems: MenuItem[] = [
  {
    label: "Platforma ZebraByte",
    description: "Conformitate, riscuri, controale și dovezi",
    href: "https://app.zebrabyte.ro",
    icon: "shield-check",
  },
  {
    label: "Portal clienți",
    description: "Cont, facturi, servicii și suport",
    href: "https://portal.zebrabyte.ro",
    icon: "users-three",
  },
  {
    label: "Webmail",
    description: "Accesează emailul ZebraByte",
    href: "https://mail.zebrabyte.ro",
    icon: "monitor",
  },
];
