# ZebraByte Mail Platform

This is the private ZebraByte mail control plane implemented by the current public-site Cloudflare Worker. It extends the existing contact/newsletter system; it does not replace the current public website or its design.

## Runtime architecture

- `EMAIL`: existing Cloudflare Email Service binding.
- `NEWSLETTER`: existing ZebraByte KV namespace. Newsletter subscribers keep the existing `confirmed:*` records. Operational clients use separate `client:*`, `client-active:*` and `client-upmind:*` prefixes.
- `MAIL_QUEUE`: `zebrabyte-mail`, used for asynchronous campaign delivery and Upmind client synchronization.
- `MAIL_SCHEDULER`: Cloudflare Workflow `zebrabyte-mail-scheduler`; scheduled campaigns sleep durably until their release timestamp and then enqueue normal delivery messages.
- `MAIL_ANALYTICS`: Workers Analytics Engine dataset `zebrabyte_mail`. Events contain campaign IDs, counters and categorical metadata only; recipient addresses are not written to Analytics Engine.
- `worker/mail-platform-core.ts`: campaign validation, preview/approval, audience resolution, scheduling, pause/resume/cancel, queue release, delivery and status.
- `worker/mail-platform.ts`: stable compatibility export for the mail platform.
- `worker/mail-workflow.ts`: durable scheduled-campaign Workflow.
- `worker/mail-dashboard.ts`: private overview and campaign-list APIs with no recipient addresses.
- `worker/email-service-errors.ts`: Cloudflare Email Service error classification.
- `worker/mail-analytics.ts`: privacy-safe Analytics Engine writes.
- `worker/upmind-mail-sync.ts`: Upmind HMAC webhook receiver and queued client sync.
- `worker/upmind-webhook-guard.ts`: source-IP allowlist for Upmind webhook traffic.
- `worker/newsletter-queue-compat.ts`: keeps existing newsletter private endpoint URLs while routing them through the queue-backed engine.

The public newsletter double-opt-in flow in `worker/forms.ts`, contact forms and security-report email flow remain unchanged.

## Existing Cloudflare resources reused

The platform deliberately reuses the production resources already used by the old ZebraByte website:

```text
EMAIL
NEWSLETTER -> a3474e304aeb47168fb65edfaad5ead1
```

This means confirmed newsletter subscriptions and any existing `client:*` records remain in the same KV namespace.

## Additional Cloudflare resources

`wrangler.jsonc` adds:

```text
MAIL_QUEUE      -> zebrabyte-mail
MAIL_SCHEDULER  -> zebrabyte-mail-scheduler
MAIL_ANALYTICS  -> zebrabyte_mail
```

The Queue must exist in the Cloudflare account before production deployment. The Analytics Engine dataset is created automatically when the Worker first writes to it. The Workflow is deployed from the named `MailCampaignWorkflow` entrypoint in `worker/main.ts`.

Required production secrets:

```text
MAIL_ADMIN_SECRET
UPMIND_WEBHOOK_SECRET
```

Existing secrets continue to be used by existing features:

```text
TURNSTILE_SECRET_KEY
NEWSLETTER_DISPATCH_SECRET
```

## Upmind client synchronization

Endpoint:

```text
POST https://www.zebrabyte.ro/api/mail/upmind-webhook
```

The endpoint verifies:

1. source IP against `UPMIND_WEBHOOK_ALLOWED_IPS`;
2. `X-Webhook-Signature` as HMAC-SHA256 over the exact raw request body using `UPMIND_WEBHOOK_SECRET`;
3. V1 client object/category fields;
4. supported client lifecycle hook codes;
5. `webhook_event_id` deduplication.

Queue payloads contain only the Upmind event ID. The sanitized pending client record remains in KV. The raw webhook body is never written to Sentry or Queue messages.

Recommended client triggers include registration/create, client update, login-email update, notification-email disable and client deletion.

Client storage:

```text
client:<email>            -> full operational client record
client-active:<email>     -> eligible operational recipient index
client-upmind:<upmindId>  -> current email address for Upmind client
```

Email changes replace the old active index. Deleted clients are deactivated. `notifications_disabled` clients are excluded from operational audiences.

## Audience and consent model

Supported message types:

```text
transactional
service
security
marketing
```

Supported audiences:

```text
subscribers
clients
both
single
custom
```

Rules:

- `custom` is allowed only with `test: true`.
- non-marketing `single` requires an active operational client.
- marketing always requires a current `confirmed:<email>` newsletter token.
- choosing `clients` or `both` for marketing does not make a client-only address eligible.
- marketing messages always receive the ZebraByte newsletter unsubscribe footer.
- operational messages use the operational ZebraByte footer and do not imply marketing consent.

## Preview and explicit approval

Bulk campaigns cannot be sent directly.

Preview:

```text
POST /api/mail/campaigns/preview
Authorization: Bearer <MAIL_ADMIN_SECRET>
```

The Worker validates the campaign, resolves the eligible audience, stores a 15-minute preview and returns only counts/metadata. It calculates a SHA-256 fingerprint over the resolved recipient set.

Confirmation:

```text
POST /api/mail/campaigns/confirm
Authorization: Bearer <MAIL_ADMIN_SECRET>

{
  "previewId": "..."
}
```

Before creating a campaign, the Worker resolves the audience again. If the recipient count or fingerprint changed since preview, confirmation returns `409` and requires a new preview. This prevents an approval from silently applying to a materially different audience.

