# ZebraByte experience baseline

## Golden design reference

The imported Probo snapshot at commit `7e7e7b5c18c621aae125488342a215a641c830b9` is the golden reference for inherited visual language, interaction behavior and product-content breadth.

It is a **design/behavior and inherited product-content reference, not authority for ZebraByte relationship claims**.

Use it to answer questions such as:

- Was this section originally a carousel, progressive interaction, animated badge or static block?
- What were the original spacing, proportions, hierarchy, responsive behavior and motion semantics?
- Was a replacement component introduced later that materially changed the inherited experience?
- Is a Probo page, feature, article, documentation surface, case study or resource missing from ZebraByte?

Do not use it as authority to state that a Probo customer, staff member, investor or partner has the same relationship with ZebraByte. Preserve the underlying product/editorial surface and adapt the relationship framing instead of deleting it.

## Audit classification

Every meaningful difference from the golden reference must be classified before it is changed:

1. **Inherited valuable product content** — preserve it completely, then rebrand/paraphrase public copy for ZebraByte.
2. **Intentional ZebraByte adaptation** — ZebraByte content/IA changed while inherited product depth and interaction quality remain coherent. Keep and protect it.
3. **Safe optimization** — runtime work was reduced without changing the visible/interactive/content contract. Keep and protect it.
4. **Experience/content regression** — inherited page coverage, layout, motion, slider behavior, responsive behavior, product detail or interaction was removed/simplified without a product requirement. Restore or rebuild it.
5. **Relationship-sensitive inherited material** — Probo people, customers, testimonials or company-specific claims must not be falsely relabeled as ZebraByte relationships. **Keep the page, company example, design, result, lesson and useful content**, but frame it as a neutral reference case/insight until a ZebraByte-owned case replaces it.

## Content provenance rules

- Never rename a Probo team photograph, person, customer, testimonial or company logo so it appears to belong to ZebraByte.
- Never present Probo customer logos as ZebraByte customer proof unless a separate ZebraByte source establishes that relationship.
- **Do preserve inherited company examples, logos, case studies and testimonial surfaces** when they are clearly labeled as reference cases, reference companies or reference perspectives rather than ZebraByte endorsements.
- The inherited homepage logo marquee retains its original company/logo set as a neutral **reference library**. Its surrounding copy must not call those organizations ZebraByte customers, partners, users or endorsements.
- Do not fabricate people, portraits, reviews, certifications, customers, partnerships or metrics to fill an inherited layout.
- Real ZebraByte reviews may be migrated from ZebraByte-owned source repositories when the text/source can be traced.
- Imported Probo authors may remain attached to articles that explicitly attribute those authors, but they must not be described as ZebraByte staff.
- Framework badges identify frameworks; they are not certification claims about ZebraByte.
- Product/release links follow the current ZebraByte Cloud SaaS architecture. Historical source/deployment identifiers may remain inside clearly marked architecture/migration reference material.

## Current deliberate adaptations from the Probo snapshot

### About

The Probo snapshot uses a Probo team photograph, named Probo people and a Probo-specific photo gallery. ZebraByte must not relabel those people as its staff. The inherited visual rhythm and two-tier team/capability geometry remain protected and can be populated with truthful ZebraByte content.

The ZebraByte wordmark asset is `public/images/zbt-negru.svg`, whose intrinsic viewBox ratio is `3242 × 1166`. When rendered as an image, preserve that ratio; do not substitute arbitrary width/height attributes that distort the wordmark.

### Reference logo marquee

The inherited auto-scrolling logo strip is part of the original visual language and remains protected. Keep the original SVG/logo set and the `LogosScroll.svelte` AutoScroll behavior unless there is an explicit product decision to replace the strip.

Until those organizations become verified ZebraByte customers, frame the strip neutrally as **„Organizații din biblioteca de referință a platformei”** (or equivalent). Do not relabel it as „Trusted by”, „Clienți ZebraByte”, „Parteneri” or another unsupported relationship claim.

