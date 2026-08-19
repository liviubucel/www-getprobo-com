import {
  deactivateMailClient,
  isValidMailAddress,
  type MailKvNamespace,
  upsertMailClient,
} from "./mail-clients";
import type {
  MailQueueBinding,
  MailQueueMessageEnvelope,
  UpmindClientSyncQueueMessage,
} from "./mail-queue-types";
import { captureSentryException, type SentryEnv } from "./sentry";

export interface UpmindMailSyncEnv extends SentryEnv {
  NEWSLETTER: MailKvNamespace;
  MAIL_QUEUE?: MailQueueBinding;
  UPMIND_WEBHOOK_SECRET?: string;
}

type UpmindClientObject = {
  id?: string;
  email?: string;
  login_email?: string;
  notification_email?: string;
  firstname?: string;
  lastname?: string;
  first_name?: string;
  last_name?: string;
  fullname?: string;
  full_name?: string;
  deleted_at?: string | null;
  notifications_disabled?: boolean;
  default_email?: { email?: string } | null;
};

type UpmindWebhookPayload = {
  webhook_event_id?: string;
  version?: string;
  hook_category?: string;
  hook_code?: string;
  object_type?: string;
  object_id?: string;
  object?: UpmindClientObject | null;
};

type PendingClientSync = {
  eventId: string;
  hookCode: string;
  action: "upsert" | "deactivate";
  upmindId?: string;
  email?: string;
  name?: string;
  notificationsDisabled: boolean;
  receivedAt: string;
};

const MAX_WEBHOOK_BYTES = 256_000;
const PENDING_TTL_SECONDS = 24 * 60 * 60;
const EVENT_TTL_SECONDS = 30 * 24 * 60 * 60;

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

function pendingKey(eventId: string): string {
  return `mail:upmind:pending:${eventId}`;
}

function acceptedKey(eventId: string): string {
  return `mail:upmind:accepted:${eventId}`;
}

function processedKey(eventId: string): string {
  return `mail:upmind:processed:${eventId}`;
}

function safeEventId(value: string): string | null {
  const trimmed = value.trim();
  return /^[A-Za-z0-9-]{8,80}$/.test(trimmed) ? trimmed : null;
}

function isRelevantClientHook(hookCode: string): boolean {
  const code = hookCode.toLowerCase();
  return (
    code.includes("registered") ||
    code.includes("created") ||
    code.includes("updated") ||
    code.includes("deleted") ||
    code.includes("notification_emails_disabled") ||
    code.includes("login_email_updated")
  );
}

function clientAction(payload: UpmindWebhookPayload): "upsert" | "deactivate" {
  const code = payload.hook_code?.toLowerCase() || "";
  if (code.includes("deleted") || payload.object?.deleted_at) return "deactivate";
  return "upsert";
}

function extractClient(payload: UpmindWebhookPayload): PendingClientSync | null {
  const eventId = safeEventId(payload.webhook_event_id || "");
  const hookCode = payload.hook_code?.trim() || "";
  if (!eventId || !hookCode) return null;

  const object = payload.object || {};
  const email = [
    object.notification_email,
    object.default_email?.email,
    object.login_email,
    object.email,
  ]
    .map((value) => value?.trim() || "")
    .find((value) => isValidMailAddress(value));

  const name =
    object.full_name?.trim() ||
    object.fullname?.trim() ||
    [object.first_name || object.firstname, object.last_name || object.lastname]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    undefined;

  const upmindId = object.id?.trim() || payload.object_id?.trim() || undefined;
  const action = clientAction(payload);

  if (action === "upsert" && !email) return null;
  if (action === "deactivate" && !email && !upmindId) return null;

  return {
    eventId,
    hookCode: hookCode.slice(0, 160),
    action,
    upmindId,
    email,
    name: name?.slice(0, 160),
    notificationsDisabled: Boolean(object.notifications_disabled),
    receivedAt: new Date().toISOString(),
  };
}

async function verifySignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
): Promise<boolean> {
  const signature = signatureHeader?.trim().toLowerCase() || "";
  if (!/^[a-f0-9]{64}$/.test(signature)) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(rawBody),
  );
  const expected = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let index = 0; index < expected.length; index += 1) {
    diff |= expected.charCodeAt(index) ^ signature.charCodeAt(index);
  }
  return diff === 0;
}

