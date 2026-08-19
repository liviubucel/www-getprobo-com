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
import { classifyEmailServiceError } from "./email-service-errors";
import { trackMailEvent, type MailAnalyticsEnv } from "./mail-analytics";
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
  }) => Promise<unknown>;
}

interface WorkflowBinding {
  create: (options: {
    id?: string;
    params?: { campaignId: string; scheduledAt: string };
  }) => Promise<{ id: string }>;
}

export interface MailPlatformEnv extends SentryEnv, MailAnalyticsEnv {
  EMAIL: EmailBinding;
  NEWSLETTER: MailKvNamespace;
  MAIL_QUEUE?: MailQueueBinding;
  MAIL_SCHEDULER?: WorkflowBinding;
  NEWSLETTER_FROM_EMAIL: string;
  MAIL_ADMIN_SECRET?: string;
}

type MailLocale = "ro" | "en";
type MessageType = "transactional" | "service" | "security" | "marketing";
type Audience = "subscribers" | "clients" | "both" | "single" | "custom";
type CampaignState =
  | "preparing"
  | "scheduled"
  | "queued"
  | "paused"
  | "cancelled"
  | "queue_failed";
type DeliveryStatus = "queued" | "sending" | "sent" | "failed" | "suppressed";

export type CampaignInput = {
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
  scheduledAt?: string;
};

type NormalizedCampaignInput = {
  subject: string;
  bodyHtml: string;
  bodyText: string;
  locale: MailLocale;
  messageType: MessageType;
  audience: Audience;
  singleEmail?: string;
  customEmail?: string;
  test: boolean;
  sourceId?: string;
  scheduledAt?: string;
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
  state: CampaignState;
  createdAt: string;
  approvedAt: string;
  sourceId?: string;
  scheduledAt?: string;
  workflowId?: string;
  pausedFrom?: "scheduled" | "queued" | "queue_failed";
};

