# Sanity full-site management implementation

Status: implementation branch `cms/full-site-management-20260822`
Base: `3839a65108aba21709698e3dc51ff1b571ee271a`
Date: 2026-08-22

## Product decision

Sanity is the editorial control plane for the ZebraByte public website.

The target is that routine website administration does not require editing Astro, TypeScript, CSS or Worker code. Editors must be able to manage:

- global announcement;
- header navigation and mega-menu content;
- header CTAs;
- footer groups and legal links;
- global company/contact settings;
- page creation and public paths;
- page section order and visibility;
- page copy in Romanian and English;
- images, video references, alt text and captions;
- feature grids, content cards, stats and metrics;
- media/text sections and media-card grids;
- approved interactive ZebraByte blocks;
- comparison tables;
- process/steps sections;
- pricing/plans presentation;
- testimonials and logo clouds;
- FAQ;
- calls to action;
- per-page SEO and indexing controls;
- HUB/guides;
- stories/case studies;
- careers;
- legal documents;
- blog content through the existing Sanity blog pipeline.

Code remains responsible for executable behaviour: authentication, API endpoints, Cloudflare bindings, WAF/routing policy, secrets, form validation, payment logic and the implementation of approved visual/interactive components. Sanity does not accept arbitrary HTML, CSS or JavaScript.

This boundary is deliberate. It lets an editor operate the site without a developer for normal content/page work while preventing a compromised CMS account from becoming arbitrary code execution on `www.zebrabyte.ro`.

## Runtime model

Public traffic does not query Sanity request-by-request.

The release pipeline is:

1. `tools/sync-sanity-site.mjs` performs one published-perspective Content Lake query.
2. The payload is validated before Astro runs.
3. `.sanity-cache/site-content.json` becomes the immutable content snapshot for that build.
4. The sync produces `worker/cms-managed-routes.ts` from published CMS-native routes.
5. Astro materializes each CMS-native document twice under an internal namespace:
   - `/_cms/ro/...`
   - `/_cms/en/...`
6. `worker/router.ts` maps the canonical public URL to the matching internal static asset.
7. Direct public access to `/_cms` is blocked with `404` and `X-Robots-Tag: noindex, nofollow`.
8. Security headers are still finalized by `worker/main.ts`.

This provides exact editor-authored Romanian and English for CMS-native pages and avoids the AI-translation pass for those routes.

## Safe migration / route ownership

A published Sanity document is authoritative for its canonical public route.

Example:

- current Astro page exists at `/managed-compliance`;
- an editor publishes a Sanity `page` with `path=/managed-compliance`;
- the build adds `/managed-compliance` to `cmsManagedRoutes`;
- the Worker serves the new Sanity-rendered static page at that exact URL;
- the old Astro file remains in the build as a rollback fallback;
- if the Sanity page is unpublished, the route falls out of the manifest on the next release and the existing Astro page becomes active again.

This avoids a big-bang rewrite and prevents migration work from overwriting the known-good production design.

CMS-only routes work without creating a new Astro page file: publishing a valid `page`, `hubArticle`, `story`, `job` or `legalDocument` creates the public route at build time.

## Bilingual contract

Fixed two-language editorial fields use paired `ro` and `en` values in the same Sanity document.

This prevents Romanian and English pages from drifting into unrelated documents and lets page structure, media, section ordering and route ownership stay synchronized.

For a canonical document path `/security`:

- Romanian public URL: `/security`
- English public URL: `/en/security`
- internal materialization only: `/_cms/ro/security` and `/_cms/en/security`

The internal paths are never canonical and are not discoverable in the sitemap.

## Page builder

`page.sections` is an ordered Sanity array. Editors can add, remove, reorder and temporarily disable approved section types.

Current section registry:

- `heroSection`
- `richTextSection`
- `featureGridSection`
- `mediaSection`
- `mediaGridSection`
- `statsSection`
- `logoCloudSection`
- `testimonialsSection`
- `comparisonTableSection`
- `cardGridSection`
- `stepsSection`
- `pricingSection`
- `faqSection`
- `ctaSection`
- `siteBlockSection`

