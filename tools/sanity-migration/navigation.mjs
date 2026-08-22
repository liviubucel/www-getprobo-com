import {cmsLink, footerGroup, localizedString, navFeature, navItem} from "./helpers.mjs";

const compliance = {
  _key: "compliance",
  _type: "navGroup",
  label: localizedString("Conformitate", "Compliance"),
  showLabel: true,
  items: [
    navItem("grc", "Platforma GRC", "GRC Platform", "Workspace intern pentru controale, riscuri, dovezi și audit", "Internal workspace for controls, risks, evidence and audits", "/compliance-platform", "shield-check"),
    navItem("trust", "Trust Center", "Trust Center", "Portal extern pentru clienți: documente, NDA și acces securizat", "External client portal for documents, NDAs and secure access", "/compliance-portal", "monitor"),
    navItem("soc2", "SOC 2", "SOC 2", "Controale și pregătire continuă pentru audit", "Controls and continuous audit readiness", "/soc2", "article"),
    navItem("iso", "ISO/IEC 27001", "ISO/IEC 27001", "ISMS, riscuri și pregătire pentru certificare", "ISMS, risk and certification readiness", "/iso-27001", "book-open-text"),
    navItem("gdpr", "GDPR și confidențialitate", "GDPR & Privacy", "Guvernanță, evidențe și măsuri tehnice", "Governance, records and technical measures", "/gdpr", "users-three"),
    navItem("nis2", "Pregătire NIS2", "NIS2 Readiness", "Guvernanță, risc și răspuns la incidente", "Governance, risk and incident response", "/nis2", "compass"),
    navItem("accessibility", "Accesibilitate", "Accessibility", "Inclusă în programul de conformitate", "Included in the compliance programme", "/accessibility", "sparkle"),
  ],
  feature: navFeature({
    eyebrowRo: "Conformitate gestionată",
    eyebrowEn: "Managed compliance",
    titleRo: "Controale, dovezi și accesibilitate într-un singur program",
    titleEn: "Controls, evidence and accessibility in one programme",
    href: "/managed-compliance",
    legacyAssetPath: "/navigation/browser.svg",
    altRo: "Platforma ZebraByte pentru conformitate gestionată",
    altEn: "ZebraByte managed compliance platform",
    variant: "product",
  }),
};

const security = {
  _key: "security",
  _type: "navGroup",
  label: localizedString("Securitate", "Security"),
  showLabel: true,
  items: [
    navItem("assessment", "Evaluare de securitate", "Security Assessment", "Expunere, configurări și plan de remediere", "Exposure, configurations and remediation plan", "/security-assessment", "magnifying-glass"),
    navItem("website-security", "Securitate site web", "Website Security", "WAF, DDoS, malware și întărire de securitate", "WAF, DDoS, malware and security hardening", "/website-security", "monitor"),
    navItem("email-security", "Securitate email", "Email Security", "SPF, DKIM, DMARC și protecție anti-spoofing", "SPF, DKIM, DMARC and anti-spoofing protection", "/email-security", "shield-check"),
    navItem("incident", "Răspuns la incidente", "Incident Response", "Evaluare, izolare, remediere și recuperare", "Assessment, containment, remediation and recovery", "/incident-response", "clock-counter-clockwise"),
    navItem("hosting", "Hosting securizat administrat", "Secure Managed Hosting", "Infrastructură administrată cu securitatea pe primul plan", "Managed infrastructure with security first", "/secure-hosting", "terminal-window"),
  ],
  feature: navFeature({
    eyebrowRo: "Securitate cibernetică",
    eyebrowEn: "Cybersecurity",
    titleRo: "Protecție tehnică legată direct de risc și conformitate",
    titleEn: "Technical protection directly linked to risk and compliance",
    href: "/cyber-security",
    legacyAssetPath: "/navigation/frameworks.svg",
    altRo: "Programul ZebraByte de securitate cibernetică",
    altEn: "ZebraByte cybersecurity programme",
    variant: "guide",
  }),
};