type PreviewRecord = {
  id: string;
  input: NormalizedCampaignInput;
  origin: string;
  recipientCount: number;
  recipientFingerprint: string;
  createdAt: string;
  expiresAt: string;
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
  errorCode?: string;
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
const PREVIEW_TTL_SECONDS = 15 * 60;
const MAX_SUBJECT_LENGTH = 200;
const MAX_HTML_LENGTH = 100_000;
const MAX_TEXT_LENGTH = 50_000;
const MAX_SCHEDULE_AHEAD_MS = 366 * 24 * 60 * 60 * 1000;

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
function previewKey(id: string): string {
  return `mail:preview:${id}`;
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

function safePreviewId(value: string): string | null {
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

function parseScheduledAt(value?: string): { ok: true; value?: string } | { ok: false; error: string } {
  const raw = value?.trim();
  if (!raw) return { ok: true };
  const timestamp = Date.parse(raw);
  if (!Number.isFinite(timestamp)) return { ok: false, error: "scheduledAt must be a valid ISO date." };
  if (timestamp > Date.now() + MAX_SCHEDULE_AHEAD_MS) {
    return { ok: false, error: "scheduledAt is too far in the future." };
  }
  return { ok: true, value: new Date(timestamp).toISOString() };
}

async function resolveRecipients(
  env: MailPlatformEnv,
  input: Pick<NormalizedCampaignInput, "messageType" | "audience" | "test" | "singleEmail" | "customEmail">,
): Promise<Recipient[]> {
  const recipients = new Map<string, Recipient>();
  let subscriberCache: Map<string, string> | null = null;

  const subscribers = async (): Promise<Map<string, string>> => {
    if (subscriberCache) return subscriberCache;
    subscriberCache = new Map(
      (await listConfirmedMailSubscribers(env.NEWSLETTER)).map(({ email, token }) => [email, token]),
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
      } else if (!recipients.has(client.email)) {
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

async function recipientFingerprint(recipients: Recipient[]): Promise<string> {
  const stable = recipients
    .map((recipient) => `${recipient.email}:${recipient.unsubscribeToken || ""}`)
    .sort()
    .join("\n");
  return sha256Hex(stable);
}

function validateCampaignInput(
  body: CampaignInput,
): { ok: true; value: NormalizedCampaignInput } | { ok: false; error: string; status: number } {
  const subject = sanitizeSubject(body.subject || "");
  const bodyHtml = body.bodyHtml?.trim() || "";
  const bodyText = body.bodyText?.trim() || "";
  const locale: MailLocale = body.locale === "en" ? "en" : "ro";
  const messageType = body.messageType as MessageType;
  const audience = body.audience as Audience;
  const test = body.test === true;
  const sourceId = body.sourceId?.trim().slice(0, 240) || undefined;
  const scheduled = parseScheduledAt(body.scheduledAt);

  if (!scheduled.ok) return { ok: false, error: scheduled.error, status: 400 };
  if (!subject || !bodyHtml || !bodyText || !MESSAGE_TYPES.has(messageType) || !AUDIENCES.has(audience)) {
    return { ok: false, error: "Missing or invalid campaign fields.", status: 400 };
  }
  if (subject.length > MAX_SUBJECT_LENGTH || bodyHtml.length > MAX_HTML_LENGTH || bodyText.length > MAX_TEXT_LENGTH) {
    return { ok: false, error: "Campaign content is too large.", status: 413 };
  }
  if (!isSafeEmailHtmlFragment(bodyHtml)) {
    return { ok: false, error: "bodyHtml must be a safe HTML fragment.", status: 400 };
  }
  if (audience === "single" && !isValidMailAddress(body.singleEmail || "")) {
    return { ok: false, error: "singleEmail is invalid.", status: 400 };
  }
  if (audience === "custom" && (!test || !isValidMailAddress(body.customEmail || ""))) {
    return { ok: false, error: "Custom recipients are allowed only for an explicit test campaign.", status: 400 };
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
      scheduledAt: scheduled.value,
    },
  };
}

async function makePreview(
  request: Request,
  env: MailPlatformEnv,
  body: CampaignInput,
): Promise<Response> {
  const validated = validateCampaignInput(body);
  if (!validated.ok) return jsonResponse({ success: false, error: validated.error }, validated.status);

  const recipients = await resolveRecipients(env, validated.value);
  if (recipients.length === 0) return jsonResponse({ success: false, error: "Campaign has no eligible recipients." }, 422);
  if (recipients.length > MAX_RECIPIENTS) {
    return jsonResponse({ success: false, error: "Campaign exceeds the recipient safety limit." }, 413);
  }

  const id = crypto.randomUUID();
  const created = Date.now();
  const preview: PreviewRecord = {
    id,
    input: validated.value,
    origin: new URL(request.url).origin,
    recipientCount: recipients.length,
    recipientFingerprint: await recipientFingerprint(recipients),
    createdAt: new Date(created).toISOString(),
    expiresAt: new Date(created + PREVIEW_TTL_SECONDS * 1000).toISOString(),
  };
  await env.NEWSLETTER.put(previewKey(id), JSON.stringify(preview), { expirationTtl: PREVIEW_TTL_SECONDS });
  trackMailEvent(env, "campaign_previewed", {
    messageType: preview.input.messageType,
    audience: preview.input.audience,
    locale: preview.input.locale,
    count: preview.recipientCount,
  });

  return jsonResponse({
    success: true,
    requiresConfirmation: true,
    preview: {
      id,
      subject: preview.input.subject,
      locale: preview.input.locale,
      messageType: preview.input.messageType,
      audience: preview.input.audience,
      test: preview.input.test,
      recipientCount: preview.recipientCount,
      scheduledAt: preview.input.scheduledAt || null,
      expiresAt: preview.expiresAt,
    },
  }, 200);
}

async function listDeliveryRecords(kv: MailKvNamespace, campaignId: string): Promise<DeliveryRecord[]> {
  const deliveries: DeliveryRecord[] = [];
  let cursor: string | undefined;
  do {
    const page = await kv.list({ prefix: deliveryPrefix(campaignId), ...(cursor ? { cursor } : {}) });
    for (const key of page.keys) {
      const delivery = await kv.get<DeliveryRecord>(key.name, "json");
      if (delivery) deliveries.push(delivery);
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return deliveries;
}

async function enqueueDeliveries(env: MailPlatformEnv, campaign: CampaignRecord): Promise<number> {
  if (!env.MAIL_QUEUE) throw new Error("Mail queue is not configured.");
  const deliveries = (await listDeliveryRecords(env.NEWSLETTER, campaign.id))
    .filter((delivery) => delivery.status === "queued" || delivery.status === "failed");
  const messages = deliveries.map((delivery) => ({
    body: { kind: "campaign-delivery", campaignId: campaign.id, deliveryId: delivery.id } as CampaignDeliveryQueueMessage,
    contentType: "json" as const,
  }));
  for (const messageChunk of chunk(messages, 100)) await env.MAIL_QUEUE.sendBatch(messageChunk);
  return messages.length;
}

async function persistDeliveries(
  env: MailPlatformEnv,
  campaignId: string,
  recipients: Recipient[],
): Promise<void> {
  const now = new Date().toISOString();
  for (const recipientChunk of chunk(recipients, 50)) {
    await Promise.all(recipientChunk.map(async (recipient) => {
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
      await env.NEWSLETTER.put(deliveryKey(campaignId, deliveryId), JSON.stringify(delivery), {
        expirationTtl: DELIVERY_TTL_SECONDS,
      });
    }));
  }
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
  const suppressed = deliveries.filter((item) => item.status === "suppressed").length;
  const sending = deliveries.filter((item) => item.status === "sending").length;
  const queued = deliveries.filter((item) => item.status === "queued").length;
  const completed = sent + failed + suppressed >= campaign.total;

  let status: string = campaign.state;
  if (campaign.state === "queued" && completed) {
    status = failed > 0 || suppressed > 0 ? "partial" : "sent";
  } else if (campaign.state === "queued" && (sent > 0 || sending > 0)) {
    status = "sending";
  }

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
    suppressed,
    sending,
    queued,
    createdAt: campaign.createdAt,
    approvedAt: campaign.approvedAt,
    scheduledAt: campaign.scheduledAt || null,
  };
}

async function createApprovedCampaign(
  request: Request,
  env: MailPlatformEnv,
  input: NormalizedCampaignInput,
  recipients: Recipient[],
): Promise<Response> {
  if (!env.MAIL_QUEUE) return jsonResponse({ success: false, error: "Mail queue is not configured." }, 503);

  const requestIdempotency = request.headers.get("Idempotency-Key")?.trim().slice(0, 240);
  const sourceId = input.sourceId || requestIdempotency;
  let dedupeKey: string | undefined;
  if (sourceId) {
    dedupeKey = idempotencyKey(await sha256Hex(sourceId));
    const existingId = await env.NEWSLETTER.get(dedupeKey);
    if (existingId) {
      return jsonResponse({ success: true, duplicate: true, campaign: await getCampaignSummary(env.NEWSLETTER, existingId) || { id: existingId } }, 200);
    }
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
    state: "preparing",
    createdAt: now,
    approvedAt: now,
    sourceId,
    scheduledAt: input.scheduledAt,
  };

  await env.NEWSLETTER.put(campaignKey(campaignId), JSON.stringify(campaign));
  if (dedupeKey) await env.NEWSLETTER.put(dedupeKey, campaignId);
  await persistDeliveries(env, campaignId, recipients);

  const scheduledTimestamp = input.scheduledAt ? Date.parse(input.scheduledAt) : 0;
  if (scheduledTimestamp > Date.now() + 5_000) {
    if (!env.MAIL_SCHEDULER) {
      campaign.state = "queue_failed";
      await env.NEWSLETTER.put(campaignKey(campaignId), JSON.stringify(campaign));
      return jsonResponse({ success: false, error: "Mail scheduler is not configured.", campaignId }, 503);
    }
    try {
      campaign.state = "scheduled";
      const workflow = await env.MAIL_SCHEDULER.create({
        id: `mail-${campaignId}`,
        params: { campaignId, scheduledAt: input.scheduledAt! },
      });
      campaign.workflowId = workflow.id;
      await env.NEWSLETTER.put(campaignKey(campaignId), JSON.stringify(campaign));
      trackMailEvent(env, "campaign_scheduled", {
        campaignId,
        messageType: campaign.messageType,
        audience: campaign.audience,
        locale: campaign.locale,
        count: campaign.total,
      });
      return jsonResponse({ success: true, campaign: await getCampaignSummary(env.NEWSLETTER, campaignId) }, 202);
    } catch (error) {
      campaign.state = "queue_failed";
      await env.NEWSLETTER.put(campaignKey(campaignId), JSON.stringify(campaign));
      await captureSentryException(env, error, { request, component: "mail.campaign.schedule" });
      return jsonResponse({ success: false, error: "Campaign scheduling failed.", campaignId }, 503);
    }
  }

  try {
    await enqueueDeliveries(env, campaign);
    campaign.state = "queued";
    await env.NEWSLETTER.put(campaignKey(campaignId), JSON.stringify(campaign));
    trackMailEvent(env, "campaign_queued", {
      campaignId,
      messageType: campaign.messageType,
      audience: campaign.audience,
      locale: campaign.locale,
      count: campaign.total,
    });
  } catch (error) {
    campaign.state = "queue_failed";
    await env.NEWSLETTER.put(campaignKey(campaignId), JSON.stringify(campaign));
    await captureSentryException(env, error, { request, component: "mail.campaign.enqueue" });
    return jsonResponse({ success: false, error: "Campaign was created but queueing was incomplete.", campaignId }, 503);
  }

  return jsonResponse({ success: true, campaign: await getCampaignSummary(env.NEWSLETTER, campaignId) }, 202);
}

async function confirmPreview(request: Request, env: MailPlatformEnv, previewId: string): Promise<Response> {
  const safeId = safePreviewId(previewId);
  if (!safeId) return jsonResponse({ success: false, error: "Invalid preview id." }, 400);
  const preview = await env.NEWSLETTER.get<PreviewRecord>(previewKey(safeId), "json");
  if (!preview) return jsonResponse({ success: false, error: "Preview expired or not found." }, 404);

  const recipients = await resolveRecipients(env, preview.input);
  if (recipients.length !== preview.recipientCount || await recipientFingerprint(recipients) !== preview.recipientFingerprint) {
    return jsonResponse({ success: false, error: "Eligible recipients changed after preview. Generate a new preview." }, 409);
  }

  const response = await createApprovedCampaign(request, env, preview.input, recipients);
  if (response.status < 500) await env.NEWSLETTER.delete(previewKey(safeId));
  return response;
}

async function directCampaignRequest(request: Request, env: MailPlatformEnv, body: CampaignInput): Promise<Response> {
  const validated = validateCampaignInput(body);
  if (!validated.ok) return jsonResponse({ success: false, error: validated.error }, validated.status);
  const automation = request.headers.get("X-ZebraByte-Mail-Automation") || "";
  const autoApprovedBlog = automation === "blog-notify" && validated.value.sourceId?.startsWith("blog:");
  const safeTest = validated.value.test && validated.value.audience === "custom";

  if (!autoApprovedBlog && !safeTest) return makePreview(request, env, validated.value);
  const recipients = await resolveRecipients(env, validated.value);
  if (recipients.length === 0) return jsonResponse({ success: false, error: "Campaign has no eligible recipients." }, 422);
  return createApprovedCampaign(request, env, validated.value, recipients);
}

export async function activateScheduledCampaign(campaignId: string, env: MailPlatformEnv): Promise<void> {
  const safeId = safeCampaignId(campaignId);
  if (!safeId || !env.MAIL_QUEUE) return;
  const campaign = await env.NEWSLETTER.get<CampaignRecord>(campaignKey(safeId), "json");
  if (!campaign || campaign.state !== "scheduled") return;
  if (campaign.scheduledAt && Date.parse(campaign.scheduledAt) > Date.now() + 2_000) return;

  try {
    const count = await enqueueDeliveries(env, campaign);
    campaign.state = "queued";
    await env.NEWSLETTER.put(campaignKey(safeId), JSON.stringify(campaign));
    trackMailEvent(env, "campaign_schedule_released", { campaignId: safeId, count });
  } catch (error) {
    campaign.state = "queue_failed";
    await env.NEWSLETTER.put(campaignKey(safeId), JSON.stringify(campaign));
    await captureSentryException(env, error, { component: "mail.campaign.schedule-release" });
    throw error;
  }
}

async function changeCampaignState(
  request: Request,
  env: MailPlatformEnv,
  campaignId: string,
  action: "pause" | "resume" | "cancel",
): Promise<Response> {
  const campaign = await env.NEWSLETTER.get<CampaignRecord>(campaignKey(campaignId), "json");
  if (!campaign) return jsonResponse({ success: false, error: "Campaign not found." }, 404);

  if (action === "cancel") {
    if (campaign.state === "cancelled") return jsonResponse({ success: true, campaign: await getCampaignSummary(env.NEWSLETTER, campaignId) }, 200);
    campaign.state = "cancelled";
    await env.NEWSLETTER.put(campaignKey(campaignId), JSON.stringify(campaign));
    trackMailEvent(env, "campaign_cancelled", { campaignId });
    return jsonResponse({ success: true, campaign: await getCampaignSummary(env.NEWSLETTER, campaignId) }, 200);
  }

  if (action === "pause") {
    if (campaign.state === "cancelled") return jsonResponse({ success: false, error: "Cancelled campaigns cannot be paused." }, 409);
    if (campaign.state !== "paused") {
      campaign.pausedFrom = campaign.state === "scheduled" ? "scheduled" : campaign.state === "queue_failed" ? "queue_failed" : "queued";
      campaign.state = "paused";
      await env.NEWSLETTER.put(campaignKey(campaignId), JSON.stringify(campaign));
      trackMailEvent(env, "campaign_paused", { campaignId });
    }
    return jsonResponse({ success: true, campaign: await getCampaignSummary(env.NEWSLETTER, campaignId) }, 200);
  }

  if (campaign.state !== "paused") return jsonResponse({ success: false, error: "Campaign is not paused." }, 409);
  const futureSchedule = campaign.scheduledAt && Date.parse(campaign.scheduledAt) > Date.now() + 2_000;
  if (futureSchedule) {
    campaign.state = "scheduled";
    await env.NEWSLETTER.put(campaignKey(campaignId), JSON.stringify(campaign));
  } else {
    try {
      campaign.state = "queued";
      await env.NEWSLETTER.put(campaignKey(campaignId), JSON.stringify(campaign));
      await enqueueDeliveries(env, campaign);
    } catch (error) {
      campaign.state = "queue_failed";
      await env.NEWSLETTER.put(campaignKey(campaignId), JSON.stringify(campaign));
      await captureSentryException(env, error, { request, component: "mail.campaign.resume" });
      return jsonResponse({ success: false, error: "Unable to resume campaign." }, 503);
    }
  }
  trackMailEvent(env, "campaign_resumed", { campaignId });
  return jsonResponse({ success: true, campaign: await getCampaignSummary(env.NEWSLETTER, campaignId) }, 202);
}

async function requeueCampaign(request: Request, env: MailPlatformEnv, campaignId: string): Promise<Response> {
  const campaign = await env.NEWSLETTER.get<CampaignRecord>(campaignKey(campaignId), "json");
  if (!campaign) return jsonResponse({ success: false, error: "Campaign not found." }, 404);
  if (campaign.state === "cancelled" || campaign.state === "paused") {
    return jsonResponse({ success: false, error: "Resume or recreate this campaign before requeueing." }, 409);
  }

  const deliveries = await listDeliveryRecords(env.NEWSLETTER, campaignId);
  const resettable = deliveries.filter((delivery) => delivery.status === "failed" || delivery.status === "queued" || delivery.status === "sending");
  const now = new Date().toISOString();
  await Promise.all(resettable.map((delivery) => env.NEWSLETTER.put(
    deliveryKey(campaignId, delivery.id),
    JSON.stringify({ ...delivery, status: "queued", updatedAt: now, failedAt: undefined, lastErrorAt: undefined, errorCode: undefined }),
    { expirationTtl: DELIVERY_TTL_SECONDS },
  )));

  try {
    campaign.state = "queued";
    await env.NEWSLETTER.put(campaignKey(campaignId), JSON.stringify(campaign));
    const count = await enqueueDeliveries(env, campaign);
    trackMailEvent(env, "campaign_requeued", { campaignId, count });
    return jsonResponse({ success: true, requeued: count, campaign: await getCampaignSummary(env.NEWSLETTER, campaignId) }, 202);
  } catch (error) {
    campaign.state = "queue_failed";
    await env.NEWSLETTER.put(campaignKey(campaignId), JSON.stringify(campaign));
    await captureSentryException(env, error, { request, component: "mail.campaign.requeue" });
    return jsonResponse({ success: false, error: "Unable to requeue all deliveries." }, 503);
  }
}

async function importClients(request: Request, env: MailPlatformEnv): Promise<Response> {
  let body: { contacts?: string | Array<{ email?: string; name?: string }> };
  try { body = await request.json() as typeof body; } catch { return jsonResponse({ success: false, error: "Invalid JSON body." }, 400); }

  let contacts: Array<{ email: string; name?: string }> = [];
  if (typeof body.contacts === "string") {
    contacts = body.contacts.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
      const [email, ...nameParts] = line.split(",");
      return { email: email.trim(), name: nameParts.join(",").trim() || undefined };
    });
  } else if (Array.isArray(body.contacts)) {
    contacts = body.contacts.map((item) => ({ email: item.email?.trim() || "", name: item.name?.trim() || undefined }));
  }
  if (contacts.length === 0 || contacts.length > 5_000) {
    return jsonResponse({ success: false, error: "Provide between 1 and 5000 contacts." }, 400);
  }

  let imported = 0;
  let rejected = 0;
  for (const contact of contacts) {
    if (!isValidMailAddress(contact.email)) { rejected += 1; continue; }
    await upsertMailClient(env.NEWSLETTER, { email: contact.email, name: contact.name, source: "manual" });
    imported += 1;
  }
  trackMailEvent(env, "clients_imported", { count: imported });
  return jsonResponse({ success: true, imported, rejected }, 200);
}

async function clientStats(env: MailPlatformEnv): Promise<Response> {
  const [clients, subscribers] = await Promise.all([
    listActiveMailClients(env.NEWSLETTER),
    listConfirmedMailSubscribers(env.NEWSLETTER),
  ]);
  return jsonResponse({ success: true, activeClients: clients.length, confirmedSubscribers: subscribers.length }, 200);
}

export async function handleMailPlatformApi(request: Request, env: MailPlatformEnv): Promise<Response | null> {
  const url = new URL(request.url);
  const pathname = normalizeApiPath(url.pathname);
  if (!pathname.startsWith("/api/mail/")) return null;
  if (pathname === "/api/mail/upmind-webhook") return null;
  if (!isAuthorized(request, env.MAIL_ADMIN_SECRET)) return jsonResponse({ success: false, error: "Unauthorized" }, 401);

  if (pathname === "/api/mail/clients/import" && request.method === "POST") return importClients(request, env);
  if (pathname === "/api/mail/clients/stats" && request.method === "GET") return clientStats(env);

  if (pathname === "/api/mail/campaigns/preview" && request.method === "POST") {
    let body: CampaignInput;
    try { body = await request.json() as CampaignInput; } catch { return jsonResponse({ success: false, error: "Invalid JSON body." }, 400); }
    return makePreview(request, env, body);
  }
  if (pathname === "/api/mail/campaigns/confirm" && request.method === "POST") {
    let body: { previewId?: string };
    try { body = await request.json() as typeof body; } catch { return jsonResponse({ success: false, error: "Invalid JSON body." }, 400); }
    return confirmPreview(request, env, body.previewId || "");
  }
  if (pathname === "/api/mail/campaigns" && request.method === "POST") {
    let body: CampaignInput;
    try { body = await request.json() as CampaignInput; } catch { return jsonResponse({ success: false, error: "Invalid JSON body." }, 400); }
    return directCampaignRequest(request, env, body);
  }

  if (pathname === "/api/mail/sanity-broadcast/preview" && request.method === "POST") {
    let body: CampaignInput & { documentId?: string };
    try { body = await request.json() as typeof body; } catch { return jsonResponse({ success: false, error: "Invalid JSON body." }, 400); }
    const documentId = body.documentId?.trim().replace(/^drafts\./, "");
    if (!documentId || documentId.length > 200) return jsonResponse({ success: false, error: "Missing documentId." }, 400);
    return makePreview(request, env, { ...body, sourceId: `sanity:${documentId}` });
  }
  if (pathname === "/api/mail/sanity-broadcast" && request.method === "POST") {
    let body: { documentId?: string; previewId?: string; approved?: boolean };
    try { body = await request.json() as typeof body; } catch { return jsonResponse({ success: false, error: "Invalid JSON body." }, 400); }
    const documentId = body.documentId?.trim().replace(/^drafts\./, "");
    if (!documentId || !body.previewId || body.approved !== true) {
      return jsonResponse({ success: false, error: "Sanity broadcast requires documentId, previewId and approved=true." }, 400);
    }
    const preview = await env.NEWSLETTER.get<PreviewRecord>(previewKey(body.previewId), "json");
    if (!preview || preview.input.sourceId !== `sanity:${documentId}`) {
      return jsonResponse({ success: false, error: "Preview does not match this Sanity document." }, 409);
    }
    return confirmPreview(request, env, body.previewId);
  }

  const actionMatch = pathname.match(/^\/api\/mail\/campaigns\/([A-Za-z0-9-]{8,80})\/(pause|resume|cancel|requeue)$/);
  if (actionMatch && request.method === "POST") {
    const [, campaignId, action] = actionMatch;
    if (action === "requeue") return requeueCampaign(request, env, campaignId);
    return changeCampaignState(request, env, campaignId, action as "pause" | "resume" | "cancel");
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
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;");
}

function campaignEmail(campaign: CampaignRecord, delivery: DeliveryRecord): { subject: string; html: string; text: string } {
  const unsubscribeUrl = delivery.unsubscribeToken ? (() => {
    const target = new URL("/api/newsletter/unsubscribe", campaign.origin);
    target.searchParams.set("token", delivery.unsubscribeToken || "");
    target.searchParams.set("email", delivery.email);
    target.searchParams.set("lang", campaign.locale);
    return target.toString();
  })() : null;

  const footer = unsubscribeUrl
    ? campaign.locale === "en"
      ? `You receive this message through your ZebraByte newsletter subscription. <a href="${escapeHtml(unsubscribeUrl)}" style="color:#5c5e60;">Unsubscribe</a>.`
      : `Primești acest mesaj prin abonarea ta la newsletter-ul ZebraByte. <a href="${escapeHtml(unsubscribeUrl)}" style="color:#5c5e60;">Dezabonează-te</a>.`
    : campaign.test
      ? campaign.locale === "en" ? "ZebraByte test message." : "Mesaj de test ZebraByte."
      : campaign.locale === "en"
        ? "You receive this operational message in connection with ZebraByte services or your ZebraByte account."
        : "Primești acest mesaj operațional în legătură cu serviciile ZebraByte sau contul tău ZebraByte.";

  const html = `<!doctype html><html lang="${campaign.locale}"><body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 0;"><tr><td align="center"><table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background:#fdfcfb;border-radius:12px;overflow:hidden;"><tr><td style="background:#101214;padding:24px 32px;color:#fff;font-size:20px;font-weight:700;">ZebraByte</td></tr><tr><td style="padding:32px;color:#0a0b0e;font-size:15px;line-height:1.6;"><h2 style="font-size:18px;margin:0 0 16px;">${escapeHtml(campaign.subject)}</h2>${campaign.bodyHtml}</td></tr><tr><td style="padding:20px 32px;border-top:1px solid #e5e7eb;color:#5c5e60;font-size:12px;line-height:1.5;">${footer}</td></tr></table></td></tr></table></body></html>`;
  return {
    subject: campaign.subject,
    html,
    text: `${campaign.subject}\n\n${campaign.bodyText}${unsubscribeUrl ? `\n\n${campaign.locale === "en" ? "Unsubscribe" : "Dezabonare"}: ${unsubscribeUrl}` : ""}`,
  };
}

export async function processCampaignDeliveryMessage(message: MailQueueMessageEnvelope, env: MailPlatformEnv): Promise<void> {
  const body = message.body as CampaignDeliveryQueueMessage;
  const campaignId = safeCampaignId(body.campaignId || "");
  const deliveryId = /^[a-f0-9]{64}$/.test(body.deliveryId || "") ? body.deliveryId : null;
  if (!campaignId || !deliveryId) { message.ack(); return; }

  const [campaign, delivery] = await Promise.all([
    env.NEWSLETTER.get<CampaignRecord>(campaignKey(campaignId), "json"),
    env.NEWSLETTER.get<DeliveryRecord>(deliveryKey(campaignId, deliveryId), "json"),
  ]);
  if (!campaign || !delivery) {
    if (message.attempts >= 5) message.ack();
    else message.retry({ delaySeconds: Math.min(900, 15 * 2 ** message.attempts) });
    return;
  }

  // Paused/cancelled/scheduled queue messages are acknowledged without sending.
  // Resume/release explicitly requeues the still-queued delivery records.
  if (campaign.state === "paused" || campaign.state === "cancelled" || campaign.state === "scheduled") {
    message.ack();
    return;
  }
  if (campaign.state !== "queued") {
    message.ack();
    return;
  }
  if (delivery.status === "sent" || delivery.status === "suppressed") { message.ack(); return; }

  const now = new Date().toISOString();
  const sending: DeliveryRecord = { ...delivery, status: "sending", updatedAt: now };
  await env.NEWSLETTER.put(deliveryKey(campaignId, deliveryId), JSON.stringify(sending), {
    expirationTtl: DELIVERY_TTL_SECONDS,
  });

  try {
    const mail = campaignEmail(campaign, sending);
    await env.EMAIL.send({
      from: env.NEWSLETTER_FROM_EMAIL,
      to: sending.email,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });
    const sentAt = new Date().toISOString();
    await env.NEWSLETTER.put(deliveryKey(campaignId, deliveryId), JSON.stringify({
      ...sending,
      status: "sent",
      updatedAt: sentAt,
      sentAt,
      lastErrorAt: undefined,
      failedAt: undefined,
      errorCode: undefined,
    } satisfies DeliveryRecord), { expirationTtl: DELIVERY_TTL_SECONDS });
    trackMailEvent(env, "delivery_sent", { campaignId, count: 1 });
    message.ack();
  } catch (error) {
    const failure = classifyEmailServiceError(error);
    const failedAt = new Date().toISOString();

    if (failure.kind === "suppressed") {
      await env.NEWSLETTER.put(deliveryKey(campaignId, deliveryId), JSON.stringify({
        ...sending,
        status: "suppressed",
        updatedAt: failedAt,
        failedAt,
        lastErrorAt: failedAt,
        errorCode: failure.code,
      } satisfies DeliveryRecord), { expirationTtl: DELIVERY_TTL_SECONDS });
      trackMailEvent(env, "delivery_suppressed", { campaignId, errorCode: failure.code });
      message.ack();
      return;
    }

    if (failure.kind === "permanent" || message.attempts >= 5) {
      await env.NEWSLETTER.put(deliveryKey(campaignId, deliveryId), JSON.stringify({
        ...sending,
        status: "failed",
        updatedAt: failedAt,
        failedAt,
        lastErrorAt: failedAt,
        errorCode: failure.code,
      } satisfies DeliveryRecord), { expirationTtl: DELIVERY_TTL_SECONDS });
      trackMailEvent(env, "delivery_failed", { campaignId, errorCode: failure.code });
      if (failure.code !== "E_DELIVERY_FAILED") {
        await captureSentryException(env, error, { component: "mail.campaign.delivery-permanent" });
      }
      message.ack();
      return;
    }

    await env.NEWSLETTER.put(deliveryKey(campaignId, deliveryId), JSON.stringify({
      ...sending,
      status: "queued",
      updatedAt: failedAt,
      lastErrorAt: failedAt,
      errorCode: failure.code,
    } satisfies DeliveryRecord), { expirationTtl: DELIVERY_TTL_SECONDS });
    trackMailEvent(env, "delivery_retry", { campaignId, errorCode: failure.code });
    await captureSentryException(env, error, { component: "mail.campaign.delivery-retry" });
    message.retry({ delaySeconds: Math.min(900, 15 * 2 ** message.attempts) });
  }
}
