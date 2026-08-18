# ZebraByte Experience Contract

This file is the authoritative engineering contract for AI coding assistants and human contributors working in this repository. Read it before editing the site.

## What this repository is

This is the ZebraByte public website, documentation surface and Cloudflare runtime. The site was adapted from the Probo website codebase and intentionally preserves its valuable product content, information architecture, interaction language, spacing, motion and component behavior while replacing the public brand with ZebraByte and extending the product with ZebraByte-specific capabilities.

**Probo is not the public brand. ZebraByte is.** Public-facing Probo naming, logos, domains and first-person product references must be rebranded to ZebraByte where appropriate. This rebranding requirement must never be interpreted as permission to delete useful Probo-originated product content or functionality.

Production identity: `https://www.zebrabyte.ro`.

Primary language architecture:

- Romanian is canonical at root paths, for example `/`, `/blog`, `/docs`.
- English is served under `/en`, for example `/en`, `/en/blog`, `/en/docs`.
- The Cloudflare localization layer is part of the product architecture. Do not build a second competing localization system without an explicit architectural decision.

## Core product rule: preserve, rebrand, extend

ZebraByte is a branded adaptation and extension of the Probo product experience. The default rule is:

1. **Preserve** useful Probo-originated pages, features, workflows, documentation, blog/Hub content, changelog/history, components, UX patterns and product explanations.
2. **Rebrand** public Probo identity to ZebraByte: product/company naming, first-person brand references, logos, domains, CTAs and equivalent public-facing identity markers.
3. **Adapt/paraphrase** public copy so it is original ZebraByte copy rather than a mechanically identical reproduction. Preserve factual meaning, product depth and useful detail while rewriting titles, headings, metadata and body copy naturally for ZebraByte and the RO/EN audience.
4. **Extend** the inherited product with ZebraByte-specific capabilities such as cyber security, managed security, accessibility, compliance extensions, status/runtime integrations, legal, localization and other approved additions.

Do **not** reduce the inherited product merely to make a branding, performance, SEO or production-readiness audit easier to pass.

### Destructive cleanup is prohibited

Brand/public-identity audits may flag or require replacement of legacy public branding. They must not delete product pages, blog/Hub articles, documentation, changelog/history, product workflows, components or features merely because they originated from Probo or still contain rebrandable copy.

When a page contains legacy Probo branding, the default remediation is **rewrite/rebrand the page**, not delete it.

When uncertain whether inherited product content should remain, **preserve it** and flag the specific factual/legal concern instead of removing it.

## Golden design baseline and content provenance

The imported Probo snapshot at commit `7e7e7b5c18c621aae125488342a215a641c830b9` is the **golden design/behavior and inherited product-content baseline** for upstream surfaces. The detailed classification and deliberate deviations are documented in `docs/architecture/experience-baseline.md`.

Compare against it when an inherited component or product surface may have lost content depth, layout, spacing, responsive behavior, animation, carousel behavior, hover/focus states or other interaction semantics.

The golden snapshot is not authority for claims that would falsely attribute third-party relationships or people to ZebraByte. Distinguish **valuable product content** from **identity/social-proof claims**:

- preserve and rebrand/paraphrase useful product explanations, educational content, documentation, workflows, blog/Hub articles, history/changelog and feature descriptions;
- never present Probo team photographs or people as ZebraByte staff;
- never present Probo customer/company logos or testimonials as ZebraByte social proof without an independent ZebraByte source;
- the inherited homepage logo marquee may retain the original logo set only under a neutral reference-library label; do not call those organizations ZebraByte customers, partners or endorsements without a separate source;
- never rename an upstream photograph, review, customer or relationship so it appears to belong to ZebraByte;
- never fabricate people, customers, reviews, certifications, partnerships or metrics to fill an inherited layout;
- author attribution may be retained when factually required for imported editorial content, but the surrounding public product branding should follow ZebraByte rules;
- framework badges identify frameworks and do not imply ZebraByte certification;
- current ZebraByte runtime, security and release architecture takes precedence over upstream Probo links or deployment assumptions.

Classify a meaningful difference before changing it:

1. **Inherited valuable product content** — preserve, rebrand and paraphrase where public copy is too close to upstream.
2. **Intentional ZebraByte adaptation/extension** — keep and protect it.
3. **Safe optimization** that preserves the visible/interactive/content contract — keep and protect it.
4. **Experience/content regression** — restore/rebuild the inherited experience and product depth using ZebraByte branding.
5. **Invalid identity/social-proof claim** — preserve the useful design pattern but remove or replace only the unsupported identity/claim.

When design and content conflict, preserve the strongest valid inherited design and product value while keeping public ZebraByte claims truthful.

## SEO/content adaptation rule

Do not publish large bodies of upstream Probo copy verbatim when they can reasonably be rewritten without losing meaning. For inherited public pages:

- keep the same useful subject matter, completeness and intent;
- rewrite titles, meta descriptions, H1/H2 headings and body copy into natural ZebraByte wording;
- localize for Romanian and English rather than performing word-for-word translation;
- preserve technical terminology where precision matters;
- do not use superficial synonym substitution that makes copy awkward or less accurate;
- do not shorten or remove sections merely to make the text different;
- keep stable useful URLs where appropriate, but replace legacy Probo-branded slugs with ZebraByte equivalents when the public identity requires it and maintain redirects where needed.

SEO differentiation is achieved by **original, useful ZebraByte copy and local relevance**, not by deleting inherited subject coverage.

## Non-negotiable product rule: preserve the experience

When adapting, optimizing or refactoring an inherited component, preserve its **visible and interactive contract**, not merely a screenshot of its resting state.

That includes:

- layout and spacing rhythm;
- animation and motion where present;
- carousel/slider behavior;
- autoplay direction and pause behavior;
- hover, focus, keyboard and pointer states;
- mobile behavior;
- progressive/viewport-triggered states;
- media posters and loading states;
- typography;
- accessibility behavior;
- Astro view-transition/navigation behavior where the layout declares `transition:name`.

A build that compiles while silently making a moving component static is a regression.

### Do not make these substitutions just for performance

Do **not** replace any of the following unless the change has explicit product approval and equivalent behavior is proven:

- Splide/Embla carousel -> plain `overflow-x` scroll;
- Lottie framework badge -> static SVG;
- animated/progressive custom element -> static markup;
- full content collection -> arbitrary `.slice(...)` subset;
- animated hero -> static gradient;
- responsive interactive component -> mobile-only static component;
- Astro `ClientRouter`/view-transition behavior -> normal full-document navigation when transition semantics are still part of the UI.

Performance work must preserve the experience. Prefer lifecycle improvements such as viewport pausing, lazy media source assignment, poster images, asset sizing, caching and reduced unnecessary work.

## Protected experience invariants

`npm run check:experience` validates the highest-risk invariants and is part of `npm run build`. It now includes both the behavioral contract and the design/content provenance contract. If it fails, fix the regression; do not weaken the checker to make a deliberate behavior change pass unless the product requirement itself changed.

Protected behaviors currently include:

1. **Homepage hero** — `AnimatedHero` remains mounted and viewport-aware.
2. **Homepage framework grid** — uses the live `Badges.svelte` behavior, not `BadgesStatic.astro`.
3. **Framework badges** — use Lottie JSON animation where the experience calls for animated badges.
4. **Reference logo marquee** — retains the inherited SVG/logo set and `LogosScroll.svelte` AutoScroll behavior. Keep its framing neutral; do not replace it with capability/service pills merely to avoid provenance wording.
5. **Client testimonials** — use `TestimonialsScroll.svelte`; desktop has the original two moving rows, including the reverse row.
6. **Case studies** — use the interactive Slider, preserve overflow/click navigation and do not arbitrarily cap the collection.
7. **Compliance journey** — viewport-triggered steps activate progressively.
8. **Product videos** — can lazy-load, but retain a poster/meaningful visual state before playback.
9. **Global layout** — preserves body typography/background classes, the skip-to-content target and Astro `ClientRouter` view transitions.
10. **Header** — preserve the intended translucent/backdrop treatment and navigation interactions.
11. **Desktop mega-menu** — closes on outside interaction/link selection, supports Escape without immediately reopening and preserves focus semantics.
12. **Motion on mobile** — mobile is not a reason to disable motion. Disable or reduce motion for `prefers-reduced-motion: reduce`.
13. **Typography** — Geist is part of the visual contract. Loading strategy must not intentionally prefer a permanent fallback font.
14. **About provenance** — do not restore the upstream Probo team photograph, people or photo gallery as ZebraByte identity; preserve the inherited page rhythm with truthful ZebraByte content. The ZebraByte wordmark must preserve its intrinsic `3242 × 1166` aspect ratio when rendered.
15. **Customer-proof provenance** — review/customer surfaces must use ZebraByte-sourced entries and must not be padded with inherited Probo company identities.
16. **Inherited content breadth** — do not silently remove full Hub/blog/docs/product collections because individual pages need rebranding or rewriting.

