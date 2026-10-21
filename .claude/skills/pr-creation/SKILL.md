---
name: pr-creation
description: Use before creating, pushing, opening, or updating a pull request in the HyperFormula repository — load this BEFORE running `gh pr create` or pushing a feature/docs/fix branch, not only when the user says "PR". Covers branch naming, the pre-flight lint/tests, the PR-then-changelog flow, and filling the GitHub PR template.
---

## 1. Read the relevant files from `dev-docs/`

| File | Why |
|---|---|
| [`DEFINITION-OF-DONE.md`](../../../dev-docs/DEFINITION-OF-DONE.md) | Every item the change must contain before review, the pre-flight gate, branch naming, the order of operations, the template, and one change per pull request |
| [`DOC-STANDARDS.md`](../../../dev-docs/DOC-STANDARDS.md#the-changelog) | The changelog entry that follows the pull request |

## 2. Follow the order of operations

Work through the [order of operations](../../../dev-docs/DEFINITION-OF-DONE.md#order-of-operations) step by step, from the branch name to the pushed changelog entry. Write the entry with skill `changelog-creation`.

## 3. Check before asking for review

Go through [`DEFINITION-OF-DONE.md`](../../../dev-docs/DEFINITION-OF-DONE.md), including [One pull request, one change](../../../dev-docs/DEFINITION-OF-DONE.md#one-pull-request-one-change), which covers keeping the description current while the branch is open.
