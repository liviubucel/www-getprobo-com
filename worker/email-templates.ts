export type EmailLocale = "ro" | "en";

const INK = "#111310";
const GREEN = "#142115";
const MUTED = "#6f716c";
const BORDER = "#dcd9d0";
const CANVAS = "#f2f1ec";
const PAPER = "#fffdf8";
const GENERIC_ART = "https://www.zebrabyte.ro/linkedin-template-iso27001.png";
const COMPLIANCE_ART = "https://www.zebrabyte.ro/blog/What_are_the_steps_towards_compliance.png";
const SECURITY_ART = "https://www.zebrabyte.ro/blog/SOC.png";

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

function contactArtwork(service = ""): string {
  if (
    service === "Managed Compliance" ||
    service === "SOC 2" ||
    service === "ISO/IEC 27001" ||
    service === "GDPR & Privacy" ||
    service === "NIS2 & Compliance"
  ) {
    return COMPLIANCE_ART;
  }

  if (
    service === "Cyber Security" ||
    service === "Security Assessment" ||
    service === "Website Security" ||
    service === "Email Security" ||
    service === "Incident / urgență de securitate"
  ) {
    return SECURITY_ART;
  }

  return GENERIC_ART;
}

function cta(label: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 8px;">
    <tr>
      <td bgcolor="${GREEN}" style="background:${GREEN};border-radius:7px;">
        <a href="${escapeHtml(url)}" style="display:inline-block;padding:13px 22px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;line-height:18px;">${escapeHtml(label)}</a>
      </td>
    </tr>
  </table>`;
}

function quoteBlock(label: string, value: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 24px;border-collapse:collapse;">
    <tr>
      <td width="3" bgcolor="${GREEN}" style="width:3px;background:${GREEN};font-size:0;line-height:0;">&nbsp;</td>
      <td style="padding:2px 0 2px 18px;">
        <div style="margin:0 0 7px;color:${MUTED};font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;">${escapeHtml(label)}</div>
        <div style="color:${INK};font-size:14px;line-height:1.7;">${escapeHtml(value).replace(/\n/g, "<br>")}</div>
      </td>
    </tr>
  </table>`;
}

type EmailLayout = {
  preheader: string;
  eyebrow: string;
  title: string;
  intro?: string;
  artwork?: string;
  bodyHtml: string;
  footerHtml: string;
};

