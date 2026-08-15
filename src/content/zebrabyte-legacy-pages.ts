export type LegacyZebraBytePage = {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  intro: string;
  features: { title: string; description: string }[];
  processTitle: string;
  process: string[];
  related: { label: string; href: string }[];
  note?: string;
  noIndex?: boolean;
};

export const legacyZebraBytePages: LegacyZebraBytePage[] = [
  {
    slug: "certificat-ssl",
    title: "Certificat SSL & HTTPS",
    eyebrow: "TLS / SSL",
    description:
      "Ce este un certificat SSL, cum funcționează HTTPS, reînnoirea automată și utilizarea certificatelor wildcard pentru subdomenii.",
    intro:
      "Un certificat TLS/SSL criptează conexiunea dintre browser și server și permite folosirea HTTPS. Pagina ZebraByte anterioară explica diferența dintre certificatele gratuite și cele comerciale, reînnoirea automată și certificatele wildcard; păstrăm aceste informații în noua experiență Probo.",
    features: [
      {
        title: "Criptarea conexiunii",
        description:
          "Datele transmise între browser și server sunt protejate în tranzit prin TLS, inclusiv autentificări, formulare și alte informații sensibile.",
      },
      {
        title: "Certificate gratuite și comerciale",
        description:
          "Certificate precum Let’s Encrypt pot oferi criptare standard fără costul certificatului; produsele comerciale pot adăuga alte forme de validare sau suport, în funcție de emitent.",
      },
      {
        title: "Reînnoire automată",
        description:
          "Expirarea certificatului poate întrerupe accesul normal prin HTTPS. În infrastructura administrată, reînnoirea și verificarea pot fi automatizate.",
      },
      {
        title: "Wildcard și subdomenii",
        description:
          "Pentru arhitecturi cu mai multe subdomenii se pot utiliza certificate wildcard sau certificate SAN, în funcție de structură și cerințe.",
      },
      {
        title: "HTTPS forțat",
        description:
          "Configurăm redirectarea către HTTPS și verificăm să nu existe resurse importante încărcate nesecurizat sau configurații TLS incoerente.",
      },
      {
        title: "Certificate management",
        description:
          "Inventarierea certificatelor, termenelor și domeniilor reduce riscul ca un serviciu să rămână cu un certificat expirat sau configurat greșit.",
      },
    ],
    processTitle: "TLS gestionat ca parte din infrastructură",
    process: [
      "Identificăm domeniile și subdomeniile care trebuie acoperite.",
      "Emitem sau importăm certificatul potrivit și validăm chain-ul.",
      "Forțăm HTTPS și verificăm configurația serviciului.",
      "Automatizăm reînnoirea și monitorizăm expirarea unde infrastructura permite.",
    ],
    related: [
      { label: "Website Security", href: "/website-security" },
      { label: "Secure Managed Hosting", href: "/secure-hosting" },
      { label: "Security Assessment", href: "/security-assessment" },
    ],
  },
  {
    slug: "securitate-servere",
    title: "Securitate pentru servere & infrastructură",
    eyebrow: "Infrastructure Security",
    description:
      "Hardening, izolare, WAF, anti-DDoS, backup, access control și monitorizare pentru infrastructura care rulează aplicațiile ZebraByte.",
    intro:
      "Pagina ZebraByte anterioară descria securitatea la nivel de platformă: roluri separate, protecția aplicațiilor, backup izolat, 2FA, permisiuni granulare și servicii de email separate. Păstrăm arhitectura conceptuală, fără a transforma afirmațiile comerciale vechi în garanții neverificate.",
    features: [
      {
        title: "Izolare pe servicii și workload-uri",
        description:
          "Separarea rolurilor web, baze de date și servicii auxiliare limitează blast radius-ul și permite politici diferite de acces și rețea.",
      },
      {
        title: "WAF & protecție la edge",
        description:
          "Filtrarea atacurilor comune, rate limiting și protecția DDoS reduc traficul malițios înainte să consume resursele aplicației.",
      },
      {
        title: "Backup izolat",
        description:
          "Backup-urile trebuie păstrate separat de mediul live, cu retenție și restaurare verificabile, pentru a rămâne utile și după compromiterea sistemului principal.",
      },
      {
        title: "Access control & MFA",
        description:
          "Conturile administrative primesc acces minim necesar, autentificare puternică și procese de revocare atunci când rolurile se schimbă.",
      },
      {
        title: "Security headers & TLS",
        description:
          "HSTS, CSP și alte headere sunt configurate în funcție de aplicație și combinate cu TLS corect, fără a bloca integrările legitime.",
      },
      {
        title: "Monitoring & recovery",
        description:
          "Disponibilitatea, semnalele de securitate și procesele de restaurare sunt tratate împreună, nu ca servicii complet separate.",
      },
    ],
    processTitle: "De la server expus la infrastructură administrată",
    process: [
      "Inventariem serviciile, porturile, conturile și fluxurile de date.",
      "Aplicăm hardening și reducem suprafața de atac.",
      "Separăm și protejăm accesul administrativ, backup-ul și serviciile publice.",
      "Monitorizăm schimbările și pregătim recovery-ul înainte de incident.",
    ],
    related: [
      { label: "Secure Managed Hosting", href: "/secure-hosting" },
      { label: "Cyber Security", href: "/cyber-security" },
      { label: "Incident Response", href: "/incident-response" },
    ],
  },
  {
    slug: "migrare-site",
    title: "Migrare website, WordPress & aplicații",
    eyebrow: "Migration",
    description:
      "Migrare controlată a website-urilor, magazinelor online și aplicațiilor către o infrastructură nouă, cu testare, DNS/TLS și plan de rollback.",
    intro:
      "ZebraByte a avut o pagină dedicată migrărilor WordPress, e-commerce și aplicațiilor. Păstrăm procesul: mediul nou este pregătit în paralel, datele sunt copiate și testate, iar comutarea are loc numai după validare.",
    features: [
      {
        title: "WordPress & CMS",
        description:
          "Fișierele, baza de date, media, plugin-urile și configurațiile sunt transferate și verificate pe mediul nou înainte de schimbarea DNS.",
      },
      {
        title: "E-commerce",
        description:
          "Pentru magazine verificăm comenzile, stocurile, plățile, emailurile tranzacționale și integrările înainte de cutover.",
      },
      {
        title: "Aplicații & baze de date",
        description:
          "Migrările de aplicații includ dependențe, variabile de mediu, baze de date, storage și verificarea fluxurilor externe.",
      },
      {
        title: "DNS & TLS",
        description:
          "Pregătim certificatele, DNS-ul și ferestrele de schimbare pentru ca domeniul să continue să funcționeze corect după mutare.",
      },
      {
        title: "SEO & redirects",
        description:
          "Dacă URL-urile sau domeniul se schimbă, verificăm redirectările, canonical, robots și sitemap pentru a reduce riscul SEO.",
      },
      {
        title: "Rollback",
        description:
          "Mediul vechi nu este oprit înainte ca serviciul nou să fie verificat; planul de rollback rămâne disponibil în perioada de cutover.",
      },
    ],
    processTitle: "Migrare în patru faze",
    process: [
      "Analiză a mediului actual, dependențelor și riscurilor.",
      "Copiere și configurare pe mediul nou, în paralel cu producția.",
      "Testare funcțională, securitate, performanță și SEO unde este relevant.",
      "Cutover DNS, monitorizare și păstrarea temporară a opțiunii de rollback.",
    ],
    related: [
      { label: "Secure Managed Hosting", href: "/secure-hosting" },
      { label: "Website Security", href: "/website-security" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    slug: "wordpress-maintenance",
    title: "Mentenanță & administrare WordPress",
    eyebrow: "WordPress Maintenance",
    description:
      "Actualizări controlate, backup, security checks, performance maintenance și rollback pentru website-uri WordPress.",
    intro:
      "Mentenanța WordPress din ZebraByte nu dispare din noul site. O păstrăm ca serviciu operațional pentru clienții care folosesc WordPress, dar o conectăm la Website Security și Secure Managed Hosting în loc să fie o ofertă IT izolată.",
    features: [
      {
        title: "Actualizări controlate",
        description:
          "Core, teme și plugin-uri sunt actualizate după verificarea compatibilității, cu backup și posibilitate de rollback înainte de schimbări importante.",
      },
      {
        title: "Backup & recovery",
        description:
          "Copiile de siguranță sunt parte din procesul de schimbare, nu doar o funcție activată și uitată. Restaurarea trebuie să poată fi executată atunci când apare o problemă.",
      },
      {
        title: "Security checks",
        description:
          "Verificăm versiuni vulnerabile, modificări suspecte, conturi administrative, configurări WordPress și semnale de compromitere.",
      },
      {
        title: "Performance maintenance",
        description:
          "Curățarea datelor inutile, caching-ul și verificarea resurselor sunt făcute fără a sacrifica integritatea aplicației sau procesul de backup.",
      },
      {
        title: "Uptime & functionality",
        description:
          "Monitorizarea disponibilității și verificările după schimbări ajută la detectarea rapidă a regresiilor care afectează utilizatorii.",
      },
      {
        title: "Staging",
        description:
          "Pentru schimbări cu risc mai mare folosim un mediu de test sau o clonă înainte de a aplica modificarea direct în producție.",
      },
    ],
    processTitle: "Ciclul de mentenanță",
    process: [
      "Backup și verificarea stării curente.",
      "Actualizări și modificări controlate, preferabil testate înainte.",
      "Security/performance checks după schimbare.",
      "Monitorizare, documentare și rollback dacă apar regresii.",
    ],
    related: [
      { label: "Website Security", href: "/website-security" },
      { label: "Secure Managed Hosting", href: "/secure-hosting" },
      { label: "Industries", href: "/industries" },
    ],
  },
  {
    slug: "serviciigdprromania",
    title: "Servicii GDPR România",
    eyebrow: "GDPR & Privacy",
    description:
      "Data mapping, DPA, breach response, privacy governance, training și consent management conectate la măsurile tehnice ale organizației.",
    intro:
      "Pagina GDPR România din ZebraByte acoperea cartografierea datelor, acorduri DPA, răspuns la breșe, suport DPO, training și cookie consent. Aceste capabilități sunt păstrate și legate acum de pagina principală GDPR și Compliance Portal.",
    features: [
      {
        title: "Data mapping & RoPA",
        description:
          "Identificăm categoriile de date, scopurile, sistemele, destinatarii, retenția și responsabilitățile astfel încât privacy governance să reflecte fluxurile reale.",
      },
      {
        title: "DPA & vendor controls",
        description:
          "Acordurile cu procesatorii și verificarea furnizorilor sunt urmărite împreună cu accesul și datele efectiv partajate.",
      },
      {
        title: "Data breach readiness",
        description:
          "Pregătim procesul intern pentru evaluarea și gestionarea incidentelor care implică date cu caracter personal și pentru escaladarea către responsabilitățile legale relevante.",
      },
      {
        title: "Privacy risk & DPIA",
        description:
          "Evaluările de risc și DPIA sunt folosite acolo unde activitatea o cere, cu legături către controalele tehnice și organizaționale.",
      },
      {
        title: "Training & awareness",
        description:
          "Personalul trebuie să înțeleagă manipularea datelor, phishing-ul, raportarea incidentelor și limitele accesului, nu doar să semneze o politică.",
      },
      {
        title: "Consent & web controls",
        description:
          "Cookie consent, formulare și tracking sunt configurate în funcție de tehnologiile reale folosite de website și de bazele legale aplicabile.",
      },
    ],
    processTitle: "Privacy governance conectat la tehnologie",
    process: [
      "Mapăm datele, sistemele și furnizorii.",
      "Identificăm riscurile, documentele și controalele necesare.",
      "Implementăm măsurile tehnice și organizaționale prioritare.",
      "Păstrăm dovezile și revizuim schimbările în timp.",
    ],
    related: [
      { label: "GDPR & Privacy", href: "/gdpr" },
      { label: "Compliance Portal", href: "/compliance-portal" },
      { label: "Cookie compliance", href: "/cookie-banner-conformitate-gdpr" },
    ],
  },
  {
    slug: "cookie-banner-conformitate-gdpr",
    title: "Cookie consent & web privacy controls",
    eyebrow: "Consent Management",
    description:
      "Categorii de consimțământ, blocarea scripturilor înainte de acord, audit trail și integrarea tracking-ului cu politica de privacy.",
    intro:
      "ZebraByte avea o pagină separată pentru cookie banner. O păstrăm: diferența importantă nu este prezența unui pop-up, ci dacă scripturile, categoriile și dovada alegerilor sunt configurate conform tehnologiilor folosite efectiv de site.",
    features: [
      {
        title: "Categorii de consimțământ",
        description:
          "Cookie-urile și tehnologiile similare sunt grupate în categorii relevante, iar utilizatorul poate controla opțiunile care nu sunt strict necesare.",
      },
      {
        title: "Script blocking",
        description:
          "Scripturile care necesită consimțământ sunt împiedicate să ruleze înainte ca alegerea utilizatorului să fie cunoscută.",
      },
      {
        title: "Audit trail",
        description:
          "Soluția poate păstra dovezi despre alegerea și configurația consimțământului, în funcție de CMP și implementare.",
      },
      {
        title: "Tagging & analytics",
        description:
          "Google tags, analytics, advertising și alte integrări sunt inventariate și mapate la categoriile și regulile de consimțământ relevante.",
      },
      {
        title: "Privacy policy alignment",
        description:
          "Bannerul și politica trebuie să descrie aceleași tehnologii și scopuri; configurarea este revizuită atunci când stack-ul website-ului se schimbă.",
      },
      {
        title: "Brand & accessibility",
        description:
          "Interfața de consimțământ este integrată vizual fără dark patterns și trebuie să rămână utilizabilă cu tastatura și tehnologii asistive.",
      },
    ],
    processTitle: "Configurare, nu doar instalare",
    process: [
      "Inventariem cookie-urile, tag-urile și scripturile terțe.",
      "Stabilim categoriile și mecanismele care trebuie blocate sau permise.",
      "Configurăm CMP-ul și testăm accept/refuz/retragere.",
      "Revizuim periodic atunci când apar noi tag-uri, furnizori sau scopuri.",
    ],
    related: [
      { label: "GDPR & Privacy", href: "/gdpr" },
      { label: "Servicii GDPR România", href: "/serviciigdprromania" },
      { label: "Accessibility", href: "/accessibility" },
    ],
  },
  {
    slug: "email-marketing",
    title: "Email marketing — serviciu legacy ZebraByte",
    eyebrow: "Legacy Service",
    description:
      "Conținutul vechi ZebraByte despre email marketing este păstrat pentru continuitate, dar nu face parte din poziționarea principală cybersecurity-first.",
    intro:
      "ZebraByte a oferit și servicii de email marketing. Nu ștergem această parte din website; o păstrăm ca serviciu legacy și o separăm de Email Security, pentru a nu amesteca livrabilitatea/campaniile cu protecția domeniului și a conturilor.",
    features: [
      { title: "Campaign setup", description: "Configurarea campaniilor, segmentelor și fluxurilor comerciale rămâne o capabilitate legacy documentată." },
      { title: "Deliverability basics", description: "SPF, DKIM și DMARC sunt relevante pentru livrabilitate, dar implementarea lor de securitate este gestionată prin Email Security." },
      { title: "Consent", description: "Listele și formularele trebuie conectate la regulile de consent/privacy aplicabile activității." },
      { title: "Unsubscribe", description: "Fluxurile de dezabonare și preferințele utilizatorilor trebuie respectate și sincronizate cu instrumentele folosite." },
      { title: "Provider configuration", description: "Domeniile de tracking, expeditorii și configurarea furnizorului pot afecta reputația și livrabilitatea." },
      { title: "Security separation", description: "Campaniile de marketing nu sunt tratate ca substitut pentru securitatea inbox-ului, anti-phishing sau account protection." },
    ],
    processTitle: "Serviciu păstrat, dar separat de cybersecurity",
    process: [
      "Clarificăm scopul și baza listei de destinatari.",
      "Configurăm expeditorul și instrumentele necesare.",
      "Testăm livrabilitatea și mecanismele de preferințe/dezabonare.",
      "Menținem securitatea domeniului în serviciul separat Email Security.",
    ],
    related: [
      { label: "Email Security", href: "/email-security" },
      { label: "GDPR & Privacy", href: "/gdpr" },
      { label: "Contact", href: "/contact" },
    ],
    noIndex: true,
  },
];

export const legacyZebraBytePageBySlug = (slug: string) =>
  legacyZebraBytePages.find((page) => page.slug === slug);