export async function handleUpmindMailSyncApi(
  request: Request,
  env: UpmindMailSyncEnv,
): Promise<Response | null> {
  const url = new URL(request.url);
  const pathname = normalizeApiPath(url.pathname);
  if (pathname !== "/api/mail/upmind-webhook" || request.method !== "POST") {
    return null;
  }

  if (!env.UPMIND_WEBHOOK_SECRET) {
    return jsonResponse({ success: false, error: "Webhook is not configured." }, 503);
  }
  if (!env.MAIL_QUEUE) {
    return jsonResponse({ success: false, error: "Mail queue is not configured." }, 503);
  }

  const declaredLength = Number(request.headers.get("Content-Length") || "0");
  if (declaredLength > MAX_WEBHOOK_BYTES) {
    return jsonResponse({ success: false, error: "Payload too large." }, 413);
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_WEBHOOK_BYTES) {
    return jsonResponse({ success: false, error: "Payload too large." }, 413);
  }

  if (
    !(await verifySignature(
      rawBody,
      request.headers.get("X-Webhook-Signature"),
      env.UPMIND_WEBHOOK_SECRET,
    ))
  ) {
    return jsonResponse({ success: false, error: "Invalid signature." }, 401);
  }

  let payload: UpmindWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as UpmindWebhookPayload;
  } catch {
    return jsonResponse({ success: false, error: "Invalid JSON." }, 400);
  }

  if (
    payload.version !== "V1" ||
    payload.hook_category !== "client" ||
    payload.object_type !== "client"
  ) {
    return jsonResponse({ success: true, skipped: true }, 200);
  }

  if (!payload.hook_code || !isRelevantClientHook(payload.hook_code)) {
    return jsonResponse({ success: true, skipped: true }, 200);
  }

  const sync = extractClient(payload);
  if (!sync) {
    return jsonResponse({ success: false, error: "Unsupported client payload." }, 422);
  }

  if (
    (await env.NEWSLETTER.get(acceptedKey(sync.eventId))) ||
    (await env.NEWSLETTER.get(processedKey(sync.eventId)))
  ) {
    return jsonResponse({ success: true, duplicate: true }, 200);
  }

  try {
    await env.NEWSLETTER.put(pendingKey(sync.eventId), JSON.stringify(sync), {
      expirationTtl: PENDING_TTL_SECONDS,
    });
    await env.MAIL_QUEUE.send({ kind: "upmind-client-sync", eventId: sync.eventId });
    await env.NEWSLETTER.put(acceptedKey(sync.eventId), "1", {
      expirationTtl: EVENT_TTL_SECONDS,
    });
  } catch (error) {
    await env.NEWSLETTER.delete(pendingKey(sync.eventId));
    await captureSentryException(env, error, {
      request,
      component: "mail.upmind.enqueue",
    });
    return jsonResponse({ success: false, error: "Unable to queue client update." }, 503);
  }

  return jsonResponse({ success: true, queued: true }, 200);
}

export async function processUpmindClientSyncMessage(
  message: MailQueueMessageEnvelope,
  env: UpmindMailSyncEnv,
): Promise<void> {
  const body = message.body as UpmindClientSyncQueueMessage;
  const eventId = safeEventId(body.eventId || "");
  if (!eventId) {
    message.ack();
    return;
  }

  if (await env.NEWSLETTER.get(processedKey(eventId))) {
    message.ack();
    return;
  }

  const sync = await env.NEWSLETTER.get<PendingClientSync>(pendingKey(eventId), "json");
  if (!sync) {
    if (message.attempts >= 5) {
      message.ack();
    } else {
      message.retry({ delaySeconds: Math.min(900, 15 * 2 ** message.attempts) });
    }
    return;
  }

  try {
    if (sync.action === "deactivate") {
      await deactivateMailClient(env.NEWSLETTER, {
        email: sync.email,
        upmindId: sync.upmindId,
      });
    } else {
      if (!sync.email) throw new Error("Upmind sync is missing a valid email.");
      await upsertMailClient(env.NEWSLETTER, {
        email: sync.email,
        name: sync.name,
        source: "upmind",
        upmindId: sync.upmindId,
        notificationsDisabled: sync.notificationsDisabled,
      });
    }

    await Promise.all([
      env.NEWSLETTER.put(processedKey(eventId), "1", {
        expirationTtl: EVENT_TTL_SECONDS,
      }),
      env.NEWSLETTER.delete(pendingKey(eventId)),
    ]);
    message.ack();
  } catch (error) {
    await captureSentryException(env, error, {
      component: "mail.upmind.process",
    });

    if (message.attempts >= 5) {
      message.ack();
    } else {
      message.retry({ delaySeconds: Math.min(900, 15 * 2 ** message.attempts) });
    }
  }
}
