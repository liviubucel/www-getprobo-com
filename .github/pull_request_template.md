## ZebraByte change checklist

- [ ] This branch was created from, rebased onto, or otherwise contains the current `main` baseline.
- [ ] I read `AGENTS.md` and treated current `main` as authoritative over historical branches, PRs and Probo reference code.
- [ ] I did not restore an older design or implementation merely because it existed in repository history.
- [ ] The diff is limited to the requested scope; content/backend work did not redesign unrelated UI.
- [ ] I did not replace interactive behavior with a static approximation.
- [ ] Desktop and mobile behavior remain intentional and aligned.
- [ ] `prefers-reduced-motion` is respected without disabling motion solely because the viewport is mobile.
- [ ] RO root paths and `/en` behavior/canonical links remain valid.
- [ ] I did not change `worker/main.ts` / Wrangler entrypoint architecture accidentally.
- [ ] I did not arbitrarily truncate a dynamic content collection.
- [ ] `npm run check:experience` passes.
- [ ] `npm run build` passes locally or the exact Cloudflare build failure has been reviewed.
- [ ] I checked the Cloudflare Workers Build for the current commit before considering deployment complete.
