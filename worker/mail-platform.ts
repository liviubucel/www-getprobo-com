import {
  getConfirmedSubscriberToken,
  getMailClient,
  isValidMailAddress,
  listActiveMailClients,
  listConfirmedMailSubscribers,
  normalizeMailAddress,
  type MailKvNamespace,
  upsertMailClient,
} from "./mail-clients";
import type {
  CampaignDeliveryQueueMessage,
  MailQueueBinding,
  MailQueueMessageEnvelope,
} from "./mail-queue-types";
import { captureSentryException, type SentryEnv } from "./sentry";

interface EmailBinding {
  send: (message: {
    from: string;
    to: string;
    subject: string;
    text: string;
    html?: string;
  }) => Promise<void>;
}

export interface MailPlatformEnv extends SentryEnv {
  EMAIL: EmailBinding;
  NEWSLETTER: MailKvNamespace;
  MAIL_QUEUE?: MailQueueBinding;
  NEWSLETTER_FROM_EMAIL: string;
  MAIL_ADMIN_SECRET?: string;
}

type MailLocale = "ro" | "en";
type MessageType = "transactional" | "service" | "security" | "marketing";
type Audience = "subscribers" | "clients" | "both" | "single" | "custom";
type DeliveryStatus = "queued" | "sending" | "sent" | "failed";

type CampaignInput = {
  subject?: string;
  bodyHtml?: string;
  bodyText?: string;
  locale?: MailLocale;
  messageType?: MessageType;
  audience?: Audience;
  singleEmail?: string;
  customEmail?: string;
  test?: boolean;
  sourceId?: string;
};

type CampaignRecord = {
  id: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  locale: MailLocale;
  messageType: MessageType;
  audience: Audience;
  test: boolean;
  origin: string;
  total: number;
  queueState: "preparing" | "queued" | "queue_failed";
  createdAt: string;
  sourceId?: string;
};

type DeliveryRecord = {
  id: string;
  campaignId: string;
  email: string;
  unsubscribeToken?: string;
  status: DeliveryStatus;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  failedAt?: string;
  lastErrorAt?: string;
};

type Recipient = {
  email: string;
  unsubscribeToken?: string;
};

const MESSAGE_TYPES = new Set<MessageType>([
  "transactional",
  "service",
  "security",
  "marketing",
]);
const AUDIENCES = new Set<Audience>([
  "subscribers",
  "clients",
  "both",
  "single",
  "custom",
]);
const MAX_RECIPIENTS = 10_000;
const DELIVERY_TTL_SECONDS = 90 * 24 * 60 * 60;
const MAX_SUBJECT_LENGTH = 200;
const MAX_HTML_LENGTH = 100_000;
const MAX_TEXT_LENGTH = 50_000;

function normalizeApiPath(pathname: string): string {
  if (pathname === "/en/api") return "/api";
  if (pathname.startsWith("/en/api/")) return pathname.slice(3);
  return pathname;
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function campaignKey(id: string): string {
  return `mail:campaign:${id}`;
}

function deliveryPrefix(campaignId: string): string {
  return `mail:delivery:${campaignId}:`;
}

function deliveryKey(campaignId: string, deliveryId: string): string {
  return `${deliveryPrefix(campaignId)}${deliveryId}`;
}

function idempotencyKey(hash: string): string {
  return `mail:idempotency:${hash}`;
}

function safeCampaignId(value: string): string | null {
  return /^[A-Za-z0-9-]{8,80}$/.test(value) ? value : null;
}

function isAuthorized(request: Request, expectedSecret?: string): boolean {
  if (!expectedSecret) return false;
  const actual = request.headers.get("Authorization") || "";
  const expected = `Bearer ${expectedSecret}`;
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let index = 0; index < actual.length; index += 1) {
    diff |= actual.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return diff === 0;
}

function sanitizeSubject(value: string): string {
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\x00-\x1f\x7f]/g, " ").replace(/\s+/g, " ").trim();
}

