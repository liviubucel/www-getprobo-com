type EmailBinding = {
  send: (message: {
    from: string;
    to: string;
    replyTo?: string;
    subject: string;
    text: string;
    html?: string;
  }) => Promise<void>;
};

type SecurityKvNamespace = {
  get: (key: string) => Promise<string | null>;
  put: (
    key: string,
    value: string,
    options?: { expirationTtl?: number },
  ) => Promise<void>;
  delete: (key: string) => Promise<void>;
};

export interface SecurityReportEnv {
  EMAIL: EmailBinding;
  NEWSLETTER: SecurityKvNamespace;
  TURNSTILE_SECRET_KEY: string;
  CONTACT_TO_EMAIL: string;
  CONTACT_FROM_EMAIL: string;
}

type Locale = "ro" | "en";

type OtpRecord = {
  digest: string;
  attempts: number;
  issuedAt: string;
};

const strictEmailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;
const phoneRegex = /^[0-9+() .\-]{7,40}$/;
const OTP_TTL_SECONDS = 600;
const OTP_RESEND_SECONDS = 60;
const OTP_MAX_ATTEMPTS = 5;
const VERIFIED_TTL_SECONDS = 1800;
const OTP_HOURLY_IP_LIMIT = 10;

const validAssetTypes = new Set([
  "website",
  "api",
  "portal",
  "worker-edge",
  "dns-domain",
  "email",
  "hosting",
  "application",
  "other",
]);

const validCategories = new Set([
  "access-control",
  "authentication",
  "injection",
  "xss",
  "ssrf",
  "csrf",
  "data-exposure",
  "misconfiguration",
  "dependency",
  "business-logic",
  "cryptography",
  "file-upload",
  "information-disclosure",
  "other",
]);

const validSeverities = new Set(["critical", "high", "medium", "low", "unsure"]);
const validEnvironments = new Set(["production", "staging", "development", "unknown"]);
const validAuthRequired = new Set(["yes", "no", "unknown"]);
const validDataExposure = new Set([
  "none-observed",
  "metadata",
  "personal-data",
  "credentials-secrets",
  "financial-data",
  "customer-content",
  "unknown",
  "other",
]);
const validExploitability = new Set(["reliable", "intermittent", "complex", "theoretical", "unknown"]);
const validDisclosure = new Set(["private", "coordinated", "no-preference"]);
const validYesNo = new Set(["yes", "no"]);

const copy = {
  ro: {
    required: "Completează toate câmpurile obligatorii.",
    invalidEmail: "Adresa de email nu este validă.",
    invalidPhone: "Numărul de telefon nu este valid.",
    invalidEvidenceUrl: "Linkul către dovezi trebuie să fie un URL HTTP sau HTTPS valid.",
    invalidValue: "Unul dintre câmpurile selectate conține o valoare neacceptată.",
    tooLong: "Unul dintre câmpuri depășește limita permisă.",
    tooLarge: "Raportul este prea mare pentru a fi procesat prin formular.",
    turnstile: "Verificarea anti-abuz a eșuat. Reîncarcă verificarea și încearcă din nou.",
    failed: "Raportul nu a putut fi trimis. Încearcă din nou sau folosește datele din security.txt.",
    verificationRequired: "Verifică adresa de email cu codul primit înainte de trimiterea raportului.",
    otpSent: "Codul de verificare a fost trimis. Este valabil 10 minute.",
    otpSendFailed: "Codul de verificare nu a putut fi trimis. Încearcă din nou.",
    otpInvalid: "Codul este incorect sau a expirat.",
    otpLocked: "Prea multe încercări. Solicită un cod nou.",
    otpCooldown: "Așteaptă înainte să soliciți un alt cod.",
    otpRate: "Prea multe solicitări de verificare. Încearcă mai târziu.",
    otpVerified: "Adresa de email a fost verificată.",
  },
  en: {
    required: "Please complete every required field.",
    invalidEmail: "The email address is not valid.",
    invalidPhone: "The phone number is not valid.",
    invalidEvidenceUrl: "The evidence link must be a valid HTTP or HTTPS URL.",
    invalidValue: "One of the selected fields contains an unsupported value.",
    tooLong: "One of the fields exceeds the allowed limit.",
    tooLarge: "The report is too large to be processed through this form.",
    turnstile: "The anti-abuse verification failed. Reload the verification and try again.",
    failed: "The report could not be sent. Please try again or use the contact details in security.txt.",
    verificationRequired: "Verify your email address with the received code before submitting the report.",
    otpSent: "The verification code was sent. It is valid for 10 minutes.",
    otpSendFailed: "The verification code could not be sent. Please try again.",
    otpInvalid: "The code is incorrect or has expired.",
    otpLocked: "Too many attempts. Request a new code.",
    otpCooldown: "Wait before requesting another code.",
    otpRate: "Too many verification requests. Try again later.",
    otpVerified: "The email address has been verified.",
  },
} as const;

