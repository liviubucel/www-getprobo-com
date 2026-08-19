# ZebraByte Experience Contract

This file is the authoritative engineering contract for AI coding assistants and human contributors working in this repository. Read it before editing the site.

## Authority order — mandatory

When two sources disagree, use this order of precedence:

1. **The user's explicit current request.**
2. **The current `origin/main` implementation at the time the work starts.**
3. **Current ZebraByte architecture, security, localization and product contracts.**
4. **The original Probo implementation as a product/design reference.**
5. **Historical ZebraByte branches, pull requests and commits.**

The current `main` branch is the operational and visual source of truth for ZebraByte. A difference between current ZebraByte and Probo, an old branch, an old PR or an old commit is **not** by itself a regression.

Never restore, replace or redesign current ZebraByte code merely because an older implementation looked different. Historical code may be inspected to understand intent, recover a specifically requested capability, or diagnose a proven regression, but it must not override a deliberate current-main implementation.

## Fresh-base rule — mandatory before editing

Before making any change:

1. Fetch the current `origin/main` SHA.
2. Confirm the working branch contains that current `main` SHA.
3. If it does not, stop and rebase/recreate the branch from current `main` before editing.
4. Fetch the exact current version of every file before replacing it.
5. Do not base new work on an old PR branch, release branch, backup branch or remembered commit.

Do not use a wholesale revert, old branch merge or broad cherry-pick as a shortcut for a focused change unless the user explicitly requests that exact history operation.

## Scope discipline — do not redesign unrelated surfaces

Match the scope of the change to the user's request.

- A copy/content/translation/SEO change must not change layout, spacing, CSS, component hierarchy, animation or interaction unless explicitly required.
- A backend/API/security fix must not redesign the frontend unless the frontend change is required for the requested behavior.
- A form behavior change must preserve the current page design unless the user explicitly asks for a visual redesign.
- A design change must not silently rewrite unrelated content, routing, runtime architecture or security controls.
- Do not "clean up" neighboring files simply because they look old or could be refactored.

Before finishing, inspect the diff and ask: **did this change touch anything the user did not ask to change?** If yes, revert the unrelated part.

## What this repository is

This is the ZebraByte public website, documentation surface and Cloudflare runtime. It was adapted from the Probo codebase and intentionally keeps useful inherited product depth while adding ZebraByte-specific cybersecurity, compliance, accessibility, hosting, localization, legal and runtime capabilities.

**Probo is not the public brand. ZebraByte is.** Public-facing Probo naming, domains, first-person product claims and identity must be rebranded appropriately. Do not delete useful inherited product content merely because it originated from Probo.

Production identity: `https://www.zebrabyte.ro`.

Primary language architecture:

- Romanian is canonical at root paths such as `/`, `/blog`, `/docs`.
- English is served under `/en`, such as `/en`, `/en/blog`, `/en/docs`.
- The Cloudflare localization layer is part of the product architecture. Do not build a competing localization system without an explicit architectural decision.

## Probo reference rule

The original Probo project remains a valuable **historical product/design reference**. It is useful for understanding inherited interaction quality, content breadth, component intent and features that ZebraByte may intentionally retain.

However:

- current `main` always wins when it intentionally differs from Probo;
- do not automatically restore a Probo layout or component because current ZebraByte is different;
- consult Probo when the user asks for comparison/restoration, when a current-main feature is demonstrably broken, or when understanding inherited behavior is necessary;
- preserve useful Probo-originated product depth, but keep public ZebraByte identity and truthful relationship framing;
- never present Probo people, customers, testimonials or partnerships as ZebraByte relationships without an independent ZebraByte source.

The imported Probo snapshot at commit `7e7e7b5c18c621aae125488342a215a641c830b9` remains available as a design and behavior reference, not a content authority and not an automatic restore target. `docs/architecture/experience-baseline.md` documents inherited provenance and deliberate adaptations. This reference is subordinate to the current-main authority rule above.

## Preserve current experience

For existing current-main surfaces, preserve the visible and interactive contract unless the user intentionally changes it. That includes:

