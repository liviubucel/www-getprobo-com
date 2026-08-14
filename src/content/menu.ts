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
    label: "Securitate",
    items: [
      {
        label: "Securitate cibernetică",
        description: "Evaluare, hardening, monitorizare și răspuns la incidente",
        href: "/cyber-security",
        icon: "shield-check",
      },
      {
        label: "Audit de securitate",
        description: "Riscuri, vulnerabilități și plan clar de remediere",
        href: "/cyber-audit",
        icon: "compass",
      },
      {
        label: "Hosting web securizat",
        description: "Găzduire administrată pentru proiecte care cer protecție reală",
        href: "/secure-hosting",
        icon: "code",
      },
    ],
    feature: {
      eyebrow: "Evaluare",
      title: "Începe cu o imagine clară a riscului",
      href: "/cyber-audit",
      asset: "/navigation/browser.svg",
      alt: "Previzualizare evaluare de securitate ZebraByte",
      variant: "product",
    },
  },
  {
    label: "Conformitate",
    items: [
      {
        label: "GDPR & Privacy",
        description: "Audit, implementare și guvernanța protecției datelor",
        href: "/gdpr",
        icon: "shield-check",
      },
      {
        label: "NIS2 & Cyber Governance",
        description: "Gap analysis, măsuri tehnice, politici și pregătire continuă",
        href: "/nis2",
        icon: "book-open-text",
      },
      {
        label: "Accesibilitate digitală",
        description: "WCAG, audit și remediere pentru experiențe digitale incluzive",
        href: "/accessibility",
        icon: "users-three",
      },
    ],
    feature: {
      eyebrow: "Cyber + Compliance",
      title: "Conformitate construită pe controale tehnice reale",
      href: "/compliance",
      asset: "/navigation/frameworks.svg",
      alt: "Cadru de conformitate și securitate ZebraByte",
      variant: "guide",
    },
  },
  {
    label: "Resurse",
    items: [
      {
        label: "Ghiduri & instrumente",
        description: "Resurse practice pentru securitate și conformitate",
        href: "/hub",
        icon: "compass",
      },
      {
        label: "Blog",
        description: "Analize, explicații și actualizări din teren",
        href: "/blog",
        icon: "article",
      },
      {
        label: "Documentație",
        description: "Cum funcționează instrumentele și serviciile ZebraByte",
        href: "/docs",
        icon: "book-open-text",
      },
    ],
    feature: {
      eyebrow: "Knowledge base",
      title: "Securitate și conformitate explicate practic",
      href: "/hub",
      asset: "/navigation/browser.svg",
      alt: "Ghiduri ZebraByte",
      variant: "guide",
    },
  },
  {
    label: "Companie",
    items: [
      {
        label: "Despre ZebraByte",
        description: "Abordarea noastră pentru securitate și risc digital",
        href: "/about",
        icon: "users-three",
      },
      {
        label: "Contact",
        description: "Discută cu echipa despre proiectul tău",
        href: "/contact",
        icon: "handshake",
      },
      {
        label: "Trust Center",
        description: "Postura de securitate și informații de încredere",
        href: "https://trust.zebrabyte.ro",
        icon: "shield-check",
      },
    ],
    feature: {
      eyebrow: "ZebraByte",
      title: "Security-first, compliance-ready",
      href: "/about",
      asset: "/navigation/browser.svg",
      alt: "ZebraByte",
      variant: "product",
    },
  },
];

export const directMenuItems: MenuItem[] = [
  {
    label: "Portal clienți",
    description: "Accesează serviciile și contul ZebraByte",
    href: "https://portal.zebrabyte.ro",
    icon: "shield-check",
  },
];