## Accessibility and motion

Respect `prefers-reduced-motion: reduce`. This is an accessibility requirement and may disable decorative motion.

Do not conflate reduced motion with viewport width. A user on a phone who has not requested reduced motion should receive the intended motion/interaction unless there is a specific mobile UX reason documented in the component.

All interactive changes must preserve keyboard access, focus visibility, Escape behavior where applicable and correct `aria-*` state.

The global skip link and `#main-content` focus target are protected accessibility infrastructure. Do not remove them while reconstructing or optimizing the layout.

## Cloudflare runtime architecture

The Worker entrypoint is intentionally:

```text
worker/main.ts
```

`worker/main.ts` handles first-party server/runtime concerns such as forms, newsletter and Sentry behavior and delegates normal site traffic to the router via `router.fetch(request, env)`.

Do **not** change `wrangler.jsonc` to point directly at `worker/router.ts` merely because a checker, old note or upstream example expects it. Fix stale validation instead.

Treat these as sensitive architectural surfaces:

- `worker/main.ts`
- `worker/router.ts`
- `worker/forms.ts`
- newsletter dispatch/subscription code
- Sentry server/client routing
- Cloudflare bindings in `wrangler.jsonc`
- locale/document rewriting

Do not bypass them with a static-only shortcut.

### Footer live-status contract

The footer live-status badge is a cross-repository runtime surface, not a static footer label. Before changing `ZebraByteStatus.svelte`, `/api/status`, `STATUS_ENGINE`, `worker/public-status.ts`, the status Service Binding, or related status copy, read `docs/architecture/footer-status.md`.

The private `STATUS_ENGINE -> status-page / FooterStatusEntrypoint` binding is primary. Public HTTP is a bounded resilience/backwards-compatibility fallback, not a replacement architecture. The compact footer must not expose provider/source implementation details or hidden service IDs. Keep the badge mobile-safe and keep the documented browser/Worker timeouts.

## i18n rules

- Root is Romanian; `/en` is English.
- Internal English links must remain under `/en`.
- Preserve canonical and `hreflang` generation.
- New public copy must be covered by the bilingual architecture; do not leave a random language island because it happens to render.
- Do not expose legacy `/ro` or old Wix/Odoo blog paths as current canonical UX. Legacy paths may exist only as compatibility redirects where required.
- Do not break sitemap parity or localized sitemap generation.

## Content and URL stability

Do not silently delete imported content to reduce build size, remove upstream identity or make audits pass.

Blog article canonicals remain `/blog/<slug>` and `/en/blog/<slug>`. Category archives are navigation surfaces, not canonical article path segments. Existing legacy redirect coverage and source-document parity are intentional.

Industry pages and other migrated content must retain source parity checks. If a source duplicate is collapsed, its source identity must remain represented by migration metadata.

Legacy Probo-branded public slugs should be migrated to ZebraByte-branded equivalents when appropriate, with redirects preserving inbound links and historical SEO value.

## Performance rules

Performance optimization is welcome, but order of operations matters:

1. measure or identify the actual cost;
2. preserve the current behavior and content contract;
3. reduce work without removing the behavior or subject coverage;
4. keep a deterministic regression check for any bug that was previously introduced;
5. verify desktop and mobile states.