export async function handleSecurityReportApi(
  request: Request,
  env: SecurityReportEnv,
): Promise<Response | null> {
  const url = new URL(request.url);
  const pathname = normalizeApiPath(url.pathname);

  if (request.method !== "POST") return null;

  if (pathname === "/api/security-report/email/start") {
    return handleEmailVerificationStart(request, env, url);
  }

  if (pathname === "/api/security-report/email/verify") {
    return handleEmailVerificationVerify(request, env, url);
  }

  if (pathname === "/api/security-report") {
    return handleReportSubmission(request, env, url);
  }

  return null;
}

async function handleEmailVerificationStart(
  request: Request,
  env: SecurityReportEnv,
  url: URL,
): Promise<Response> {
  const locale = localeFromRequest(request, url);
  const t = copy[locale];

  try {
    const data = await request.formData();
    const email = singleLine(data.get("email"), 254).toLowerCase();
    const turnstileToken = data.get("cf-turnstile-response")?.toString() || "";

    if (!strictEmailRegex.test(email)) {
      return jsonResponse({ success: false, error: t.invalidEmail }, 400);
    }

    const remoteIp = request.headers.get("CF-Connecting-IP") || "";
    if (!(await verifyTurnstile(env, turnstileToken, remoteIp))) {
      return jsonResponse({ success: false, error: t.turnstile }, 400);
    }

    const emailHash = await sha256Hex(email);
    const cooldownKey = `security:otp:cooldown:${emailHash}`;
    if (await env.NEWSLETTER.get(cooldownKey)) {
      return jsonResponse({ success: false, error: t.otpCooldown }, 429);
    }

    if (!(await allowOtpRequestFromIp(env, remoteIp))) {
      return jsonResponse({ success: false, error: t.otpRate }, 429);
    }

    const code = randomSixDigitCode();
    const digest = await otpDigest(env, email, code);
    const otpRecord: OtpRecord = {
      digest,
      attempts: 0,
      issuedAt: new Date().toISOString(),
    };

    await env.NEWSLETTER.put(
      `security:otp:${emailHash}`,
      JSON.stringify(otpRecord),
      { expirationTtl: OTP_TTL_SECONDS },
    );
    await env.NEWSLETTER.put(cooldownKey, "1", {
      expirationTtl: OTP_RESEND_SECONDS,
    });

    const message = verificationCodeEmail(code, locale);
    await env.EMAIL.send({
      from: env.CONTACT_FROM_EMAIL,
      to: email,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });

    return jsonResponse(
      {
        success: true,
        message: t.otpSent,
        expiresIn: OTP_TTL_SECONDS,
        resendAfter: OTP_RESEND_SECONDS,
      },
      200,
    );
  } catch (error) {
    console.error("security report email verification start failed", error);
    return jsonResponse({ success: false, error: t.otpSendFailed }, 500);
  }
}

