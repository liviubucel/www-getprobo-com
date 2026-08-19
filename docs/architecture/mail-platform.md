# ZebraByte Mail Platform

This document describes the private mail control plane implemented by the public-site Cloudflare Worker. It extends the existing newsletter/contact email system; it does not replace it.

## Architecture

- `EMAIL`: Cloudflare Email Service binding. Sender addresses are restricted in `wrangler.jsonc` to `noreply@zebrabyte.ro` and `newsletter@zebrabyte.ro`.
- `NEWSLETTER`: existing ZebraByte KV namespace. Newsletter subscribers keep the existing `confirmed:*` records. Operational clients use separate `client:*`, `client-active:*` and `client-upmind:*` prefixes.
- `MAIL_QUEUE`: Cloudflare Queue used for asynchronous campaign delivery and Upmind client sync. Queue messages contain only internal IDs; recipient email addresses stay in KV.
- `worker/mail-platform.ts`: private campaign/client API and queue delivery worker.
- `worker/upmind-mail-sync.ts`: Upmind HMAC webhook receiver and queued client synchronization.
- `worker/upmind-webhook-guard.ts`: source-IP allowlist for Upmind webhook traffic.
- `worker/mail-clients.ts`: client directory and newsletter/client audience helpers.
- `worker/newsletter-queue-compat.ts`: preserves the existing private newsletter endpoint URLs while routing their work through the new Queue/campaign engine.

The public newsletter double-opt-in flow in `worker/forms.ts` remains unchanged. The existing private endpoints `/api/newsletter/send-announcement` and `/api/newsletter/notify-post` remain compatible for callers, but are intercepted before the historical synchronous dispatcher and are now delivered through the campaign Queue. The historical dispatcher stays in the tree as a compatibility implementation, not as the active path for those two endpoints.

## Required Cloudflare resources

Before deploying a commit that includes the Queue binding, create the producer Queue once:

```bash
npx wrangler queues create zebrabyte-mail
```

`wrangler.jsonc` configures `zebrabyte-mail` as both producer and consumer, with a small batch, five retries, a dead-letter queue and `max_concurrency: 1`. The dead-letter queue is named `zebrabyte-mail-dlq`; Cloudflare creates a configured missing DLQ automatically.

Configure these Worker secrets in Cloudflare; never commit them:

```text
MAIL_ADMIN_SECRET
UPMIND_WEBHOOK_SECRET
```

Existing secrets continue to be required for their existing features:

```text
TURNSTILE_SECRET_KEY
NEWSLETTER_DISPATCH_SECRET
```

## Client directory

Operational clients are distinct from newsletter subscribers.

```text
client:<email>            -> full client record
client-active:<email>     -> active/sendable client record
client-upmind:<upmindId>  -> current email address
```

A client can be active but excluded from operational delivery when Upmind reports `notifications_disabled`.

When an Upmind account changes email, the `client-upmind:*` index removes the old active email record so a single client is not duplicated under two addresses.

When a client is deleted, the record is marked inactive and removed from the active-delivery index.

## Upmind webhook

Endpoint:

```text
POST /api/mail/upmind-webhook
```

Authentication is layered:

1. Cloudflare's `CF-Connecting-IP` must match the configured Upmind source-IP allowlist.
2. `X-Webhook-Signature` must match the HMAC-SHA256 of the exact raw request body using `UPMIND_WEBHOOK_SECRET`.

The current Upmind European primary-cluster outgoing IPs are configured in `wrangler.jsonc` as:

```text
91.240.229.1
91.240.229.2
91.240.229.3
```

If ZebraByte is moved to another Upmind cluster, verify Upmind's current published outgoing IPs before changing `UPMIND_WEBHOOK_ALLOWED_IPS`. Do not weaken the guard by accepting arbitrary source addresses.

Only V1 client objects and relevant client create/register/update/delete/email-notification hooks are processed. Other Upmind webhook categories return `200` with `skipped: true`.

Configure the Upmind endpoint for client lifecycle triggers, especially:

- Client registered
- Staff created verified client
- Staff created unverified client
- Client updated
- Client login email updated
- Client notification emails disabled
- Client deleted

The receiver uses `webhook_event_id` for deduplication. It extracts only the fields required by ZebraByte and stores a short-lived sanitized pending record in KV. The Queue message itself contains only the event ID.

Do not log or send the raw Upmind webhook body to Sentry. The implementation intentionally avoids that legacy behavior.

## Private mail APIs

All endpoints below require:

```http
Authorization: Bearer <MAIL_ADMIN_SECRET>
```

### Import clients

```text
POST /api/mail/clients/import
```

Accepts either a newline-separated string or an array of contacts.

### Audience statistics

```text
GET /api/mail/clients/stats
```

Returns counts only; it does not expose recipient addresses.

### Create campaign

```text
POST /api/mail/campaigns
```

Payload:

```json
{
  "subject": "Mentenanță programată",
  "bodyHtml": "<p>Fereastra de mentenanță începe la...</p>",
  "bodyText": "Fereastra de mentenanță începe la...",
  "locale": "ro",
  "messageType": "service",
  "audience": "clients",
  "sourceId": "maintenance-2026-08-19"
}
```

