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

Sanity Studio v6 is a browser SPA. It can be hosted by Sanity or self-hosted. For ZebraByte production, the preferred final topology is a dedicated CMS hostname such as `cms.zebrabyte.ro`, deployed separately from the public website and protected by Sanity authentication; Cloudflare Access may be added as a second gate when self-hosted.

If self-hosted, the Studio origin must be added to the Sanity project's CORS origins. Never embed API/deploy tokens in the Studio bundle.

## Publishing workflow

Initial safe workflow:

1. Editor changes a draft in ZebraByte CMS.
2. Editor publishes the document in Sanity.
3. The website build imports the `published` perspective.
4. Existing build/release gates run.
5. The exact validated website artifact is deployed.

A signed Sanity webhook/build trigger can be added after Phase 1. Until that trigger is implemented and verified, publishing a Sanity document does not by itself guarantee an immediate website deployment.

## Production acceptance for Phase 1

Before enabling the CMS for normal editorial use:

- Sanity Studio builds successfully on its own.
- The existing website build succeeds with the same project/dataset.
- At least one harmless draft/edit/publish cycle is tested on staging.
- Published article URL, title, body, image, tags and author render correctly.
- `/en` behavior remains correct.
- RSS, sitemap and SEO checks remain green.
- no Studio token or secret is present in Git or the browser bundle.
- public website design and `/compliance-portal` remain unchanged.
