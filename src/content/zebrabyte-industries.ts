export type IndustryServiceKey =
  | "cyber"
  | "email"
  | "website"
  | "hosting"
  | "maintenance";

export type ZebraByteIndustry = {
  slug: string;
  legacyLabel: string;
  title: string;
  shortTitle: string;
  description: string;
  context: string;
  priorities: string[];
  risks: string[];
  outcomes: string[];
  serviceSlugs: Record<IndustryServiceKey, string>;
};

export const industryServiceMeta: Record<
  IndustryServiceKey,
  {
    label: string;
    eyebrow: string;
    description: string;
    core: string[];
    href: string;
  }
> = {
  cyber: {
    label: "Securitate cibernetică",
    eyebrow: "Cyber Security",
    description:
      "Assessment, hardening, identity, monitoring și incident readiness adaptate modului în care organizația lucrează în fiecare zi.",
    core: [
      "Security assessment și prioritizarea riscului",
      "MFA, access control și reducerea conturilor privilegiate",
      "Vulnerability management și hardening",
      "Incident response și recovery planning",
    ],
    href: "/cyber-security",
  },
  email: {
    label: "Securitate email",
    eyebrow: "Email & Domain Security",
    description:
      "SPF, DKIM, DMARC, anti-spoofing și protecție împotriva phishing/BEC pentru identitatea digitală a organizației.",
    core: [
      "SPF, DKIM și DMARC configurate și validate",
      "Protecție anti-spoofing și monitorizarea domeniului",
      "MFA și hardening pentru conturile de email",
      "Reducerea riscului de phishing și business email compromise",
    ],
    href: "/email-security",
  },
  website: {
    label: "Securitate website",
    eyebrow: "Website Security",
    description:
      "WAF, DDoS protection, malware scanning, hardening și recovery pentru aplicațiile și site-urile publice.",
    core: [
      "Web Application Firewall și reguli de protecție",
      "Scanare malware și verificarea modificărilor neautorizate",
      "Protecție DDoS, TLS și security headers",
      "Curățare, restaurare și hardening după compromitere",
    ],
    href: "/website-security",
  },
  hosting: {
    label: "Hosting securizat",
    eyebrow: "Secure Managed Hosting",
    description:
      "Infrastructură administrată, backup, recovery și operațiuni security-first pentru workload-uri care nu trebuie lăsate pe pilot automat.",
    core: [
      "Hardening și administrarea infrastructurii",
      "Backup și restaurare testabilă",
      "Monitorizare de disponibilitate și securitate",
      "Migrare controlată și reducerea suprafeței de atac",
    ],
    href: "/secure-hosting",
  },
  maintenance: {
    label: "Mentenanță WordPress",
    eyebrow: "Application Maintenance",
    description:
      "Actualizări, backup, verificări de securitate și suport operațional pentru instalații WordPress care rămân parte din infrastructura organizației.",
    core: [
      "Actualizări controlate pentru core, teme și plugin-uri",
      "Backup înainte de schimbări și procedură de rollback",
      "Verificări de securitate și integritate",
      "Suport pentru incidente și probleme operaționale",
    ],
    href: "/website-security",
  },
};

