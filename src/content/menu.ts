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
        label: "Platforma de conformitate",
        description: "Controale, dovezi și partajare securizată",
        href: "/compliance-portal",
        icon: "notepad",
      },
      {
        label: "SOC 2",
        description: "Controale și pregătire continuă pentru audit",
        href: "/soc2",
        icon: "shield-check",
      },
      {
        label: "ISO/IEC 27001",
        description: "ISMS, riscuri și pregătire pentru certificare",
        href: "/iso-27001",
        icon: "book-open-text",
      },
      {
        label: "GDPR și confidențialitate",
        description: "Guvernanță, evidențe și măsuri tehnice",
        href: "/gdpr",
        icon: "users-three",
      },
      {
        label: "Pregătire NIS2",
        description: "Guvernanță, risc și răspuns la incidente",
        href: "/nis2",
        icon: "compass",
      },
      {
        label: "Accesibilitate · Gratuit",
        description: "Widget gratuit; administrare completă din platformă",
        href: "/accessibility",
        icon: "sparkle",
      },
    ],
    feature: {
      eyebrow: "Conformitate gestionată",
      title: "Controale, dovezi și accesibilitate gestionate împreună",
      href: "/managed-compliance",
      asset: "/navigation/browser.svg",
      alt: "Platforma ZebraByte pentru conformitate gestionată",
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
        description: "WAF, DDoS, malware și întărire de securitate",
        href: "/website-security",
        icon: "monitor",
      },
      {
        label: "Securitate email",
        description: "SPF, DKIM, DMARC și protecție anti-spoofing",
        href: "/email-security",
        icon: "shield-check",
      },
      {
        label: "Răspuns la incidente",
        description: "Evaluare, izolare, remediere și recuperare",
        href: "/incident-response",
        icon: "clock-counter-clockwise",
      },
      {
        label: "Hosting securizat administrat",
        description: "Infrastructură administrată cu securitatea pe primul plan",
        href: "/secure-hosting",
        icon: "terminal-window",
      },
    ],
    feature: {
      eyebrow: "Securitate cibernetică",
      title: "Protecție tehnică legată direct de risc și conformitate",
      href: "/cyber-security",
      asset: "/navigation/frameworks.svg",
      alt: "Programul ZebraByte de securitate cibernetică",
      variant: "guide",
    },
  },
  {
    label: "Resurse",
    items: [
      {
        label: "Blog",
        description: "Analize despre conformitate, confidențialitate și securitate",
        href: "/blog",
        icon: "article",
      },
      {
        label: "Studii de caz",
        description: "Povești și exemple practice din platformă",
        href: "/stories",
        icon: "quotes",
      },
      {
        label: "Instrumente gratuite",
        description: "Instrumente pentru securitate și conformitate",
        href: "/tools",
        icon: "sparkle",
      },
      {
        label: "Noutăți produs",
        description: "Funcții noi și îmbunătățiri ale platformei",
        href: "/changelog",
        icon: "clock-counter-clockwise",
      },
      {
        label: "Descărcări",
        description: "Aplicații și componente ZebraByte",
        href: "/download",
        icon: "code",
      },
      {
        label: "Newsletter",
        description: "Ghiduri și actualizări direct în inbox",
        href: "/newsletter",
        icon: "heart",
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
        label: "Cariere",
        description: "Roluri, profile și oportunități ZebraByte",
        href: "/careers",
        icon: "briefcase",
      },
      {
        label: "Brand",
        description: "Logo, identitate și resurse de brand",
        href: "/brand",
        icon: "paint-brush",
      },
      {
        label: "Industrii",
        description: "Securitate și conformitate adaptate sectorului",
        href: "/industries",
        icon: "compass",
      },
      {
        label: "Parteneriate",
        description: "Colaborări pentru securitate și conformitate",
        href: "/partnerships",
        icon: "handshake",
      },
      {
        label: "Trust Center",
        description: "Postura ZebraByte de securitate și conformitate",
        href: "https://trust.zebrabyte.ro",
        icon: "shield-check",
      },
      {
        label: "Programează o discuție",
        description: "Alege direct o fereastră disponibilă",
        href: "/programare",
        icon: "clock-counter-clockwise",
      },
    ],
    feature: {
      eyebrow: "Despre ZebraByte",
      title: "Securitate cibernetică și conformitate, într-un singur program",
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
        description: "Conformitate, riscuri, confidențialitate și audit",
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
        label: "Implementare",
        description: "Cloud, self-hosting, configurare și operațiuni",
        href: "/docs/deployment",
        icon: "terminal-window",
      },
      {
        label: "Device Agent",
        description: "Instalare și administrare pe dispozitive",
        href: "/docs/product/device-agent/overview",
        icon: "monitor",
      },
      {
        label: "API și integrări",
        description: "Automatizare și conectare cu sistemele tale",
        href: "/docs/developers/api",
        icon: "notepad",
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
