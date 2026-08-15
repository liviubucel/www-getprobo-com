export type SiteLocale = "ro" | "en";

const roToEn: Record<string, string> = {
  // Shared navigation
  "Navigație principală": "Main navigation",
  "Conformitate": "Compliance",
  "Securitate": "Security",
  "Resurse": "Resources",
  "Companie": "Company",
  "Documentație": "Documentation",
  "Acces clienți": "Client access",
  "Acasă": "Home",
  "Despre": "About",
  "Contact": "Contact",
  "Păreri de la clienți ⭐": "Love from Customers ⭐",
  "Jurnal de modificări": "Changelog",
  "Conformitate și juridic": "Compliance & Legal",
  "Centru de încredere": "Trust Center",
  "Politica privind cookie-urile": "Cookie Policy",
  "Politica de confidențialitate": "Privacy Policy",
  "Termeni și condiții": "Terms of service",
  "Toate drepturile rezervate.": "All rights reserved.",
  "Nr. companie": "Company No.",
  "Platforma de conformitate": "Compliance platform",
  "Controale, dovezi și partajare securizată": "Controls, evidence and secure sharing",
  "Controale și pregătire continuă pentru audit": "Controls and continuous audit readiness",
  "ISMS, riscuri și pregătire pentru certificare": "ISMS, risk and certification readiness",
  "GDPR și confidențialitate": "GDPR & privacy",
  "Guvernanță, evidențe și măsuri tehnice": "Governance, records and technical safeguards",
  "Pregătire NIS2": "NIS2 readiness",
  "Guvernanță, risc și răspuns la incidente": "Governance, risk and incident response",
  "Accesibilitate": "Accessibility",
  "Inclusă în programul de conformitate": "Included in the compliance programme",
  "Conformitate gestionată": "Managed compliance",
  "Controale, dovezi și accesibilitate într-un singur program": "Controls, evidence and accessibility in one programme",
  "Platforma ZebraByte pentru conformitate gestionată": "ZebraByte managed compliance platform",
  "Evaluare de securitate": "Security assessment",
  "Expunere, configurări și plan de remediere": "Exposure, configuration and remediation plan",
  "Securitate site web": "Website security",
  "WAF, DDoS, malware și întărire de securitate": "WAF, DDoS, malware and security hardening",
  "Securitate email": "Email security",
  "SPF, DKIM, DMARC și protecție anti-spoofing": "SPF, DKIM, DMARC and anti-spoofing protection",
  "Răspuns la incidente": "Incident response",
  "Evaluare, izolare, remediere și recuperare": "Assessment, containment, remediation and recovery",
  "Hosting securizat administrat": "Secure managed hosting",
  "Infrastructură administrată cu securitatea pe primul plan": "Managed infrastructure with security first",
  "Securitate cibernetică": "Cyber security",
  "Protecție tehnică legată direct de risc și conformitate": "Technical protection directly tied to risk and compliance",
  "Programul ZebraByte de securitate cibernetică": "ZebraByte cyber security programme",
  "Analize despre conformitate, confidențialitate și securitate": "Analysis on compliance, privacy and security",
  "Studii de caz": "Case studies",
  "Povești și exemple practice din platformă": "Stories and practical examples from the platform",
  "Instrumente gratuite": "Free tools",
  "Instrumente pentru securitate și conformitate": "Tools for security and compliance",
  "Noutăți produs": "Product updates",
  "Funcții noi și îmbunătățiri ale platformei": "New features and platform improvements",
  "Descărcări": "Downloads",
  "Aplicații și componente ZebraByte": "ZebraByte applications and components",
  "Ghiduri și actualizări direct în inbox": "Guides and updates delivered to your inbox",
  "Hub ZebraByte": "ZebraByte Hub",
  "Ghiduri, comparații și resurse practice": "Guides, comparisons and practical resources",
  "Biblioteca ZebraByte de resurse și studii de caz": "ZebraByte resource and case-study library",
  "Cariere": "Careers",
  "Roluri, profile și oportunități ZebraByte": "Roles, profiles and opportunities at ZebraByte",
  "Logo, identitate și resurse de brand": "Logo, identity and brand resources",
  "Industrii": "Industries",
  "Securitate și conformitate adaptate sectorului": "Security and compliance tailored to your sector",
  "Parteneriate": "Partnerships",
  "Colaborări pentru securitate și conformitate": "Partnerships for security and compliance",
  "Postura ZebraByte de securitate și conformitate": "ZebraByte security and compliance posture",
  "Programează o discuție": "Book a call",
  "Alege direct o fereastră disponibilă": "Choose an available time directly",
  "Despre ZebraByte": "About ZebraByte",
  "Securitate cibernetică și conformitate, într-un singur program": "Cyber security and compliance in one programme",
  "Începe aici": "Start here",
  "Concepte și capabilități ale platformei": "Platform concepts and capabilities",
  "Produs": "Product",
  "Conformitate, riscuri, confidențialitate și audit": "Compliance, risk, privacy and audit",
  "Dezvoltatori": "Developers",
  "GraphQL, CLI, MCP, n8n și webhooks": "GraphQL, CLI, MCP, n8n and webhooks",
  "Implementare": "Deployment",
  "Cloud, self-hosting, configurare și operațiuni": "Cloud, self-hosting, configuration and operations",
  "Instalare și administrare pe dispozitive": "Installation and device management",
  "API și integrări": "API & integrations",
  "Automatizare și conectare cu sistemele tale": "Automation and connection to your systems",
  "Înțelege, integrează și operează platforma ZebraByte": "Understand, integrate and operate the ZebraByte platform",
  "Platforma ZebraByte": "ZebraByte Platform",
  "Conformitate, riscuri, controale și dovezi": "Compliance, risk, controls and evidence",
  "Portal clienți": "Client Portal",
  "Cont, facturi, servicii și suport": "Account, invoices, services and support",
  "Accesează emailul ZebraByte": "Access ZebraByte email",
  "Discută cu un expert": "Talk to an expert",
  "Deschide meniul": "Open menu",
  "Închide meniul": "Close menu",
  "Portal clienți ZebraByte": "ZebraByte Client Portal",

  // Homepage
  "Conformitate administrată & securitate cibernetică": "Managed compliance & cyber security",
  "Conformitate administrată, securitate cibernetică și găzduire securizată într-un singur program ZebraByte, cu controale, dovezi și pregătire continuă pentru audit.":
    "Managed compliance, cyber security and secure hosting in one ZebraByte programme, with controls, evidence and continuous audit readiness.",
  "Conformitate administrată · Securitate cibernetică": "Managed compliance · Cyber security",
  "Conformitate și securitate,": "Compliance and security,",
  "gestionate pentru tine.": "managed for you.",
  "Un expert coordonează programul de conformitate de la început până la final, iar echipa de securitate cibernetică leagă controalele de măsuri tehnice reale: protecția aplicațiilor, securitatea emailului, răspunsul la incidente și infrastructura construită cu securitatea în centru.":
    "An expert coordinates your compliance programme from start to finish, while the cyber security team connects controls to real technical measures: application protection, email security, incident response and infrastructure built with security at its core.",
  "Conformitate administrată": "Managed compliance",
  "Organizații din biblioteca de referință a platformei": "Organisations featured in the platform reference library",
  "Pune conformitatea și securitatea pe pilot automat": "Put compliance and security on autopilot",
  "Rulează programul cu o combinație de expertiză și automatizare. ZebraByte urmărește controalele, dovezile și riscurile, iar măsurile tehnice sunt implementate și menținute în același model operațional.":
    "Run the programme through a combination of expertise and automation. ZebraByte tracks controls, evidence and risk while technical safeguards are implemented and maintained in the same operating model.",
  "Expert dedicat pentru conformitate": "Dedicated compliance expert",
  "Un specialist coordonează politicile, controalele, evaluările de risc, evaluările furnizorilor, cerințele de accesibilitate și pregătirea pentru audit, ca extensie a echipei tale.":
    "A specialist coordinates policies, controls, risk assessments, vendor reviews, accessibility requirements and audit readiness as an extension of your team.",
  "Conformitate care rulează în fundal": "Compliance running in the background",
  "Colectarea dovezilor, aprobările și acțiunile repetitive sunt automatizate, iar echipa urmărește schimbările care pot afecta postura de conformitate.":
    "Evidence collection, approvals and repetitive actions are automated while the team tracks changes that can affect your compliance posture.",
  "Transformă controalele în securitate reală": "Turn controls into real security",
  "Evaluarea de securitate, protecția site-ului și a emailului, consolidarea configurațiilor, gestionarea vulnerabilităților și găzduirea securizată susțin direct tratarea riscurilor și controalele asumate.":
    "Security assessments, website and email protection, configuration hardening, vulnerability management and secure hosting directly support risk treatment and committed controls.",
  "Lucrează dintr-un singur program": "Work from one programme",
  "Documentele, acțiunile, dovezile, verificările și integrarea cu fluxurile de lucru ale echipei rămân centralizate, fără un catalog fragmentat de servicii fără legătură între ele.":
    "Documents, actions, evidence, checks and integration with your team's workflows stay centralised, without a fragmented catalogue of disconnected services.",

  // Compliance journey
  "De la haos la control": "From chaos to control",
  "Specialiștii noștri coordonează întregul parcurs — de la configurare și evaluarea riscurilor până la audit și monitorizare continuă — astfel încât echipa ta să rămână concentrată pe activitatea principală.":
    "Our specialists coordinate the entire journey — from setup and risk assessment to audit and continuous monitoring — so your team can stay focused on its core work.",
  "Analiză și plan": "Assessment and plan",
  "Începem cu evaluarea mediului, a riscurilor și a furnizorilor, identificăm lacunele și stabilim pașii prioritari. Apoi construim un program de conformitate adaptat modului în care lucrează echipa ta.":
    "We start by assessing your environment, risks and vendors, identify gaps and prioritise the next steps. We then build a compliance programme around the way your team works.",
  "Implementare și audit": "Implementation and audit",
  "Colectarea dovezilor este automatizată prin platformă, iar echipa noastră pregătește documentele și coordonează comunicarea necesară pentru audit. Participi doar acolo unde este nevoie, cu pregătire și context clar.":
    "Evidence collection is automated through the platform while our team prepares documentation and coordinates the communication required for audit. You only participate where needed, with clear preparation and context.",
  "Conformitate continuă": "Continuous compliance",
  "După finalizarea auditului, programul continuă în fundal: monitorizăm schimbările, actualizăm controalele, reînnoim dovezile și menținem evaluările la zi pentru o pregătire continuă.":
    "After the audit, the programme continues in the background: we monitor changes, update controls, renew evidence and keep assessments current for continuous readiness.",

  // Shared UI / footer / status
  "Toate sistemele sunt operaționale": "All systems operational",
  "Performanță degradată": "Degraded performance",
  "Incident activ": "Active incident",
  "Se verifică statusul": "Checking status",
  "Status indisponibil": "Status unavailable",
  "Sari la conținutul principal": "Skip to main content",
};