export const zebraByteIndustries: ZebraByteIndustry[] = [
  {
    slug: "avocatura",
    legacyLabel: "Avocatură & Notariat",
    title: "Securitate și conformitate pentru avocatură & notariat",
    shortTitle: "Avocatură & Notariat",
    description:
      "Protejăm corespondența, documentele confidențiale, website-ul și infrastructura cabinetului fără să transformăm activitatea juridică într-un proiect IT permanent.",
    context:
      "Cabinetele și societățile de avocatură lucrează cu informații confidențiale, documente sensibile, instrucțiuni de plată și comunicare în care identitatea expeditorului contează. Programul trebuie să acopere atât secretul profesional, cât și continuitatea serviciilor digitale.",
    priorities: ["Secret profesional", "Email identity", "Access control", "GDPR", "Recovery"],
    risks: [
      "Phishing sau BEC care imită parteneri, clienți ori colegi",
      "Conturi de email compromise și acces la corespondență confidențială",
      "Website vulnerabil sau infectat folosit pentru distribuirea de conținut malițios",
      "Documente ori date personale expuse prin acces sau configurări greșite",
    ],
    outcomes: [
      "Domeniu de email autentificat și protejat împotriva spoofing-ului",
      "Acces mai strict la conturi și sisteme sensibile",
      "Website și hosting operate cu hardening și recovery",
      "Măsuri tehnice conectate la GDPR și la procesele interne",
    ],
    serviceSlugs: {
      cyber: "securitate-cibernetica-avocatura",
      email: "securitate-email-avocatura",
      website: "securitate-website-avocatura",
      hosting: "hosting-securitate-cabinete-avocatura",
      maintenance: "mentenanta-wordpress-avocatura",
    },
  },
  {
    slug: "medical",
    legacyLabel: "Medical & Clinici",
    title: "Securitate pentru clinici, cabinete și servicii medicale",
    shortTitle: "Medical & Clinici",
    description:
      "Protecție pentru date sensibile, conturi, formulare, comunicare și infrastructură, cu recovery și privacy integrate în modul de operare.",
    context:
      "Organizațiile medicale procesează categorii speciale de date și depind de aplicații, email și website-uri pentru programări, comunicare și activitate operațională. Disponibilitatea și controlul accesului sunt la fel de importante ca documentația de privacy.",
    priorities: ["Sensitive data", "Identity", "Availability", "Privacy", "Backup"],
    risks: [
      "Acces neautorizat la conturi sau informații despre pacienți",
      "Phishing orientat către personal și furnizori",
      "Formulare sau aplicații publice vulnerabile",
      "Indisponibilitate sau pierdere de date după un incident",
    ],
    outcomes: [
      "Control de acces și autentificare întărite",
      "Protecția website-urilor și formularelor expuse",
      "Backup/recovery tratate ca parte din continuitate",
      "Privacy și security urmărite în același program",
    ],
    serviceSlugs: {
      cyber: "securitate-cibernetica-medical",
      email: "securitate-email-medical",
      website: "securitate-website-medical",
      hosting: "hosting-securitate-cabinete-medicale",
      maintenance: "mentenanta-wordpress-medical",
    },
  },
  {
    slug: "institutii-publice",
    legacyLabel: "Instituții Publice",
    title: "Cyber security, NIS2 și accesibilitate pentru instituții publice",
    shortTitle: "Instituții Publice",
    description:
      "Un program comun pentru servicii publice expuse, email, infrastructură, NIS2 readiness, GDPR și accesibilitate digitală.",
    context:
      "Instituțiile publice operează servicii vizibile, gestionează date personale și trebuie să poată demonstra guvernanță, măsuri tehnice și capacitate de răspuns. În plus, accesibilitatea digitală nu poate fi tratată separat de restul calității serviciului public.",
    priorities: ["NIS2", "Public services", "GDPR", "Accessibility", "Incident readiness"],
    risks: [
      "Atacuri asupra website-urilor și serviciilor publice",
      "Compromiterea conturilor de email instituționale",
      "Lipsa vizibilității asupra vulnerabilităților și furnizorilor",
      "Procese de incident și dovezi insuficient pregătite",
    ],
    outcomes: [
      "Baseline tehnic și governance conectat la NIS2 readiness",
      "Protecție pentru email, website și infrastructură",
      "Incident response și evidence pregătite înainte de incident",
      "WCAG/accessibility integrate în programul digital",
    ],
    serviceSlugs: {
      cyber: "securitate-cibernetica-institutii-publice",
      email: "securitate-email-institutii-publice",
      website: "securitate-website-institutii-publice",
      hosting: "hosting-securitate-institutii-publice",
      maintenance: "mentenanta-wordpress-institutii-publice",
    },
  },
  {
    slug: "ecommerce",
    legacyLabel: "E-commerce",
    title: "Securitate și reziliență pentru magazine online",
    shortTitle: "E-commerce",
    description:
      "Protejăm checkout-ul, conturile, emailul și infrastructura fără să sacrificăm performanța sau disponibilitatea magazinului.",
    context:
      "Pentru e-commerce, o problemă de securitate este rapid și o problemă de venituri. Website-ul, integrările de plăți, conturile de administrare și emailul comercial formează aceeași suprafață de atac.",
    priorities: ["Checkout", "Availability", "Admin access", "Email", "Recovery"],
    risks: [
      "Exploatarea vulnerabilităților din CMS, plugin-uri sau integrări",
      "Credential stuffing și compromiterea conturilor administrative",
      "Phishing/BEC în relația cu furnizorii și plățile",
      "Downtime sau coruperea datelor în perioade critice",
    ],
    outcomes: [
      "WAF și hardening pentru aplicația publică",
      "Acces administrativ protejat și monitorizat",
      "Email/domain identity mai greu de falsificat",
      "Backup și recovery pregătite pentru revenire rapidă",
    ],
    serviceSlugs: {
      cyber: "securitate-cibernetica-ecommerce",
      email: "securitate-email-ecommerce",
      website: "securitate-website-ecommerce",
      hosting: "hosting-securitate-magazine-online",
      maintenance: "mentenanta-wordpress-ecommerce",
    },
  },
  {
    slug: "imobiliare",
    legacyLabel: "Imobiliare",
    title: "Securitate digitală pentru agenții imobiliare",
    shortTitle: "Imobiliare",
    description:
      "Protecție pentru formulare, lead-uri, email, website-uri bogate în media și integrările folosite în fluxul comercial.",
    context:
      "Agențiile imobiliare colectează volume mari de date de contact și depind de email, formulare, CRM-uri și integrări externe. Domeniul și conturile angajaților sunt ținte utile pentru fraude și impersonare.",
    priorities: ["Lead data", "Email identity", "Forms", "CRM access", "Availability"],
    risks: [
      "Formulare vulnerabile sau spam/abuz automatizat",
      "Impersonarea agenției prin email sau domenii similare",
      "Conturi compromise în CRM ori servicii SaaS",
      "Website lent, indisponibil sau infectat",
    ],
    outcomes: [
      "Formulare și website protejate la edge/aplicație",
      "Email authentication și anti-spoofing",
      "Acces mai controlat la instrumentele comerciale",
      "Hosting și recovery administrate",
    ],
    serviceSlugs: {
      cyber: "securitate-cibernetica-imobiliare",
      email: "securitate-email-imobiliare",
      website: "securitate-website-imobiliare",
      hosting: "hosting-securitate-agentii-imobiliare",
      maintenance: "mentenanta-wordpress-imobiliare",
    },
  },
  {
    slug: "horeca",
    legacyLabel: "HoReCa",
    title: "Securitate și continuitate pentru HoReCa",
    shortTitle: "HoReCa",
    description:
      "Protecție pentru rezervări, website, email, conturi și furnizori, cu accent pe disponibilitate și recuperare rapidă.",
    context:
      "Website-urile de prezentare, rezervările, comenzile și conturile administrate de mai multe persoane creează multe puncte de intrare. În HoReCa, perioadele cu trafic mare sunt exact momentele în care downtime-ul costă cel mai mult.",
    priorities: ["Reservations", "Availability", "Email", "Third parties", "Recovery"],
    risks: [
      "Website compromis sau indisponibil în perioade cu trafic mare",
      "Phishing și preluarea conturilor de email/social/admin",
      "Plugin-uri ori integrări neactualizate",
      "Lipsa unei copii curate și a unei proceduri rapide de restaurare",
    ],
    outcomes: [
      "Website protejat și monitorizat",
      "Actualizări și schimbări efectuate controlat",
      "Email/domain hardening",
      "Backup și procedură de recovery clară",
    ],
    serviceSlugs: {
      cyber: "securitate-cibernetica-horeca",
      email: "securitate-email-horeca",
      website: "securitate-website-horeca",
      hosting: "hosting-securitate-horeca",
      maintenance: "mentenanta-wordpress-horeca",
    },
  },
  {
    slug: "logistica",
    legacyLabel: "Producție & Logistică",
    title: "Cyber resilience pentru producție & logistică",
    shortTitle: "Producție & Logistică",
    description:
      "Protejăm identitățile, aplicațiile operaționale, emailul, furnizorii și continuitatea proceselor dependente de tehnologie.",
    context:
      "Producția și logistica depind de aplicații, tracking, ERP, furnizori și conturi privilegiate. O compromitere care întrerupe accesul sau datele poate avea efect operațional imediat, nu doar impact asupra website-ului.",
    priorities: ["Operational continuity", "Identity", "Third parties", "NIS2", "Recovery"],
    risks: [
      "Compromiterea conturilor privilegiate sau remote access",
      "Phishing în lanțul de furnizori și schimburi de documente",
      "Vulnerabilități în aplicații expuse și servicii de tracking",
      "Dependență de sisteme fără recovery testat",
    ],
    outcomes: [
      "Identity și access controls mai stricte",
      "Vulnerability management pentru activele prioritare",
      "Supply-chain risk și NIS2 readiness integrate",
      "Planuri de incident și recovery orientate operațional",
    ],
    serviceSlugs: {
      cyber: "securitate-cibernetica-logistica",
      email: "securitate-email-logistica",
      website: "securitate-website-logistica",
      hosting: "hosting-securitate-productie-logistica",
      maintenance: "mentenanta-wordpress-logistica",
    },
  },
  {
    slug: "educatie",
    legacyLabel: "Educație",
    title: "Securitate, privacy și accesibilitate pentru educație",
    shortTitle: "Educație",
    description:
      "Protejăm platformele, conturile și datele elevilor/studenților, integrând securitatea cu GDPR și accesibilitatea serviciilor digitale.",
    context:
      "Instituțiile educaționale au utilizatori numeroși, roluri diferite și multe platforme publice sau SaaS. Identitatea, privacy și accesibilitatea trebuie gestionate fără a bloca utilizarea de zi cu zi.",
    priorities: ["Student data", "Identity", "GDPR", "Accessibility", "Website security"],
    risks: [
      "Conturi compromise prin parole reutilizate sau phishing",
      "Expunerea datelor elevilor, studenților sau personalului",
      "Website-uri și LMS-uri cu extensii vulnerabile",
      "Servicii digitale inaccesibile sau slab guvernate",
    ],
    outcomes: [
      "Identity baseline și MFA unde este posibil",
      "Website/LMS hardening și patching disciplinat",
      "GDPR și accessibility urmărite împreună cu security",
      "Backup și recovery pentru serviciile esențiale",
    ],
    serviceSlugs: {
      cyber: "securitate-cibernetica-educatie",
      email: "securitate-email-educatie",
      website: "securitate-website-educatie",
      hosting: "hosting-securitate-educatie",
      maintenance: "mentenanta-wordpress-educatie",
    },
  },
  {
    slug: "ong",
    legacyLabel: "ONG-uri",
    title: "Securitate pragmatică pentru ONG-uri",
    shortTitle: "ONG-uri",
    description:
      "Un baseline realist pentru email, website, date, SaaS și recovery, potrivit echipelor mici și infrastructurii distribuite.",
    context:
      "ONG-urile lucrează adesea cu echipe mici, voluntari, servicii SaaS și bugete controlate, dar pot procesa date sensibile despre beneficiari, donatori și parteneri. Programul trebuie să reducă riscul fără administrare inutilă.",
    priorities: ["Email", "SaaS", "Donor data", "Website", "Backups"],
    risks: [
      "Phishing și compromiterea conturilor partajate",
      "Acces rămas activ după schimbarea voluntarilor sau colaboratorilor",
      "Website neactualizat ori infectat",
      "Date dispersate în servicii SaaS fără ownership clar",
    ],
    outcomes: [
      "Baseline de acces și MFA",
      "Email/domain protection",
      "Website maintenance și security",
      "Inventar simplu de servicii, ownership și backup",
    ],
    serviceSlugs: {
      cyber: "securitate-cibernetica-ong",
      email: "securitate-email-ong",
      website: "securitate-website-ong",
      hosting: "hosting-securitate-ong",
      maintenance: "mentenanta-wordpress-ong",
    },
  },
];

export const findIndustryBySlug = (slug: string) =>
  zebraByteIndustries.find((industry) => industry.slug === slug);

export const findIndustryServiceByLegacySlug = (legacySlug: string) => {
  for (const industry of zebraByteIndustries) {
    for (const [service, slug] of Object.entries(industry.serviceSlugs)) {
      if (slug === legacySlug) {
        return {
          industry,
          service: service as IndustryServiceKey,
          meta: industryServiceMeta[service as IndustryServiceKey],
        };
      }
    }
  }
  return undefined;
};

export const legacyIndustryServiceSlugs = zebraByteIndustries.flatMap((industry) =>
  Object.values(industry.serviceSlugs),
);
