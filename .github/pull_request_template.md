## ZebraByte change checklist

- [ ] I read `AGENTS.md` and did not replace interactive behavior with a static approximation.
- [ ] Desktop and mobile behavior remain intentional and aligned.
- [ ] `prefers-reduced-motion` is respected without disabling motion solely because the viewport is mobile.
- [ ] RO root paths and `/en` behavior/canonical links remain valid.
- [ ] I did not change `worker/main.ts` / Wrangler entrypoint architecture accidentally.
- [ ] I did not arbitrarily truncate a dynamic content collection.
- [ ] `npm run check:experience` passes.
- [ ] `npm run build` passes locally or the exact Cloudflare build failure has been reviewed.
- [ ] I checked the Cloudflare Workers Build for the current commit before considering deployment complete.
