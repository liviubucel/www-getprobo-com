export interface MailAnalyticsBinding {
  writeDataPoint: (point: {
    indexes?: string[];
    blobs?: string[];
    doubles?: number[];
  }) => void;
}

export interface MailAnalyticsEnv {
  MAIL_ANALYTICS?: MailAnalyticsBinding;
}

export function trackMailEvent(
  env: MailAnalyticsEnv,
  event: string,
  options: {
    campaignId?: string;
    messageType?: string;
    audience?: string;
    locale?: string;
    errorCode?: string;
    count?: number;
  } = {},
): void {
  try {
    env.MAIL_ANALYTICS?.writeDataPoint({
      indexes: [options.campaignId || "mail-platform"],
      blobs: [
        event.slice(0, 100),
        (options.messageType || "").slice(0, 50),
        (options.audience || "").slice(0, 50),
        (options.locale || "").slice(0, 10),
        (options.errorCode || "").slice(0, 100),
      ],
      doubles: [Number.isFinite(options.count) ? Number(options.count) : 1],
    });
  } catch {
    // Analytics must never block mail delivery or API requests.
  }
}
