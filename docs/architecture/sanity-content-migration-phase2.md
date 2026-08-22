# Sanity content migration — phase 2

Status: implementation branch `cms/managed-compliance-migration-20260822`
Date: 2026-08-22

## Goal

Use `/managed-compliance` as the representative service/compliance migration after the homepage. The page exercises enough of the CMS model to validate that normal ZebraByte service pages can be managed without editing Astro for routine content changes.

The phase-two batch is `tools/sanity-migration/content-v2.mjs` and contains:

- `siteSettings`
- `mainNavigation`
- `page.homepage`
- `page.managed-compliance`

All writes remain draft-only.

## Managed Compliance mapping

The current production page is represented as nine ordered CMS regions:

1. animated hero with two independently styled CTAs and framework badges;
2. existing compliance journey component;
3. four SaleArg/video items;
4. responsibility matrix (ZebraByte vs customer ownership);
5. supported framework links;
6. testimonials;
7. stories/case studies;
8. FAQ;
9. final CTA.

The Sanity document stores paired Romanian and English values in the same page document.

## Production parity renderer

`src/components/cms/CmsManagedComplianceRenderer.astro` deliberately reuses the current production components and layout primitives instead of approximating the page with generic cards:

- `Badges`
- `ComplianceTrack`
- `SaleArg`
- `Testimonials`
- `Stories`
- `AnimatedHero`

The responsibility matrix, framework list, FAQ and final CTA use the current page markup but read their values from the Sanity document.

The renderer also emits the existing `Service` JSON-LD contract for the canonical Managed Compliance route.

## Media

SaleArg videos resolve in this order:

1. Sanity `videoFile` upload;
2. migration HTTPS `videoUrl` fallback.

Existing keyshot URLs are preserved for initial parity. Editors can later upload replacement videos directly in Studio without a code change.

## Safety

The migration runner still rejects publishing and production mutation flags. Phase 2 uses deterministic IDs and `createOrReplace` only on `drafts.*` documents.

The runner additionally rejects duplicate page paths in the migration batch.

Publication of `/managed-compliance` remains blocked until:

- the draft is written to Sanity;
- staging preview is operational;
- desktop/mobile parity is verified;
- RO/EN content is reviewed;
- SEO, canonical and structured data are verified;
- interactive components preserve their existing behavior.

Until explicit publication, the current Astro page remains authoritative.

## What this proves

Once homepage and Managed Compliance parity are accepted, most standard product, security, compliance and company pages can be migrated in controlled batches using the same content objects and approved component families. A dedicated renderer should be used only where the current ZebraByte design requires a stable production template that the generic builder cannot reproduce exactly.
