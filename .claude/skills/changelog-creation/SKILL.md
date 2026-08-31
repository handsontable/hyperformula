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

The entry carries a link, so it needs the number. Do not guess it — read it from the URL. Skill `pr-creation`.

## 4. Write the bullet

Under `## [Unreleased]` in `CHANGELOG.md`, in the section that matches the change, creating the `### ` heading if it is absent. Link the public issue where one exists; otherwise the pull request.

## 5. Re-read it as a user would

If it names a class, a file, or an internal identifier, rewrite it. Check it carries nothing sensitive — no client, customer, or partner names, and nothing that identifies them indirectly. See [`AGENTS.md`](../../../AGENTS.md#never-publish-sensitive-information).

## 6. Push it to the same branch

So the open pull request picks it up.