function isSafeEmailHtmlFragment(value: string): boolean {
  const lowered = value.toLowerCase();
  return !(
    /<(?:script|iframe|object|embed|form|html|head|body)\b/.test(lowered) ||
    /javascript\s*:/i.test(value) ||
    /data\s*:\s*text\/html/i.test(value)
  );
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function chunk<T>(values: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

async function resolveRecipients(
  env: MailPlatformEnv,
  input: Required<Pick<CampaignInput, "messageType" | "audience" | "test">> &
    Pick<CampaignInput, "singleEmail" | "customEmail">,
): Promise<Recipient[]> {
  const recipients = new Map<string, Recipient>();
  let subscriberCache: Map<string, string> | null = null;

  const subscribers = async (): Promise<Map<string, string>> => {
    if (subscriberCache) return subscriberCache;
    subscriberCache = new Map(
      (await listConfirmedMailSubscribers(env.NEWSLETTER)).map(({ email, token }) => [
        email,
        token,
      ]),
    );
    return subscriberCache;
  };

  const addSubscriber = (email: string, token: string) => {
    recipients.set(email, { email, unsubscribeToken: token });
  };

  if (input.audience === "subscribers" || input.audience === "both") {
    for (const [email, token] of await subscribers()) addSubscriber(email, token);
  }

  if (input.audience === "clients" || input.audience === "both") {
    const clients = await listActiveMailClients(env.NEWSLETTER);
    const confirmed = input.messageType === "marketing" ? await subscribers() : null;

    for (const client of clients) {
      if (input.messageType === "marketing") {
        const token = confirmed?.get(client.email);
        if (token) addSubscriber(client.email, token);
        continue;
      }

      if (!recipients.has(client.email)) {
        recipients.set(client.email, { email: client.email });
      }
    }
  }

  if (input.audience === "single") {
    const email = normalizeMailAddress(input.singleEmail || "");
    if (!isValidMailAddress(email)) return [];

    const token = await getConfirmedSubscriberToken(env.NEWSLETTER, email);
    if (input.messageType === "marketing") {
      if (token) addSubscriber(email, token);
      return [...recipients.values()];
    }

    const client = await getMailClient(env.NEWSLETTER, email);
    if (client?.status === "active" && !client.notificationsDisabled) {
      recipients.set(email, token ? { email, unsubscribeToken: token } : { email });
    }
  }

  if (input.audience === "custom") {
    const email = normalizeMailAddress(input.customEmail || "");
    if (!input.test || !isValidMailAddress(email)) return [];
    recipients.set(email, { email });
  }

  return [...recipients.values()];
}

function validateCampaignInput(
  body: CampaignInput,
): { ok: true; value: Required<Pick<CampaignInput, "subject" | "bodyHtml" | "bodyText" | "locale" | "messageType" | "audience" | "test">> & Pick<CampaignInput, "singleEmail" | "customEmail" | "sourceId"> } | { ok: false; error: string; status: number } {
  const subject = sanitizeSubject(body.subject || "");
  const bodyHtml = body.bodyHtml?.trim() || "";
  const bodyText = body.bodyText?.trim() || "";
  const locale: MailLocale = body.locale === "en" ? "en" : "ro";
  const messageType = body.messageType as MessageType;
  const audience = body.audience as Audience;
  const test = body.test === true;
  const sourceId = body.sourceId?.trim().slice(0, 240) || undefined;

  if (!subject || !bodyHtml || !bodyText || !MESSAGE_TYPES.has(messageType) || !AUDIENCES.has(audience)) {
    return { ok: false, error: "Missing or invalid campaign fields.", status: 400 };
  }
  if (
    subject.length > MAX_SUBJECT_LENGTH ||
    bodyHtml.length > MAX_HTML_LENGTH ||
    bodyText.length > MAX_TEXT_LENGTH
  ) {
    return { ok: false, error: "Campaign content is too large.", status: 413 };
  }
  if (!isSafeEmailHtmlFragment(bodyHtml)) {
    return { ok: false, error: "bodyHtml must be a safe HTML fragment.", status: 400 };
  }
  if (audience === "single" && !isValidMailAddress(body.singleEmail || "")) {
    return { ok: false, error: "singleEmail is invalid.", status: 400 };
  }
  if (audience === "custom" && (!test || !isValidMailAddress(body.customEmail || ""))) {
    return {
      ok: false,
      error: "Custom recipients are allowed only for an explicit test campaign.",
      status: 400,
    };
  }

  return {
    ok: true,
    value: {
      subject,
      bodyHtml,
      bodyText,
      locale,
      messageType,
      audience,
      test,
      singleEmail: body.singleEmail,
      customEmail: body.customEmail,
      sourceId,
    },
  };
}

async function createCampaign(
  request: Request,
  env: MailPlatformEnv,
  body: CampaignInput,
): Promise<Response> {
  if (!env.MAIL_QUEUE) {
    return jsonResponse({ success: false, error: "Mail queue is not configured." }, 503);
  }

  const validated = validateCampaignInput(body);
  if (!validated.ok) {
    return jsonResponse({ success: false, error: validated.error }, validated.status);
  }
  const input = validated.value;

  const requestIdempotency = request.headers.get("Idempotency-Key")?.trim().slice(0, 240);
  const sourceId = input.sourceId || requestIdempotency;
  let dedupeKey: string | undefined;

  if (sourceId) {
    dedupeKey = idempotencyKey(await sha256Hex(sourceId));
    const existingId = await env.NEWSLETTER.get(dedupeKey);
    if (existingId) {
      const existing = await getCampaignSummary(env.NEWSLETTER, existingId);
      return jsonResponse(
        { success: true, duplicate: true, campaign: existing || { id: existingId } },
        200,
      );
    }
  }

  const recipients = await resolveRecipients(env, input);
  if (recipients.length === 0) {
    return jsonResponse({ success: false, error: "Campaign has no eligible recipients." }, 422);
  }
  if (recipients.length > MAX_RECIPIENTS) {
    return jsonResponse({ success: false, error: "Campaign exceeds the recipient safety limit." }, 413);
  }

  const campaignId = crypto.randomUUID();
  const now = new Date().toISOString();
  const campaign: CampaignRecord = {
    id: campaignId,
    subject: input.subject,
    bodyHtml: input.bodyHtml,
    bodyText: input.bodyText,
    locale: input.locale,
    messageType: input.messageType,
    audience: input.audience,
    test: input.test,
    origin: new URL(request.url).origin,
    total: recipients.length,
    queueState: "preparing",
    createdAt: now,
    sourceId,
  };

  await env.NEWSLETTER.put(campaignKey(campaignId), JSON.stringify(campaign));
  if (dedupeKey) await env.NEWSLETTER.put(dedupeKey, campaignId);

  const queueMessages: Array<{ body: CampaignDeliveryQueueMessage; contentType: "json" }> = [];

  for (const recipientChunk of chunk(recipients, 50)) {
    await Promise.all(
      recipientChunk.map(async (recipient) => {
        const deliveryId = await sha256Hex(`${campaignId}:${recipient.email}`);
        const delivery: DeliveryRecord = {
          id: deliveryId,
          campaignId,
          email: recipient.email,
          unsubscribeToken: recipient.unsubscribeToken,
          status: "queued",
          createdAt: now,
          updatedAt: now,
        };
        await env.NEWSLETTER.put(
          deliveryKey(campaignId, deliveryId),
          JSON.stringify(delivery),
          { expirationTtl: DELIVERY_TTL_SECONDS },
        );
        queueMessages.push({
          body: { kind: "campaign-delivery", campaignId, deliveryId },
          contentType: "json",
        });
      }),
    );
  }

  try {
    for (const messageChunk of chunk(queueMessages, 100)) {
      await env.MAIL_QUEUE.sendBatch(messageChunk);
    }
    campaign.queueState = "queued";
    await env.NEWSLETTER.put(campaignKey(campaignId), JSON.stringify(campaign));
  } catch (error) {
    campaign.queueState = "queue_failed";
    await env.NEWSLETTER.put(campaignKey(campaignId), JSON.stringify(campaign));
    await captureSentryException(env, error, {
      request,
      component: "mail.campaign.enqueue",
    });
    return jsonResponse(
      { success: false, error: "Campaign was created but queueing was incomplete.", campaignId },
      503,
    );
  }

  const summary = await getCampaignSummary(env.NEWSLETTER, campaignId);
  return jsonResponse({ success: true, campaign: summary }, 202);
}

async function listDeliveryRecords(
  kv: MailKvNamespace,
  campaignId: string,
): Promise<DeliveryRecord[]> {
  const deliveries: DeliveryRecord[] = [];
  let cursor: string | undefined;
  do {
    const page = await kv.list({
      prefix: deliveryPrefix(campaignId),
      ...(cursor ? { cursor } : {}),
    });
    for (const key of page.keys) {
      const delivery = await kv.get<DeliveryRecord>(key.name, "json");
      if (delivery) deliveries.push(delivery);
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return deliveries;
}

async function getCampaignSummary(
  kv: MailKvNamespace,
  campaignId: string,
): Promise<Record<string, unknown> | null> {
  const campaign = await kv.get<CampaignRecord>(campaignKey(campaignId), "json");
  if (!campaign) return null;

  const deliveries = await listDeliveryRecords(kv, campaignId);
  const sent = deliveries.filter((item) => item.status === "sent").length;
  const failed = deliveries.filter((item) => item.status === "failed").length;
  const sending = deliveries.filter((item) => item.status === "sending").length;
  const queued = deliveries.filter((item) => item.status === "queued").length;
  const completed = sent + failed >= campaign.total;
  const status =
    campaign.queueState === "queue_failed" && sent === 0
      ? "queue_failed"
      : completed
        ? failed > 0
          ? "partial"
          : "sent"
        : sent > 0 || sending > 0
          ? "sending"
          : "queued";

  return {
    id: campaign.id,
    subject: campaign.subject,
    locale: campaign.locale,
    messageType: campaign.messageType,
    audience: campaign.audience,
    test: campaign.test,
    status,
    total: campaign.total,
    sent,
    failed,
    sending,
    queued,
    createdAt: campaign.createdAt,
  };
}

async function requeueCampaign(
  request: Request,
  env: MailPlatformEnv,
  campaignId: string,
): Promise<Response> {
  if (!env.MAIL_QUEUE) {
    return jsonResponse({ success: false, error: "Mail queue is not configured." }, 503);
  }
  const campaign = await env.NEWSLETTER.get<CampaignRecord>(campaignKey(campaignId), "json");
  if (!campaign) return jsonResponse({ success: false, error: "Campaign not found." }, 404);

  const deliveries = await listDeliveryRecords(env.NEWSLETTER, campaignId);
  const pending = deliveries.filter((delivery) => delivery.status !== "sent");
  const now = new Date().toISOString();

  const messages: Array<{ body: CampaignDeliveryQueueMessage; contentType: "json" }> = [];
  for (const delivery of pending) {
    const reset: DeliveryRecord = {
      ...delivery,
      status: "queued",
      updatedAt: now,
      failedAt: undefined,
      lastErrorAt: undefined,
    };
    await env.NEWSLETTER.put(
      deliveryKey(campaignId, delivery.id),
      JSON.stringify(reset),
      { expirationTtl: DELIVERY_TTL_SECONDS },
    );
    messages.push({
      body: { kind: "campaign-delivery", campaignId, deliveryId: delivery.id },
      contentType: "json",
    });
  }

  try {
    for (const messageChunk of chunk(messages, 100)) {
      await env.MAIL_QUEUE.sendBatch(messageChunk);
    }
    campaign.queueState = "queued";
    await env.NEWSLETTER.put(campaignKey(campaignId), JSON.stringify(campaign));
  } catch (error) {
    campaign.queueState = "queue_failed";
    await env.NEWSLETTER.put(campaignKey(campaignId), JSON.stringify(campaign));
    await captureSentryException(env, error, {
      request,
      component: "mail.campaign.requeue",
    });
    return jsonResponse({ success: false, error: "Unable to requeue all deliveries." }, 503);
  }

  return jsonResponse(
    { success: true, requeued: messages.length, campaign: await getCampaignSummary(env.NEWSLETTER, campaignId) },
    202,
  );
}

async function importClients(request: Request, env: MailPlatformEnv): Promise<Response> {
  let body: {
    contacts?: string | Array<{ email?: string; name?: string }>;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonResponse({ success: false, error: "Invalid JSON body." }, 400);
  }

  let contacts: Array<{ email: string; name?: string }> = [];
  if (typeof body.contacts === "string") {
    contacts = body.contacts
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [email, ...nameParts] = line.split(",");
        return { email: email.trim(), name: nameParts.join(",").trim() || undefined };
      });
  } else if (Array.isArray(body.contacts)) {
    contacts = body.contacts.map((item) => ({
      email: item.email?.trim() || "",
      name: item.name?.trim() || undefined,
    }));
  }

  if (contacts.length === 0 || contacts.length > 5_000) {
    return jsonResponse({ success: false, error: "Provide between 1 and 5000 contacts." }, 400);
  }

  let imported = 0;
  let rejected = 0;
  for (const contact of contacts) {
    if (!isValidMailAddress(contact.email)) {
      rejected += 1;
      continue;
    }
    await upsertMailClient(env.NEWSLETTER, {
      email: contact.email,
      name: contact.name,
      source: "manual",
    });
    imported += 1;
  }

  return jsonResponse({ success: true, imported, rejected }, 200);
}

async function clientStats(env: MailPlatformEnv): Promise<Response> {
  const [clients, subscribers] = await Promise.all([
    listActiveMailClients(env.NEWSLETTER),
    listConfirmedMailSubscribers(env.NEWSLETTER),
  ]);
  return jsonResponse(
    {
      success: true,
      activeClients: clients.length,
      confirmedSubscribers: subscribers.length,
    },
    200,
  );
}

export async function handleMailPlatformApi(
  request: Request,
  env: MailPlatformEnv,
): Promise<Response | null> {
  const url = new URL(request.url);
  const pathname = normalizeApiPath(url.pathname);
  if (!pathname.startsWith("/api/mail/")) return null;

  if (pathname === "/api/mail/upmind-webhook") return null;

  if (!isAuthorized(request, env.MAIL_ADMIN_SECRET)) {
    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
  }

  if (pathname === "/api/mail/clients/import" && request.method === "POST") {
    return importClients(request, env);
  }
  if (pathname === "/api/mail/clients/stats" && request.method === "GET") {
    return clientStats(env);
  }
  if (pathname === "/api/mail/campaigns" && request.method === "POST") {
    let body: CampaignInput;
    try {
      body = (await request.json()) as CampaignInput;
    } catch {
      return jsonResponse({ success: false, error: "Invalid JSON body." }, 400);
    }
    return createCampaign(request, env, body);
  }
  if (pathname === "/api/mail/sanity-broadcast" && request.method === "POST") {
    let body: CampaignInput & { documentId?: string };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return jsonResponse({ success: false, error: "Invalid JSON body." }, 400);
    }
    const documentId = body.documentId?.trim();
    if (!documentId || documentId.length > 200) {
      return jsonResponse({ success: false, error: "Missing documentId." }, 400);
    }
    return createCampaign(request, env, {
      ...body,
      sourceId: `sanity:${documentId.replace(/^drafts\./, "")}`,
    });
  }

  const requeueMatch = pathname.match(/^\/api\/mail\/campaigns\/([A-Za-z0-9-]{8,80})\/requeue$/);
  if (requeueMatch && request.method === "POST") {
    return requeueCampaign(request, env, requeueMatch[1]);
  }

  const campaignMatch = pathname.match(/^\/api\/mail\/campaigns\/([A-Za-z0-9-]{8,80})$/);
  if (campaignMatch && request.method === "GET") {
    const campaignId = safeCampaignId(campaignMatch[1]);
    if (!campaignId) return jsonResponse({ success: false, error: "Invalid campaign id." }, 400);
    const summary = await getCampaignSummary(env.NEWSLETTER, campaignId);
    if (!summary) return jsonResponse({ success: false, error: "Campaign not found." }, 404);
    return jsonResponse({ success: true, campaign: summary }, 200);
  }

  return jsonResponse({ success: false, error: "Not found." }, 404);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

function campaignEmail(
  campaign: CampaignRecord,
  delivery: DeliveryRecord,
): { subject: string; html: string; text: string } {
  const unsubscribeUrl = delivery.unsubscribeToken
    ? (() => {
        const url = new URL("/api/newsletter/unsubscribe", campaign.origin);
        url.searchParams.set("token", delivery.unsubscribeToken || "");
        url.searchParams.set("email", delivery.email);
        url.searchParams.set("lang", campaign.locale);
        return url.toString();
      })()
    : null;

  const footer = unsubscribeUrl
    ? campaign.locale === "en"
      ? `You receive this message through your ZebraByte newsletter subscription. <a href="${escapeHtml(unsubscribeUrl)}" style="color:#5c5e60;">Unsubscribe</a>.`
      : `Primești acest mesaj prin abonarea ta la newsletter-ul ZebraByte. <a href="${escapeHtml(unsubscribeUrl)}" style="color:#5c5e60;">Dezabonează-te</a>.`
    : campaign.test
      ? campaign.locale === "en"
        ? "ZebraByte test message."
        : "Mesaj de test ZebraByte."
      : campaign.locale === "en"
        ? "You receive this operational message in connection with ZebraByte services or your ZebraByte account."
        : "Primești acest mesaj operațional în legătură cu serviciile ZebraByte sau contul tău ZebraByte.";

  const html = `<!doctype html>
<html lang="${campaign.locale}">
  <body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 0;">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background:#fdfcfb;border-radius:12px;overflow:hidden;">
          <tr><td style="background:#101214;padding:24px 32px;color:#fff;font-size:20px;font-weight:700;">ZebraByte</td></tr>
          <tr><td style="padding:32px;color:#0a0b0e;font-size:15px;line-height:1.6;"><h2 style="font-size:18px;margin:0 0 16px;">${escapeHtml(campaign.subject)}</h2>${campaign.bodyHtml}</td></tr>
          <tr><td style="padding:20px 32px;border-top:1px solid #e5e7eb;color:#5c5e60;font-size:12px;line-height:1.5;">${footer}</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  return {
    subject: campaign.subject,
    html,
    text: `${campaign.subject}\n\n${campaign.bodyText}${unsubscribeUrl ? `\n\n${campaign.locale === "en" ? "Unsubscribe" : "Dezabonare"}: ${unsubscribeUrl}` : ""}`,
  };
}

export async function processCampaignDeliveryMessage(
  message: MailQueueMessageEnvelope,
  env: MailPlatformEnv,
): Promise<void> {
  const body = message.body as CampaignDeliveryQueueMessage;
  const campaignId = safeCampaignId(body.campaignId || "");
  const deliveryId = /^[a-f0-9]{64}$/.test(body.deliveryId || "") ? body.deliveryId : null;
  if (!campaignId || !deliveryId) {
    message.ack();
    return;
  }

  const [campaign, delivery] = await Promise.all([
    env.NEWSLETTER.get<CampaignRecord>(campaignKey(campaignId), "json"),
    env.NEWSLETTER.get<DeliveryRecord>(deliveryKey(campaignId, deliveryId), "json"),
  ]);

  if (!campaign || !delivery) {
    if (message.attempts >= 5) message.ack();
    else message.retry({ delaySeconds: Math.min(900, 15 * 2 ** message.attempts) });
    return;
  }
  if (delivery.status === "sent") {
    message.ack();
    return;
  }

  const now = new Date().toISOString();
  const sending: DeliveryRecord = {
    ...delivery,
    status: "sending",
    updatedAt: now,
  };
  await env.NEWSLETTER.put(
    deliveryKey(campaignId, deliveryId),
    JSON.stringify(sending),
    { expirationTtl: DELIVERY_TTL_SECONDS },
  );

  try {
    const mail = campaignEmail(campaign, sending);
    await env.EMAIL.send({
      from: env.NEWSLETTER_FROM_EMAIL,
      to: sending.email,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });

    const sent: DeliveryRecord = {
      ...sending,
      status: "sent",
      updatedAt: new Date().toISOString(),
      sentAt: new Date().toISOString(),
      lastErrorAt: undefined,
      failedAt: undefined,
    };
    await env.NEWSLETTER.put(
      deliveryKey(campaignId, deliveryId),
      JSON.stringify(sent),
      { expirationTtl: DELIVERY_TTL_SECONDS },
    );
    message.ack();
  } catch (error) {
    await captureSentryException(env, error, {
      component: "mail.campaign.delivery",
    });

    if (message.attempts >= 5) {
      const failed: DeliveryRecord = {
        ...sending,
        status: "failed",
        updatedAt: new Date().toISOString(),
        failedAt: new Date().toISOString(),
        lastErrorAt: new Date().toISOString(),
      };
      await env.NEWSLETTER.put(
        deliveryKey(campaignId, deliveryId),
        JSON.stringify(failed),
        { expirationTtl: DELIVERY_TTL_SECONDS },
      );
      message.ack();
      return;
    }

    const queued: DeliveryRecord = {
      ...sending,
      status: "queued",
      updatedAt: new Date().toISOString(),
      lastErrorAt: new Date().toISOString(),
    };
    await env.NEWSLETTER.put(
      deliveryKey(campaignId, deliveryId),
      JSON.stringify(queued),
      { expirationTtl: DELIVERY_TTL_SECONDS },
    );
    message.retry({ delaySeconds: Math.min(900, 15 * 2 ** message.attempts) });
  }
}
