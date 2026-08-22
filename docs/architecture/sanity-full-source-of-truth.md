# ZebraByte full Sanity source-of-truth architecture

## Decision

Sanity is the primary editorial control plane for the ZebraByte website.

This means editors can control:

- global site settings and announcements
- header navigation and footer groups
- all normal marketing/product/service/company pages
- page section composition and ordering
- Romanian and English copy
- images, video references, captions and alt text
- CTA destinations and presentation variants
- SEO titles, descriptions, social images, canonical overrides and schema.org page type
- blog articles
- HUB/guides
- ZebraByte-owned stories/case studies
- jobs/careers
- legal document content
- FAQ, comparison tables, metrics, feature grids, testimonials and logo clouds

The public component implementations remain in source control. Sanity chooses the component type, approved variant, content and order; it does not accept arbitrary HTML, CSS or JavaScript.

## Security boundary

Sanity must never become a path to mutate application/security infrastructure. The following remain code/Cloudflare-controlled:

- Worker routing and runtime redirects
- WAF and Access policies
- CSP/security headers
- Turnstile verification
- authentication/session implementation
- webhook signature verification
- mail/admin authorization
- rate limiting
- Cloudflare bindings and secrets
- raw JavaScript, CSS or arbitrary HTML execution

The CMS contract check explicitly rejects browser-facing Studio secret assignments and raw custom HTML/CSS/JS schema fields.

## Content model

### Global singletons

- `siteSettings` — fixed document ID `siteSettings`
- `navigation` — fixed document ID `mainNavigation`

### Pages

`page` stores a canonical Romanian `path`; the website derives the English route under `/en` from the same document.

Each page contains an ordered `pageSections` array. Supported first-party sections:

- hero
- rich text
- feature grid
- media + text
- metrics/stats
- logo cloud
- testimonials
- comparison table
- FAQ
- CTA

Adding/reordering/removing these array items is the page-building model. New visual patterns should be introduced by adding a reviewed component variant in code and exposing only its safe configuration in Sanity.

### Bilingual content

The first full-site migration uses paired `ro` / `en` fields for strings, long text and Portable Text. This matches ZebraByte's fixed two-language public contract and avoids creating independent translation documents whose route/content relationships can drift.

### Editorial collections

- `post`
- `hubArticle`
- `story`
- `job`
- `legalDocument`

The existing `post` fields consumed by the legacy blog importer are preserved during migration.

## Presentation Tool

Sanity Studio includes the Presentation Tool with trusted origins limited to:

- local development
- `https://stag.zebrabyte.ro`
- `https://www.zebrabyte.ro`

The preview URL is controlled by the public `SANITY_STUDIO_PREVIEW_URL` environment variable. No token is bundled into Studio.

Phase A provides document-to-route mapping and embedded preview.

Phase B adds authenticated draft preview, Content Source Maps, click-to-edit overlays, live draft refresh and drag-and-drop page building. Because the current public site uses a custom static-assets-first Cloudflare Worker, this must be integrated without replacing the existing Worker entrypoint. The preferred implementation is an isolated draft-preview route/runtime, not a wholesale conversion of public traffic to SSR.

## Publishing model

Production remains deterministic:

1. Editor changes content in Sanity.
2. Draft is previewed in the Presentation Tool.
3. Editor publishes.
4. Sanity webhook triggers the Cloudflare Workers Build deploy hook for the website.
5. Website build queries the published perspective.
6. CMS content is validated and materialized for Astro.
7. Existing experience/security/SEO/i18n/build gates run.
8. Wrangler deploys only if all gates pass.

A CMS edit therefore cannot bypass the website release gates.

## Migration order

The migration is performed on the current `main` baseline only. Existing public pages remain authoritative until their Sanity consumer and content migration are validated.

1. Full schema + Presentation Tool contract.
2. Global settings, navigation and footer adapter.
3. Generic `page` adapter and component registry.
4. Migrate homepage and representative product/service page; visual parity test.
5. Migrate remaining page inventory without changing design.
6. Migrate HUB/guides.
7. Migrate stories/case studies.
8. Migrate jobs.
9. Migrate legal documents.
10. Replace legacy blog-only importer with the unified content sync after parity is proven.
11. Add authenticated draft-preview runtime and full Visual Editing/drag-and-drop.
12. Remove superseded local content only after route-by-route parity and SEO checks pass.

## Design preservation

Sanity controls composition, but it must not silently invent a second design system. The current ZebraByte/Probo-derived frontend remains the visual contract.

For each section type, the website maps a schema object to an existing or reviewed ZebraByte component. CMS variants are enums, not arbitrary class names. Tailwind classes, CSS rules and component source are not editor-controlled.

## Production acceptance

The full CMS migration is complete only when:

- all current public content has a Sanity source or an explicit code-owned exception
- RO and EN routes render from the same validated Sanity document model
- homepage/product/service/compliance pages preserve current design
- navigation and footer are CMS-driven without broken links
- blog/HUB/stories/jobs/legal are CMS-driven
- sitemap/RSS/schema.org/SEO metadata are generated from the CMS model
- draft preview is authenticated and never indexable
- Presentation Tool origins are restricted
- no Sanity secret exists in the browser bundle or Git
- a Sanity publish cannot deploy when release gates fail
- public Worker security behavior remains unchanged
