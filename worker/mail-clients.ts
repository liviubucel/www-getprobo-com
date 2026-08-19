export interface MailKvListResult {
  keys: Array<{ name: string }>;
  list_complete: boolean;
  cursor?: string;
}

export interface MailKvNamespace {
  get: <T = string>(key: string, type?: "json") => Promise<T | null>;
  put: (
    key: string,
    value: string,
    options?: { expirationTtl?: number },
  ) => Promise<void>;
  delete: (key: string) => Promise<void>;
  list: (options?: { prefix?: string; cursor?: string }) => Promise<MailKvListResult>;
}

export type MailClientSource = "manual" | "upmind";
export type MailClientStatus = "active" | "inactive";

export interface MailClientRecord {
  email: string;
  name?: string;
  source: MailClientSource;
  status: MailClientStatus;
  notificationsDisabled: boolean;
  upmindId?: string;
  createdAt: string;
  updatedAt: string;
  deactivatedAt?: string;
}

export interface ConfirmedMailSubscriber {
  email: string;
  token: string;
}

const STRICT_EMAIL = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;

export function normalizeMailAddress(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidMailAddress(value: string): boolean {
  const email = normalizeMailAddress(value);
  return (
    email.length <= 254 &&
    STRICT_EMAIL.test(email) &&
    !/[\r\n\0<>"']/.test(email)
  );
}

function clientKey(email: string): string {
  return `client:${normalizeMailAddress(email)}`;
}

function activeClientKey(email: string): string {
  return `client-active:${normalizeMailAddress(email)}`;
}

function upmindClientKey(upmindId: string): string {
  return `client-upmind:${upmindId}`;
}

export async function getMailClient(
  kv: MailKvNamespace,
  email: string,
): Promise<MailClientRecord | null> {
  if (!isValidMailAddress(email)) return null;
  return kv.get<MailClientRecord>(clientKey(email), "json");
}

export async function upsertMailClient(
  kv: MailKvNamespace,
  input: {
    email: string;
    name?: string;
    source: MailClientSource;
    upmindId?: string;
    notificationsDisabled?: boolean;
  },
): Promise<MailClientRecord> {
  const email = normalizeMailAddress(input.email);
  if (!isValidMailAddress(email)) {
    throw new Error("Invalid client email address.");
  }

  const now = new Date().toISOString();

  if (input.upmindId) {
    const previousEmail = await kv.get(upmindClientKey(input.upmindId));
    if (previousEmail && normalizeMailAddress(previousEmail) !== email) {
      await Promise.all([
        kv.delete(clientKey(previousEmail)),
        kv.delete(activeClientKey(previousEmail)),
      ]);
    }
  }

  const previous = await kv.get<MailClientRecord>(clientKey(email), "json");
  const record: MailClientRecord = {
    email,
    name: input.name?.trim().slice(0, 160) || previous?.name,
    source: input.source,
    status: "active",
    notificationsDisabled: Boolean(input.notificationsDisabled),
    upmindId: input.upmindId || previous?.upmindId,
    createdAt: previous?.createdAt || now,
    updatedAt: now,
  };

  const writes: Promise<void>[] = [
    kv.put(clientKey(email), JSON.stringify(record)),
  ];

  if (record.notificationsDisabled) {
    writes.push(kv.delete(activeClientKey(email)));
  } else {
    writes.push(kv.put(activeClientKey(email), JSON.stringify(record)));
  }

  if (record.upmindId) {
    writes.push(kv.put(upmindClientKey(record.upmindId), email));
  }

  await Promise.all(writes);
  return record;
}

export async function deactivateMailClient(
  kv: MailKvNamespace,
  input: { email?: string; upmindId?: string },
): Promise<boolean> {
  let email = input.email ? normalizeMailAddress(input.email) : "";

  if (!email && input.upmindId) {
    email = normalizeMailAddress((await kv.get(upmindClientKey(input.upmindId))) || "");
  }

  if (!email || !isValidMailAddress(email)) return false;

  const existing = await kv.get<MailClientRecord>(clientKey(email), "json");
  if (!existing) {
    await kv.delete(activeClientKey(email));
    return false;
  }

  const record: MailClientRecord = {
    ...existing,
    status: "inactive",
    updatedAt: new Date().toISOString(),
    deactivatedAt: new Date().toISOString(),
  };

  await Promise.all([
    kv.put(clientKey(email), JSON.stringify(record)),
    kv.delete(activeClientKey(email)),
  ]);

  return true;
}

export async function listActiveMailClients(
  kv: MailKvNamespace,
): Promise<MailClientRecord[]> {
  const clients: MailClientRecord[] = [];
  let cursor: string | undefined;

  do {
    const page = await kv.list({
      prefix: "client-active:",
      ...(cursor ? { cursor } : {}),
    });

    for (const key of page.keys) {
      const record = await kv.get<MailClientRecord>(key.name, "json");
      if (
        record &&
        record.status === "active" &&
        !record.notificationsDisabled &&
        isValidMailAddress(record.email)
      ) {
        clients.push(record);
      }
    }

    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  return clients;
}

export async function getConfirmedSubscriberToken(
  kv: MailKvNamespace,
  email: string,
): Promise<string | null> {
  const normalized = normalizeMailAddress(email);
  if (!isValidMailAddress(normalized)) return null;
  return kv.get(`confirmed:${normalized}`);
}

export async function listConfirmedMailSubscribers(
  kv: MailKvNamespace,
): Promise<ConfirmedMailSubscriber[]> {
  const subscribers: ConfirmedMailSubscriber[] = [];
  let cursor: string | undefined;

  do {
    const page = await kv.list({
      prefix: "confirmed:",
      ...(cursor ? { cursor } : {}),
    });

    for (const key of page.keys) {
      const email = normalizeMailAddress(key.name.slice("confirmed:".length));
      if (!isValidMailAddress(email)) continue;
      const token = await kv.get(key.name);
      if (token) subscribers.push({ email, token });
    }

    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  return subscribers;
}
