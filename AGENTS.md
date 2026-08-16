# ZebraByte Experience Contract

This file is the authoritative engineering contract for AI coding assistants and human contributors working in this repository. Read it before editing the site.

## What this repository is

This is the ZebraByte public website, documentation surface and Cloudflare runtime. The site was adapted from the Probo website codebase and intentionally preserves much of its interaction language, spacing, motion and component behavior while replacing the public brand, information architecture and content with ZebraByte.

**This is not a generic Probo fork and Probo is not the public brand.** Probo remains useful as upstream design/behavior lineage and, where applicable, as a technical reference for inherited compliance-product documentation.

Production identity: `https://www.zebrabyte.ro`.

Primary language architecture:

- Romanian is canonical at root paths, for example `/`, `/blog`, `/docs`.
- English is served under `/en`, for example `/en`, `/en/blog`, `/en/docs`.
- The Cloudflare localization layer is part of the product architecture. Do not build a second competing localization system without an explicit architectural decision.

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

`npm run check:experience` validates the highest-risk invariants and is part of `npm run build`. If it fails, fix the regression; do not weaken the checker to make a deliberate behavior change pass unless the product requirement itself changed.

Protected behaviors currently include:

1. **Homepage hero** — `AnimatedHero` remains mounted and viewport-aware.
2. **Homepage framework grid** — uses the live `Badges.svelte` behavior, not `BadgesStatic.astro`.
3. **Framework badges** — use Lottie JSON animation where the experience calls for animated badges.
4. **Customer logos** — loop through `LogosScroll.svelte` with Splide AutoScroll and pause appropriately.
5. **Client testimonials** — use `TestimonialsScroll.svelte`; desktop has the original two moving rows, including the reverse row.
6. **Case studies** — use the interactive Slider, preserve overflow/click navigation and do not arbitrarily cap the collection.
7. **Compliance journey** — viewport-triggered steps activate progressively.
8. **Product videos** — can lazy-load, but retain a poster/meaningful visual state before playback.
9. **Global layout** — preserves body typography/background classes, the skip-to-content target and Astro `ClientRouter` view transitions.
10. **Header** — preserve the intended translucent/backdrop treatment and navigation interactions.
11. **Desktop mega-menu** — closes on outside interaction/link selection, supports Escape without immediately reopening and preserves focus semantics.
12. **Motion on mobile** — mobile is not a reason to disable motion. Disable or reduce motion for `prefers-reduced-motion: reduce`.
13. **Typography** — Geist is part of the visual contract. Loading strategy must not intentionally prefer a permanent fallback font.

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

## i18n rules

- Root is Romanian; `/en` is English.
- Internal English links must remain under `/en`.
- Preserve canonical and `hreflang` generation.
- New public copy must be covered by the bilingual architecture; do not leave a random language island because it happens to render.
- Do not expose legacy `/ro` or old Wix/Odoo blog paths as current canonical UX. Legacy paths may exist only as compatibility redirects where required.
- Do not break sitemap parity or localized sitemap generation.

## Content and URL stability

Do not silently delete imported content to reduce build size.

Blog article canonicals remain `/blog/<slug>` and `/en/blog/<slug>`. Category archives are navigation surfaces, not canonical article path segments. Existing legacy redirect coverage and source-document parity are intentional.

Industry pages and other migrated content must retain source parity checks. If a source duplicate is collapsed, its source identity must remain represented by migration metadata.

## Performance rules

Performance optimization is welcome, but order of operations matters:

1. measure or identify the actual cost;
2. preserve the current behavior contract;
3. reduce work without removing the behavior;
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
- remove client behavior and call the visual resting state equivalent;
- remove `ClientRouter` while leaving view-transition declarations throughout the UI.

## Before editing

Because multiple agents/processes may work on this repository concurrently:

1. Fetch the current `main` SHA immediately before making changes.
2. Fetch the exact current file before replacing it.
3. Do not overwrite unrelated changes from another agent.
4. Prefer focused changes over wholesale reverts of mixed commits.
5. If restoring a regression, inspect history so the original behavioral intent is understood.

## Required validation

At minimum for site/runtime changes:

```bash
npm run check:experience
npm run build
```

The production build also runs content, performance-asset, localization and sitemap audits.

A successful local compile is not proof of a successful deployment. The authoritative deployment signal is the **Cloudflare Workers Build** for the current `main` SHA. The separate GitHub Actions build can fail for account/billing reasons and must not be mistaken for the Cloudflare deployment result.

Do not report a deployment as successful until the current-head Cloudflare Workers Build is completed successfully.

## Cloudflare build failure handling

When a Cloudflare build fails:

1. identify the current `main` SHA;
2. inspect the Cloudflare check for that exact SHA;
3. read the final build error, not just warnings;
4. fix only the actual failure;
5. preserve all protected behaviors and runtime architecture;
6. wait for a new current-head Cloudflare build before declaring success.

## Design/system changes

Do not treat the inherited Probo design system as disposable scaffolding. ZebraByte content and IA can evolve substantially, but interaction quality, alignment and component polish should remain coherent with the existing system unless a deliberate redesign is requested.

If a design change is intentional and conflicts with a protected invariant, update the implementation, this contract and `tools/check-experience-contract.mjs` together. The checker follows the product decision; it must not be weakened merely to accommodate an accidental regression.

## Security

- Never commit production secrets.
- Keep Turnstile validation server-side where required.
- Do not weaken CSP/security headers simply to make an integration render.
- Do not expose internal endpoints, source-system details or infrastructure implementation to public users unless the product explicitly calls for it.
- Preserve validation and rate-limiting behavior when refactoring forms/auth/integrations.

## Definition of done

A change is not done merely because it compiles. It is done when:

- behavior is preserved or intentionally changed;
- desktop and mobile remain coherent;
- accessibility states still work;
- RO/EN architecture remains valid;
- protected regression checks pass;
- the current-head Cloudflare build succeeds;
- unrelated concurrent work was not overwritten.
