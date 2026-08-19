# Current-main authority

This file summarizes the repository working rule enforced by `AGENTS.md` and CI.

- Current `origin/main` is the authoritative ZebraByte implementation.
- Probo remains a historical product/design reference and does not automatically override current ZebraByte.
- Historical ZebraByte branches, pull requests and commits are never valid starting points for new work unless the user explicitly requests a history operation.
- New work must start from a branch that contains current `main`.
- Content, backend, API, security and translation changes must not redesign unrelated current-main UI.
- A difference from Probo or old repository history is not itself a regression.
