import {cmsLink, localizedRichText, localizedString, localizedText} from "./helpers.mjs";

const keyedLocalized = (key, ro, en) => ({_key: key, ...localizedString(ro, en)});
const faq = (key, questionRo, questionEn, answerRo, answerEn) => ({
  _key: key,
  _type: "faqItem",
  question: localizedString(questionRo, questionEn),
  answer: localizedRichText(`${key}-answer`, answerRo, answerEn),
});

export const managedComplianceDocument = {
  _id: "page.managed-compliance",
  _type: "page",
  internalName: "Managed Compliance",
  path: "/managed-compliance",
  pageType: "compliance",
  seo: {
    _type: "seo",
    title: localizedString("Managed Compliance", "Managed Compliance"),
    description: localizedText(
      "Managed Compliance ZebraByte: platformă cloud și expert dedicat pentru controls, evidence, risk, policies, third parties, remediation și audit readiness continuă.",
      "ZebraByte Managed Compliance: cloud platform and dedicated expert for controls, evidence, risk, policies, third parties, remediation and continuous audit readiness.",
    ),
    noIndex: false,
    structuredDataType: "Service",
  },
  showHeader: true,
  showFooter: true,
  showFooterFrameworks: true,
  hideFromNavigation: false,
  sections: [
    {
      _key: "managed-hero",
      _type: "heroSection",
      enabled: true,
      variant: "animated",
      theme: "default",
      density: "normal",
      eyebrow: localizedString("Managed Compliance", "Managed Compliance"),
      title: localizedString("Compliance,", "Compliance,"),
      highlight: localizedString("gestionat împreună cu tine.", "managed together with you."),
      description: localizedText(
        "Un specialist ZebraByte coordonează programul de conformitate de la scope și risk până la controls, evidence, remediation și audit readiness. Echipa ta păstrează ownership-ul real, iar noi reducem munca operațională și ținem programul în mișcare.",
        "A ZebraByte specialist coordinates the compliance programme from scope and risk through controls, evidence, remediation and audit readiness. Your team keeps real ownership while we reduce operational work and keep the programme moving.",
      ),
      primaryCta: cmsLink({
        labelRo: "Vezi platforma",
        labelEn: "See the platform",
        href: "/compliance-platform",
        style: "secondary",
      }),
      secondaryCta: cmsLink({
        labelRo: "Discută cu un expert",
        labelEn: "Talk to an expert",
        href: "/contact",
        style: "primary",
      }),
      showFrameworkBadges: true,
      showReferenceLogos: false,
    },
    {
      _key: "managed-compliance-track",
      _type: "siteBlockSection",
      enabled: true,
      theme: "default",
      density: "compact",
      component: "complianceTrack",
    },
    {
      _key: "managed-autopilot",
      _type: "mediaGridSection",
      enabled: true,
      theme: "default",
      density: "normal",
      columns: 2,
      title: localizedString(
        "Programul rulează continuu, nu doar înainte de audit",
        "The programme runs continuously, not only before an audit",
      ),
      description: localizedText(
        "Folosim platforma ZebraByte pentru a păstra controls, evidence, risk și documentele conectate, iar specialistul dedicat urmărește ce trebuie făcut în continuare.",
        "We use the ZebraByte platform to keep controls, evidence, risk and documents connected, while the dedicated specialist tracks what needs to happen next.",
      ),
      items: [
        {
          _key: "managed-expert",
          _type: "mediaGridItem",
          title: localizedString("Un expert dedicat programului", "A dedicated programme expert"),
          body: localizedRichText(
            "managed-expert",
            "Ai un owner clar pentru program, care coordonează politicile, controalele, evaluările, evidence-ul și pregătirea pentru review-uri sau audit.",
            "You have a clear programme owner who coordinates policies, controls, assessments, evidence and preparation for reviews or audits.",
          ),
          media: {
            _type: "mediaAsset",
            videoUrl: "https://www.zebrabyte.ro/videos/keyshot1.mp4",
            alt: localizedString("Expert dedicat programului", "Dedicated programme expert"),
          },
        },
        {
          _key: "managed-evidence",
          _type: "mediaGridItem",
          title: localizedString("Evidence care se menține în fundal", "Evidence maintained in the background"),
          body: localizedRichText(
            "managed-evidence",
            "Dovezile, aprobările și review-urile sunt urmărite pe parcurs, astfel încât audit readiness să nu înceapă cu reconstruirea ultimelor luni de activitate.",
            "Evidence, approvals and reviews are tracked continuously so audit readiness does not begin by reconstructing months of past activity.",
          ),
          media: {
            _type: "mediaAsset",
            videoUrl: "https://www.zebrabyte.ro/videos/keyshot2.mp4",
            alt: localizedString("Evidence menținut continuu", "Continuously maintained evidence"),
          },
        },
        {
          _key: "managed-trust",
          _type: "mediaGridItem",
          title: localizedString("Trust pentru clienți și parteneri", "Trust for customers and partners"),
          body: localizedRichText(
            "managed-trust",
            "Când trebuie să demonstrezi postura de securitate, documentele aprobate pot fi distribuite controlat prin Trust Center fără să expui workspace-ul intern.",
            "When you need to demonstrate your security posture, approved documents can be shared in a controlled way through the Trust Center without exposing the internal workspace.",
          ),
          media: {
            _type: "mediaAsset",
            videoUrl: "https://www.zebrabyte.ro/videos/keyshot3.mp4",
            alt: localizedString("Trust Center pentru clienți", "Customer Trust Center"),
          },
        },
        {
          _key: "managed-team",
          _type: "mediaGridItem",
          title: localizedString("Lucru integrat cu echipa ta", "Integrated work with your team"),
          body: localizedRichText(
            "managed-team",
            "Programul este construit în jurul modului în care funcționează organizația, cu owners interni și intervenții clare doar atunci când este nevoie de decizie, validare sau acțiune tehnică.",
            "The programme is built around how your organisation operates, with internal owners and clear interventions only when a decision, validation or technical action is required.",
          ),
          media: {
            _type: "mediaAsset",
            videoUrl: "https://www.zebrabyte.ro/videos/keyshot4.mp4",
            alt: localizedString("Program integrat cu echipa", "Programme integrated with the team"),
          },
        },
      ],
    },
    {
      _key: "managed-responsibilities",
      _type: "comparisonTableSection",
      enabled: true,
      theme: "default",
      density: "normal",
      title: localizedString("Cine face ce", "Who does what"),
      description: localizedText(
        "Managed nu înseamnă să inventăm ownership în locul organizației. Separăm clar munca pe care o putem coordona de deciziile și activitățile care trebuie să rămână la ownerii reali ai proceselor.",
        "Managed does not mean inventing ownership on behalf of the organisation. We clearly separate the work we can coordinate from decisions and activities that must remain with the real process owners.",
      ),
      columns: [
        keyedLocalized("area", "Arie", "Area"),
        keyedLocalized("zebra", "ZebraByte", "ZebraByte"),
        keyedLocalized("client", "Echipa ta", "Your team"),
      ],
      rows: [
        {
          _key: "programme-governance",
          _type: "comparisonRow",
          label: localizedString("Program & governance", "Programme & governance"),
          values: [
            keyedLocalized("zebra", "Structură, calendar de review, follow-up și coordonarea programului.", "Structure, review calendar, follow-up and programme coordination."),
            keyedLocalized("client", "Deciziile de business, risk acceptance și ownerii interni.", "Business decisions, risk acceptance and internal owners."),
          ],
        },
        {
          _key: "controls-evidence",
          _type: "comparisonRow",
          label: localizedString("Controls & evidence", "Controls & evidence"),
          values: [
            keyedLocalized("zebra", "Mapping, evidence plan, review de calitate și urmărirea gap-urilor.", "Mapping, evidence plan, quality review and gap tracking."),
            keyedLocalized("client", "Execută sau confirmă activitățile care aparțin proceselor interne.", "Performs or confirms activities that belong to internal processes."),
          ],
        },
        {
          _key: "policies-documents",
          _type: "comparisonRow",
          label: localizedString("Policies & documents", "Policies & documents"),
          values: [
            keyedLocalized("zebra", "Structură, draft, versioning, approvals și calendar de revizuire.", "Structure, drafting, versioning, approvals and review calendar."),
            keyedLocalized("client", "Aprobă conținutul și confirmă că reflectă modul real de lucru.", "Approves content and confirms it reflects the real operating model."),
          ],
        },
        {
          _key: "risk-third-parties",
          _type: "comparisonRow",
          label: localizedString("Risk & third parties", "Risk & third parties"),
          values: [
            keyedLocalized("zebra", "Metodologie, register, reviews și legătura cu măsurile de tratare.", "Methodology, register, reviews and linkage to treatment measures."),
            keyedLocalized("client", "Context operațional, priorități și decizii privind acceptarea riscului.", "Operational context, priorities and risk acceptance decisions."),
          ],
        },
        {
          _key: "audit-readiness",
          _type: "comparisonRow",
          label: localizedString("Audit readiness", "Audit readiness"),
          values: [
            keyedLocalized("zebra", "Gap tracking, evidence pack, pregătirea ownerilor și follow-up.", "Gap tracking, evidence pack, owner preparation and follow-up."),
            keyedLocalized("client", "Participă acolo unde auditorul are nevoie de owner-ul real al procesului.", "Participates where the auditor needs the real process owner."),
          ],
        },
      ],
    },
    {
      _key: "managed-frameworks",
      _type: "cardGridSection",
      enabled: true,
      theme: "default",
      density: "normal",
      variant: "link-cards",
      columns: 2,
      title: localizedString("Un program, mai multe framework-uri", "One programme, multiple frameworks"),
      description: localizedText(
        "Nu reconstruim aceeași muncă de la zero pentru fiecare standard. Acolo unde cerințele se suprapun, aceleași controls, risks și evidence pot susține mai multe obiective de conformitate.",
        "We do not rebuild the same work from scratch for every standard. Where requirements overlap, the same controls, risks and evidence can support multiple compliance objectives.",
      ),
      cards: [
        {_key: "iso", _type: "contentCard", title: localizedString("ISO/IEC 27001", "ISO/IEC 27001"), description: localizedText("ISMS, risk treatment, controls, Statement of Applicability și audit readiness.", "ISMS, risk treatment, controls, Statement of Applicability and audit readiness."), link: cmsLink({labelRo: "ISO/IEC 27001", labelEn: "ISO/IEC 27001", href: "/iso-27001"})},
        {_key: "soc2", _type: "contentCard", title: localizedString("SOC 2", "SOC 2"), description: localizedText("Trust Services Criteria, controls, evidence și pregătire pentru engagement-ul auditorului.", "Trust Services Criteria, controls, evidence and preparation for the auditor engagement."), link: cmsLink({labelRo: "SOC 2", labelEn: "SOC 2", href: "/soc2"})},
        {_key: "gdpr", _type: "contentCard", title: localizedString("GDPR & Privacy", "GDPR & Privacy"), description: localizedText("Data mapping, RoPA, DPIA, third parties, privacy governance și măsuri tehnice.", "Data mapping, RoPA, DPIA, third parties, privacy governance and technical measures."), link: cmsLink({labelRo: "GDPR & Privacy", labelEn: "GDPR & Privacy", href: "/gdpr"})},
        {_key: "nis2", _type: "contentCard", title: localizedString("NIS2", "NIS2"), description: localizedText("Cyber risk, resilience, supplier security, incident readiness și evidence continuu.", "Cyber risk, resilience, supplier security, incident readiness and continuous evidence."), link: cmsLink({labelRo: "NIS2", labelEn: "NIS2", href: "/nis2"})},
        {_key: "accessibility", _type: "contentCard", title: localizedString("Accessibility", "Accessibility"), description: localizedText("Assessment, remediation și managementul continuu al accesibilității web.", "Assessment, remediation and continuous web accessibility management."), link: cmsLink({labelRo: "Accesibilitate", labelEn: "Accessibility", href: "/accessibility"})},
      ],
    },
    {_key: "managed-testimonials", _type: "siteBlockSection", enabled: true, theme: "default", density: "compact", component: "testimonials"},
    {_key: "managed-stories", _type: "siteBlockSection", enabled: true, theme: "default", density: "compact", component: "stories"},
    {
      _key: "managed-faq",
      _type: "faqSection",
      enabled: true,
      theme: "default",
      density: "normal",
      title: localizedString("Întrebări frecvente", "Frequently asked questions"),
      items: [
        faq("self-service", "Care este diferența dintre platforma self-service și Managed Compliance?", "What is the difference between the self-service platform and Managed Compliance?", "Platforma este aceeași. În self-service, echipa sau adviser-ul tău operează programul. În Managed Compliance, ZebraByte preia mai mult din coordonare, evidence, documente, follow-up și audit readiness împreună cu ownerii interni.", "The platform is the same. In self-service, your team or adviser operates the programme. With Managed Compliance, ZebraByte takes on more coordination, evidence, documents, follow-up and audit readiness together with internal owners."),
        faq("decisions", "ZebraByte poate lua toate deciziile de compliance în locul organizației?", "Can ZebraByte make all compliance decisions for the organisation?", "Nu. Deciziile de business, risk acceptance, responsabilitățile legale și activitățile care aparțin proceselor interne rămân la organizație. Rolul nostru este să reducem munca operațională și să ținem programul coerent și în mișcare.", "No. Business decisions, risk acceptance, legal responsibilities and activities belonging to internal processes remain with the organisation. Our role is to reduce operational work and keep the programme coherent and moving."),
        faq("framework", "Putem începe cu un singur framework și extinde ulterior?", "Can we start with one framework and expand later?", "Da. Programul poate porni de la ISO 27001, SOC 2, GDPR sau NIS2 și poate reutiliza controale, riscuri și dovezi atunci când cerințele se suprapun.", "Yes. The programme can start with ISO 27001, SOC 2, GDPR or NIS2 and reuse controls, risks and evidence where requirements overlap."),
        faq("remediation", "Managed Compliance include și remediation tehnică?", "Does Managed Compliance include technical remediation?", "Atunci când un gap cere o măsură tehnică, programul poate fi legat de security assessment, hardening, website security, email security, incident readiness sau infrastructură administrată. Scope-ul se stabilește în funcție de nevoia reală, nu prin adăugarea automată de servicii.", "When a gap requires a technical measure, the programme can connect to security assessment, hardening, website security, email security, incident readiness or managed infrastructure. Scope is set according to the real need rather than automatically adding services."),
        faq("certification", "ZebraByte emite certificări ISO sau rapoarte SOC 2?", "Does ZebraByte issue ISO certifications or SOC 2 reports?", "Nu. ZebraByte ajută la readiness, implementare, evidence și operarea programului. Certificarea sau raportul de atestare este emis de organismul sau auditorul independent competent pentru framework-ul respectiv.", "No. ZebraByte supports readiness, implementation, evidence and programme operation. Certification or the attestation report is issued by the competent independent certification body or auditor for the relevant framework."),
      ],
    },
    {
      _key: "managed-final-cta",
      _type: "ctaSection",
      enabled: true,
      theme: "default",
      density: "normal",
      variant: "centered",
      title: localizedString(
        "Construiește un program pe care îl poți menține după primul audit.",
        "Build a programme you can maintain after the first audit.",
      ),
      description: localizedText(
        "Poți folosi platforma direct sau poți lucra cu ZebraByte într-un model Managed Compliance, în funcție de cât ownership operațional vrei să păstrezi intern.",
        "You can use the platform directly or work with ZebraByte in a Managed Compliance model, depending on how much operational ownership you want to keep internally.",
      ),
      primaryCta: cmsLink({
        labelRo: "Discută despre Managed Compliance",
        labelEn: "Discuss Managed Compliance",
        href: "/contact",
        style: "primary",
      }),
    },
  ],
};