const resources = {
  _key: "resources",
  _type: "navGroup",
  label: localizedString("Resurse", "Resources"),
  showLabel: true,
  items: [
    navItem("hub", "Hub", "Hub", "Ghiduri, comparații și resurse pentru conformitate și securitate", "Guides, comparisons and resources for compliance and security", "/hub", "book-open-text"),
    navItem("blog", "Blog", "Blog", "Analize despre conformitate, confidențialitate și securitate", "Analysis on compliance, privacy and security", "/blog", "article"),
    navItem("stories", "Studii de caz", "Case Studies", "Povești și exemple practice din platformă", "Stories and practical examples from the platform", "/stories", "quotes"),
    navItem("tools", "Instrumente gratuite", "Free Tools", "Instrumente pentru securitate și conformitate", "Tools for security and compliance", "/tools", "compass"),
    navItem("changelog", "Noutăți produs", "Product Updates", "Funcții noi și îmbunătățiri ale platformei", "New features and platform improvements", "/changelog", "clock-counter-clockwise"),
    navItem("download", "Descărcări", "Downloads", "Aplicații și componente ZebraByte", "ZebraByte apps and components", "/download", "code"),
    navItem("newsletter", "Newsletter", "Newsletter", "Ghiduri și actualizări direct în inbox", "Guides and updates delivered to your inbox", "/newsletter", "heart"),
  ],
  feature: navFeature({
    eyebrowRo: "Hub ZebraByte",
    eyebrowEn: "ZebraByte Hub",
    titleRo: "Ghiduri, comparații și resurse practice",
    titleEn: "Guides, comparisons and practical resources",
    href: "/hub",
    legacyAssetPath: "/navigation/ahrefs.webp",
    altRo: "Biblioteca ZebraByte de resurse și studii de caz",
    altEn: "ZebraByte resource and case-study library",
    variant: "story",
  }),
};

const company = {
  _key: "company",
  _type: "navGroup",
  label: localizedString("Companie", "Company"),
  showLabel: true,
  items: [
    navItem("about", "Despre noi", "About Us", "Misiunea, principiile și modul în care lucrăm", "Our mission, principles and how we work", "/about", "users-three"),
    navItem("careers", "Cariere", "Careers", "Roluri, profile și oportunități ZebraByte", "Roles, profiles and ZebraByte opportunities", "/careers", "briefcase"),
    navItem("brand", "Brand", "Brand", "Logo, identitate și resurse de brand", "Logo, identity and brand resources", "/brand", "paint-brush"),
    navItem("industries", "Industrii", "Industries", "Securitate și conformitate adaptate sectorului", "Security and compliance adapted to your sector", "/industries", "compass"),
    navItem("partnerships", "Parteneriate", "Partnerships", "Colaborări pentru securitate și conformitate", "Partnerships for security and compliance", "/partnerships", "handshake"),
    navItem("yc", "Program pentru startup-uri YC", "YC Startup Programme", "Oferta de conformitate pentru startup-uri Y Combinator eligibile", "Compliance offer for eligible Y Combinator startups", "/yc", "sparkle"),
    navItem("security", "Securitate ZebraByte", "ZebraByte Security", "Practicile și postura operațională de securitate", "Security practices and operational posture", "/security", "shield-check"),
    navItem("booking", "Programează o discuție", "Book a Call", "Alege direct o fereastră disponibilă", "Choose an available time slot directly", "/programare", "clock-counter-clockwise"),
  ],
  feature: navFeature({
    eyebrowRo: "Despre ZebraByte",
    eyebrowEn: "About ZebraByte",
    titleRo: "Securitate cibernetică și conformitate, într-un singur program",
    titleEn: "Cybersecurity and compliance in one programme",
    href: "/about",
    legacyAssetPath: "/og-zebrabyte.svg",
    altRo: "ZebraByte",
    altEn: "ZebraByte",
    variant: "story",
  }),
};

const documentation = {
  _key: "documentation",
  _type: "navGroup",
  label: localizedString("Documentație", "Documentation"),
  href: "/docs",
  showLabel: false,
  items: [
    navItem("docs-start", "Începe aici", "Start Here", "Concepte și capabilități ale platformei", "Platform concepts and capabilities", "/docs", "book-open-text"),
    navItem("docs-product", "Produs", "Product", "Conformitate, riscuri, confidențialitate și audit", "Compliance, risk, privacy and audit", "/docs/product", "shield-check"),
    navItem("docs-dev", "Dezvoltatori", "Developers", "GraphQL, CLI, MCP, n8n și webhooks", "GraphQL, CLI, MCP, n8n and webhooks", "/docs/developers", "code"),
    navItem("docs-cloud", "Cloud & arhitectură", "Cloud & Architecture", "SaaS Cloud, securitatea infrastructurii și referințe de arhitectură/migrare", "SaaS Cloud, infrastructure security and architecture/migration references", "/docs/deployment", "compass"),
    navItem("docs-agent", "Device Agent", "Device Agent", "Instalare și administrare pe dispozitive", "Device installation and management", "/docs/product/device-agent/overview", "monitor"),
    navItem("docs-api", "API și integrări", "API & Integrations", "Automatizare și conectare cu sistemele tale", "Automation and integration with your systems", "/docs/developers/api", "notepad"),
  ],
  feature: navFeature({
    eyebrowRo: "Documentație",
    eyebrowEn: "Documentation",
    titleRo: "Înțelege, integrează și operează platforma ZebraByte",
    titleEn: "Understand, integrate and operate the ZebraByte platform",
    href: "/docs",
    legacyAssetPath: "/navigation/docs.svg",
    altRo: "Documentația ZebraByte",
    altEn: "ZebraByte documentation",
    variant: "product",
  }),
};

