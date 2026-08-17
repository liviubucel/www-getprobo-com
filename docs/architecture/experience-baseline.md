# ZebraByte experience baseline

## Golden design reference

The imported Probo snapshot at commit `7e7e7b5c18c621aae125488342a215a641c830b9` is the golden reference for inherited visual language and interaction behavior.

It is a **design and behavior reference, not a content authority**.

Use it to answer questions such as:

- Was this section originally a carousel, progressive interaction, animated badge or static block?
- What were the original spacing, proportions, hierarchy, responsive behavior and motion semantics?
- Was a replacement component introduced later that materially changed the inherited experience?

Do not use it as authority for ZebraByte customer names, staff identities, company claims, legal statements, public links or current product architecture.

## Audit classification

Every meaningful difference from the golden reference must be classified before it is restored or removed:

1. **Intentional ZebraByte adaptation** — ZebraByte content/IA changed while inherited interaction quality remains coherent. Keep and protect it.
2. **Safe optimization** — runtime work was reduced without changing the visible/interactive contract. Keep and protect it.
3. **Experience regression** — inherited layout, motion, slider behavior, responsive behavior or interaction was removed/simplified without a product requirement. Restore or rebuild it.
4. **Invalid inherited content** — inherited Probo identity, people, customers, testimonials, claims or assets would imply a ZebraByte relationship that is not sourced. Preserve the design pattern but replace/remove the invalid content.

## Content provenance rules

- Never rename a Probo team photograph, person, customer, testimonial or company logo so it appears to belong to ZebraByte.
- Never present Probo customer logos as ZebraByte social proof unless a separate ZebraByte source establishes that relationship.
- The inherited homepage logo marquee may retain its original company/logo set only as a clearly neutral **reference library**. Its surrounding copy must not call those organizations ZebraByte customers, partners, users or endorsements.
- Never fabricate people, portraits, reviews, certifications, customers, partnerships or metrics to fill an inherited layout.
- Real ZebraByte reviews may be migrated from ZebraByte-owned source repositories when the text/source can be traced.
- Imported Probo authors may remain attached to articles that explicitly attribute those authors, but they must not be described as ZebraByte staff.
- Framework badges identify frameworks; they are not certification claims about ZebraByte.
- Product/release links must follow the current ZebraByte runtime and release architecture, not the upstream Probo repository merely because the original page did so.

## Current deliberate deviations from the Probo snapshot

### About

The Probo snapshot uses a Probo team photograph, named Probo people and a Probo-specific photo gallery. Those assets are not valid ZebraByte identity. ZebraByte keeps the inherited large visual rhythm and two-tier team/capability geometry without presenting those people or photographs as ZebraByte.

The ZebraByte wordmark asset is `public/images/zbt-negru.svg`, whose intrinsic viewBox ratio is `3242 × 1166`. When rendered as an image, preserve that ratio; do not substitute arbitrary width/height attributes that distort the wordmark.

### Reference logo marquee

The inherited auto-scrolling logo strip is part of the original visual language and remains protected. Keep the original SVG/logo set and the `LogosScroll.svelte` AutoScroll behavior unless there is an explicit product decision to replace the strip.

Because those organizations are not established here as ZebraByte customers, the homepage must frame the strip neutrally as **„Organizații din biblioteca de referință a platformei”** (or an equivalent non-customer reference label). Do not relabel it as „Trusted by”, „Clienți ZebraByte”, „Parteneri” or another unsupported relationship claim.

Do not replace the logo strip with service-name pills or generic capability icons merely to avoid this distinction; that changes the inherited visual composition.

### Customer reviews

Only ZebraByte-sourced review content may be presented as ZebraByte customer feedback. The review wall filters for ZebraByte-owned entries and must not be padded with the inherited Probo logo strip.

The public ZebraByte review set is pinned in `docs/architecture/wall-provenance.json` to the ZebraByte-owned source repository and source commit. Customer quote text must remain **verbatim**. Do not correct grammar, punctuation, spelling, capitalization or wording. A new `zebrabyte-*.mdx` wall entry is not public-proof-safe merely because its filename has the prefix; it must be added to the provenance manifest with a verified source. Do not invent follower, like or comment counts for customer reviews.

When a source platform is known, the card must identify that platform accurately. A Trustpilot review must not inherit a LinkedIn glyph merely because the original Probo wall component was designed for LinkedIn posts.

### Brand assets

The structure of the inherited brand page may be preserved, but public downloads and previews must use ZebraByte assets. Do not restore Probo logos as ZebraByte brand assets.

### Careers

Inherited role profiles may be retained as a clearly labeled role library, but they must not be presented as currently open ZebraByte vacancies without a ZebraByte source of truth.

### Article attribution

Probo authors may be shown only for imported material that explicitly carries their attribution. Default/new ZebraByte editorial material must not inherit Probo people by default.

### Generated ZebraByte landing pages

New ZebraByte industry, service, legacy and contact surfaces may add content that did not exist in the Probo snapshot, but their chrome must remain consistent with the inherited visual system.

Prefer continuous structures for repeated peer items:

- `divide-y` / `border-y` for editorial lists and outcomes;
- one framed `gap-px` grid with `bg-border` separators for peer cards/links;
- free layout and whitespace where content does not require a container.

Avoid turning every paragraph, outcome, contact method or related link into its own floating `rounded-xl border p-6` card. A single form, media frame, interactive surface or intentional framed grid can still use rounded/bordered chrome. The rule is about repeated independent card shells, not a global ban on borders or rounded corners.

This keeps new ZebraByte content compatible with Probo's calmer hierarchy while preserving first-party forms, current service architecture, security controls and SEO.

## Change procedure

Before changing an inherited surface:

1. compare the current file with the golden commit;
2. identify whether the difference is design, behavior, content, runtime architecture or a combination;
3. classify it using the four categories above;
4. preserve valid ZebraByte content and current runtime/security architecture;
5. restore inherited experience only where it is actually the intended design language;
6. add a deterministic guard when the regression class can be tested;
7. verify desktop, mobile, keyboard, reduced-motion, RO/EN and the current-head Cloudflare Workers Build.

The goal is not pixel-for-pixel historical restoration. The goal is a ZebraByte site whose content is truthful and current while the strongest inherited Probo interaction/design qualities remain intact and cannot silently regress.