Do not replace the logo strip with service-name pills or generic capability icons merely to avoid this distinction; that changes the inherited visual composition.

### Customer reviews and reference insights

The wall and testimonial surfaces are intentionally **mixed provenance**:

- ZebraByte-sourced entries may be presented as ZebraByte customer feedback;
- inherited Probo customer/testimonial material remains visible as **Reference insight / Reference perspective** material;
- inherited companies must not be described as ZebraByte customers merely because the material appears on the ZebraByte site.

The inherited entries are not padding to be filtered away. They remain part of the product's reference library until ZebraByte accumulates enough first-party customer stories to replace them one by one.

The public ZebraByte review set is pinned in `docs/architecture/wall-provenance.json` to the ZebraByte-owned source repository and source commit. ZebraByte customer quote text must remain **verbatim**. Do not correct grammar, punctuation, spelling, capitalization or wording. A new `zebrabyte-*.mdx` wall entry is not public-proof-safe merely because its filename has the prefix; it must be added to the provenance manifest with a verified source. Do not invent follower, like or comment counts for ZebraByte customer reviews.

Inherited testimonial quotes may be converted to indirect editorial summaries when direct wording names Probo. Keep the person/company context and useful lesson, but label it as a reference perspective rather than altering the quote to say ZebraByte.

When a source platform is known, the card should identify that platform accurately. A Trustpilot review must not inherit a LinkedIn glyph merely because the original component was designed for LinkedIn posts.

### Case studies

Inherited company case studies are first-class public content and must remain available. Until ZebraByte has its own replacement case for a given slot:

- present the inherited story as a **Reference case study**;
- preserve the company, challenge, approach, result, framework, layout, imagery and practical lesson;
- do not claim the company hired or used ZebraByte unless independently verified;
- if an inherited video explicitly promotes or names Probo, retain the section with a static image/poster and an editorial reference-case narrative rather than deleting the story;
- replace reference cases gradually with ZebraByte-owned customer cases as they become available.

### Brand assets

The structure of the inherited brand page may be preserved, but current ZebraByte brand downloads and previews use ZebraByte assets. Historical Probo assets may remain only where they are genuinely required as reference/lineage material, not as ZebraByte logos.

### Careers

Inherited role profiles are retained as a clearly labeled role library. They must not be described as currently open ZebraByte vacancies without a ZebraByte source of truth.

### Article attribution

Probo authors may be shown for imported material that explicitly carries their attribution. Default/new ZebraByte editorial material must not inherit Probo people by default.

### Cloud SaaS versus open-source lineage

ZebraByte is delivered as **Cloud SaaS**, not as an open-source or customer-operated self-hosted distribution.

Do not delete inherited open-source, Docker, Kubernetes, deployment or contribution documentation. Reframe it as **platform lineage / architecture / migration reference** while current onboarding, product pages and navigation describe the supported ZebraByte Cloud model.

The cloud platform supports:

1. self-service use by companies;
2. professional/adviser use by lawyers, DPOs, GRC/compliance specialists and other professionals managing client work;
3. ZebraByte Managed Compliance for customers that want ZebraByte specialists to operate more of the program.

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
2. inventory whether any page/content/functionality is missing before simplifying anything;
3. classify the difference using the categories above;
4. preserve complete inherited product/content breadth and valid ZebraByte additions;
5. rebrand/paraphrase instead of deleting;
6. neutralize relationship-sensitive material rather than hiding the surrounding content;
7. add a deterministic guard when the regression class can be tested;
8. verify desktop, mobile, keyboard, reduced-motion, RO/EN and the current-head deployment build.

The goal is not a reduced ZebraByte site inspired by Probo. The goal is **the complete inherited Probo product/site surface, rebranded and extended as ZebraByte**, with truthful relationship framing and ZebraByte's Cloud SaaS, cybersecurity, hosting, accessibility and managed-service additions.