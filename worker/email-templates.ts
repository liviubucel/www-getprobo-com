export type EmailLocale = "ro" | "en";

const ORIGIN = "https://www.zebrabyte.ro";
const INK = "#111310";
const GREEN = "#142115";
const GREEN_SOFT = "#e9eee6";
const MUTED = "#6f716c";
const BORDER = "#d9d6cc";
const CANVAS = "#f2f1ec";
const PAPER = "#fffdf8";
const WHITE = "#ffffff";

const ART = {
  generic: `${ORIGIN}/linkedin-template-iso27001.png`,
  compliance: `${ORIGIN}/blog/What_are_the_steps_towards_compliance.png`,
  complianceSecondary: `${ORIGIN}/blog/The_case_for_open_source_compliance.png`,
  security: `${ORIGIN}/blog/SOC.png`,
  securitySecondary: `${ORIGIN}/blog/Do_you_need_penetration_test_for_iso27001.png`,
  isoTimeline: `${ORIGIN}/blog/ISO27001-timeline.jpg`,
  socCost: `${ORIGIN}/blog/SOC2-cost-illustration.jpg`,
} as const;

type Resource = {
  eyebrow: string;
  title: string;
  copy: string;
  url: string;
  cta: string;
  image: string;
  alt: string;
};

type EmailLayout = {
  locale: EmailLocale;
  preheader: string;
  eyebrow: string;
  title: string;
  intro?: string;
  heroImage: string;
  heroAlt: string;
  bodyHtml: string;
  footerHtml: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function recipientMessage(value: string): string {
  const normalized = value.replace(/\r\n?/g, "\n").trim();
  const marker = "Mesaj:";
  const markerIndex = normalized.lastIndexOf(marker);
  if (markerIndex === -1) return normalized;
  return normalized.slice(markerIndex + marker.length).trim() || normalized;
}

function button(label: string, url: string, inverse = false): string {
  const background = inverse ? WHITE : GREEN;
  const color = inverse ? GREEN : WHITE;
  const border = inverse ? `1px solid ${GREEN}` : `1px solid ${GREEN}`;

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 4px;">
    <tr>
      <td bgcolor="${background}" style="background:${background};border:${border};">
        <a href="${escapeHtml(url)}" style="display:inline-block;padding:12px 18px;color:${color};text-decoration:none;font-size:13px;font-weight:700;line-height:18px;">${escapeHtml(label)} →</a>
      </td>
    </tr>
  </table>`;
}

function messageBlock(label: string, value: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0;border-collapse:collapse;">
    <tr>
      <td width="4" bgcolor="${GREEN}" style="width:4px;background:${GREEN};font-size:0;line-height:0;">&nbsp;</td>
      <td style="padding:3px 0 3px 18px;">
        <div style="margin:0 0 8px;color:${MUTED};font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;">${escapeHtml(label)}</div>
        <div style="color:${INK};font-size:15px;line-height:1.72;">${escapeHtml(value).replace(/\n/g, "<br>")}</div>
      </td>
    </tr>
  </table>`;
}

function statStrip(locale: EmailLocale): string {
  const items = locale === "en"
    ? [
        ["01", "Received", "Your request is safely registered."],
        ["02", "Routed", "We match it to the relevant team."],
        ["03", "Follow-up", "You get a concrete next step."],
      ]
    : [
        ["01", "Înregistrată", "Solicitarea este înregistrată în siguranță."],
        ["02", "Direcționată", "O trimitem către echipa relevantă."],
        ["03", "Răspuns", "Primești un pas următor concret."],
      ];

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:30px 0 6px;border-top:1px solid ${BORDER};border-bottom:1px solid ${BORDER};">
    <tr>
      ${items
        .map(
          ([index, title, copy]) => `<td class="zbt-step" width="33.33%" valign="top" style="width:33.33%;padding:18px 14px 18px 0;">
            <div style="color:${GREEN};font-size:10px;font-weight:800;letter-spacing:.12em;">${index}</div>
            <div style="margin-top:8px;color:${INK};font-size:13px;font-weight:750;">${escapeHtml(title)}</div>
            <div style="margin-top:5px;color:${MUTED};font-size:11px;line-height:1.55;">${escapeHtml(copy)}</div>
          </td>`,
        )
        .join("")}
    </tr>
  </table>`;
}

function promo(resource: Resource): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:34px 0 8px;background:${GREEN_SOFT};border-top:1px solid ${BORDER};border-bottom:1px solid ${BORDER};">
    <tr>
      <td class="zbt-promo-image" width="43%" valign="top" style="width:43%;padding:0;">
        <img src="${escapeHtml(resource.image)}" width="250" alt="${escapeHtml(resource.alt)}" style="display:block;width:100%;max-width:250px;height:auto;border:0;outline:none;text-decoration:none;">
      </td>
      <td class="zbt-promo-copy" width="57%" valign="middle" style="width:57%;padding:22px 24px;">
        <div style="color:${GREEN};font-size:9px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;">${escapeHtml(resource.eyebrow)}</div>
        <h2 style="margin:8px 0 8px;color:${INK};font-size:21px;line-height:1.18;font-weight:700;letter-spacing:-.025em;">${escapeHtml(resource.title)}</h2>
        <p style="margin:0;color:${MUTED};font-size:12px;line-height:1.62;">${escapeHtml(resource.copy)}</p>
        ${button(resource.cta, resource.url)}
      </td>
    </tr>
  </table>`;
}

function resourceRail(locale: EmailLocale): string {
  const hubLabel = locale === "en" ? "Guides & practical resources" : "Ghiduri și resurse practice";
  const trustLabel = locale === "en" ? "Trust & security information" : "Informații de trust și securitate";
  const statusLabel = locale === "en" ? "Live service status" : "Status servicii în timp real";

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0;border-top:1px solid ${BORDER};">
    <tr>
      <td style="padding:18px 0 8px;color:${MUTED};font-size:9px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;">${locale === "en" ? "Explore ZebraByte" : "Explorează ZebraByte"}</td>
    </tr>
    <tr>
      <td style="padding:0 0 10px;font-size:13px;line-height:1.8;">
        <a href="${ORIGIN}/hub" style="color:${INK};font-weight:700;text-decoration:none;">${escapeHtml(hubLabel)} →</a><br>
        <a href="https://trust.zebrabyte.ro" style="color:${INK};font-weight:700;text-decoration:none;">${escapeHtml(trustLabel)} →</a><br>
        <a href="https://status.zebrabyte.ro" style="color:${INK};font-weight:700;text-decoration:none;">${escapeHtml(statusLabel)} →</a>
      </td>
    </tr>
  </table>`;
}

function shell(options: EmailLayout): string {
  return `<!doctype html>
<html lang="${options.locale}">
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
  <style>
    @media only screen and (max-width:640px) {
      .zbt-shell { width:100% !important; }
      .zbt-pad { padding-left:20px !important; padding-right:20px !important; }
      .zbt-title { font-size:34px !important; line-height:1.08 !important; }
      .zbt-step { display:block !important; width:100% !important; padding:14px 0 !important; border-bottom:1px solid #d9d6cc !important; }
      .zbt-promo-image, .zbt-promo-copy { display:block !important; width:100% !important; }
      .zbt-promo-image img { width:100% !important; max-width:100% !important; }
      .zbt-promo-copy { padding:20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${CANVAS};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${INK};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${CANVAS};">${escapeHtml(options.preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background:${CANVAS};">
    <tr>
      <td align="center" style="padding:26px 10px 44px;">
        <table role="presentation" width="660" cellpadding="0" cellspacing="0" border="0" class="zbt-shell" style="width:100%;max-width:660px;border-collapse:collapse;background:${PAPER};">
          <tr>
            <td class="zbt-pad" style="padding:20px 32px;border-top:3px solid ${GREEN};border-bottom:1px solid ${BORDER};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="color:${INK};font-size:18px;font-weight:850;letter-spacing:-.035em;">ZebraByte</td>
                  <td align="right" style="color:${MUTED};font-size:9px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;">Cybersecurity &amp; Compliance</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td class="zbt-pad" style="padding:42px 32px 26px;">
              <div style="color:${GREEN};font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;">${escapeHtml(options.eyebrow)}</div>
              <h1 class="zbt-title" style="margin:10px 0 0;color:${INK};font-size:44px;line-height:1.04;font-weight:680;letter-spacing:-.055em;">${escapeHtml(options.title)}</h1>
              ${options.intro ? `<p style="margin:16px 0 0;max-width:540px;color:${MUTED};font-size:15px;line-height:1.65;">${escapeHtml(options.intro)}</p>` : ""}
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px 8px;" class="zbt-pad">
              <img src="${escapeHtml(options.heroImage)}" width="596" alt="${escapeHtml(options.heroAlt)}" style="display:block;width:100%;max-width:596px;height:auto;border:0;outline:none;text-decoration:none;">
            </td>
          </tr>

          <tr>
            <td class="zbt-pad" style="padding:26px 32px 38px;color:${INK};font-size:15px;line-height:1.72;">
              ${options.bodyHtml}
            </td>
          </tr>

          <tr>
            <td class="zbt-pad" style="padding:20px 32px 26px;border-top:1px solid ${BORDER};color:${MUTED};font-size:10px;line-height:1.7;">
              ${options.footerHtml}
              <div style="margin-top:12px;">
                <a href="${ORIGIN}" style="color:${INK};text-decoration:underline;">zebrabyte.ro</a>
                &nbsp;&nbsp;·&nbsp;&nbsp;
                <a href="${ORIGIN}/legal" style="color:${INK};text-decoration:underline;">Legal</a>
                &nbsp;&nbsp;·&nbsp;&nbsp;
                <a href="https://trust.zebrabyte.ro" style="color:${INK};text-decoration:underline;">Trust Center</a>
                &nbsp;&nbsp;·&nbsp;&nbsp;
                <a href="https://status.zebrabyte.ro" style="color:${INK};text-decoration:underline;">Status</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function serviceUrl(service: string): string {
  switch (service) {
    case "Managed Compliance":
      return `${ORIGIN}/managed-compliance`;
    case "SOC 2":
      return `${ORIGIN}/soc2`;
    case "ISO/IEC 27001":
      return `${ORIGIN}/iso-27001`;
    case "GDPR & Privacy":
      return `${ORIGIN}/gdpr`;
    case "NIS2 & Compliance":
      return `${ORIGIN}/nis2`;
    case "Cyber Security":
      return `${ORIGIN}/cyber-security`;
    case "Security Assessment":
      return `${ORIGIN}/security-assessment`;
    case "Website Security":
      return `${ORIGIN}/website-security`;
    case "Email Security":
      return `${ORIGIN}/email-security`;
    case "Incident / urgență de securitate":
      return `${ORIGIN}/incident-response`;
    case "Secure Managed Hosting":
      return `${ORIGIN}/secure-hosting`;
    case "Accessibility":
      return `${ORIGIN}/accessibility`;
    default:
      return `${ORIGIN}/`;
  }
}

function contactResource(service: string, locale: EmailLocale): Resource {
  const compliance = new Set([
    "Managed Compliance",
    "SOC 2",
    "ISO/IEC 27001",
    "GDPR & Privacy",
    "NIS2 & Compliance",
  ]);
  const security = new Set([
    "Cyber Security",
    "Security Assessment",
    "Website Security",
    "Email Security",
    "Incident / urgență de securitate",
  ]);

  if (compliance.has(service)) {
    return locale === "en"
      ? {
          eyebrow: "While we review your request",
          title: "See how ZebraByte turns compliance into an operating system, not a document project.",
          copy: "Explore the framework, evidence and operational model behind the service you selected.",
          url: serviceUrl(service),
          cta: "Explore this service",
          image: ART.complianceSecondary,
          alt: "ZebraByte compliance resource",
        }
      : {
          eyebrow: "Până analizăm solicitarea",
          title: "Vezi cum transformăm conformitatea într-un sistem de lucru, nu într-un proiect de documente.",
          copy: "Poți explora framework-ul, dovezile și modelul operațional din spatele serviciului selectat.",
          url: serviceUrl(service),
          cta: "Explorează serviciul",
          image: ART.complianceSecondary,
          alt: "Resursă ZebraByte despre conformitate",
        };
  }

  if (security.has(service)) {
    const incident = service === "Incident / urgență de securitate";
    return locale === "en"
      ? {
          eyebrow: incident ? "Active incident" : "Security context",
          title: incident
            ? "Preserve evidence first. We will use the context you sent to prioritise the response."
            : "See what a ZebraByte security engagement looks like before the first call.",
          copy: incident
            ? "Do not rotate, delete or overwrite relevant evidence unless containment requires it. Avoid sending secrets by email."
            : "Scope, external exposure, identity, email and technical controls are treated as one security surface.",
          url: serviceUrl(service),
          cta: incident ? "Incident response guidance" : "Explore security",
          image: ART.securitySecondary,
          alt: "ZebraByte security resource",
        }
      : {
          eyebrow: incident ? "Incident activ" : "Context de securitate",
          title: incident
            ? "Păstrează dovezile relevante. Folosim contextul trimis pentru prioritizarea răspunsului."
            : "Vezi cum arată o evaluare ZebraByte înainte de prima discuție.",
          copy: incident
            ? "Nu șterge sau suprascrie dovezi relevante decât dacă izolarea incidentului o cere. Nu trimite secrete prin email."
            : "Scope-ul, expunerea publică, identitatea, emailul și controalele tehnice sunt tratate ca o singură suprafață de securitate.",
          url: serviceUrl(service),
          cta: incident ? "Ghid incident response" : "Explorează securitatea",
          image: ART.securitySecondary,
          alt: "Resursă ZebraByte despre securitate",
        };
  }

  if (service === "Secure Managed Hosting") {
    return locale === "en"
      ? {
          eyebrow: "Infrastructure",
          title: "Hosting is only useful when security, availability and operations are designed together.",
          copy: "See the ZebraByte managed hosting model and what we take responsibility for after migration.",
          url: serviceUrl(service),
          cta: "Explore secure hosting",
          image: ART.generic,
          alt: "ZebraByte secure hosting",
        }
      : {
          eyebrow: "Infrastructură",
          title: "Hostingul are sens doar când securitatea, disponibilitatea și operarea sunt proiectate împreună.",
          copy: "Vezi modelul ZebraByte de managed hosting și ce responsabilități preluăm după migrare.",
          url: serviceUrl(service),
          cta: "Vezi secure hosting",
          image: ART.generic,
          alt: "ZebraByte secure hosting",
        };
  }

  return locale === "en"
    ? {
        eyebrow: "Explore ZebraByte",
        title: "Security and compliance work better when they share the same operating context.",
        copy: "Browse the ZebraByte platform, guides and practical resources while we review your request.",
        url: `${ORIGIN}/hub`,
        cta: "Open the Hub",
        image: ART.generic,
        alt: "ZebraByte resource",
      }
    : {
        eyebrow: "Explorează ZebraByte",
        title: "Securitatea și conformitatea funcționează mai bine când folosesc același context operațional.",
        copy: "Poți explora platforma, ghidurile și resursele ZebraByte până analizăm solicitarea ta.",
        url: `${ORIGIN}/hub`,
        cta: "Deschide HUB-ul",
        image: ART.generic,
        alt: "Resursă ZebraByte",
      };
}

function contactHero(service: string): string {
  if (["Managed Compliance", "SOC 2", "ISO/IEC 27001", "GDPR & Privacy", "NIS2 & Compliance"].includes(service)) {
    return ART.compliance;
  }
  if (["Cyber Security", "Security Assessment", "Website Security", "Email Security", "Incident / urgență de securitate"].includes(service)) {
    return ART.security;
  }
  return ART.generic;
}

function articleHero(title: string): string {
  const normalized = title.toLowerCase();
  if (normalized.includes("iso 27001") || normalized.includes("iso27001")) return ART.isoTimeline;
  if (normalized.includes("soc 2") || normalized.includes("soc2")) return ART.socCost;
  if (normalized.includes("security") || normalized.includes("secur")) return ART.security;
  if (normalized.includes("compliance") || normalized.includes("conform")) return ART.compliance;
  return ART.generic;
}

export function contactConfirmationEmail(
  fullName: string,
  message: string,
  locale: EmailLocale,
  service = "",
): { subject: string; html: string; text: string } {
  const firstName = fullName.trim().split(/\s+/)[0] || fullName;
  const cleanMessage = recipientMessage(message);
  const preview = cleanMessage.length > 700 ? `${cleanMessage.slice(0, 700)}…` : cleanMessage;
  const resource = contactResource(service, locale);

  if (locale === "en") {
    const subject = "We received your request | ZebraByte";
    const html = shell({
      locale,
      preheader: `Your ZebraByte request is registered, ${firstName}.`,
      eyebrow: service || "Request received",
      title: `We have your request, ${firstName}.`,
      intro: "This email is not just a receipt — it gives you the next steps and relevant context while the team reviews your request.",
      heroImage: contactHero(service),
      heroAlt: service ? `ZebraByte — ${service}` : "ZebraByte",
      bodyHtml: `<p style="margin:0;">Thanks for getting in touch. Your request is registered and will be reviewed by the relevant ZebraByte team. We normally reply within one business day.</p>
        ${statStrip(locale)}
        ${messageBlock("Your message", preview)}
        ${promo(resource)}
        ${resourceRail(locale)}
        <p style="margin:24px 0 0;color:${MUTED};font-size:11px;line-height:1.65;">Please do not send passwords, private keys, access tokens or other secrets by email.</p>`,
      footerHtml: "This service email was generated because you submitted the ZebraByte contact form.",
    });
    const text = `Hi ${firstName},\n\nWe received your ZebraByte request and normally reply within one business day.\n\nYour message:\n${cleanMessage}\n\nRelevant resource: ${resource.url}\n\nPlease do not send passwords, private keys or access tokens by email.`;
    return { subject, html, text };
  }

  const subject = "Am primit solicitarea ta | ZebraByte";
  const html = shell({
    locale,
    preheader: `Solicitarea ta ZebraByte este înregistrată, ${firstName}.`,
    eyebrow: service || "Solicitare primită",
    title: `Am primit solicitarea ta, ${firstName}.`,
    intro: "Emailul acesta nu este doar o confirmare: ai pașii următori și context relevant până când echipa analizează solicitarea.",
    heroImage: contactHero(service),
    heroAlt: service ? `ZebraByte — ${service}` : "ZebraByte",
    bodyHtml: `<p style="margin:0;">Mulțumim că ne-ai scris. Solicitarea este înregistrată și va fi analizată de echipa ZebraByte relevantă. Revenim de regulă în maximum o zi lucrătoare.</p>
      ${statStrip(locale)}
      ${messageBlock("Mesajul tău", preview)}
      ${promo(resource)}
      ${resourceRail(locale)}
      <p style="margin:24px 0 0;color:${MUTED};font-size:11px;line-height:1.65;">Nu trimite prin email parole, chei private, token-uri de acces sau alte secrete.</p>`,
    footerHtml: "Acest email de serviciu a fost generat deoarece ai trimis formularul de contact ZebraByte.",
  });
  const text = `Salut, ${firstName},\n\nAm primit solicitarea ta ZebraByte și revenim de regulă în maximum o zi lucrătoare.\n\nMesajul tău:\n${cleanMessage}\n\nResursă relevantă: ${resource.url}\n\nNu trimite prin email parole, chei private sau token-uri de acces.`;
  return { subject, html, text };
}

export function newsletterConfirmationEmail(
  confirmUrl: string,
  locale: EmailLocale,
): { subject: string; html: string; text: string } {
  const resource: Resource = locale === "en"
    ? {
        eyebrow: "Inside the ZebraByte Hub",
        title: "Practical security and compliance guides, without the sales deck.",
        copy: "Browse explainers, comparisons and implementation guidance while you decide what is useful to you.",
        url: `${ORIGIN}/hub`,
        cta: "Explore the Hub",
        image: ART.complianceSecondary,
        alt: "ZebraByte Hub",
      }
    : {
        eyebrow: "În HUB-ul ZebraByte",
        title: "Ghiduri practice de securitate și conformitate, fără prezentări comerciale inutile.",
        copy: "Poți explora explicații, comparații și ghiduri de implementare înainte să alegi ce îți este util.",
        url: `${ORIGIN}/hub`,
        cta: "Explorează HUB-ul",
        image: ART.complianceSecondary,
        alt: "HUB ZebraByte",
      };

  if (locale === "en") {
    const subject = "Confirm your ZebraByte newsletter subscription";
    const html = shell({
      locale,
      preheader: "One click remains before your ZebraByte newsletter subscription becomes active.",
      eyebrow: "Newsletter · Double opt-in",
      title: "One click, then you're in.",
      intro: "Confirm your address to receive ZebraByte analysis, practical guides and product updates.",
      heroImage: ART.generic,
      heroAlt: "ZebraByte newsletter",
      bodyHtml: `<p style="margin:0;">We received a subscription request for this address. The subscription stays inactive until you confirm it.</p>
        ${button("Confirm subscription", confirmUrl)}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:32px 0 0;border-top:1px solid ${BORDER};border-bottom:1px solid ${BORDER};">
          <tr>
            <td style="padding:18px 0;color:${INK};font-size:13px;line-height:1.8;"><strong>What arrives in your inbox</strong><br><span style="color:${MUTED};">Security analysis · Compliance explainers · Practical implementation guides · Important ZebraByte product updates</span></td>
          </tr>
        </table>
        ${promo(resource)}
        <p style="margin:24px 0 0;color:${MUTED};font-size:11px;line-height:1.65;">If you did not request this, ignore the message. Nothing will be activated.</p>`,
      footerHtml: "This message was generated because this address was entered in the ZebraByte newsletter form.",
    });
    const text = `Confirm your ZebraByte newsletter subscription:\n${confirmUrl}\n\nExplore the Hub: ${ORIGIN}/hub\n\nIf you did not request this, ignore this email.`;
    return { subject, html, text };
  }

  const subject = "Confirmă abonarea la newsletter-ul ZebraByte";
  const html = shell({
    locale,
    preheader: "Mai este un singur pas înainte ca abonarea la newsletter-ul ZebraByte să devină activă.",
    eyebrow: "Newsletter · Double opt-in",
    title: "Un click și abonarea este activă.",
    intro: "Confirmă adresa pentru a primi analize ZebraByte, ghiduri practice și actualizări importante de produs.",
    heroImage: ART.generic,
    heroAlt: "Newsletter ZebraByte",
    bodyHtml: `<p style="margin:0;">Am primit o solicitare de abonare pentru această adresă. Abonarea rămâne inactivă până când o confirmi.</p>
      ${button("Confirmă abonarea", confirmUrl)}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:32px 0 0;border-top:1px solid ${BORDER};border-bottom:1px solid ${BORDER};">
        <tr>
          <td style="padding:18px 0;color:${INK};font-size:13px;line-height:1.8;"><strong>Ce vei primi</strong><br><span style="color:${MUTED};">Analize de securitate · Explicații de compliance · Ghiduri practice · Actualizări importante ZebraByte</span></td>
        </tr>
      </table>
      ${promo(resource)}
      <p style="margin:24px 0 0;color:${MUTED};font-size:11px;line-height:1.65;">Dacă nu ai cerut abonarea, ignoră mesajul. Nu se activează nimic.</p>`,
    footerHtml: "Acest mesaj a fost generat deoarece adresa a fost introdusă în formularul de newsletter ZebraByte.",
  });
  const text = `Confirmă abonarea la newsletter-ul ZebraByte:\n${confirmUrl}\n\nExplorează HUB-ul: ${ORIGIN}/hub\n\nDacă nu ai cerut tu asta, ignoră acest email.`;
  return { subject, html, text };
}

export function newsletterPostEmail(
  postTitle: string,
  postExcerpt: string,
  postUrl: string,
  unsubscribeUrl: string,
  locale: EmailLocale,
): { subject: string; html: string; text: string } {
  const resource: Resource = locale === "en"
    ? {
        eyebrow: "Continue reading",
        title: "The ZebraByte Hub keeps the technical context in one place.",
        copy: "Framework explainers, security guidance and practical implementation notes are available without leaving the ZebraByte ecosystem.",
        url: `${ORIGIN}/hub`,
        cta: "Browse the Hub",
        image: ART.complianceSecondary,
        alt: "ZebraByte Hub",
      }
    : {
        eyebrow: "Continuă lectura",
        title: "HUB-ul ZebraByte păstrează contextul tehnic într-un singur loc.",
        copy: "Găsești explicații despre framework-uri, ghiduri de securitate și note practice de implementare fără să ieși din ecosistemul ZebraByte.",
        url: `${ORIGIN}/hub`,
        cta: "Deschide HUB-ul",
        image: ART.complianceSecondary,
        alt: "HUB ZebraByte",
      };

  if (locale === "en") {
    const subject = `New ZebraByte article: ${postTitle}`;
    const html = shell({
      locale,
      preheader: postExcerpt || postTitle,
      eyebrow: "New analysis",
      title: postTitle,
      intro: postExcerpt || "A new ZebraByte analysis is now available.",
      heroImage: articleHero(postTitle),
      heroAlt: postTitle,
      bodyHtml: `${button("Read the full article", postUrl)}
        ${promo(resource)}
        ${resourceRail(locale)}
        <p style="margin:26px 0 0;padding-top:18px;border-top:1px solid ${BORDER};color:${MUTED};font-size:11px;line-height:1.65;">Prefer not to receive these updates? <a href="${escapeHtml(unsubscribeUrl)}" style="color:${INK};font-weight:700;">Unsubscribe</a>.</p>`,
      footerHtml: "You are receiving this because you confirmed your ZebraByte newsletter subscription.",
    });
    const text = `New article: ${postTitle}\n${postExcerpt}\n\nRead it here: ${postUrl}\n\nExplore the Hub: ${ORIGIN}/hub\n\nUnsubscribe: ${unsubscribeUrl}`;
    return { subject, html, text };
  }

  const subject = `Articol nou ZebraByte: ${postTitle}`;
  const html = shell({
    locale,
    preheader: postExcerpt || postTitle,
    eyebrow: "Analiză nouă",
    title: postTitle,
    intro: postExcerpt || "O analiză nouă ZebraByte este disponibilă.",
    heroImage: articleHero(postTitle),
    heroAlt: postTitle,
    bodyHtml: `${button("Citește articolul complet", postUrl)}
      ${promo(resource)}
      ${resourceRail(locale)}
      <p style="margin:26px 0 0;padding-top:18px;border-top:1px solid ${BORDER};color:${MUTED};font-size:11px;line-height:1.65;">Nu mai vrei aceste actualizări? <a href="${escapeHtml(unsubscribeUrl)}" style="color:${INK};font-weight:700;">Dezabonează-te</a>.</p>`,
    footerHtml: "Primești acest email pentru că ai confirmat abonarea la newsletter-ul ZebraByte.",
  });
  const text = `Articol nou: ${postTitle}\n${postExcerpt}\n\nCitește aici: ${postUrl}\n\nExplorează HUB-ul: ${ORIGIN}/hub\n\nDezabonare: ${unsubscribeUrl}`;
  return { subject, html, text };
}

export function securityReportConfirmationEmail(
  referenceId: string,
  locale: EmailLocale,
): { subject: string; html: string; text: string } {
  const referenceBlock = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;background:${INK};">
    <tr>
      <td style="padding:18px 20px;color:${WHITE};">
        <div style="font-size:9px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#c7cbc4;">${locale === "en" ? "Security reference" : "Referință securitate"}</div>
        <div style="margin-top:7px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:18px;font-weight:700;letter-spacing:.02em;">${escapeHtml(referenceId)}</div>
      </td>
    </tr>
  </table>`;

  const resource: Resource = locale === "en"
    ? {
        eyebrow: "Responsible disclosure",
        title: "Keep the reference above for every follow-up about this report.",
        copy: "Our security page explains the disclosure channel, trust information and how ZebraByte handles operational security reports.",
        url: `${ORIGIN}/security`,
        cta: "Open security information",
        image: ART.securitySecondary,
        alt: "ZebraByte security",
      }
    : {
        eyebrow: "Responsible disclosure",
        title: "Păstrează referința de mai sus pentru orice comunicare ulterioară despre raport.",
        copy: "Pagina de securitate explică canalul de disclosure, informațiile de trust și modul în care ZebraByte tratează rapoartele operaționale.",
        url: `${ORIGIN}/security`,
        cta: "Deschide zona de securitate",
        image: ART.securitySecondary,
        alt: "Securitate ZebraByte",
      };

  if (locale === "en") {
    const subject = `ZebraByte security report received — ${referenceId}`;
    const html = shell({
      locale,
      preheader: `Security report ${referenceId} has been received by ZebraByte.`,
      eyebrow: "Security report received",
      title: "Your report is in the security queue.",
      intro: "Use the reference below if you need to follow up. Reports with credible active impact are prioritised separately.",
      heroImage: ART.security,
      heroAlt: "ZebraByte security",
      bodyHtml: `${referenceBlock}
        ${statStrip(locale)}
        ${promo(resource)}
        <p style="margin:24px 0 0;color:${MUTED};font-size:11px;line-height:1.65;">Do not email passwords, private keys, access tokens or unnecessary personal data. Preserve evidence where possible.</p>`,
      footerHtml: "This is a service acknowledgement for a security report submitted to ZebraByte.",
    });
    const text = `We received your security report.\nReference: ${referenceId}\n\nKeep this reference for follow-up.\nSecurity information: ${ORIGIN}/security\n\nDo not send passwords, private keys, access tokens or unnecessary personal data by email.`;
    return { subject, html, text };
  }

  const subject = `Raport de securitate ZebraByte primit — ${referenceId}`;
  const html = shell({
    locale,
    preheader: `Raportul de securitate ${referenceId} a fost primit de ZebraByte.`,
    eyebrow: "Raport de securitate primit",
    title: "Raportul tău este în fluxul de securitate.",
    intro: "Folosește referința de mai jos pentru orice follow-up. Rapoartele cu impact activ credibil sunt prioritizate separat.",
    heroImage: ART.security,
    heroAlt: "Securitate ZebraByte",
    bodyHtml: `${referenceBlock}
      ${statStrip(locale)}
      ${promo(resource)}
      <p style="margin:24px 0 0;color:${MUTED};font-size:11px;line-height:1.65;">Nu trimite prin email parole, chei private, token-uri de acces sau date personale care nu sunt necesare. Păstrează dovezile relevante unde este posibil.</p>`,
    footerHtml: "Acesta este emailul de confirmare pentru un raport de securitate trimis către ZebraByte.",
  });
  const text = `Am primit raportul tău de securitate.\nReferință: ${referenceId}\n\nPăstrează această referință pentru comunicările ulterioare.\nInformații de securitate: ${ORIGIN}/security\n\nNu trimite prin email parole, chei private, token-uri de acces sau date personale care nu sunt necesare.`;
  return { subject, html, text };
}