Supported `messageType` values:

```text
transactional
service
security
marketing
```

Supported `audience` values:

```text
subscribers
clients
both
single
custom
```

`custom` is deliberately restricted to `test: true` and requires `customEmail`.

`single` requires `singleEmail` and, for non-marketing messages, the address must be an active client. For marketing messages, any client recipient must also be a confirmed newsletter subscriber.

Marketing recipients always require a confirmed newsletter token and therefore always receive an unsubscribe URL. Choosing `clients` or `both` never turns a client-only address into a marketing recipient.

The HTML body is a fragment, not a complete document. Script/iframe/object/embed/form/full-document tags and `javascript:`/HTML-data URLs are rejected. The Worker always adds the ZebraByte mail wrapper and mandatory footer itself.

### Idempotency

Use either a stable `sourceId` in the body or an `Idempotency-Key` HTTP header. The value is SHA-256 hashed before being used as a KV key. Repeating the same source returns the existing campaign rather than sending again.

The compatibility blog notification endpoint automatically uses `blog:<locale>:<slug>` as its source ID. Calling it again for the same localized post therefore returns the existing campaign instead of sending duplicate article notifications.

### Campaign status

```text
GET /api/mail/campaigns/<campaignId>
```

The status is derived from individual delivery records:

```text
queued
sending
sent
partial
queue_failed
```

### Requeue failed/incomplete delivery

```text
POST /api/mail/campaigns/<campaignId>/requeue
```

Already-sent recipients are never requeued. Duplicate Queue messages are harmless because the consumer checks the delivery record before sending.

## Queue delivery

Recipient addresses are not embedded in Queue messages. For every delivery the Worker creates a SHA-256 delivery ID and stores the address in a 90-day KV delivery record.

Queue message:

```json
{
  "kind": "campaign-delivery",
  "campaignId": "...",
  "deliveryId": "sha256..."
}
```

The consumer retries transient Email Service failures with exponential backoff. After five delivery attempts the recipient is marked failed and the message is acknowledged so the campaign can become `partial` instead of remaining stuck forever.

The consumer explicitly acknowledges successful messages after Email Service succeeds and the delivery record has been marked sent. Cloudflare Queue delivery is at-least-once, so no email transport can provide mathematical exactly-once delivery across a crash between an external send and acknowledgement; the per-delivery sent record and serialized consumer substantially reduce duplicate risk.

## Existing newsletter API compatibility

These existing endpoints remain valid:

```text
POST /api/newsletter/send-announcement
POST /api/newsletter/notify-post
```

They continue to require `NEWSLETTER_DISPATCH_SECRET`, so existing callers do not need to learn the private mail-admin secret. Internally, `worker/newsletter-queue-compat.ts` maps them to a `marketing` campaign for the `subscribers` audience and calls the same Queue-backed mail platform used by new campaigns.

`notify-post` also gets stable server-side idempotency from the post locale/slug. The existing npm scripts detect both the new queued response shape and the old synchronous shape so they remain usable during rollout.

## Sanity control-plane adapter

The Worker provides:

```text
POST /api/mail/sanity-broadcast
```

It accepts the same campaign fields plus:

```json
{
  "documentId": "newsletterBroadcast-..."
}
```

`documentId` becomes the idempotency source (`sanity:<documentId>`), so republishing the same Sanity document does not resend it.

A Sanity webhook can project the fields required by the campaign endpoint and authenticate with `MAIL_ADMIN_SECRET`. The current public website does not need a Sanity runtime dependency; Sanity is only an optional private authoring/control surface.

## CLI fallback

Create a campaign from a JSON file:

```bash
npm run mail:campaign -- campaign.json
```

Import clients from a text file:

```bash
npm run mail:clients:import -- clients.txt
```

Both commands use `MAIL_ADMIN_SECRET` and default to `https://www.zebrabyte.ro`; override `SITE_URL` for staging.

The existing `newsletter:announce` and `newsletter:notify-post` commands continue to use `NEWSLETTER_DISPATCH_SECRET`, but their server-side endpoints now queue the campaign instead of performing a synchronous send loop.

## Production checklist

1. Create `zebrabyte-mail` in the ZebraByte Cloudflare account.
2. Add `MAIL_ADMIN_SECRET` and `UPMIND_WEBHOOK_SECRET` as Worker secrets.
3. Confirm the Upmind tenant uses the European primary cluster or update `UPMIND_WEBHOOK_ALLOWED_IPS` to Upmind's current published outgoing IPs for the tenant's cluster.
4. Deploy the exact reviewed SHA.
5. Configure Upmind's webhook endpoint and selected client lifecycle triggers.
6. Send a `custom` + `test: true` campaign to a controlled address.
7. Import or synchronize a test Upmind client and verify `/api/mail/clients/stats` changes.
8. Send one service campaign to the test client.
9. Verify campaign status reaches `sent` and confirm the message contains the ZebraByte operational footer.
10. Test a newsletter marketing campaign and verify the unsubscribe URL is present and functional.
11. Test the legacy `newsletter:notify-post` command and confirm that re-running the same locale/slug does not send twice.
12. Only then enable broad client/newsletter audiences.