- layout and spacing rhythm;
- animation and motion;
- carousel/slider behavior;
- hover, focus, keyboard and pointer states;
- mobile behavior;
- progressive/viewport-triggered states;
- media posters and loading states;
- typography;
- accessibility behavior;
- Astro `ClientRouter` / view-transition behavior.

A build that compiles while silently making an interactive component static is a regression.

Do not replace Splide/Embla carousels with plain overflow scrolling, Lottie experiences with static assets, animated/progressive components with static markup, or full collections with arbitrary subsets solely for performance convenience.

Respect `prefers-reduced-motion: reduce`. Mobile viewport size alone is not a reason to disable intended motion.

## Protected current-main invariants

`npm run check:experience` is part of `npm run build`. Protected behavior currently includes, among other things:

- animated homepage hero and framework experiences;
- moving testimonial/logo surfaces where currently used;
- interactive case-study sliders;
- compliance journey progression;
- meaningful product-video poster/loading states;
- current global typography and layout treatment;
- current header, desktop mega-menu and mobile navigation behavior;
- keyboard, focus and Escape semantics;
- current truthful customer/review provenance;
- inherited Hub/blog/docs/product breadth that remains part of current ZebraByte.

If the user intentionally changes one of these product decisions, update the implementation and relevant regression check together. Do not weaken a checker merely to hide an accidental regression.

## Cloudflare runtime architecture

The Worker entrypoint is intentionally:

```text
worker/main.ts
```

`worker/main.ts` owns first-party server/runtime concerns and delegates normal site traffic to the router. Do not point Wrangler directly at `worker/router.ts` because an old note, branch or upstream example does so.

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

Before changing `ZebraByteStatus.svelte`, `/api/status`, `STATUS_ENGINE`, `worker/public-status.ts`, the status Service Binding or related copy, read `docs/architecture/footer-status.md`.

The private `STATUS_ENGINE -> status-page / FooterStatusEntrypoint` binding is primary. Public HTTP is a bounded resilience/backwards-compatibility fallback, not a replacement architecture. Do not expose private source/provider implementation details in the public status badge.

## Content and provenance

Preserve useful inherited product content and ZebraByte additions. Rebrand or paraphrase legacy public identity rather than deleting valuable coverage.

Do not fabricate or falsely relabel:

- people or team members;
- customers or testimonials;
- certifications;
- partnerships;
- metrics or social proof.

Current ZebraByte reviews and relationship-sensitive content must remain grounded in their documented sources.

## i18n rules

- Root is Romanian; `/en` is English.
- Internal English links remain under `/en`.
- Preserve canonical and `hreflang` generation.
- New public copy must participate in the bilingual architecture.
- Legacy `/ro` or old Wix/Odoo paths may exist only as compatibility redirects where required.
- Do not break localized sitemap parity.

## Security

- Never commit production secrets.
- Keep Turnstile validation server-side where required.
- Do not weaken CSP/security headers simply to make an integration render.
- Do not expose internal endpoints, source-system details or private infrastructure implementation unless the product explicitly requires it.
- Preserve validation, rate limiting and anti-abuse controls when refactoring forms, auth or integrations.

## Required validation

For site/runtime changes, at minimum run:

```bash
npm run check:experience
npm run build
```

Where applicable also validate the Worker bundle with:

```bash
npx wrangler deploy --dry-run
```

A successful local compile is not proof of deployment. The authoritative production deployment signal is the **Cloudflare Workers Build** for the exact current production SHA.

Do not report a deployment as successful until the current-head Cloudflare Workers Build has completed successfully.

## Definition of done

A change is done only when:

- it started from the current `main` baseline;
- the diff is limited to the requested scope;
- unrelated current-main design/content/runtime behavior was not overwritten;
- useful product functionality and content remain intact unless explicitly changed;
- public ZebraByte identity and provenance remain truthful;
- desktop and mobile remain coherent;
- accessibility states still work;
- RO/EN architecture remains valid;
- security controls remain intact;
- protected regression checks pass;
- the relevant current-head deployment/build signal has been verified.
