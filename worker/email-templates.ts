export type EmailLocale = "ro" | "en";

const BRAND_COLOR = "#101214";
const TEXT_COLOR = "#121315";
const MUTED_COLOR = "#666a70";
const BORDER_COLOR = "#e6e4de";
const CANVAS_COLOR = "#f4f3ef";
const SURFACE_COLOR = "#fffefa";
const LOGO_URL = "https://www.zebrabyte.ro/images/zebrabyte-mark.svg";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function button(label: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;">
    <tr>
      <td style="border-radius:999px;background:${BRAND_COLOR};">
        <a href="${escapeHtml(url)}" style="display:inline-block;padding:13px 24px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;line-height:18px;">${escapeHtml(label)}</a>
      </td>
    </tr>
  </table>`;
}

function infoPanel(label: string, valueHtml: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;border:1px solid ${BORDER_COLOR};border-radius:14px;background:#f8f7f3;">
    <tr>
      <td style="padding:18px 20px;">
        <div style="margin-bottom:7px;color:${MUTED_COLOR};font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">${escapeHtml(label)}</div>
        <div style="color:${TEXT_COLOR};font-size:14px;line-height:1.65;">${valueHtml}</div>
      </td>
    </tr>
  </table>`;
}

type LayoutOptions = {
  preheader: string;
  eyebrow: string;
  title: string;
  intro?: string;
  bodyHtml: string;
  footerHtml: string;
};