A direct `POST /api/mail/campaigns` is auto-approved only for:

- `custom` + `test: true` single-recipient tests;
- trusted idempotent blog-notification automation routed internally with the dedicated automation header.

All other direct campaign requests return a preview instead of sending.

## Scheduling

Add an ISO timestamp to the campaign input:

```json
{
  "scheduledAt": "2026-08-20T08:00:00.000Z"
}
```

After approval, future campaigns create a `MAIL_SCHEDULER` Workflow instance. `MailCampaignWorkflow` uses `sleepUntil` and, at the scheduled time, calls the same queue release used by immediate campaigns. Delivery still happens through `MAIL_QUEUE`; Workflows do not bypass queue retry/idempotency controls.

Schedules more than roughly one year ahead are rejected by the application safety limit.

## Campaign controls

Status:

```text
GET /api/mail/campaigns/<campaignId>
```

Pause:

```text
POST /api/mail/campaigns/<campaignId>/pause
```

Queue messages arriving while paused are acknowledged without sending. Delivery records stay queued.

Resume:

```text
POST /api/mail/campaigns/<campaignId>/resume
```

A future scheduled campaign returns to `scheduled`. A due/immediate campaign requeues its pending delivery records.

Cancel:

```text
POST /api/mail/campaigns/<campaignId>/cancel
```

Cancelled campaigns can no longer send. Remaining Queue messages are acknowledged without delivery.

Manual recovery:

```text
POST /api/mail/campaigns/<campaignId>/requeue
```

Sent and suppressed recipients are never requeued. Failed/queued/in-flight records can be requeued after an operational problem is fixed.

## Delivery error handling

Cloudflare Email Service errors are classified before Queue retry decisions.

Retryable examples:

```text
E_RATE_LIMIT_EXCEEDED
E_DAILY_LIMIT_EXCEEDED
E_INTERNAL_SERVER_ERROR
unknown transient errors (bounded by Queue retry limit)
```

Permanent configuration/content/delivery errors are marked `failed` and acknowledged instead of wasting Queue retries.

`E_RECIPIENT_SUPPRESSED` is recorded as `suppressed` and acknowledged immediately. Cloudflare remains the source of truth for its account-level suppression list.

Per-recipient delivery states:

```text
queued
sending
sent
failed
suppressed
```

Campaign summaries report sent, failed, suppressed, sending and queued counts.

## Privacy-safe analytics

Workers Analytics Engine receives operational events such as:

```text
campaign_previewed
campaign_queued
campaign_scheduled
campaign_paused
campaign_resumed
campaign_cancelled
campaign_requeued
delivery_sent
delivery_retry
delivery_failed
delivery_suppressed
clients_imported
```

Analytics records use campaign ID, category fields and numeric counts. Recipient addresses and raw Upmind payloads are not written to Analytics Engine.

## Private operations overview

Private control-plane endpoints:

```text
GET /api/mail/overview
GET /api/mail/campaigns
Authorization: Bearer <MAIL_ADMIN_SECRET>
```

They return campaign metadata, states and aggregate counts only. They do not expose recipient addresses. This is the API surface for a future Sanity/admin dashboard without coupling the public website to a specific admin UI.

## Sanity adapter

The current repository does not contain a deployable Sanity Studio, so the Worker exposes a complete control-plane adapter without introducing a second application into the public-site repository.

Preview a Sanity broadcast:

```text
POST /api/mail/sanity-broadcast/preview
```

Payload includes `documentId` plus normal campaign fields. The Worker fixes the idempotency source to `sanity:<documentId>`.

Approve the exact preview:

```text
POST /api/mail/sanity-broadcast

{
  "documentId": "newsletterBroadcast-...",
  "previewId": "...",
  "approved": true
}
```

The Worker verifies that the preview belongs to the same Sanity document before confirmation. Republishing the same Sanity document is also protected by source-id idempotency.

## Existing newsletter compatibility

Existing private URLs remain:

```text
POST /api/newsletter/send-announcement
POST /api/newsletter/notify-post
```

`send-announcement` now uses preview + explicit confirmation. `notify-post` remains automated/idempotent and is queued through the same campaign engine.

CLI flows:

```bash
npm run mail:campaign -- campaign.json
npm run mail:campaign -- --confirm <preview-id>

npm run newsletter:announce -- "Titlu" body.html body.txt ro
npm run newsletter:announce -- --confirm <preview-id>

npm run newsletter:notify-post -- "Titlu" slug "Excerpt" ro
npm run mail:clients:import -- clients.txt
```

## Production rollout checklist

1. Confirm `zebrabyte-mail` exists in the ZebraByte Cloudflare account.
2. Confirm `MAIL_ADMIN_SECRET` and `UPMIND_WEBHOOK_SECRET` are production Worker secrets.
3. Validate the exact PR head with the repository build/release gates and `wrangler deploy --dry-run`.
4. Merge/deploy that exact reviewed SHA.
5. Confirm Analytics Engine and Workflow bindings appear on the deployed Worker.
6. Send `custom` + `test: true` to a controlled address.
7. Preview a multi-recipient campaign and verify the recipient count.
8. Confirm it and verify Queue delivery/status.
9. Test pause/resume on a controlled campaign.
10. Test a scheduled controlled campaign and verify Workflow release.
11. Test newsletter marketing and verify the unsubscribe link.
12. Test an Upmind client update and deletion and verify `/api/mail/clients/stats`.
13. Only after the controlled sequence passes, enable broad operational or marketing audiences.
