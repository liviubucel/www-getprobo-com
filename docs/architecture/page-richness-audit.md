# ZebraByte page richness audit

## Non-destructive rule

This audit exists to enrich ZebraByte-owned pages without shrinking, hiding, redirecting, or redesigning inherited Probo product surfaces.

Golden rule:

> Preserve -> protect -> learn from -> enrich adjacent ZebraByte pages.

Never use this audit to delete inherited pages, remove inherited product detail, replace a rich Probo composition with a generic landing-page template, or hide content behind redirects.

## Probo is the visual ceiling

For ZebraByte-owned additions, the Probo website is not merely loose inspiration. Its visual grammar is the design ceiling and default source of truth.

Before inventing a new presentation pattern, inspect the inherited baseline and, where useful, the upstream `getprobo/probo.com` `v2` implementation. Prefer an existing Probo composition or component vocabulary whenever it can express the content well.

A ZebraByte page may combine Probo patterns in a new way and may introduce ZebraByte-specific content, but it must still feel like a native extension of the same product family.

### Preferred Probo-native vocabulary

Use the existing design language before inventing replacements:

- animated hero patterns already used by Probo;
- `Badges` / framework badges where the subject genuinely calls for them;
- `ComplianceTrack` for compliance journeys;
- `SaleArg` for substantial product explanations with meaningful media;
- `Stories`, `Testimonials`, sliders and inherited proof/reference patterns;
- Hub-style long-form editorial sections, tables and bordered rows;
- real Lottie interactions, product screenshots and existing product assets;
- spacious text/media splits;
- simple FAQs and restrained CTAs.

### Anti-AI-slop rule

Do not create decorative product UI merely to make a page look richer.

In particular, avoid:

- fake SaaS dashboards or fabricated application screens;
- invented status panels, KPI tiles, progress widgets or posture cards that do not correspond to a real product surface;
- repeated walls of `rounded-2xl border` cards when a Probo editorial/table/row pattern would communicate the same information better;
- status pills such as `Enabled`, `Reviewed`, `Monitoring`, or similar labels used only as decoration;
- unrelated inherited videos or screenshots reused simply to fill space;
- new visual systems that compete with Probo typography, spacing, radius, borders, motion or density;
- adding visual complexity solely because a page needs to become longer.

If a real product interface exists, use its real component/asset or a truthful representation grounded in the implemented product. If no real product visual exists, prefer clear editorial structure over fabricated UI.

**Content richness is not UI density.** A page becomes rich through useful explanation, workflows, evidence, examples, limitations, integrations, real visuals, reference cases and strong information architecture.

## Classification

- **KEEP / PROTECTED** — rich inherited or already excellent page. Preserve structure and visual rhythm. Only fix copy, branding, accessibility, responsiveness, or clear defects.
- **POLISH** — strong page that needs small visual/editorial improvements, not a rebuild.
- **ENRICH** — good foundation but too short/repetitive. Preserve existing good sections and build substantial new product/storytelling sections around them.
- **REBUILD AROUND EXISTING** — weak composition, but useful copy/sections exist. Keep those useful parts and rebuild the surrounding experience using the Probo design language.

## Golden references

The following surfaces are reference quality and must not be simplified:

- `/compliance-portal` — canonical rich Trust Center / Compliance Portal experience, sourced from `src/pages/products/compliance-portal.astro`.
- Rich inherited Hub, Docs, Changelog, Stories, comparison pages, workflows, Lottie interactions, product screenshots, and visual primitives.
- Upstream `getprobo/probo.com` `v2` is a useful reference for native component composition when a ZebraByte-owned page needs a new arrangement.

The goal is not to copy one golden page everywhere. Reuse the design language and component vocabulary while giving each product its own content structure and story.

## Page design requirements

A flagship product/service page should usually answer:

1. What is this?
2. What problem does it solve?
3. What does the workflow look like?
4. What exactly is included?
5. What does the product/service look like in practice?
6. What is automated vs human-operated?
7. How does it connect to the rest of ZebraByte?
8. What outcomes/deliverables should the customer expect?
9. What trust, security, privacy, scope, or limitation details matter?
10. What should the visitor do next?

Richness must come from product explanation, workflows, diagrams, examples, integrations, reference cases, FAQ, and differentiated real visuals — not from filler text or decorative UI.

## Visual repetition guardrails

- Do not use the same hero composition, generic card grid, image, or keyshot video across every page.
- Do not repeat one section pattern more than necessary on the same page.
- Prefer existing Probo-native editorial rows, tables, text/media splits, real product assets and interactions over new decorative containers.
- Page-specific diagrams or mock product views are acceptable only when they are grounded in a real implemented product/workflow rather than invented for decoration.
- Existing beautiful sections stay. Build around them rather than replacing them for consistency.
- Keep mobile quality equal to desktop quality.

## First-wave classification and outcome

### Compliance

| Route | Classification | Outcome |
|---|---|---|
| `/compliance-portal` | KEEP / PROTECTED | Golden inherited Trust Center experience. Left structurally untouched. |
| `/compliance-platform` | POLISH / KEEP | Strong ZebraByte product page. Reviewed and deliberately left intact rather than redesigned. |
| `/managed-compliance` | ENRICH | Enriched, then corrected to Probo-native hero, ComplianceTrack, SaleArg, proof/reference blocks, rows and FAQ. |
| `/soc2` | ENRICH | Enriched with Trust Services Criteria, Type I/II, readiness, roles, Trust Center, Stories and FAQ using Hub/Probo-native presentation. |
| `/iso-27001` | ENRICH | Enriched with clauses 4–10, Annex A, risk lifecycle, certification journey, Trust Center, Stories and FAQ using Probo-native presentation. |
| `/gdpr` | ENRICH | Enriched around the inherited privacy-management model: data records, RoPA, DPIA/TIA, rights requests, third parties and security measures. |
| `/nis2` | ENRICH | Enriched with risk measures, governance, incident readiness, supply chain, security controls and Romanian legal context. |

### Cyber Security

| Route | Classification | Outcome |
|---|---|---|
| `/cyber-security` | ENRICH | Rebuilt around Probo-native rows, lifecycle, engagement models, compliance links, ZebraByte reviews and FAQ. |
| `/security-assessment` | ENRICH | Enriched with methodology, finding anatomy, authorization boundaries, deliverables, remediation handoff, reviews and FAQ. |
| `/website-security` | ENRICH | Removed unrelated compliance keyshots; added security layers, controls, threat model, workloads, operating modes, reviews and FAQ. |
| `/email-security` | ENRICH | Removed decorative status dashboard; added sender/SPF/DKIM/DMARC rollout, identity/BEC, provider workflows, monitoring and FAQ. |
| `/incident-response` | ENRICH | Added incident lifecycle, evidence handling, roles, recovery criteria, outputs, reviews and FAQ without card-wall UI. |
| `/secure-hosting` | ENRICH / POLISH | Removed unrelated compliance keyshots; retained migration strengths and added layers, responsibilities, operations, decision path, reviews and FAQ. |

### Other strong surfaces

- Accessibility is already visually/content-rich relative to most ZebraByte additions; review first and default to **KEEP/POLISH**, not rebuild.
- Inherited Probo pages remain protected even when their copy is adapted to ZebraByte Cloud/SaaS or neutral reference-case positioning.

## Validation discipline

Each page is validated independently before moving to the next one. No enrichment batch may remove or redirect an inherited Probo surface.

A page is not considered complete merely because it is long or because CI passes. It must also:

- look like a native Probo-family surface;
- avoid fabricated product UI;
- preserve truthful provenance;
- retain useful existing ZebraByte content;
- remain coherent on mobile;
- explain the product/service more deeply than the previous version without adding filler.