Each section exposes only bounded design choices such as variant, theme, spacing, column count and visibility. The website owns the actual CSS/component implementation.

`siteBlockSection` lets an editor place approved existing ZebraByte interactive/brand components without exposing component imports or executable input. The initial allow-list contains the compliance journey, framework badges, framework strip, reference logos, stories, ZebraByte testimonials, testimonials and newsletter signup.

## Global chrome

The singleton documents are:

- `siteSettings` with document ID `siteSettings`;
- `navigation` with document ID `mainNavigation`.

When published they control the global header/footer/announcement for CMS materialization and, where the build snapshot is available, the regular static pages too.

Hardcoded production values remain safe fallback values until the singleton documents are populated and published. A missing CMS configuration must not blank navigation during migration.

When any CMS-native public route exists, the build requires both singleton documents. This prevents publishing a CMS page with incomplete global chrome.

## SEO

CMS-managed documents support:

- localized title;
- localized meta description;
- social image;
- `noIndex`;
- canonical path override;
- bounded Schema.org page type.

Internal `/_cms` materialization routes are excluded from Astro sitemap generation. `tools/localize-sitemap.mjs` injects the canonical public URL for CMS-only routes and creates the matching `/en` URL while respecting CMS `noIndex`.

## Content security rules

The build rejects or prevents:

- `/api`, `/cdn-cgi`, `/.well-known`, `/en` or `/_cms` as editor-owned public route prefixes;
- unsafe URL schemes;
- duplicate CMS public routes;
- invalid slugs;
- non-HTTPS media/application URLs where HTTPS is required;
- arbitrary HTML/CSS/JavaScript schema fields;
- multiple global singleton documents;
- CMS-native routes without published global site settings and navigation.

Portable Text rendering escapes authored text and supports only a controlled subset of marks, lists, headings, images and safe links.

## Operational publishing flow

After the account-side Sanity webhook / Cloudflare Deploy Hook is configured:

1. editor changes content in Sanity;
2. editor previews on trusted staging through Presentation Tool;
3. editor publishes;
4. Sanity webhook triggers the public website build;
5. build downloads the published snapshot once;
6. all existing release/security/SEO checks run;
7. only a successful build is deployed;
8. public Worker serves the new static content.

Draft content is never read by the production build.

## Migration plan from current code-owned content

Do not import historical HTML blindly and do not replace the current design with generic CMS markup.

Migrate in this order:

1. Populate `siteSettings` from the current production values.
2. Populate `mainNavigation` from `src/content/menu.ts` and current footer groups.
3. Migrate `/` by mapping the existing animated hero, badges, reference logos, compliance journey, SaleArg-style cards, testimonials and stories to approved CMS sections.
4. Visual-diff the Sanity version against current production/staging.
5. Publish `/` only after parity.
6. Migrate a representative service page such as `/managed-compliance` and prove tables, media cards, FAQ and CTA parity.
7. Migrate remaining marketing/product/security/compliance/company pages route by route.
8. Migrate HUB/stories/careers/legal collections.
9. Migrate documentation pages only after confirming Starlight-specific navigation/search requirements; a CMS page can already own `/docs/...`, but Starlight behaviour must not be discarded accidentally.
10. Keep blog on the existing Sanity pipeline until its bilingual/editorial model is deliberately upgraded.
11. Remove old local page content only after every route has passed visual, SEO, link and mobile parity checks.

## What editors will not need a developer for

Once the migration is complete, routine work such as changing copy, translating content, changing images, creating a new standard page, changing page order/sections, updating navigation/footer, adding FAQs/cards/plans/metrics, publishing legal copy, adding jobs/case studies/guides, changing CTAs and updating SEO is Sanity-only.

A developer is still required when ZebraByte introduces a genuinely new executable capability: a new API/integration, authentication flow, payment workflow, security-sensitive form processing, new Cloudflare binding, or a visual/interactive component family that does not yet exist in the approved component registry.

That distinction is the long-term maintenance contract: content and composition are CMS-owned; executable product behaviour remains code-reviewed.
