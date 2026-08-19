# ZebraByte agent entry point

Read `AGENTS.md` before making any change in this repository. `AGENTS.md` is the authoritative engineering contract.

Mandatory precedence:

1. the user's explicit current request;
2. the current `origin/main` implementation;
3. current ZebraByte architecture/security/localization contracts;
4. the original Probo project as a historical product/design reference;
5. historical ZebraByte branches, PRs and commits.

Do not restore an older design, component, layout or implementation merely because it existed in Probo or in repository history. A difference from history is not automatically a regression.

Before editing, fetch current `origin/main` and verify the working branch contains that exact current-main history. If the branch is stale, update/recreate it before doing work.

For content-only, translation, SEO, backend, API or security work, do not redesign unrelated current-main UI. Keep changes scoped to the user's request and inspect the final diff for unrelated changes.

Probo remains available and valuable as a reference. It does not override an intentional current-main ZebraByte implementation.
