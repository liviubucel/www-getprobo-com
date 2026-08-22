# ZebraByte Sanity migration seeds

These files are one-time migration sources for the current ZebraByte website and are intentionally kept separate from the runtime CMS adapter.

- `site-settings.mjs` — global site settings
- `navigation.mjs` — header mega-menu and footer
- `homepage.mjs` — current homepage mapped into CMS sections
- `content-v1.mjs` — versioned migration batch
- `helpers.mjs` — deterministic localized/link/Portable Text builders

The canonical website remains the reference until each migrated draft passes staging and visual/SEO parity. Do not use these files as a replacement runtime content source.

The mutation runner converts canonical IDs to `drafts.*` only at write time. Publishing is deliberately excluded from the migration tool.
