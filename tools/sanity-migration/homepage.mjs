import {cmsLink, localizedRichText, localizedString, localizedText} from "./helpers.mjs";

export const homepageDocument = {
  _id: "page.homepage",
  _type: "page",
  internalName: "Homepage",
  path: "/",
  pageType: "landing",
  seo: {
    _type: "seo",
    title: localizedString(
      "Conformitate administrată & securitate cibernetică",
      "Managed compliance & cybersecurity",
    ),
    description: localizedText(
      "Conformitate administrată, securitate cibernetică și găzduire securizată într-un singur program ZebraByte, cu controale, dovezi și pregătire continuă pentru audit.",
      "Managed compliance, cybersecurity and secure managed hosting in one ZebraByte programme, with controls, evidence and continuous audit readiness.",
    ),
    noIndex: false,
    structuredDataType: "WebPage",
  },
  showHeader: true,
  showFooter: true,
  showFooterFrameworks: true,
  hideFromNavigation: false,
  sections: [
    {
      _key: "home-hero",
      _type: "heroSection",
      enabled: true,
      variant: "animated",
      theme: "default",
      density: "normal",
      eyebrow: localizedString(
        "Conformitate administrată · Securitate cibernetică",
        "Managed compliance · Cybersecurity",
      ),
      title: localizedString(
        "Conformitate și securitate,",
        "Compliance and security,",
      ),
      highlight: localizedString(
        "gestionate pentru tine.",
        "managed for you.",
      ),
      description: localizedText(
        "Un expert coordonează programul de conformitate de la început până la final, iar echipa de securitate cibernetică leagă controalele de măsuri tehnice reale: protecția aplicațiilor, securitatea emailului, răspunsul la incidente și infrastructura construită cu securitatea în centru.",
        "An expert coordinates the compliance programme from start to finish, while the cybersecurity team connects controls to real technical measures: application protection, email security, incident response and infrastructure built with security at its core.",
      ),
      primaryCta: cmsLink({
        labelRo: "Conformitate administrată",
        labelEn: "Managed Compliance",
        href: "/managed-compliance",
        style: "secondary",
      }),
      secondaryCta: cmsLink({
        labelRo: "Discută cu un expert",
        labelEn: "Talk to an Expert",
        href: "/contact",
        style: "primary",
      }),
      showFrameworkBadges: true,
      showReferenceLogos: true,
    },
    {
      _key: "compliance-track",
      _type: "siteBlockSection",
      enabled: true,
      theme: "default",
      density: "compact",
      component: "complianceTrack",
    },
    {
      _key: "autopilot",
      _type: "mediaGridSection",
      enabled: true,
      theme: "default",
      density: "normal",
      columns: 2,
      title: localizedString(
        "Pune conformitatea și securitatea pe pilot automat",
        "Put compliance and security on autopilot",
      ),
      description: localizedText(
        "Rulează programul cu o combinație de expertiză și automatizare. ZebraByte urmărește controalele, dovezile și riscurile, iar măsurile tehnice sunt implementate și menținute în același model operațional.",
        "Run the programme with a combination of expertise and automation. ZebraByte tracks controls, evidence and risks, while technical measures are implemented and maintained within the same operating model.",
      ),
      items: [
        {
          _key: "dedicated-expert",
          _type: "mediaGridItem",
          title: localizedString(
            "Expert dedicat pentru conformitate",
            "Dedicated compliance expert",
          ),
          body: localizedRichText(
            "dedicated-expert",
            "Un specialist coordonează politicile, controalele, evaluările de risc, evaluările furnizorilor, cerințele de accesibilitate și pregătirea pentru audit, ca extensie a echipei tale.",
            "A specialist coordinates policies, controls, risk assessments, vendor assessments, accessibility requirements and audit readiness as an extension of your team.",
          ),
          media: {
            _type: "mediaAsset",
            videoUrl: "https://www.zebrabyte.ro/videos/keyshot1.mp4",
            alt: localizedString(
              "Expert dedicat pentru conformitate",
              "Dedicated compliance expert",
            ),
          },
        },
        {
          _key: "background-compliance",
          _type: "mediaGridItem",
          title: localizedString(
            "Conformitate care rulează în fundal",
            "Compliance running in the background",
          ),
          body: localizedRichText(
            "background-compliance",
            "Colectarea dovezilor, aprobările și acțiunile repetitive sunt automatizate, iar echipa urmărește schimbările care pot afecta postura de conformitate.",
            "Evidence collection, approvals and repetitive actions are automated, while the team tracks changes that can affect your compliance posture.",
          ),
          media: {
            _type: "mediaAsset",
            videoUrl: "https://www.zebrabyte.ro/videos/keyshot2.mp4",
            alt: localizedString(
              "Automatizare continuă a conformității",
              "Continuous compliance automation",
            ),
          },
        },
        {
          _key: "real-security",
          _type: "mediaGridItem",
          title: localizedString(
            "Transformă controalele în securitate reală",
            "Turn controls into real security",
          ),
          body: localizedRichText(
            "real-security",
            "Evaluarea de securitate, protecția site-ului și a emailului, consolidarea configurațiilor, gestionarea vulnerabilităților și găzduirea securizată susțin direct tratarea riscurilor și controalele asumate.",
            "Security assessment, website and email protection, configuration hardening, vulnerability management and secure hosting directly support risk treatment and committed controls.",
          ),
          media: {
            _type: "mediaAsset",
            videoUrl: "https://www.zebrabyte.ro/videos/keyshot3.mp4",
            alt: localizedString(
              "Securitate tehnică legată de controale",
              "Technical security linked to controls",
            ),
          },
        },
        {
          _key: "single-program",
          _type: "mediaGridItem",
          title: localizedString(
            "Lucrează dintr-un singur program",
            "Work from one programme",
          ),
          body: localizedRichText(
            "single-program",
            "Documentele, acțiunile, dovezile, verificările și integrarea cu fluxurile de lucru ale echipei rămân centralizate, fără un catalog fragmentat de servicii fără legătură între ele.",
            "Documents, actions, evidence, checks and workflow integration stay centralised, without a fragmented catalogue of disconnected services.",
          ),
          media: {
            _type: "mediaAsset",
            videoUrl: "https://www.zebrabyte.ro/videos/keyshot4.mp4",
            alt: localizedString(
              "Program ZebraByte unificat",
              "Unified ZebraByte programme",
            ),
          },
        },
      ],
    },
    {
      _key: "zebrabyte-testimonials",
      _type: "siteBlockSection",
      enabled: true,
      theme: "default",
      density: "compact",
      component: "zebrabyteTestimonials",
    },
    {
      _key: "stories",
      _type: "siteBlockSection",
      enabled: true,
      theme: "default",
      density: "compact",
      component: "stories",
    },
  ],
};
