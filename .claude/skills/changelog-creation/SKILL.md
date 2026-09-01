---
name: changelog-creation
description: Use when a change to source code needs a changelog entry, and before pushing any bug fix, feature, or behaviour change. Covers when an entry is required, which section it belongs in, how to write the title, and the link format.
---

## 1. Read the relevant files from `dev-docs/`

| File | Why |
|---|---|
| [`DOC-STANDARDS.md`](../../../dev-docs/DOC-STANDARDS.md#the-changelog) | Which section to use, the bullet format, and how to write the text |
| [`PULL-REQUESTS.md`](../../../dev-docs/PULL-REQUESTS.md#order-of-operations) | Why the entry comes after the pull request, not before |

## 2. Decide whether an entry is required at all

Documentation-only, test-only, and CI or tooling changes take none, and neither does a bug that was introduced and never released.

## 3. Open the pull request first

**Every entry ends with a GitHub link**: the public issue it fixes when one exists, otherwise the pull request. So the entry needs a number that only exists once the pull request is open. Do not guess it — read it from the URL `gh pr create` prints. Skill `pr-creation`.

## 4. Write the bullet

Under `## [Unreleased]` in `CHANGELOG.md`, in the section that matches the change, creating the `### ` heading if it is absent. End it with the link from step 3.

## 5. Re-read it as a user would

If it names a class, a file, or an internal identifier, rewrite it. Check it carries nothing sensitive — no client, customer, or partner names, and nothing that identifies them indirectly. See [`AGENTS.md`](../../../AGENTS.md#never-publish-sensitive-information).

## 6. Push it to the same branch

So the open pull request picks it up.
