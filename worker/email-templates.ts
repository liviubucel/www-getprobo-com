export type EmailLocale = "ro" | "en";

const BRAND_COLOR = "#101214";
const TEXT_COLOR = "#0a0b0e";
const MUTED_COLOR = "#5c5e60";
const SURFACE_COLOR = "#fdfcfb";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

function layout(
  locale: EmailLocale,
  preheader: string,
  bodyHtml: string,
  footerHtml: string,
): string {
  return `<!doctype html>
<html lang="${locale}">
  <body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <span style="display:none;font-size:1px;color:#f4f5f7;">${escapeHtml(preheader)}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background:${SURFACE_COLOR};border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background:${BRAND_COLOR};padding:24px 32px;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.02em;">
                ZebraByte
              </td>
            </tr>
            <tr>
              <td style="padding:32px;color:${TEXT_COLOR};font-size:15px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;border-top:1px solid #e5e7eb;color:${MUTED_COLOR};font-size:12px;line-height:1.5;">
                ${footerHtml}
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
  const preview = message.length > 280 ? `${message.slice(0, 280)}…` : message;

  if (locale === "en") {
    const subject = "We received your message | ZebraByte";
    const html = layout(
      locale,
      `Thanks, ${firstName}. We received your message.`,
      `<p>Hello, ${escapeHtml(firstName)}!</p>
       <p>Thanks for contacting ZebraByte. We received your message and will reply as soon as possible, usually within one business day.</p>
       <p style="margin:24px 0;padding:16px 20px;background:#f4f5f7;border-radius:8px;color:${MUTED_COLOR};">
         “${escapeHtml(preview).replace(/\n/g, "<br>")}”
       </p>
       <p>Talk soon,<br>The ZebraByte team</p>`,
      `You are receiving this email because you sent a message through the contact form on <a href="https://www.zebrabyte.ro/en" style="color:${MUTED_COLOR};">zebrabyte.ro</a>.`,
    );
    const text = `Hello, ${firstName}!\n\nThanks for contacting ZebraByte. We received your message and will reply as soon as possible, usually within one business day.\n\nYour message:\n"${message}"\n\nTalk soon,\nThe ZebraByte team`;
    return { subject, html, text };
  }

  const subject = "Am primit mesajul tău | ZebraByte";
  const html = layout(
    locale,
    `Mulțumim, ${firstName}! Am primit mesajul tău.`,
    `<p>Salut, ${escapeHtml(firstName)}!</p>
     <p>Mulțumim că ne-ai scris. Am primit mesajul tău și îți vom răspunde cât mai rapid posibil, de obicei în maximum o zi lucrătoare.</p>
     <p style="margin:24px 0;padding:16px 20px;background:#f4f5f7;border-radius:8px;color:${MUTED_COLOR};">
       „${escapeHtml(preview).replace(/\n/g, "<br>")}”
     </p>
     <p>Pe curând,<br>Echipa ZebraByte</p>`,
    `Primești acest email pentru că ai trimis un mesaj prin formularul de contact de pe <a href="https://www.zebrabyte.ro" style="color:${MUTED_COLOR};">zebrabyte.ro</a>.`,
  );
  const text = `Salut, ${firstName}!\n\nMulțumim că ne-ai scris. Am primit mesajul tău și îți vom răspunde cât mai rapid posibil, de obicei în maximum o zi lucrătoare.\n\nMesajul tău:\n"${message}"\n\nPe curând,\nEchipa ZebraByte`;
  return { subject, html, text };
}

export function newsletterConfirmationEmail(
  confirmUrl: string,
  locale: EmailLocale,
): { subject: string; html: string; text: string } {
  const safeUrl = escapeHtml(confirmUrl);

  if (locale === "en") {
    const subject = "Confirm your ZebraByte newsletter subscription";
    const html = layout(
      locale,
      "Confirm your email address to receive ZebraByte updates.",
      `<p>Hello!</p>
       <p>Someone (probably you) used this email address to subscribe to the ZebraByte newsletter. Confirm the subscription using the button below:</p>
       <p style="text-align:center;margin:28px 0;">
         <a href="${safeUrl}" style="background:${BRAND_COLOR};color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:999px;font-weight:bold;display:inline-block;">Confirm subscription</a>
       </p>
       <p>If you did not request this, you can ignore this email. You will not be subscribed without confirmation.</p>`,
      `You are receiving this email because this address was entered in the newsletter form on <a href="https://www.zebrabyte.ro/en" style="color:${MUTED_COLOR};">zebrabyte.ro</a>.`,
    );
    const text = `Confirm your ZebraByte newsletter subscription: ${confirmUrl}\n\nIf you did not request this, ignore this email.`;
    return { subject, html, text };
  }

  const subject = "Confirmă abonarea la newsletter-ul ZebraByte";
  const html = layout(
    locale,
    "Confirmă adresa de email ca să primești noutățile ZebraByte.",
    `<p>Salut!</p>
     <p>Cineva (probabil tu) a folosit această adresă pentru a se abona la newsletter-ul ZebraByte. Apasă butonul de mai jos ca să confirmi:</p>
     <p style="text-align:center;margin:28px 0;">
       <a href="${safeUrl}" style="background:${BRAND_COLOR};color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:999px;font-weight:bold;display:inline-block;">Confirmă abonarea</a>
     </p>
     <p>Dacă nu ai cerut tu asta, poți ignora acest email. Nu vei fi abonat fără confirmare.</p>`,
    `Primești acest email pentru că această adresă a fost introdusă în formularul de newsletter de pe <a href="https://www.zebrabyte.ro" style="color:${MUTED_COLOR};">zebrabyte.ro</a>.`,
  );
  const text = `Confirmă abonarea la newsletter-ul ZebraByte: ${confirmUrl}\n\nDacă nu ai cerut tu asta, ignoră acest email.`;
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
  const safePostUrl = escapeHtml(postUrl);
  const safeUnsubscribeUrl = escapeHtml(unsubscribeUrl);

  if (locale === "en") {
    const subject = `New ZebraByte article: ${postTitle}`;
    const html = layout(
      locale,
      postExcerpt || postTitle,
      `<p>We published a new article:</p>
       <h2 style="font-size:18px;margin:16px 0 8px;">${title}</h2>
       ${postExcerpt ? `<p style="color:${MUTED_COLOR};">${excerpt}</p>` : ""}
       <p style="text-align:center;margin:28px 0;"><a href="${safePostUrl}" style="background:${BRAND_COLOR};color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:999px;font-weight:bold;display:inline-block;">Read the article</a></p>`,
      `You subscribed to the ZebraByte newsletter. <a href="${safeUnsubscribeUrl}" style="color:${MUTED_COLOR};">Unsubscribe</a>.`,
    );
    const text = `New article: ${postTitle}\n${postExcerpt}\n\nRead it here: ${postUrl}\n\nUnsubscribe: ${unsubscribeUrl}`;
    return { subject, html, text };
  }

  const subject = `Articol nou pe blogul ZebraByte: ${postTitle}`;
  const html = layout(
    locale,
    postExcerpt || postTitle,
    `<p>Am publicat un articol nou:</p>
     <h2 style="font-size:18px;margin:16px 0 8px;">${title}</h2>
     ${postExcerpt ? `<p style="color:${MUTED_COLOR};">${excerpt}</p>` : ""}
     <p style="text-align:center;margin:28px 0;"><a href="${safePostUrl}" style="background:${BRAND_COLOR};color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:999px;font-weight:bold;display:inline-block;">Citește articolul</a></p>`,
    `Primești acest email pentru că te-ai abonat la newsletter-ul ZebraByte. <a href="${safeUnsubscribeUrl}" style="color:${MUTED_COLOR};">Dezabonează-te</a>.`,
  );
  const text = `Articol nou: ${postTitle}\n${postExcerpt}\n\nCitește aici: ${postUrl}\n\nDezabonare: ${unsubscribeUrl}`;
  return { subject, html, text };
}
