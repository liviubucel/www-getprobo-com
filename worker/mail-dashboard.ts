import type { MailPlatformEnv } from "./mail-platform";

type CampaignRecord = {
  id?: string;
  subject?: string;
  locale?: string;
  messageType?: string;
  audience?: string;
  test?: boolean;
  total?: number;
  state?: string;
  createdAt?: string;
  approvedAt?: string;
  scheduledAt?: string;
};

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

function isAuthorized(request: Request, secret?: string): boolean {
  if (!secret) return false;
  const actual = request.headers.get("Authorization") || "";
  const expected = `Bearer ${secret}`;
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i += 1) diff |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

async function listCampaignRecords(env: MailPlatformEnv): Promise<CampaignRecord[]> {
  const records: CampaignRecord[] = [];
  let cursor: string | undefined;
  do {
    const page = await env.NEWSLETTER.list({
      prefix: "mail:campaign:",
      ...(cursor ? { cursor } : {}),
    });
    for (const key of page.keys) {
      const record = await env.NEWSLETTER.get<CampaignRecord>(key.name, "json");
      if (record) records.push(record);
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  return records.sort((a, b) => Date.parse(b.createdAt || "") - Date.parse(a.createdAt || ""));
}

export async function handleMailDashboardApi(
  request: Request,
  env: MailPlatformEnv,
): Promise<Response | null> {
  const pathname = normalizeApiPath(new URL(request.url).pathname);
  if (request.method !== "GET") return null;
  if (pathname !== "/api/mail/overview" && pathname !== "/api/mail/campaigns") return null;
  if (!isAuthorized(request, env.MAIL_ADMIN_SECRET)) {
    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
  }

  const campaigns = await listCampaignRecords(env);
  const safe = campaigns.slice(0, 100).map((campaign) => ({
    id: campaign.id,
    subject: campaign.subject,
    locale: campaign.locale,
    messageType: campaign.messageType,
    audience: campaign.audience,
    test: campaign.test === true,
    total: campaign.total || 0,
    state: campaign.state || "unknown",
    createdAt: campaign.createdAt,
    approvedAt: campaign.approvedAt,
    scheduledAt: campaign.scheduledAt || null,
  }));

  if (pathname === "/api/mail/campaigns") {
    return jsonResponse({ success: true, campaigns: safe, totalCampaigns: campaigns.length }, 200);
  }

  const byState: Record<string, number> = {};
  let totalRecipients = 0;
  for (const campaign of campaigns) {
    const state = campaign.state || "unknown";
    byState[state] = (byState[state] || 0) + 1;
    totalRecipients += campaign.total || 0;
  }

  return jsonResponse({
    success: true,
    totalCampaigns: campaigns.length,
    totalRecipientsPlanned: totalRecipients,
    byState,
    recentCampaigns: safe.slice(0, 20),
  }, 200);
}