function layout(locale: EmailLocale, options: LayoutOptions): string {
  return `<!doctype html>
<html lang="${locale}">
  <head>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="color-scheme" content="light only">
  </head>
  <body style="margin:0;padding:0;background:${CANVAS_COLOR};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${TEXT_COLOR};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${CANVAS_COLOR};">${escapeHtml(options.preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;background:${CANVAS_COLOR};">
      <tr>
        <td align="center" style="padding:26px 12px 40px;">
          <table role="presentation" width="620" cellpadding="0" cellspacing="0" style="width:100%;max-width:620px;border-collapse:separate;">
            <tr>
              <td style="padding:0 8px 14px;color:${MUTED_COLOR};font-size:11px;line-height:16px;text-align:right;">
                ZebraByte · Cybersecurity &amp; Compliance
              </td>
            </tr>
            <tr>
              <td style="overflow:hidden;border-radius:20px 20px 0 0;background:${BRAND_COLOR};padding:28px 32px 30px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td valign="middle" style="width:46px;">
                      <table role="presentation" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" valign="middle" style="width:42px;height:42px;border-radius:12px;background:#ffffff;">
                            <img src="${LOGO_URL}" width="26" height="26" alt="" style="display:block;width:26px;height:26px;border:0;">
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td valign="middle" style="padding-left:12px;color:#ffffff;font-size:18px;font-weight:750;letter-spacing:-.02em;">ZebraByte</td>
                  </tr>
                </table>
                <div style="margin-top:30px;color:#b8bbb9;font-size:11px;font-weight:700;letter-spacing:.10em;text-transform:uppercase;">${escapeHtml(options.eyebrow)}</div>
                <h1 style="margin:10px 0 0;color:#ffffff;font-size:30px;line-height:1.18;font-weight:650;letter-spacing:-.035em;">${escapeHtml(options.title)}</h1>
                ${options.intro ? `<p style="margin:12px 0 0;max-width:500px;color:#d6d8d7;font-size:14px;line-height:1.65;">${escapeHtml(options.intro)}</p>` : ""}
              </td>
            </tr>
            <tr>
              <td style="background:${SURFACE_COLOR};padding:30px 32px 34px;border-left:1px solid ${BORDER_COLOR};border-right:1px solid ${BORDER_COLOR};color:${TEXT_COLOR};font-size:15px;line-height:1.7;">
                ${options.bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="border:1px solid ${BORDER_COLOR};border-top:0;border-radius:0 0 20px 20px;background:#faf9f5;padding:20px 32px 24px;color:${MUTED_COLOR};font-size:11px;line-height:1.6;">
                ${options.footerHtml}
                <div style="margin-top:14px;color:#8b8e92;">
                  <a href="https://www.zebrabyte.ro" style="color:${MUTED_COLOR};text-decoration:underline;">zebrabyte.ro</a>
                  &nbsp;·&nbsp;
                  <a href="https://trust.zebrabyte.ro" style="color:${MUTED_COLOR};text-decoration:underline;">Trust Center</a>
                  &nbsp;·&nbsp;
                  <a href="https://status.zebrabyte.ro" style="color:${MUTED_COLOR};text-decoration:underline;">Status</a>
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
): { subject: string; html: string; text: string } {
  const firstName = fullName.trim().split(/\s+/)[0] || fullName;
  const preview = message.length > 360 ? `${message.slice(0, 360)}…` : message;
  const previewHtml = escapeHtml(preview).replace(/\n/g, "<br>");

  if (locale === "en") {
    const subject = "We received your request | ZebraByte";
    const html = layout(locale, {
      preheader: `Thanks, ${firstName}. Your request reached ZebraByte.`,
      eyebrow: "Request received",
      title: "Your message is with the right team.",
      intro: "We have your context and will route it to the relevant security or compliance specialist.",
      bodyHtml: `<p style="margin:0 0 14px;">Hi ${escapeHtml(firstName)},</p>
        <p style="margin:0;">Thanks for contacting ZebraByte. We normally respond within one business day. If your request concerns an active security incident, it is prioritised separately.</p>
        ${infoPanel("Your message", previewHtml)}
        <p style="margin:0;color:${MUTED_COLOR};font-size:13px;">Please do not reply with passwords, private keys, access tokens or other secrets.</p>`,
      footerHtml: `You are receiving this service email because you submitted the contact form on ZebraByte.`,
    });
    const text = `Hi ${firstName},\n\nWe received your ZebraByte request and normally respond within one business day.\n\nYour message:\n${message}\n\nPlease do not send passwords, private keys or access tokens by email.`;
    return { subject, html, text };
  }

  const subject = "Am primit solicitarea ta | ZebraByte";
  const html = layout(locale, {
    preheader: `Mulțumim, ${firstName}. Solicitarea ta a ajuns la ZebraByte.`,
    eyebrow: "Solicitare primită",
    title: "Mesajul tău a ajuns la echipa potrivită.",
    intro: "Avem contextul transmis și îl direcționăm către zona relevantă de securitate sau conformitate.",
    bodyHtml: `<p style="margin:0 0 14px;">Salut, ${escapeHtml(firstName)},</p>
      <p style="margin:0;">Mulțumim că ne-ai scris. Răspundem de regulă în maximum o zi lucrătoare. Solicitările care indică un incident de securitate activ sunt prioritizate separat.</p>
      ${infoPanel("Mesajul tău", previewHtml)}
      <p style="margin:0;color:${MUTED_COLOR};font-size:13px;">Nu trimite prin email parole, chei private, token-uri de acces sau alte secrete.</p>`,
    footerHtml: `Primești acest email de serviciu pentru că ai trimis formularul de contact ZebraByte.`,
  });
  const text = `Salut, ${firstName},\n\nAm primit solicitarea ta ZebraByte și răspundem de regulă în maximum o zi lucrătoare.\n\nMesajul tău:\n${message}\n\nNu trimite prin email parole, chei private sau token-uri de acces.`;
  return { subject, html, text };
}

export function newsletterConfirmationEmail(
  confirmUrl: string,
  locale: EmailLocale,
): { subject: string; html: string; text: string } {
  if (locale === "en") {
    const subject = "Confirm your ZebraByte newsletter subscription";
    const html = layout(locale, {
      preheader: "One click remains before your ZebraByte newsletter subscription becomes active.",
      eyebrow: "Newsletter",
      title: "Confirm your email address.",
      intro: "Security, privacy and compliance analysis from ZebraByte — only after you explicitly confirm.",
      bodyHtml: `<p style="margin:0;">We received a newsletter subscription request for this address. Confirm it below to activate your subscription.</p>
        ${button("Confirm subscription", confirmUrl)}
        ${infoPanel("Why this extra step?", "Double opt-in helps us verify that the address really belongs to you and prevents unwanted subscriptions.")}
        <p style="margin:0;color:${MUTED_COLOR};font-size:13px;">If you did not request this, ignore this message. Nothing will be activated.</p>`,
      footerHtml: `This email was triggered because this address was entered in the ZebraByte newsletter form.`,
    });
    const text = `Confirm your ZebraByte newsletter subscription:\n${confirmUrl}\n\nIf you did not request this, ignore this email.`;
    return { subject, html, text };
  }

  const subject = "Confirmă abonarea la newsletter-ul ZebraByte";
  const html = layout(locale, {
    preheader: "Mai este un singur pas înainte ca abonarea la newsletter-ul ZebraByte să devină activă.",
    eyebrow: "Newsletter",
    title: "Confirmă adresa de email.",
    intro: "Analize despre securitate, privacy și compliance de la ZebraByte — doar după confirmarea ta explicită.",
    bodyHtml: `<p style="margin:0;">Am primit o solicitare de abonare pentru această adresă. Confirmă mai jos pentru a activa newsletter-ul.</p>
      ${button("Confirmă abonarea", confirmUrl)}
      ${infoPanel("De ce încă un pas?", "Folosim double opt-in ca să verificăm că adresa îți aparține și să prevenim abonările nedorite.")}
      <p style="margin:0;color:${MUTED_COLOR};font-size:13px;">Dacă nu ai cerut tu abonarea, ignoră mesajul. Nu se activează nimic.</p>`,
    footerHtml: `Acest email a fost generat deoarece adresa a fost introdusă în formularul de newsletter ZebraByte.`,
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
  const title = escapeHtml(postTitle);
  const excerpt = escapeHtml(postExcerpt);

  if (locale === "en") {
    const subject = `New ZebraByte article: ${postTitle}`;
    const html = layout(locale, {
      preheader: postExcerpt || postTitle,
      eyebrow: "New analysis",
      title: postTitle,
      intro: postExcerpt || "A new ZebraByte article is now available.",
      bodyHtml: `${postExcerpt ? infoPanel("In brief", excerpt) : ""}
        ${button("Read the article", postUrl)}
        <p style="margin:18px 0 0;color:${MUTED_COLOR};font-size:13px;">Prefer not to receive these updates? <a href="${escapeHtml(unsubscribeUrl)}" style="color:${TEXT_COLOR};">Unsubscribe</a>.</p>`,
      footerHtml: `You are receiving this because you confirmed your ZebraByte newsletter subscription.`,
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
    bodyHtml: `${postExcerpt ? infoPanel("Pe scurt", excerpt) : ""}
      ${button("Citește articolul", postUrl)}
      <p style="margin:18px 0 0;color:${MUTED_COLOR};font-size:13px;">Nu mai vrei aceste actualizări? <a href="${escapeHtml(unsubscribeUrl)}" style="color:${TEXT_COLOR};">Dezabonează-te</a>.</p>`,
    footerHtml: `Primești acest email pentru că ai confirmat abonarea la newsletter-ul ZebraByte.`,
  });
  const text = `Articol nou: ${postTitle}\n${postExcerpt}\n\nCitește aici: ${postUrl}\n\nDezabonare: ${unsubscribeUrl}`;
  return { subject, html, text };
}
