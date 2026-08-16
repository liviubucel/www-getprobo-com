# Contributing to the ZebraByte website

Read `AGENTS.md` before changing the website. It defines the experience and architecture that must survive refactors and performance work.

## Local development

Use Node.js 24 and install the locked dependencies:

```bash
npm ci
npm run dev
```

The local site is available at `http://localhost:4321`.

## Product and design lineage

This repository is the ZebraByte website. It was adapted from the Probo website and deliberately retains parts of that design system and interaction model. Do not treat inherited interactive components as disposable scaffolding.

If a refactor changes a component from animated/interactive to static, changes mobile behavior, removes a loading state, alters keyboard behavior or reduces a content collection, consider that a product change rather than a neutral optimization.

## Language architecture

Romanian is canonical on root paths and English is served under `/en` by the Cloudflare localization architecture. New routes, links and copy must remain compatible with both languages, canonical/hreflang output and localized sitemaps.

## Documentation

Documentation pages live in `src/content/docs/docs/`. Every MDX file must include a `title` and `description` in its frontmatter.

- Write for a reader with a specific goal.
- Use ZebraByte public terminology and positioning.
- When documentation describes inherited Probo-backed product behavior, verify technical behavior against the supported upstream product/schema rather than making marketing assumptions.
- State limitations and security implications where they affect a reader's decision.
- Do not promise legal compliance or describe a generated/inferred result as authoritative.
- Use realistic examples without real customer data or secrets.
- Add navigable pages to the existing docs navigation/sidebar configuration.
- Use root-relative links; the localization layer handles the English path architecture.
- Prefer Starlight components over unnecessary custom markup.

## Quality checks

For code, layout, interaction or runtime changes run:

```bash
npm run check:experience
npm run build
```

For documentation changes also run:

```bash
npm run check:docs
```

Formatting:

```bash
npm run format
```

`npm run build` is intentionally strict. It includes blog/content migration checks, performance-asset checks, the ZebraByte experience contract, Astro build, localized sitemap generation and i18n validation.

Do not remove or weaken a checker simply because it blocks a refactor. If the product requirement intentionally changes, update implementation and the relevant contract/check together.

## Interactive components

Before modifying a slider, Lottie badge, video, custom element, navigation/menu or animated section:

1. inspect its current behavior on desktop and mobile;
2. inspect its history if the intent is unclear;
3. retain hover/focus/keyboard states;
4. retain `prefers-reduced-motion` support;
5. optimize lifecycle/loading rather than deleting behavior;
6. add or preserve a deterministic contract assertion for known regressions.

## Cloudflare runtime

The Worker entrypoint is `worker/main.ts`, which delegates normal traffic to `worker/router.ts` after first-party runtime handlers. Do not point Wrangler directly at the router to satisfy stale examples or checks.

Commits to `main` are built by Cloudflare Workers Builds. For deployment status, use the Cloudflare Workers Build attached to the exact current `main` SHA as the source of truth.

## Generated developer reference

Where the exhaustive inherited product reference is generated from a local Probo checkout:

```bash
npm run docs:generate
npm run docs:check-reference
```

Set `PROBO_REPO_PATH` if the upstream checkout is not at the generator's default location. Commit generated MDX and do not hand-edit files marked as generated.

## Concurrent work

Multiple agents may be active. Fetch current `main` and the current blob before writing. Never overwrite unrelated recent changes simply to make your patch easier to apply.
