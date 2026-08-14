# ZebraByte website & open-source compliance experience

This repository is the new ZebraByte website, built by **preserving and extending the Probo website/documentation experience** rather than replacing it with a separate generic corporate site.

The public brand and commercial positioning are ZebraByte. The underlying website, documentation patterns and open-source compliance concepts are derived from the MIT-licensed Probo project and remain explicitly attributed where technically or editorially relevant.

## Migration rule — do not simplify Probo

The core rule for this repository is:

> **Keep the Probo experience and capabilities. Rebrand, adapt and extend them for ZebraByte. Do not remove useful Probo pages, components, documentation, animations or open-source functionality merely because the commercial brand changes.**

Examples of what should be preserved:

- GRC/compliance product documentation
- Compliance Portal / Trust Center concepts
- Product, developer and deployment documentation
- GraphQL, CLI, MCP, n8n and webhook documentation
- self-hosting and Cloud deployment documentation
- Hub, Stories, Blog and Changelog structures
- framework badges and compliance resources
- endpoint posture / Probo Agent technical documentation
- animations, sliders, navigation patterns and reusable UI components
- upstream historical/editorial material when it remains useful

When upstream material cannot truthfully be presented as ZebraByte material, **attribute it instead of deleting or blindly renaming it**. For example, Probo customer stories, historical changelog entries, original authors and actual Probo Agent binary names remain upstream material until ZebraByte has an equivalent verified asset or release.

## ZebraByte positioning

The website focuses ZebraByte on a narrower, security-led offer:

- Cyber Security
- Privacy & GDPR
- NIS2 and compliance readiness
- ISO 27001 / audit readiness
- GRC and compliance automation
- Compliance Portal / Trust Center
- Digital Accessibility / WCAG
- Secure Managed Hosting
- open-source compliance platform and integrations

Commodity hosting and broad generic IT services are not the primary positioning of this website.

## Repository roles

- **This repository (`liviubucel/www-getprobo-com`)** is the repository being edited and will become the new ZebraByte website.
- **`liviubucel/Zebrabyte-Web` is read-only reference material during this migration.** It may be inspected for existing ZebraByte content, legal documents, reviews, assets and working integrations, but it must not be modified as part of this migration.
- **`getprobo/probo` is the upstream open-source project** and should remain credited where its technical names, releases, docs or historical content are still being used.

## Current migration branch

Active migration work is isolated on:

```text
zebrabyte-repositioning
```

Do not push unfinished migration changes directly to `main`.

## Setup

Use Node.js 24:

```bash
npm ci
npm run dev
```

Open:

```text
http://localhost:4321
```

Before merging:

```bash
npm run format
npm run check:docs
npm run build
```

A GitHub Actions validation workflow is also present under `.github/workflows/validate.yml`.

## Cloudflare runtime

The project deploys through the existing Worker architecture and retains the original static asset / Markdown-serving model.

`wrangler.jsonc` currently defines:

- static asset binding
- observability
- Cloudflare Email Service binding
- ZebraByte `NEWSLETTER` KV binding
- public Turnstile site key
- contact/newsletter sender variables

For local Worker development, copy `.dev.vars.example` to `.dev.vars` and supply real secret values locally.

### Required secret

```text
TURNSTILE_SECRET_KEY
```

This is required for server-side validation of contact and newsletter submissions.

### Optional analytics variables

PostHog is intentionally disabled unless a ZebraByte-controlled configuration is supplied:

```text
PUBLIC_POSTHOG_API_KEY
PUBLIC_POSTHOG_API_HOST
PUBLIC_POSTHOG_UI_HOST
```

Do not point ZebraByte analytics to the upstream Probo analytics proxy.

### Upstream Probo cookie banner

The `@probo/cookie-banner` package is retained for compatibility, but its upstream backend is disabled by default. It only renders when all relevant variables are deliberately configured, including:

```text
PUBLIC_ENABLE_UPSTREAM_COOKIE_BANNER=true
PUBLIC_COOKIE_BANNER_ID
PUBLIC_COOKIE_BANNER_API_BASE_URL
```

ZebraByte's production consent-management implementation should be configured deliberately; do not run two CMPs in parallel.

## Contact & newsletter

The ZebraByte Worker now provides:

```text
POST /api/contact
POST /api/newsletter/subscribe
GET  /api/newsletter/confirm
GET  /api/newsletter/unsubscribe
```

The newsletter flow uses ZebraByte's existing KV namespace and double opt-in. The contact and newsletter forms use Cloudflare Turnstile with server-side verification.

The legacy upstream `/api/yc-deal` route is retained for compatibility but is not part of ZebraByte's main public positioning.

## Documentation

Documentation lives in:

```text
src/content/docs/docs/
```

Technical upstream names such as `Probo Agent`, package names, API identifiers or CLI commands should not be renamed until ZebraByte has an actual compatible fork/release that justifies the change.

## Editorial attribution

Some original Probo assets are intentionally retained in clearly separated upstream archives:

- historical Probo customer stories
- original Probo blog posts and authors
- historical Probo changelog entries
- Probo-specific comparison articles

Do not present those companies, quotes, authors or claims as ZebraByte customers or ZebraByte-authored material.

ZebraByte-native case studies and testimonials must use real, supportable evidence only.

## SEO and canonical identity

Public canonical identity is ZebraByte:

```text
https://www.zebrabyte.ro
```

`robots.txt`, sitemap configuration, global metadata, JSON-LD, RSS metadata, AI/LLM manifests and documentation chrome should remain aligned with that identity.

Upstream archive pages that could otherwise create misleading ZebraByte claims should be clearly attributed and, where appropriate, excluded from indexing rather than deleted.

## License and upstream attribution

The original Probo website/project material in this repository is used under its MIT license. Keep the repository `LICENSE` and preserve appropriate upstream attribution.

Upstream project:

```text
https://github.com/getprobo/probo
```