async function handleEmailVerificationVerify(
  request: Request,
  env: SecurityReportEnv,
  url: URL,
): Promise<Response> {
  const locale = localeFromRequest(request, url);
  const t = copy[locale];

  try {
    const data = await request.formData();
    const email = singleLine(data.get("email"), 254).toLowerCase();
    const code = singleLine(data.get("code"), 6);

    if (!strictEmailRegex.test(email) || !/^\d{6}$/.test(code)) {
      return jsonResponse({ success: false, error: t.otpInvalid }, 400);
    }

    const emailHash = await sha256Hex(email);
    const otpKey = `security:otp:${emailHash}`;
    const raw = await env.NEWSLETTER.get(otpKey);
    if (!raw) {
      return jsonResponse({ success: false, error: t.otpInvalid }, 400);
    }

    const record = safeJson<OtpRecord>(raw);
    if (!record || record.attempts >= OTP_MAX_ATTEMPTS) {
      await env.NEWSLETTER.delete(otpKey);
      return jsonResponse({ success: false, error: t.otpLocked }, 429);
    }

    const digest = await otpDigest(env, email, code);
    if (!timingSafeEqualText(digest, record.digest)) {
      const attempts = record.attempts + 1;
      if (attempts >= OTP_MAX_ATTEMPTS) {
        await env.NEWSLETTER.delete(otpKey);
        return jsonResponse({ success: false, error: t.otpLocked }, 429);
      }

      await env.NEWSLETTER.put(
        otpKey,
        JSON.stringify({ ...record, attempts }),
        { expirationTtl: OTP_TTL_SECONDS },
      );
      return jsonResponse({ success: false, error: t.otpInvalid }, 400);
    }

    await env.NEWSLETTER.delete(otpKey);

    const verificationToken = `${crypto.randomUUID()}.${crypto.randomUUID()}`;
    const tokenHash = await sha256Hex(verificationToken);
    await env.NEWSLETTER.put(
      `security:verified:${tokenHash}`,
      JSON.stringify({ email, verifiedAt: new Date().toISOString() }),
      { expirationTtl: VERIFIED_TTL_SECONDS },
    );

    return jsonResponse(
      {
        success: true,
        message: t.otpVerified,
        verificationToken,
        expiresIn: VERIFIED_TTL_SECONDS,
      },
      200,
    );
  } catch (error) {
    console.error("security report email verification failed", error);
    return jsonResponse({ success: false, error: t.failed }, 500);
  }
}