const entries = Object.entries(roToEn).sort((a, b) => b[0].length - a[0].length);

const excludedInternalPath =
  /^\/(?:en(?:\/|$)|api(?:\/|$)|_astro(?:\/|$)|static(?:\/|$)|frameworks(?:\/|$)|navigation(?:\/|$)|videos(?:\/|$)|images(?:\/|$)|assets(?:\/|$)|fonts(?:\/|$)|favicon(?:\.|\/)|og(?:[-./]|$)|robots\.txt$|sitemap(?:[-./]|$)|changelog\.xml$|blog\.xml$|security\.txt$)/i;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function isEnglishPath(pathname: string): boolean {
  return pathname === "/en" || pathname.startsWith("/en/");
}

export function stripEnglishPrefix(pathname: string): string {
  if (pathname === "/en") return "/";
  if (pathname.startsWith("/en/")) return pathname.slice(3) || "/";
  return pathname;
}

export function toEnglishPath(pathname: string): string {
  const clean = stripEnglishPrefix(pathname) || "/";
  return clean === "/" ? "/en" : `/en${clean}`;
}

function protectRuntimeBlocks(html: string): { html: string; restore: (value: string) => string } {
  const blocks: string[] = [];
  const protectedHtml = html.replace(
    /<(script|style|textarea|pre|code|svg)\b[^>]*>[\s\S]*?<\/\1>/gi,
    (block) => {
      const marker = `___ZBT_I18N_BLOCK_${blocks.length}___`;
      blocks.push(block);
      return marker;
    },
  );

  return {
    html: protectedHtml,
    restore(value) {
      return value.replace(/___ZBT_I18N_BLOCK_(\d+)___/g, (_match, index) => blocks[Number(index)] || "");
    },
  };
}

