---
name: pr-creation
description: Use before creating, pushing, opening, or updating a pull request in the HyperFormula repository — load this BEFORE running `gh pr create` or pushing a feature/docs/fix branch, not only when the user says "PR". Covers branch naming, the pre-flight lint/tests, the PR-then-changelog flow, and filling the GitHub PR template.
---

Branch naming, the pre-flight gate, the template, and the scope rule are in [`PULL-REQUESTS.md`](../../../dev-docs/PULL-REQUESTS.md). Read it before pushing. This skill is the run order.

## Run order

1. Commit on a correctly named feature branch.
2. Run the gate and **read the output**:
   ```bash
   npm run test:setup-private
   npm run lint
   npm run test:jest
   ```
   A green Jest run without `test/hyperformula-tests/` covers only the smoke tests. Confirm the suite is attached before calling it green.
3. Push and open the pull request. Fill in every section of the template.
4. Read the pull request number from the URL.
5. Add the changelog entry with that link — skill `changelog-creation` — and push it to the same branch.
6. Confirm every item of [`DEFINITION-OF-DONE.md`](../../../dev-docs/DEFINITION-OF-DONE.md).

## While the branch is open

Update the description in the same push whenever the scope changes. Read your own diff end to end before asking anyone else to.
