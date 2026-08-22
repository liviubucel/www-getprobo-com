# Sanity content migration — phase 1

Status: implementation branch `cms/content-migration-20260822`
Date: 2026-08-22

## Goal

Move the current ZebraByte website into the full-site Sanity control plane without changing production content or design before parity is reviewed.

Phase 1 seeds three canonical documents:

- `siteSettings`
- `mainNavigation`
- `page.homepage`

The source is the current `main` website, not an historical branch and not the old Sanity project structure.

## Safety model

The migration is intentionally **draft-only**.

`tools/migrate-site-content-to-sanity.mjs` refuses publishing flags and supports only:

- default dry-run: validates and prints the planned documents;
- `--apply-drafts`: writes `drafts.siteSettings`, `drafts.mainNavigation` and `drafts.page.homepage` using `createOrReplace`.

The canonical source IDs stay stable (`siteSettings`, `mainNavigation`, `page.homepage`) and the runner adds the `drafts.` prefix only at mutation time.

This means:

1. rerunning the migration is idempotent;
2. no duplicate migration documents are created;
3. production cannot switch to the CMS page just because the migration script ran;
4. editors can review the imported documents before publication;
5. publication remains a deliberate Studio action after staging/visual parity checks.

## Authentication boundary

A write token is required only for `--apply-drafts` and must be supplied as:

`SANITY_API_WRITE_TOKEN`

Never use a `SANITY_STUDIO_*` variable for write credentials. Never commit the token, paste it into a PR, or expose it to browser code.

Project and dataset default to the established ZebraByte project:

- project: `yj548pxh`
- dataset: `production`

They can be overridden server-side with `SANITY_PROJECT_ID` and `SANITY_DATASET`.

## Commands

Validate/inspect without mutating Sanity:

```bash
npm run sanity:migrate:dry-run
```

Write drafts only:

```bash
SANITY_API_WRITE_TOKEN=... npm run sanity:migrate:drafts
```

The second command must be run only from a trusted local/admin environment or a protected CI job with the token stored as a secret.

## What is migrated

### Global settings

The seed carries the current ZebraByte brand defaults, SEO defaults, contact/security email, status and trust URLs, global CTAs, footer company metadata and a disabled announcement object.

### Navigation/footer

The complete current mega-menu is represented in Romanian and English, including the current feature cards and repository-backed migration media paths.

The current three footer columns are represented in Romanian and English. No extra footer-legal row is enabled in phase 1 because the current production footer does not render one without CMS data; this avoids an unintended visual change.

### Homepage

The draft maps the current homepage into five major regions:

1. hero with RO/EN copy and CTAs;
2. compliance journey;
3. the four autopilot/security media arguments;
4. ZebraByte testimonials;
5. stories/case studies.

Current keyshot videos are referenced through the existing public HTTPS assets during the migration phase. They can later be moved to Sanity-managed media without changing the page model.

## CI contract

`tools/check-sanity-content-migration.mjs` verifies that:

- all three phase-one documents exist;
- localized fields contain both Romanian and English values;
- critical current menu/footer routes remain represented in the Sanity seed;
- protected homepage copy remains represented;
- the migration runner remains draft-only;
- the write token name remains server-side;
- the build runs the migration runner in dry-run mode only.

## Publication gate

Do not publish `page.homepage` until all of the following are true:

- `siteSettings` and `mainNavigation` drafts have been reviewed;
- CMS Studio is available on the protected ZebraByte CMS origin;
- staging preview is operational;
- desktop/mobile visual parity has been checked;
- Romanian and English copy has been reviewed;
- SEO/canonical/hreflang checks pass;
- the CMS version preserves the current interactive components and accessibility behavior.

Only after that gate is met should the drafts be published from Studio. The existing code-owned pages remain the production fallback throughout the migration.

## Next phase

After homepage parity, migrate a representative service page (`/managed-compliance`) and use it to prove the full section registry for media, comparisons, FAQ and CTA. Then migrate the remaining marketing/security/compliance/company routes in controlled batches.