const footerResources = footerGroup("footer-resources", "Resurse", "Resources", [
  cmsLink({key: "home", labelRo: "Acasă", labelEn: "Home", href: "/"}),
  cmsLink({key: "blog", labelRo: "Blog", labelEn: "Blog", href: "/blog"}),
  cmsLink({key: "hub", labelRo: "Hub", labelEn: "Hub", href: "/hub"}),
  cmsLink({key: "stories", labelRo: "Studii de caz", labelEn: "Case Studies", href: "/stories"}),
  cmsLink({key: "love", labelRo: "Păreri de la clienți ⭐", labelEn: "Customer feedback ⭐", href: "/love-from-customer"}),
  cmsLink({key: "changelog", labelRo: "Jurnal de modificări", labelEn: "Changelog", href: "/changelog"}),
  cmsLink({key: "download", labelRo: "Descărcări", labelEn: "Downloads", href: "/download"}),
  cmsLink({key: "docs", labelRo: "Documentație", labelEn: "Documentation", href: "/docs"}),
  cmsLink({key: "tools", labelRo: "Instrumente gratuite", labelEn: "Free Tools", href: "/tools"}),
]);

const footerCompany = footerGroup("footer-company", "Companie", "Company", [
  cmsLink({key: "about", labelRo: "Despre", labelEn: "About", href: "/about"}),
  cmsLink({key: "careers", labelRo: "Cariere", labelEn: "Careers", href: "/careers"}),
  cmsLink({key: "brand", labelRo: "Brand", labelEn: "Brand", href: "/brand"}),
  cmsLink({key: "industries", labelRo: "Industrii", labelEn: "Industries", href: "/industries"}),
  cmsLink({key: "partnerships", labelRo: "Parteneriate", labelEn: "Partnerships", href: "/partnerships"}),
  cmsLink({key: "contact", labelRo: "Contact", labelEn: "Contact", href: "/contact"}),
  cmsLink({key: "portal", labelRo: "Portal clienți", labelEn: "Client Portal", href: "https://portal.zebrabyte.ro", newTab: true}),
]);

const footerLegal = footerGroup("footer-legal", "Conformitate și juridic", "Compliance & Legal", [
  cmsLink({key: "legal", labelRo: "Centru juridic", labelEn: "Legal Centre", href: "/legal"}),
  cmsLink({key: "security", labelRo: "Securitate ZebraByte", labelEn: "ZebraByte Security", href: "/security"}),
  cmsLink({key: "managed", labelRo: "Conformitate gestionată", labelEn: "Managed Compliance", href: "/managed-compliance"}),
  cmsLink({key: "grc", labelRo: "Platforma GRC", labelEn: "GRC Platform", href: "/compliance-platform"}),
  cmsLink({key: "trust", labelRo: "Trust Center", labelEn: "Trust Center", href: "/compliance-portal"}),
  cmsLink({key: "soc2", labelRo: "SOC 2", labelEn: "SOC 2", href: "/soc2"}),
  cmsLink({key: "iso", labelRo: "ISO/IEC 27001", labelEn: "ISO/IEC 27001", href: "/iso-27001"}),
  cmsLink({key: "gdpr", labelRo: "GDPR și confidențialitate", labelEn: "GDPR & Privacy", href: "/gdpr"}),
  cmsLink({key: "nis2", labelRo: "NIS2", labelEn: "NIS2", href: "/nis2"}),
  cmsLink({key: "accessibility", labelRo: "Accesibilitate", labelEn: "Accessibility", href: "/accessibility"}),
  cmsLink({key: "cookies", labelRo: "Politica privind cookie-urile", labelEn: "Cookie Policy", href: "/cookie-policy"}),
  cmsLink({key: "privacy", labelRo: "Politica de confidențialitate", labelEn: "Privacy Policy", href: "/privacy"}),
  cmsLink({key: "terms", labelRo: "Termeni și condiții", labelEn: "Terms & Conditions", href: "/terms"}),
  cmsLink({key: "dpa", labelRo: "Acord de prelucrare a datelor (DPA)", labelEn: "Data Processing Agreement (DPA)", href: "/dpa"}),
  cmsLink({key: "sla", labelRo: "SLA găzduire", labelEn: "Hosting SLA", href: "/legal/hosting-sla"}),
]);

export const navigationDocument = {
  _id: "mainNavigation",
  _type: "navigation",
  name: "Primary ZebraByte navigation",
  header: [compliance, security, resources, company, documentation],
  footerGroups: [footerResources, footerCompany, footerLegal],
  footerLegal: [],
};
