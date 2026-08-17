# Footer status architecture

Last updated: 2026-08-17

This document is the engineering contract for the compact live-status badge rendered in the ZebraByte website footer.

## Product intent

The footer badge is a compact public summary, not a miniature status page.

It should answer two questions only:

1. What is the current public state?
2. If there is a problem, which public ZebraByte service is the primary affected surface?

The full incident timeline, provider details, maintenance details and evidence remain on `https://status.zebrabyte.ro/`.

Do not expose upstream provider names, internal source names, hidden service IDs, polling architecture or incident titles in the footer badge.

## Runtime path

```text
ZebraByteStatus.svelte
  -> GET /api/status on the website Worker
  -> worker/public-status.ts
  -> STATUS_ENGINE Cloudflare Service Binding (primary)
  -> status-page / FooterStatusEntrypoint
```

Website Cloudflare binding:

```text
STATUS_ENGINE -> service: status-page -> entrypoint: FooterStatusEntrypoint
```

The website also has a bounded public fallback to:

```text
https://status.zebrabyte.ro/api/status
```

The fallback exists for preview/staging environments, temporary Service Binding failures and backwards compatibility while the status Worker RPC contract is being rolled out. The private binding remains authoritative whenever it returns a valid state.

## Public website `/api/status` contract

The website endpoint deliberately exposes only:

```json
{
  "overall": "operational | degraded | outage | no_data",
  "updatedAt": "ISO timestamp or null",
  "primaryServiceId": "public service id or null",
  "affectedCount": 0
}
```

Do not add `source`, provider names, internal architecture, raw incidents or source URLs to this endpoint without an explicit product/security decision.

## Compact UI rules

Operational state keeps the existing trust message:

```text
Toate sistemele sunt operaționale
All systems are operational
```

When one public service is degraded:

```text
Degradat · Hosting
Degraded · Hosting
```

When one public service has an outage:

```text
Incident · Portal
Incident · Portal
```

When more than one public service is affected, show the primary service plus the additional count:

```text
Incident · Portal +2
Degradat · Email +1
```

Do not show a long incident title in the footer. The badge links to the full status page for details.

If there is no usable service context, preserve the generic state label instead of guessing a service.

## Public service label map

The website owns the short bilingual display labels. The status engine sends only the public service ID.

| Public service ID | Romanian | English |
| --- | --- | --- |
| `client-portal` | Portal | Portal |
| `managed-hosting` | Hosting | Hosting |
| `authentication` | Autentificare | Authentication |
| `payments-billing` | Plăți | Payments |
| `compliance-console` | Compliance | Compliance |
| `cookie-consent` | Cookies | Cookies |
| `accessibility-widget` | Accesibilitate | Accessibility |
| `files-documents` | Fișiere | Files |
| `zbt-edge-network` | Edge/CDN | Edge/CDN |
| `zbt-dns-routing` | DNS | DNS |
| `zbt-workers-apis` | API-uri | APIs |
| `zbt-security-waf` | WAF | WAF |
| `zbt-data-storage` | Stocare | Storage |
| `zbt-ai-services` | AI | AI |
| `zbt-email-services` | Email | Email |

Aggregate/internal IDs such as `cloud-platform` and `compliance-platform` are intentionally not eligible for the footer context.

## Primary-service selection

For `outage`, prefer the first allowlisted public service currently in `outage` state.

For `degraded`, prefer the first allowlisted public service currently in `degraded` state.

Selection is deterministic using the documented priority order in `worker/public-status.ts` and in the status Worker RPC implementation. `affectedCount` counts all allowlisted public services in `outage` or `degraded` state.

The footer does not claim that the primary service is the only affected service. `+N` communicates additional affected public services.

## Failure and fallback behavior

The website Worker uses this order:

1. Read the private `STATUS_ENGINE` binding.
2. If it returns `no_data` or is unavailable, read the public status API with a 4.5 second timeout.
3. If the binding returns `outage`/`degraded` but is an older RPC version without service context, use the public API only to enrich `primaryServiceId`/`affectedCount`; do not replace the binding's authoritative overall state unless the states match.
4. If both paths fail, return `no_data`.

The browser component has its own 6 second timeout. It must not remain forever on `Se verifică statusul / Checking status`.

After the first failed/no-data attempt it renders:

```text
Status indisponibil
Status unavailable
```

It retries every 60 seconds and refreshes when the document becomes visible again.

## Security and privacy invariants

- Do not expose infrastructure supplier names in this badge.
- Do not expose the internal source used to calculate status.
- Do not expose hidden/aggregate service IDs.
- Do not expose raw incident messages or event payloads.
- Keep the Service Binding primary; public HTTP is a resilience bridge/fallback.
- Keep timeouts on both Worker-to-status and browser-to-website calls.
- Keep the public-service allowlist when parsing fallback payloads.

## Files involved

Website repository:

- `src/components/ZebraByteStatus.svelte` — visual badge, RO/EN short labels, browser timeout and refresh behavior.
- `worker/public-status.ts` — Service Binding reader, public fallback, public allowlist and compact response contract.
- `worker/main.ts` — passes Worker env/bindings into `handlePublicStatusApi`.
- `wrangler.jsonc` — declares `STATUS_ENGINE` -> `status-page` / `FooterStatusEntrypoint`.
- `src/components/Footer.astro` — mounts `<ZebraByteStatus client:load />`.

Status repository (`liviubucel/Status-page-stackstatus`):

- `src/status-canonical-engine.js` — exports `FooterStatusEntrypoint` and derives compact public service context.
- `wrangler.toml` — deploys canonical Worker service `status-page`.

## Cross-repository rollout

The website implementation is backwards-compatible with the old `FooterStatusEntrypoint` that returned only `overall` and `updatedAt`. During rollout it can enrich incident/degraded context from the public API.

Preferred rollout order:

1. Deploy the status Worker RPC enhancement.
2. Deploy the website footer enhancement.

The reverse order remains safe because of the compatibility bridge.

## Validation checklist for future agents

Before changing footer status behavior:

1. Fetch current `main` for both repositories.
2. Do not replace `STATUS_ENGINE` with a public HTTP-only implementation.
3. Verify the public service ID remains on the allowlist before adding a label.
4. Keep visual copy short enough for mobile.
5. Preserve `client:load`, the browser timeout and 60-second refresh.
6. Run the website `npm run check:experience` and `npm run build` (the latter already includes experience/i18n checks in current package scripts).
7. Validate the status Worker using its repository checks/workflow before deployment.
8. Do not claim production success until the exact current-head Cloudflare deployment is successful.

## Current implementation context

The compact context feature was introduced while PR #7 (`feat/legal-center-audit`) was open in `liviubucel/www-getprobo-com`. The status-side RPC enhancement is developed separately in `liviubucel/Status-page-stackstatus` on `feat/footer-status-context`.

Do not assume those branch names remain current forever; use this document as the behavioral/architectural contract and verify current refs before editing.