Good examples:

- pause RAF/video/Lottie when offscreen or document is hidden;
- lazy-load video sources while keeping poster frames;
- lazy-load menu media only when the menu is used;
- set dimensions to avoid layout shifts;
- use IntersectionObserver to avoid offscreen work;
- cache generated/localized output safely.

Bad examples:

- replace a carousel with static scrolling because Lighthouse is easier to satisfy;
- remove animation only on mobile;
- use `display=optional` if it makes the branded font commonly disappear;
- cap a content collection without a product requirement;
- delete Hub/blog/docs pages because they contain upstream branding that should instead be rewritten;
- remove client behavior and call the visual resting state equivalent;
- remove `ClientRouter` while leaving view-transition declarations throughout the UI.

## Before editing

Because multiple agents/processes may work on this repository concurrently:

1. Fetch the current target-branch SHA immediately before making changes.
2. Fetch the exact current file before replacing it.
3. If an inherited design/product surface is involved, compare it with golden commit `7e7e7b5c18c621aae125488342a215a641c830b9` before simplifying, restoring or deleting it.
4. Do not overwrite unrelated changes from another agent.
5. Prefer focused changes over wholesale reverts of mixed commits.
6. If restoring a regression, inspect history so the original behavioral and content intent is understood.
7. Validate public identity/content provenance separately from visual parity and content preservation.

## Required validation

At minimum for site/runtime changes:

```bash
npm run check:experience
npm run build
```

The production build also runs content, performance-asset, localization and sitemap audits.

A successful local compile is not proof of a successful deployment. The authoritative deployment signal is the **Cloudflare Workers Build** for the current production SHA. The separate GitHub Actions build can fail for account/billing reasons and must not be mistaken for the Cloudflare deployment result.

Do not report a deployment as successful until the current-head Cloudflare Workers Build is completed successfully.

## Cloudflare build failure handling

When a Cloudflare build fails:

1. identify the current production SHA;
2. inspect the Cloudflare check for that exact SHA;
3. read the final build error, not just warnings;
4. fix only the actual failure;
5. preserve all protected behaviors, inherited content breadth and runtime architecture;
6. verify a new current-head Cloudflare build before declaring success.

## Design/system changes

Do not treat the inherited Probo design system or product content as disposable scaffolding. ZebraByte identity, localization and capabilities can evolve substantially, but the useful upstream product depth, interaction quality, alignment and component polish should remain unless a deliberate product decision removes a specific item.

Do not blindly restore invalid Probo identity/social proof. The golden snapshot establishes lineage and product breadth; `docs/architecture/experience-baseline.md` records where upstream identity/content claims are intentionally invalid for ZebraByte. Audit the design pattern, product value and content provenance independently.

If a design/product change is intentional and conflicts with a protected invariant, update the implementation, this contract, the experience baseline and the relevant checker together. The checker follows the product decision; it must not be weakened merely to accommodate an accidental regression.

## Security

- Never commit production secrets.
- Keep Turnstile validation server-side where required.
- Do not weaken CSP/security headers simply to make an integration render.
- Do not expose internal endpoints, source-system details or infrastructure implementation to public users unless the product explicitly calls for it.
- Preserve validation and rate-limiting behavior when refactoring forms/auth/integrations.

## Definition of done

A change is not done merely because it compiles. It is done when:

- useful inherited product content and functionality are preserved unless explicitly removed for a valid product/legal reason;
- public Probo branding has been replaced with ZebraByte where appropriate;
- inherited copy has been paraphrased/adapted where necessary without reducing factual depth;
- ZebraByte-specific extensions remain intact;
- behavior is preserved or intentionally changed;
- inherited design changes were checked against the golden baseline where relevant;
- public content provenance is valid and does not imply unsupported ZebraByte relationships;
- desktop and mobile remain coherent;
- accessibility states still work;
- RO/EN architecture remains valid;
- protected regression checks pass;
- the current-head Cloudflare build succeeds;
- unrelated concurrent work was not overwritten.