async function handleReportSubmission(
  request: Request,
  env: SecurityReportEnv,
  url: URL,
): Promise<Response> {
  const locale = localeFromRequest(request, url);
  const t = copy[locale];

  const contentLength = Number.parseInt(request.headers.get("Content-Length") || "0", 10);
  if (Number.isFinite(contentLength) && contentLength > 180_000) {
    return jsonResponse({ success: false, error: t.tooLarge }, 413);
  }

  try {
    const data = await request.formData();

    if (singleLine(data.get("website"), 200)) {
      return jsonResponse({ success: true }, 200);
    }

    const firstName = singleLine(data.get("firstName"), 80);
    const lastName = singleLine(data.get("lastName"), 80);
    const email = singleLine(data.get("email"), 254).toLowerCase();
    const phone = singleLine(data.get("phone"), 40);
    const organization = singleLine(data.get("organization"), 150);
    const jobTitle = singleLine(data.get("jobTitle"), 150);
    const country = singleLine(data.get("country"), 100);
    const emailVerificationToken = singleLine(data.get("emailVerificationToken"), 100);

    const affectedAsset = singleLine(data.get("affectedAsset"), 500);
    const assetType = allowed(data.get("assetType"), validAssetTypes, 50);
    const category = allowed(data.get("category"), validCategories, 80);
    const severity = allowed(data.get("severity"), validSeverities, 30);
    const discoveredAt = singleLine(data.get("discoveredAt"), 50);
    const environment = allowed(data.get("environment"), validEnvironments, 30);
    const authRequired = allowed(data.get("authRequired"), validAuthRequired, 20);
    const accountContext = multiline(data.get("accountContext"), 1200);

    const summary = multiline(data.get("summary"), 500);
    const technicalDescription = multiline(data.get("technicalDescription"), 8000);
    const prerequisites = multiline(data.get("prerequisites"), 4000);
    const reproduction = multiline(data.get("reproduction"), 10000);
    const expectedBehavior = multiline(data.get("expectedBehavior"), 3000);
    const actualBehavior = multiline(data.get("actualBehavior"), 3000);
    const impact = multiline(data.get("impact"), 5000);
    const dataExposure = allowed(data.get("dataExposure"), validDataExposure, 40);
    const affectedUsers = singleLine(data.get("affectedUsers"), 100);
    const exploitability = allowed(data.get("exploitability"), validExploitability, 30);
    const poc = multiline(data.get("poc"), 8000);
    const evidenceUrl = singleLine(data.get("evidenceUrl"), 1000);
    const remediation = multiline(data.get("remediation"), 5000);

    const disclosure = allowed(data.get("disclosure"), validDisclosure, 30);
    const requestedDisclosureDate = singleLine(data.get("requestedDisclosureDate"), 100);
    const disclosedElsewhere = allowed(data.get("disclosedElsewhere"), validYesNo, 10);
    const otherRecipients = multiline(data.get("otherRecipients"), 1500);

    const authorizationAcknowledgement = data.get("authorizationAcknowledgement");
    const safeTestingAcknowledgement = data.get("safeTestingAcknowledgement");
    const accuracyAcknowledgement = data.get("accuracyAcknowledgement");
    const privacyAcknowledgement = data.get("privacyAcknowledgement");
    const turnstileToken = data.get("cf-turnstile-response")?.toString() || "";

    const requiredValues = [
      firstName,
      lastName,
      email,
      phone,
      organization,
      jobTitle,
      country,
      emailVerificationToken,
      affectedAsset,
      assetType,
      category,
      severity,
      discoveredAt,
      environment,
      authRequired,
      accountContext,
      summary,
      technicalDescription,
      prerequisites,
      reproduction,
      expectedBehavior,
      actualBehavior,
      impact,
      dataExposure,
      affectedUsers,
      exploitability,
      poc,
      evidenceUrl,
      remediation,
      disclosure,
      requestedDisclosureDate,
      disclosedElsewhere,
      otherRecipients,
    ];

    if (
      requiredValues.some((value) => !value) ||
      !authorizationAcknowledgement ||
      !safeTestingAcknowledgement ||
      !accuracyAcknowledgement ||
      !privacyAcknowledgement
    ) {
      return jsonResponse({ success: false, error: t.required }, 400);
    }

    if (!strictEmailRegex.test(email)) {
      return jsonResponse({ success: false, error: t.invalidEmail }, 400);
    }
    if (!phoneRegex.test(phone)) {
      return jsonResponse({ success: false, error: t.invalidPhone }, 400);
    }
    if (!isSafeHttpUrl(evidenceUrl)) {
      return jsonResponse({ success: false, error: t.invalidEvidenceUrl }, 400);
    }
    if (
      !assetType ||
      !category ||
      !severity ||
      !environment ||
      !authRequired ||
      !dataExposure ||
      !exploitability ||
      !disclosure ||
      !disclosedElsewhere
    ) {
      return jsonResponse({ success: false, error: t.invalidValue }, 400);
    }

    const verifiedTokenHash = await sha256Hex(emailVerificationToken);
    const verifiedKey = `security:verified:${verifiedTokenHash}`;
    const verifiedRaw = await env.NEWSLETTER.get(verifiedKey);
    const verified = verifiedRaw
      ? safeJson<{ email?: string; verifiedAt?: string }>(verifiedRaw)
      : null;
    if (!verified?.email || verified.email.toLowerCase() !== email) {
      return jsonResponse({ success: false, error: t.verificationRequired }, 403);
    }

    const remoteIp = request.headers.get("CF-Connecting-IP") || "";
    if (!(await verifyTurnstile(env, turnstileToken, remoteIp))) {
      return jsonResponse({ success: false, error: t.turnstile }, 400);
    }

    const reference = createReference();
    const receivedAt = new Date().toISOString();
    const reporter = `${firstName} ${lastName} <${email}>`;
    const internalSubject = `[Security report][${severity.toUpperCase()}] ${reference} — ${headerText(summary, 100)}`;

    const fields: Array<[string, string]> = [
      ["Reference", reference],
      ["Received", receivedAt],
      ["Reporter", reporter],
      ["Phone", phone],
      ["Organization", organization],
      ["Role / job title", jobTitle],
      ["Country", country],
      ["Email verified", verified.verifiedAt || "yes"],
      ["Affected asset", affectedAsset],
      ["Asset type", assetType],
      ["Category", category],
      ["Reporter severity", severity],
      ["Discovered at", discoveredAt],
      ["Environment", environment],
      ["Authentication required", authRequired],
      ["Data exposure", dataExposure],
      ["Affected users / accounts", affectedUsers],
      ["Exploitability", exploitability],
      ["Evidence URL", evidenceUrl],
      ["Disclosure preference", disclosure],
      ["Requested disclosure date", requestedDisclosureDate],
      ["Disclosed elsewhere", disclosedElsewhere],
    ];

    const sections: Array<[string, string]> = [
      ["Account / access context", accountContext],
      ["Summary", summary],
      ["Technical description", technicalDescription],
      ["Prerequisites", prerequisites],
      ["Reproduction steps", reproduction],
      ["Expected behavior", expectedBehavior],
      ["Actual behavior", actualBehavior],
      ["Security impact", impact],
      ["Proof of concept / evidence", poc],
      ["Suggested remediation", remediation],
      ["Other recipients / prior disclosure details", otherRecipients],
    ];

    const internalText = [
      ...fields.map(([label, value]) => `${label}: ${value}`),
      "",
      ...sections.flatMap(([label, value]) => [label + ":", value, ""]),
      `Source IP: ${remoteIp || "not available"}`,
      `User-Agent: ${request.headers.get("User-Agent") || "not available"}`,
    ].join("\n");

    await env.EMAIL.send({
      from: env.CONTACT_FROM_EMAIL,
      to: env.CONTACT_TO_EMAIL,
      replyTo: email,
      subject: internalSubject,
      text: internalText,
      html: internalReportHtml(fields, sections),
    });

    await env.NEWSLETTER.delete(verifiedKey);

    try {
      const acknowledgementEmail = reporterAcknowledgement(reference, locale);
      await env.EMAIL.send({
        from: env.CONTACT_FROM_EMAIL,
        to: email,
        subject: acknowledgementEmail.subject,
        text: acknowledgementEmail.text,
        html: acknowledgementEmail.html,
      });
    } catch (error) {
      console.error("security report acknowledgement failed", { reference, error });
    }

    return jsonResponse({ success: true, reference }, 200);
  } catch (error) {
    console.error("security report submission failed", error);
    return jsonResponse({ success: false, error: t.failed }, 500);
  }
}