function protectUrlAttributes(html: string): { html: string; restore: (value: string) => string } {
  const urls: string[] = [];
  const marker = (index: number) => `___ZBT_I18N_URL_${index}___`;

  let protectedHtml = html.replace(
    /\b(href|action|src)=("|')([^"']*)\2/gi,
    (_match, attribute, quote, url) => {
      const index = urls.push(url) - 1;
      return `${attribute}=${quote}${marker(index)}${quote}`;
    },
  );

  protectedHtml = protectedHtml.replace(
    /("|')(https?:\/\/[^"']*)\1/g,
    (_match, quote, url) => {
      const index = urls.push(url) - 1;
      return `${quote}${marker(index)}${quote}`;
    },
  );

  return {
    html: protectedHtml,
    restore(value) {
      return value.replace(/___ZBT_I18N_URL_(\d+)___/g, (_match, index) => urls[Number(index)] || "");
    },
  };
}

function prefixEnglishInternalLinks(html: string): string {
  return html.replace(/<[^>]+\b(?:href|action)=["'][^"']*["'][^>]*>/gi, (tag) => {
    if (tag.includes("data-locale-switch")) return tag;

    return tag.replace(/\b(href|action)=("|')([^"']*)\2/gi, (match, attribute, quote, url) => {
      if (!url.startsWith("/") || excludedInternalPath.test(url)) return match;
      return `${attribute}=${quote}${toEnglishPath(url)}${quote}`;
    });
  });
}

function translateDictionary(html: string): string {
  let translated = html;
  for (const [source, target] of entries) {
    const escapedSource = source.replace(/&/g, "&amp;");
    const escapedTarget = target.replace(/&/g, "&amp;");
    let pattern = escapeRegExp(escapedSource).replace(/\s+/g, "\\s+");
    if (/^[A-Za-z0-9]/.test(source)) pattern = `\\b${pattern}`;
    if (/[A-Za-z0-9]$/.test(source)) pattern = `${pattern}\\b`;
    translated = translated.replace(new RegExp(pattern, "g"), escapedTarget);
  }
  return translated;
}

function rewriteEnglishCanonical(html: string): string {
  const rewriteUrl = (raw: string) => {
    try {
      const parsed = new URL(raw);
      if (parsed.hostname !== "www.zebrabyte.ro" && parsed.hostname !== "zebrabyte.ro") return raw;
      parsed.pathname = toEnglishPath(parsed.pathname);
      return parsed.toString().replace(/\/$/, parsed.pathname === "/en" ? "" : "/");
    } catch {
      return raw;
    }
  };

  let result = html.replace(
    /(<link\b[^>]*rel=["']canonical["'][^>]*href=["'])(https?:\/\/[^"']+)(["'][^>]*>)/gi,
    (_match, before, url, after) => `${before}${rewriteUrl(url)}${after}`,
  );

  result = result.replace(
    /(<meta\b[^>]*(?:property|name)=["']og:url["'][^>]*content=["'])(https?:\/\/[^"']+)(["'][^>]*>)/gi,
    (_match, before, url, after) => `${before}${rewriteUrl(url)}${after}`,
  );

  return result;
}

export function translateEnglishHtml(html: string): string {
  const runtime = protectRuntimeBlocks(html);
  const urls = protectUrlAttributes(runtime.html);

  let translated = urls.html
    .replace(/<html\b([^>]*)\blang=["']ro["']/i, '<html$1lang="en"')
    .replace(/content=["']ro_RO["']/gi, 'content="en_GB"');

  translated = translateDictionary(translated);
  translated = urls.restore(translated);
  translated = prefixEnglishInternalLinks(translated);
  translated = rewriteEnglishCanonical(translated);
  return runtime.restore(translated);
}