---
name: changelog-creation
description: Use when a change to source code needs a changelog entry, and before pushing any bug fix, feature, or behaviour change. Covers when an entry is required, which section it belongs in, how to write the title, and the link format.
---

Which section to use, the bullet format, and how to write the text are in [`DOC-STANDARDS.md`](../../../dev-docs/DOC-STANDARDS.md#the-changelog). This skill is the sequence.

## Sequence

1. **Decide whether an entry is required at all.** Documentation-only, test-only, and CI or tooling changes take none, and neither does a bug that was introduced and never released.
2. **Open the pull request first.** The entry carries a link, so it needs the number. Do not guess it — read it from the URL. See skill `pr-creation`.
3. **Write the bullet** under `## [Unreleased]` in `CHANGELOG.md`, in the section that matches the change, creating the `### ` heading if it is absent.
4. **Link the public issue** where one exists; otherwise the pull request.
5. **Re-read it as a user would.** If it names a class, a file, or an internal identifier, rewrite it.
6. **Check it carries nothing sensitive** — no client, customer, or partner names, and nothing that identifies them indirectly. See [`AGENTS.md`](../../../AGENTS.md#never-publish-sensitive-information).
7. **Commit and push to the same branch**, so the open pull request picks it up.