async function allowOtpRequestFromIp(
  env: SecurityReportEnv,
  remoteIp: string,
): Promise<boolean> {
  if (!remoteIp) return true;
  const ipHash = await sha256Hex(remoteIp);
  const hour = new Date().toISOString().slice(0, 13);
  const key = `security:otp:rate:${ipHash}:${hour}`;
  const raw = await env.NEWSLETTER.get(key);
  const count = Number.parseInt(raw || "0", 10) || 0;
  if (count >= OTP_HOURLY_IP_LIMIT) return false;
  await env.NEWSLETTER.put(key, String(count + 1), { expirationTtl: 3700 });
  return true;
}

async function verifyTurnstile(
  env: SecurityReportEnv,
  token: string,
  remoteIp: string,
): Promise<boolean> {
  if (!env.TURNSTILE_SECRET_KEY || !token) return false;

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: env.TURNSTILE_SECRET_KEY,
          response: token,
          remoteip: remoteIp,
        }),
      },
    );
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch (error) {
    console.error("security report Turnstile verification failed", error);
    return false;
  }
}

function verificationCodeEmail(
  code: string,
  locale: Locale,
): { subject: string; text: string; html: string } {
  if (locale === "en") {
    return {
      subject: "Verify your email for a ZebraByte security report",
      text: `Your ZebraByte Security verification code is ${code}. It expires in 10 minutes. If you did not request this code, you can ignore this message.`,
      html: emailLayout(
        "Verify your email",
        `<p>Use this one-time code to verify your email before submitting a vulnerability report:</p><p style="font-size:30px;font-weight:750;letter-spacing:8px;margin:24px 0">${escapeHtml(code)}</p><p>This code expires in 10 minutes. If you did not request it, you can ignore this message.</p>`,
      ),
    };
  }

  return {
    subject: "Verifică emailul pentru raportarea de securitate ZebraByte",
    text: `Codul tău ZebraByte Security este ${code}. Expiră în 10 minute. Dacă nu ai solicitat acest cod, poți ignora mesajul.`,
    html: emailLayout(
      "Verifică adresa de email",
      `<p>Folosește acest cod unic pentru a verifica adresa de email înainte să trimiți raportul de vulnerabilitate:</p><p style="font-size:30px;font-weight:750;letter-spacing:8px;margin:24px 0">${escapeHtml(code)}</p><p>Codul expiră în 10 minute. Dacă nu l-ai solicitat, poți ignora mesajul.</p>`,
    ),
  };
}

