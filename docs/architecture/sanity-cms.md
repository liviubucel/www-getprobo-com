# ZebraByte Sanity CMS architecture

## Decision

Sanity is the editorial CMS for ZebraByte. It owns content, not application layout or security behavior.

The public website remains an Astro application deployed through the existing Cloudflare Worker. Sanity content is imported during the website build, validated against the Astro content schema, and then published as static site content. Public requests do not need a Sanity write token and do not depend on Sanity being reachable at request time.

## Current production source

The existing ZebraByte blog importer already reads published `post` documents from:

- Sanity project: `yj548pxh`
- dataset: `production`

The project ID and dataset are public identifiers. Authentication tokens are secrets and must never be placed in `SANITY_STUDIO_*` variables or committed to Git.

`sanity-studio/` is deliberately isolated from the root website dependencies so the Studio React/Sanity dependency graph cannot increase the production website bundle or alter the Astro runtime.

## Phase 1: blog

Phase 1 exposes only the content contract that the website already consumes safely:

- `title`
- `slug`
- `excerpt`
- `publishedAt`
- `author`
- `tags`
- `mainImage` + alternative text
- Portable Text `body`

The website's existing `tools/sync-zebrabyte-blog-optimized.mjs` / `tools/sync-zebrabyte-blog-v2.mjs` pipeline remains the publishing adapter. It queries only the `published` perspective, validates required article structure, resolves duplicate legacy content, optimizes Sanity images, converts Portable Text to MDX, and writes generated content for the Astro build.

This preserves the current public URLs, redirects, SEO checks, bilingual runtime behavior, and design.

## What Sanity must not control

The following stay in source control unless a future reviewed migration explicitly changes that boundary:

- page/component layout and ZebraByte/Probo-derived design
- Cloudflare Worker routing and redirects
- security headers, Turnstile, rate limiting and mail/webhook controls
- compliance/security application behavior
- navigation architecture
- generated GitHub changelog
- Starlight documentation and API/reference documentation

This prevents an editorial change from becoming an application/security change.

## Future CMS phases

After Phase 1 is deployed and smoke-tested, migrate collections one at a time with a dedicated importer/adapter and regression test for each collection:

1. HUB/guides
2. ZebraByte-owned stories/case studies
3. jobs/careers
4. approved social/review wall content

Do not add a Sanity document type to the editor before the public website has a tested consumer for that type. Editors must never be able to publish fields the site silently ignores.

## Local Studio

From the repository root:

```bash
npm --prefix sanity-studio install
npm run sanity:dev
```

Or from `sanity-studio/`:

```bash
npm install
npm run dev
```

The checked-in defaults point to `yj548pxh / production`. To use another project/dataset, copy `sanity-studio/.env.example` to a local ignored environment file and change only the public identifiers.

## Studio deployment

Sanity Studio v6 is a browser SPA. ZebraByte self-hosts the Studio as a completely separate Cloudflare application so the CMS deployment cannot overwrite the public website Worker.

The checked-in `sanity-studio/wrangler.jsonc` uses:

- Worker name: `zebrabyte-cms`
- build output: `sanity-studio/dist`
- SPA fallback: `single-page-application`

The intended production hostname is:

- `https://cms.zebrabyte.ro`

Do not add the CMS hostname as a route of the public `zebrabyte-website` Worker. It belongs to the separate `zebrabyte-cms` application.

### Cloudflare setup

Create or connect a separate Worker/Build for the CMS using this repository and the Studio directory/configuration. Build the Studio before the Wrangler deployment. The validation workflow performs a Studio build and a separate Cloudflare dry-run so the two deployment targets cannot be confused silently.

After the CMS is deployed, attach `cms.zebrabyte.ro` as the custom domain of `zebrabyte-cms`.

Cloudflare Access is recommended as a second authentication boundary for the CMS hostname. Sanity authentication remains required for access to the project/content even when Access is enabled.

### Sanity CORS

A self-hosted Studio must be explicitly trusted by the Sanity project. In Sanity Manage for project `yj548pxh`, add exactly:

- Origin: `https://cms.zebrabyte.ro`
- Allow credentials: **Yes**

Do not add a platform-wide wildcard and do not use `*.zebrabyte.ro` when an exact production origin is sufficient.

The project ID/dataset are safe browser configuration. API tokens, deploy tokens and webhook URLs are not.

## Automatic publishing: Sanity -> Cloudflare

The public website is generated at build time, so publishing in Sanity must trigger a new build of the public `zebrabyte-website` Worker.

Use Cloudflare Workers Builds **Deploy Hooks** rather than putting a Cloudflare API token in Sanity or in browser-facing Studio code.

### Cloudflare Deploy Hook

On the **public website Worker** (`zebrabyte-website`), create a Deploy Hook:

- suggested name: `sanity-published-content`
- branch: `main`

Cloudflare returns a unique POST URL. Treat that URL as a secret credential:

- never commit it to Git
- never place it in `SANITY_STUDIO_*`
- never expose it in client-side code
- rotate/delete it in Cloudflare if it is disclosed

The Deploy Hook deliberately targets `main`. The existing website build then imports only Sanity's published perspective and executes the existing content, design, SEO, i18n, security and Worker release gates.

### Sanity webhook

In Sanity Manage, create a webhook for project `yj548pxh` / dataset `production` whose target is the Cloudflare Deploy Hook URL.

For Phase 1 keep it narrow:

- document filter: `_type == "post"`
- trigger only content mutations relevant to publish/unpublish/update
- do not include drafts
- do not include all document versions
- method: `POST`

This means normal draft editing does not rebuild production. A published content mutation triggers Cloudflare, and Cloudflare deduplicates duplicate hook calls that arrive before the first build starts.

The direct Deploy Hook is preferred for this build trigger because the unique hook URL itself is the Cloudflare build credential and no broad Cloudflare API token is required. If future requirements need payload validation, custom authorization or event transformation, add a dedicated server-side proxy that validates Sanity's webhook signature before calling a Deploy Hook stored as a Worker secret. Do not add that complexity until it is actually needed.

## Publishing workflow

Production flow after the dashboard integration is enabled:

1. Editor changes a draft in ZebraByte CMS.
2. Editor publishes the document in Sanity.
3. Sanity calls the private Cloudflare Deploy Hook.
4. Cloudflare builds `main` for `zebrabyte-website`.
5. The website importer queries only Sanity's `published` perspective.
6. Existing build/release gates run.
7. Cloudflare deploys the exact successfully built website artifact.

Publishing content never gives Sanity permission to change Worker routing, application code, layouts or security controls.

## Production acceptance for Phase 1

Before enabling the CMS for normal editorial use:

- Sanity Studio audit reports no known vulnerabilities at the configured threshold.
- Sanity Studio builds successfully on its own.
- `zebrabyte-cms` Cloudflare bundle passes dry-run separately from `zebrabyte-website`.
- `cms.zebrabyte.ro` points only to the separate CMS application.
- Sanity CORS allows exactly `https://cms.zebrabyte.ro` with credentials.
- Cloudflare Access is enabled for the CMS hostname if used as the second gate.
- the Deploy Hook points to the public website `main` branch and its URL is not present in Git/client code.
- the Sanity webhook is filtered to published Phase-1 `post` content, without drafts/all versions.
- at least one harmless draft/edit/publish cycle is tested first against the intended release path.
- the triggered Cloudflare build identifies the expected `main` SHA.
- published article URL, title, body, image, tags and author render correctly.
- `/en` behavior remains correct.
- RSS, sitemap and SEO checks remain green.
- no Studio token or secret is present in Git or the browser bundle.
- public website design and `/compliance-portal` remain unchanged.
