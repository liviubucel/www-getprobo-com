# ZebraByte website

Website, documentation and Cloudflare runtime for ZebraByte.

## Public positioning

ZebraByte focuses on two connected areas:

- **Managed Compliance** — compliance program management, controls, evidence, audit readiness, Compliance Portal, ISO/IEC 27001, GDPR, NIS2, SOC 2 and accessibility governance.
- **Cyber Security** — security assessment, website security, email security, incident response and secure managed hosting.

Generic IT, WordPress maintenance, email marketing and standalone migration/SSL services are not part of the current public offer.

## Repository contract

`AGENTS.md` is the authoritative engineering and experience contract for both AI assistants and human contributors. Read it before refactoring interactive components or the Cloudflare runtime.

This site originated from the Probo website codebase. ZebraByte preserves selected design-system and interaction behavior intentionally; inherited components must not be converted to static equivalents merely for performance.

## Branch and deployment

`main` is the Cloudflare-integrated delivery branch. Cloudflare Workers Builds attached to the current `main` commit are the authoritative deployment signal.

Do not confuse a separate GitHub Actions account/billing failure with the Cloudflare deployment result.

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

Before deployment:

```bash
npm run format
npm run check:docs
npm run check:experience
npm run build
```

## Cloudflare runtime

The project uses Cloudflare Workers plus static assets. The Worker entrypoint is intentionally:

```text
worker/main.ts
```

The entrypoint handles first-party runtime endpoints and then delegates normal website traffic to `worker/router.ts`.

Current server-side features include:

- contact form processing
- Cloudflare Turnstile verification
- Cloudflare Email Service
- newsletter double opt-in
- newsletter confirmation/unsubscribe
- ZebraByte newsletter KV storage
- Sentry request/error handling
- RO/EN localization routing

For local Worker development, copy `.dev.vars.example` to `.dev.vars` and provide secret values locally.

Never commit production secrets.

## Language architecture

Canonical Romanian pages live at root paths. English pages live under `/en`.

Examples:

```text
/blog
/en/blog
/docs
/en/docs
```

The Worker handles English upstream path stripping/localization and internal-link rewriting. Keep canonical metadata, hreflang, sitemap and internal English links aligned with this architecture.

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

Primary public surfaces include:

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
/blog
/stories
/contact
```

Accessibility tools are free and sit within the Compliance area rather than being positioned as a separate commercial business line.

## Quality gates

`npm run build` runs the production quality chain, including:

- ZebraByte blog synchronization/migration checks
- performance-asset checks
- changelog synchronization
- ZebraByte content parity checks
- `check:experience` regression contract
- Astro production build
- LLM asset normalization
- bilingual sitemap localization
- i18n audit

`check:experience` protects known high-risk UX regressions such as static replacements for carousels/Lottie, removed hero/progress motion, mobile-only motion suppression, arbitrarily truncated case-study collections and Worker entrypoint drift.

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
- Validate Cloudflare bindings on production deployments.
- Do not bypass `worker/main.ts` when changing routing.

## Licensing

Third-party notices and license obligations are maintained in repository license/notices and dependency metadata. Do not remove required legal notices when modifying or redistributing third-party code.