function reporterAcknowledgement(
  reference: string,
  locale: Locale,
): { subject: string; text: string; html: string } {
  if (locale === "en") {
    const subject = `Security report received — ${reference} | ZebraByte`;
    const text = `We received your security report.\n\nReference: ${reference}\n\nKeep this reference for follow-up. Do not send passwords, private keys or other secrets by email. We will review the report and respond using the verified address you provided.`;
    const html = emailLayout(
      "Security report received",
      `<p>Thank you for reporting a potential security issue to ZebraByte.</p><p>Your reference is <strong>${escapeHtml(reference)}</strong>.</p><p>Keep this reference for follow-up. Do not send passwords, private keys or other secrets by email. We will review the report and respond using your verified email address.</p>`,
    );
    return { subject, text, html };
  }

  const subject = `Raport de securitate primit — ${reference} | ZebraByte`;
  const text = `Am primit raportul tău de securitate.\n\nReferință: ${reference}\n\nPăstrează această referință pentru comunicările ulterioare. Nu trimite parole, chei private sau alte secrete prin email. Vom analiza raportul și vom răspunde la adresa verificată.`;
  const html = emailLayout(
    "Raport de securitate primit",
    `<p>Mulțumim pentru raportarea unei posibile probleme de securitate către ZebraByte.</p><p>Referința raportului este <strong>${escapeHtml(reference)}</strong>.</p><p>Păstrează această referință pentru comunicările ulterioare. Nu trimite parole, chei private sau alte secrete prin email. Vom analiza raportul și vom răspunde la adresa verificată.</p>`,
  );
  return { subject, text, html };
}

function internalReportHtml(
  fields: Array<[string, string]>,
  sections: Array<[string, string]>,
): string {
  const tableRows = fields
    .map(([label, value]) => row(label, value))
    .join("");
  const sectionHtml = sections
    .map(([label, value]) => section(label, value))
    .join("");

  return `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111827;line-height:1.55"><div style="max-width:820px;margin:0 auto;padding:24px"><h1 style="font-size:22px">New ZebraByte security report</h1><table style="width:100%;border-collapse:collapse;margin:20px 0"><tbody>${tableRows}</tbody></table>${sectionHtml}</div></body></html>`;
}

function row(label: string, value: string): string {
  return `<tr><th style="text-align:left;vertical-align:top;padding:8px 12px;border:1px solid #e5e7eb;background:#f9fafb;width:220px">${escapeHtml(label)}</th><td style="padding:8px 12px;border:1px solid #e5e7eb">${escapeHtml(value)}</td></tr>`;
}

function section(label: string, value: string): string {
  return `<h2 style="font-size:16px;margin:24px 0 8px">${escapeHtml(label)}</h2><div style="white-space:pre-wrap;padding:14px;border:1px solid #e5e7eb;border-radius:8px;background:#f9fafb">${escapeHtml(value)}</div>`;
}

function emailLayout(title: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111827"><div style="max-width:600px;margin:0 auto;padding:32px 16px"><div style="background:#101214;color:white;padding:20px 24px;border-radius:12px 12px 0 0;font-weight:700">ZebraByte Security</div><div style="background:#fff;padding:28px 24px;border-radius:0 0 12px 12px"><h1 style="font-size:20px;margin-top:0">${escapeHtml(title)}</h1>${body}</div></div></body></html>`;
}

async function otpDigest(
  env: SecurityReportEnv,
  email: string,
  code: string,
): Promise<string> {
  return sha256Hex(`${email}|${code}|${env.TURNSTILE_SECRET_KEY}`);
}

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function randomSixDigitCode(): string {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return String(values[0] % 1_000_000).padStart(6, "0");
}

function timingSafeEqualText(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) {
    difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return difference === 0;
}

function safeJson<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function createReference(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  return `ZBT-SEC-${date}-${random}`;
}

function headerText(value: string, max: number): string {
  return value.replace(/[\r\n]+/g, " ").slice(0, max).trim();
}

function allowed(
  value: FormDataEntryValue | null,
  values: Set<string>,
  max: number,
): string {
  const normalized = singleLine(value, max);
  return values.has(normalized) ? normalized : "";
}

function singleLine(value: FormDataEntryValue | null, max: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/[\x00-\x1f\x7f]/g, "").trim().slice(0, max + 1);
}

function multiline(value: FormDataEntryValue | null, max: number): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "")
    .trim()
    .slice(0, max + 1);
}

function isSafeHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function localeFromRequest(request: Request, url: URL): Locale {
  const explicit = url.searchParams.get("lang")?.toLowerCase();
  if (explicit === "en" || explicit === "ro") return explicit;
  if (url.pathname === "/en" || url.pathname.startsWith("/en/")) return "en";

  const acceptLanguage = request.headers.get("Accept-Language")?.toLowerCase() || "";
  return acceptLanguage.includes("en") && !acceptLanguage.includes("ro") ? "en" : "ro";
}

function normalizeApiPath(pathname: string): string {
  if (pathname === "/en/api") return "/api";
  if (pathname.startsWith("/en/api/")) return pathname.slice(3);
  return pathname;
}

function jsonResponse(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
