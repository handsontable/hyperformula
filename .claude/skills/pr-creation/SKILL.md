---
name: pr-creation
description: Use before creating, pushing, opening, or updating a pull request in the HyperFormula repository — load this BEFORE running `gh pr create` or pushing a feature/docs/fix branch, not only when the user says "PR". Covers branch naming, the pre-flight lint/tests, the PR-then-changelog flow, and filling the GitHub PR template.
---

## 1. Read the relevant files from `dev-docs/`

| File | Why |
|---|---|
| [`PULL-REQUESTS.md`](../../../dev-docs/PULL-REQUESTS.md) | Branch naming, the pre-flight gate, the template, and the one-change-per-pull-request rule |
| [`DEFINITION-OF-DONE.md`](../../../dev-docs/DEFINITION-OF-DONE.md) | Every item the change must contain before review |
| [`DOC-STANDARDS.md`](../../../dev-docs/DOC-STANDARDS.md#the-changelog) | The changelog entry that follows the pull request |

## 2. Commit on a correctly named branch

`<type>/<ticket>-<slug>`. Nothing from a private ticket in the name — the identifier alone is fine.

## 3. Run the gate and read the output

```bash
npm run test:setup-private
npm run lint
npm run test:jest
```

A green Jest run without `test/hyperformula-tests/` covers only the smoke tests. Confirm the suite is attached before calling it green. Do not open a pull request on a red run and describe it as ready.

## 4. Push and open the pull request

Fill in every section of the template. Tick the Types of changes boxes honestly, breaking change included.

## 5. Add the changelog entry

Read the number from the pull request URL, then skill `changelog-creation`. Push it to the same branch.

## 6. Confirm the definition of done

Then read your own diff end to end before asking anyone else to.

## While the branch is open

Update the description in the same push whenever the scope changes.