function layout(locale: EmailLocale, options: EmailLayout): string {
  const artwork = options.artwork || GENERIC_ART;

  return `<!doctype html>
<html lang="${locale}">
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
  <style>
    @media only screen and (max-width:640px) {
      .zbt-shell { width:100% !important; }
      .zbt-pad { padding-left:20px !important; padding-right:20px !important; }
      .zbt-hero-copy, .zbt-hero-art { display:block !important; width:100% !important; }
      .zbt-hero-art { padding-top:22px !important; text-align:left !important; }
      .zbt-hero-art img { width:220px !important; max-width:100% !important; }
      .zbt-title { font-size:31px !important; line-height:1.12 !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${CANVAS};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${INK};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${CANVAS};">${escapeHtml(options.preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background:${CANVAS};">
    <tr>
      <td align="center" style="padding:24px 10px 42px;">
        <table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" class="zbt-shell" style="width:100%;max-width:640px;border-collapse:collapse;background:${PAPER};">
          <tr>
            <td class="zbt-pad" style="padding:22px 30px;border-top:3px solid ${GREEN};border-bottom:1px solid ${BORDER};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="color:${INK};font-size:18px;font-weight:800;letter-spacing:-.035em;">ZebraByte</td>
                  <td align="right" style="color:${MUTED};font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;">Cybersecurity &amp; Compliance</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td class="zbt-pad" style="padding:38px 30px 30px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td valign="top" width="62%" class="zbt-hero-copy" style="width:62%;padding-right:24px;">
                    <div style="margin:0 0 13px;color:${GREEN};font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;">${escapeHtml(options.eyebrow)}</div>
                    <h1 class="zbt-title" style="margin:0;color:${INK};font-size:38px;line-height:1.08;font-weight:650;letter-spacing:-.045em;">${escapeHtml(options.title)}</h1>
                    ${options.intro ? `<p style="margin:18px 0 0;color:${MUTED};font-size:15px;line-height:1.65;">${escapeHtml(options.intro)}</p>` : ""}
                  </td>
                  <td valign="top" align="right" width="38%" class="zbt-hero-art" style="width:38%;text-align:right;">
                    <img src="${escapeHtml(artwork)}" width="205" alt="" style="display:block;width:205px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;">
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td class="zbt-pad" style="padding:4px 30px 36px;color:${INK};font-size:15px;line-height:1.72;">
              ${options.bodyHtml}
            </td>
          </tr>

          <tr>
            <td class="zbt-pad" style="padding:22px 30px 26px;border-top:1px solid ${BORDER};color:${MUTED};font-size:11px;line-height:1.65;">
              ${options.footerHtml}
              <div style="margin-top:13px;">
                <a href="https://www.zebrabyte.ro" style="color:${INK};text-decoration:underline;">zebrabyte.ro</a>
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

export function contactConfirmationEmail(
  fullName: string,
  message: string,
  locale: EmailLocale,
  service = "",
): { subject: string; html: string; text: string } {
  const firstName = fullName.trim().split(/\s+/)[0] || fullName;
  const cleanMessage = recipientMessage(message);
  const preview = cleanMessage.length > 520 ? `${cleanMessage.slice(0, 520)}…` : cleanMessage;
  const artwork = contactArtwork(service);

  if (locale === "en") {
    const subject = "We received your request | ZebraByte";
    const html = layout(locale, {
      preheader: `We received your ZebraByte request, ${firstName}.`,
      eyebrow: "Request received",
      title: "We received your request.",
      intro: service ? `${service} · We normally reply within one business day.` : "We normally reply within one business day.",
      artwork,
      bodyHtml: `<p style="margin:0 0 15px;">Hi ${escapeHtml(firstName)},</p>
        <p style="margin:0;">Thanks for getting in touch. Your request is registered and will be reviewed by the relevant ZebraByte team.</p>
        ${quoteBlock("Message sent", preview)}
        <p style="margin:0;color:${MUTED};font-size:13px;">If this concerns an active security incident, the request is prioritised separately. Please do not send passwords, private keys or access tokens by email.</p>`,
      footerHtml: "This is a service confirmation generated after you submitted the ZebraByte contact form.",
    });
    const text = `Hi ${firstName},\n\nWe received your ZebraByte request and normally reply within one business day.\n\nMessage sent:\n${cleanMessage}\n\nPlease do not send passwords, private keys or access tokens by email.`;
    return { subject, html, text };
  }

  const subject = "Am primit solicitarea ta | ZebraByte";
  const html = layout(locale, {
    preheader: `Am primit solicitarea ta ZebraByte, ${firstName}.`,
    eyebrow: "Solicitare primită",
    title: "Am primit solicitarea ta.",
    intro: service ? `${service} · Revenim de regulă în maximum o zi lucrătoare.` : "Revenim de regulă în maximum o zi lucrătoare.",
    artwork,
    bodyHtml: `<p style="margin:0 0 15px;">Salut, ${escapeHtml(firstName)},</p>
      <p style="margin:0;">Mulțumim că ne-ai scris. Solicitarea este înregistrată și va fi verificată de echipa ZebraByte relevantă.</p>
      ${quoteBlock("Mesaj trimis", preview)}
      <p style="margin:0;color:${MUTED};font-size:13px;">Dacă este vorba despre un incident de securitate activ, solicitarea este prioritizată separat. Nu trimite prin email parole, chei private sau token-uri de acces.</p>`,
    footerHtml: "Acesta este un email de serviciu generat după trimiterea formularului de contact ZebraByte.",
  });
  const text = `Salut, ${firstName},\n\nAm primit solicitarea ta ZebraByte și revenim de regulă în maximum o zi lucrătoare.\n\nMesaj trimis:\n${cleanMessage}\n\nNu trimite prin email parole, chei private sau token-uri de acces.`;
  return { subject, html, text };
}

export function newsletterConfirmationEmail(
  confirmUrl: string,
  locale: EmailLocale,
): { subject: string; html: string; text: string } {
  if (locale === "en") {
    const subject = "Confirm your ZebraByte newsletter subscription";
    const html = layout(locale, {
      preheader: "Confirm your address to activate the ZebraByte newsletter.",
      eyebrow: "Newsletter",
      title: "Confirm your email address.",
      intro: "One click remains before your subscription becomes active.",
      artwork: GENERIC_ART,
      bodyHtml: `<p style="margin:0;">We received a subscription request for this address. Use the button below to confirm it.</p>
        ${cta("Confirm subscription", confirmUrl)}
        <p style="margin:24px 0 0;padding-top:18px;border-top:1px solid ${BORDER};color:${MUTED};font-size:13px;line-height:1.65;">We use double opt-in to verify ownership of the address and prevent unwanted subscriptions. If you did not request this, ignore the email — nothing will be activated.</p>`,
      footerHtml: "This message was triggered because this address was entered in the ZebraByte newsletter form.",
    });
    const text = `Confirm your ZebraByte newsletter subscription:\n${confirmUrl}\n\nIf you did not request this, ignore this email.`;
    return { subject, html, text };
  }

  const subject = "Confirmă abonarea la newsletter-ul ZebraByte";
  const html = layout(locale, {
    preheader: "Confirmă adresa pentru a activa newsletter-ul ZebraByte.",
    eyebrow: "Newsletter",
    title: "Confirmă adresa de email.",
    intro: "Mai este un singur pas înainte ca abonarea să devină activă.",
    artwork: GENERIC_ART,
    bodyHtml: `<p style="margin:0;">Am primit o solicitare de abonare pentru această adresă. Folosește butonul de mai jos pentru confirmare.</p>
      ${cta("Confirmă abonarea", confirmUrl)}
      <p style="margin:24px 0 0;padding-top:18px;border-top:1px solid ${BORDER};color:${MUTED};font-size:13px;line-height:1.65;">Folosim double opt-in ca să verificăm că adresa îți aparține și să prevenim abonările nedorite. Dacă nu ai cerut abonarea, ignoră mesajul — nu se activează nimic.</p>`,
    footerHtml: "Acest mesaj a fost generat deoarece adresa a fost introdusă în formularul de newsletter ZebraByte.",
  });
  const text = `Confirmă abonarea la newsletter-ul ZebraByte:\n${confirmUrl}\n\nDacă nu ai cerut tu asta, ignoră acest email.`;
  return { subject, html, text };
}

export function newsletterPostEmail(
  postTitle: string,
  postExcerpt: string,
  postUrl: string,
  unsubscribeUrl: string,
  locale: EmailLocale,
): { subject: string; html: string; text: string } {
  if (locale === "en") {
    const subject = `New ZebraByte article: ${postTitle}`;
    const html = layout(locale, {
      preheader: postExcerpt || postTitle,
      eyebrow: "New analysis",
      title: postTitle,
      intro: postExcerpt || "A new ZebraByte article is available.",
      artwork: GENERIC_ART,
      bodyHtml: `${cta("Read the article", postUrl)}
        <p style="margin:26px 0 0;padding-top:18px;border-top:1px solid ${BORDER};color:${MUTED};font-size:13px;">Prefer not to receive these updates? <a href="${escapeHtml(unsubscribeUrl)}" style="color:${INK};">Unsubscribe</a>.</p>`,
      footerHtml: "You are receiving this because you confirmed your ZebraByte newsletter subscription.",
    });
    const text = `New article: ${postTitle}\n${postExcerpt}\n\nRead it here: ${postUrl}\n\nUnsubscribe: ${unsubscribeUrl}`;
    return { subject, html, text };
  }

  const subject = `Articol nou ZebraByte: ${postTitle}`;
  const html = layout(locale, {
    preheader: postExcerpt || postTitle,
    eyebrow: "Analiză nouă",
    title: postTitle,
    intro: postExcerpt || "O analiză nouă ZebraByte este disponibilă.",
    artwork: GENERIC_ART,
    bodyHtml: `${cta("Citește articolul", postUrl)}
      <p style="margin:26px 0 0;padding-top:18px;border-top:1px solid ${BORDER};color:${MUTED};font-size:13px;">Nu mai vrei aceste actualizări? <a href="${escapeHtml(unsubscribeUrl)}" style="color:${INK};">Dezabonează-te</a>.</p>`,
    footerHtml: "Primești acest email pentru că ai confirmat abonarea la newsletter-ul ZebraByte.",
  });
  const text = `Articol nou: ${postTitle}\n${postExcerpt}\n\nCitește aici: ${postUrl}\n\nDezabonare: ${unsubscribeUrl}`;
  return { subject, html, text };
}
