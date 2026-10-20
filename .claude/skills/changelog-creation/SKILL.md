---
name: changelog-creation
description: Use when a change to source code needs a changelog entry, and before pushing any bug fix, feature, or behaviour change. Covers when an entry is required, which section it belongs in, how to write the title, and the link format.
---

## 1. Read the relevant files from `dev-docs/`

| File | Why |
|---|---|
| [`DOC-STANDARDS.md`](../../../dev-docs/DOC-STANDARDS.md#the-changelog) | Whether an entry is needed, which changelog and section, the bullet format, and how to write the text |
| [`DEFINITION-OF-DONE.md`](../../../dev-docs/DEFINITION-OF-DONE.md#order-of-operations) | Why the entry comes after the pull request, and where its number comes from |
| [`SENSITIVE-INFORMATION.md`](../../../dev-docs/SENSITIVE-INFORMATION.md) | What must never appear in the entry |

## 2. Work through them in order

1. Decide whether an entry is needed at all — the "No entry is needed" paragraph of [The changelog](../../../dev-docs/DOC-STANDARDS.md#the-changelog).
2. Open the pull request first, if it is not open yet — skill `pr-creation`, and steps 3–5 of the [order of operations](../../../dev-docs/DEFINITION-OF-DONE.md#order-of-operations).
3. Write the bullet as [The changelog](../../../dev-docs/DOC-STANDARDS.md#the-changelog) describes, and check it against [`SENSITIVE-INFORMATION.md`](../../../dev-docs/SENSITIVE-INFORMATION.md).
4. Push it to the same branch.
