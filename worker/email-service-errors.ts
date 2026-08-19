export type EmailServiceFailureKind = "retryable" | "permanent" | "suppressed";

export type EmailServiceFailure = {
  code: string;
  kind: EmailServiceFailureKind;
  message: string;
};

const RETRYABLE_CODES = new Set([
  "E_RATE_LIMIT_EXCEEDED",
  "E_DAILY_LIMIT_EXCEEDED",
  "E_INTERNAL_SERVER_ERROR",
]);

const SUPPRESSED_CODES = new Set([
  "E_RECIPIENT_SUPPRESSED",
]);

const PERMANENT_CODES = new Set([
  "E_VALIDATION_ERROR",
  "E_FIELD_MISSING",
  "E_TOO_MANY_RECIPIENTS",
  "E_TOO_MANY_ATTACHMENTS",
  "E_SENDER_NOT_VERIFIED",
  "E_RECIPIENT_NOT_ALLOWED",
  "E_SENDER_DOMAIN_NOT_AVAILABLE",
  "E_CONTENT_TOO_LARGE",
  "E_DELIVERY_FAILED",
  "E_HEADER_NOT_ALLOWED",
  "E_HEADER_USE_API_FIELD",
  "E_HEADER_VALUE_INVALID",
  "E_HEADER_VALUE_TOO_LONG",
  "E_HEADER_NAME_INVALID",
  "E_HEADERS_TOO_LARGE",
  "E_HEADERS_TOO_MANY",
]);

export function classifyEmailServiceError(error: unknown): EmailServiceFailure {
  const record = error && typeof error === "object" ? error as { code?: unknown; message?: unknown } : null;
  const code = typeof record?.code === "string" ? record.code : "E_UNKNOWN";
  const message = typeof record?.message === "string" ? record.message.slice(0, 500) : "Email Service failure";

  if (SUPPRESSED_CODES.has(code)) return { code, kind: "suppressed", message };
  if (PERMANENT_CODES.has(code)) return { code, kind: "permanent", message };
  if (RETRYABLE_CODES.has(code)) return { code, kind: "retryable", message };

  // Unknown failures are retried conservatively. Queue-level retry limits still cap attempts.
  return { code, kind: "retryable", message };
}
