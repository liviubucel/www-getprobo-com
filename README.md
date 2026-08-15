# ZebraByte website

Website, documentation and Cloudflare runtime for ZebraByte.

## Public positioning

ZebraByte focuses on two connected areas:

- **Managed Compliance** — compliance program management, controls, evidence, audit readiness, Compliance Portal, ISO/IEC 27001, GDPR, NIS2, SOC 2 and accessibility governance.
- **Cyber Security** — security assessment, website security, email security, incident response and secure managed hosting.

Generic IT, WordPress maintenance, email marketing and standalone migration/SSL services are not part of the current public offer.

## Development branch

Active website work is isolated on:

```text
zebrabyte-repositioning
```

Do not merge unfinished work into `main`.

## Local setup

Use Node.js 24:

```bash
npm ci
npm run dev
```

Local URL:

```text
http://localhost:4321
```

Before merge/deployment:

```bash
npm run format
npm run check:docs
npm run build
```

## Cloudflare runtime

The project uses Cloudflare Workers and static assets. `wrangler.jsonc` includes the required runtime bindings and public variables for the website.

Current server-side features include:

- contact form processing
- Cloudflare Turnstile verification
- Cloudflare Email Service
- newsletter double opt-in
- newsletter confirmation/unsubscribe
- ZebraByte newsletter KV storage

For local Worker development, copy `.dev.vars.example` to `.dev.vars` and provide secret values locally.

Required secret:

```text
TURNSTILE_SECRET_KEY
```

## Optional analytics

Analytics remain disabled unless ZebraByte-owned PostHog configuration is explicitly supplied:

```text
PUBLIC_POSTHOG_API_KEY
PUBLIC_POSTHOG_API_HOST
PUBLIC_POSTHOG_UI_HOST
```

## Website endpoints

```text
POST /api/contact
POST /api/newsletter/subscribe
GET  /api/newsletter/confirm
GET  /api/newsletter/unsubscribe
```

## Content

Primary public surfaces:

```text
/
/managed-compliance
/compliance-portal
/iso-27001
/gdpr
/nis2
/accessibility
/cyber-security
/security-assessment
/website-security
/email-security
/incident-response
/secure-hosting
/tools
/industries
/docs
/hub
/stories
/contact
```

Accessibility tools are free and sit within the Compliance area rather than being positioned as a separate commercial business line.

## SEO identity

Canonical public identity:

```text
https://www.zebrabyte.ro
```

Keep canonical metadata, sitemap, robots, RSS, IndexNow, security.txt and AI/LLM manifests aligned to the ZebraByte brand and current commercial offer.

## Security notes

- Never commit production secrets.
- Keep Turnstile validation server-side.
- Do not weaken CSP or security headers to work around integration issues.
- Do not expose internal/legacy routes in the main navigation or sitemap.
- Validate all Cloudflare bindings on the production deployment before merge.

## Licensing

Third-party notices and license obligations are maintained in the repository license/notices and dependency metadata. Do not remove required legal notices when modifying or redistributing third-party code.
