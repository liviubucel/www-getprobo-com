# ZebraByte page richness audit

## Non-destructive rule

This audit exists to enrich ZebraByte-owned pages without shrinking, hiding, redirecting, or redesigning inherited Probo product surfaces.

Golden rule:

> Preserve -> protect -> learn from -> enrich adjacent ZebraByte pages.

Never use this audit to delete inherited pages, remove inherited product detail, replace a rich Probo composition with a generic landing-page template, or hide content behind redirects.

## Classification

- **KEEP / PROTECTED** — rich inherited or already excellent page. Preserve structure and visual rhythm. Only fix copy, branding, accessibility, responsiveness, or clear defects.
- **POLISH** — strong page that needs small visual/editorial improvements, not a rebuild.
- **ENRICH** — good foundation but too short/repetitive. Preserve existing good sections and build substantial new product/storytelling sections around them.
- **REBUILD AROUND EXISTING** — weak composition, but useful copy/sections exist. Keep those useful parts and rebuild the surrounding experience using the Probo design language.

## Golden references

The following surfaces are reference quality and must not be simplified:

- `/compliance-portal` — canonical rich Trust Center / Compliance Portal experience, sourced from `src/pages/products/compliance-portal.astro`.
- Rich inherited Hub, Docs, Changelog, Stories, comparison pages, workflows, Lottie interactions, product screenshots, and visual primitives.

The goal is not to copy one golden page everywhere. Reuse the design language and component vocabulary while giving each product its own composition and visual story.

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

Richness must come from product explanation, workflows, diagrams, examples, integrations, reference cases, FAQ, and differentiated visuals — not from filler text.

## Visual repetition guardrails

- Do not use the same hero composition, generic card grid, image, or keyshot video across every page.
- Do not repeat one section pattern more than necessary on the same page.
- Prefer page-specific diagrams, workflows, mock product UI, architecture views, timelines, before/after states, and realistic deliverable examples.
- Existing beautiful sections stay. Build around them rather than replacing them for consistency.
- Keep mobile quality equal to desktop quality.

## First-wave classification

### Compliance

| Route | Classification | Notes |
|---|---|---|
| `/compliance-portal` | KEEP / PROTECTED | Golden inherited Trust Center experience. Do not redesign or simplify. |
| `/compliance-platform` | POLISH + ENRICH | Strong new foundation and product mockup. Add depth selectively without losing its current composition. |
| `/managed-compliance` | ENRICH | Strategically important but currently too short and dependent on generic SaleArg/video blocks. |
| `/soc2` | ENRICH | Good core message; needs deeper workflow, evidence, audit, roles, FAQ, and product views. |
| `/iso-27001` | ENRICH | Good factual foundation; needs richer ISMS workflow, SoA/risk/evidence visualisation, audit journey, FAQ. |
| `/gdpr` | ENRICH | Needs richer privacy operations, RoPA/DPIA/vendor/data-rights workflows and product visuals. |
| `/nis2` | ENRICH | Needs richer operational/security workflow, incident readiness, supply-chain, resilience, evidence and role views. |

### Cyber Security

| Route | Classification | Notes |
|---|---|---|
| `/cyber-security` | ENRICH | Strong positioning but too template-like; needs a differentiated security operating model and richer visuals. |
| `/security-assessment` | ENRICH | Preserve current scope/report sections, add attack-surface view, sample finding, methodology, authorization/scope, FAQ and remediation handoff. |
| `/website-security` | ENRICH | Needs a page-specific edge/WAF/origin story, threat flows, monitoring/recovery views and less reused keyshot media. |
| `/email-security` | ENRICH | Needs identity/domain architecture, DMARC rollout visual, BEC scenario flow, provider/integration views and monitoring story. |
| `/incident-response` | ENRICH | Needs incident timeline, evidence/containment/recovery workflow, roles, communications, post-incident outputs and FAQ. |
| `/secure-hosting` | ENRICH / POLISH after review | Preserve anything already strong; enrich with architecture, isolation, backup/recovery, operations and security-control views. |

### Other strong surfaces

- Accessibility is already visually/content-rich relative to most ZebraByte additions; review first and default to **KEEP/POLISH**, not rebuild.
- Inherited Probo pages remain protected even when their copy is adapted to ZebraByte Cloud/SaaS or neutral reference-case positioning.

## Work order

1. Managed Compliance
2. Compliance Platform
3. SOC 2
4. ISO/IEC 27001
5. GDPR
6. NIS2
7. Cyber Security overview
8. Security Assessment
9. Website Security
10. Email Security
11. Incident Response
12. Secure Hosting

Each page is validated independently before moving to the next one. No enrichment batch may remove or redirect an inherited Probo surface.