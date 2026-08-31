---
name: pr-creation
description: Use before creating, pushing, opening, or updating a pull request in the HyperFormula repository — load this BEFORE running `gh pr create` or pushing a branch, not only when the user says "PR". Covers branch naming, the pre-flight gate, filling the PR template, and the changelog ordering.
---

## Order of operations

1. Commit the source change on a feature branch.
2. Run the pre-flight gate (below).
3. Push and run `gh pr create`.
4. Read the PR number from the URL it prints.
5. Add the changelog entry, linking that PR (or the public issue it fixes) — see skill `changelog-creation`.
6. Commit and push the changelog entry to the same branch.

The changelog entry comes **after** the PR exists, because it carries the link. Do not guess the next PR number.

## Branch naming

`<type>/<ticket>-<slug>`, lowercase, hyphen-separated:

```
feat/hf-305-overwrite-flag
fix/hf-357-mod-divisor-sign
docs/hf-282-counts-guide
spike/hf-270-null-to-zero
```

Never put a client name, a customer report's wording, or anything from a private ticket in the branch name. The ticket identifier alone is fine.

Never force-push to `master`, `develop`, or a branch that already has an open pull request.

## Pre-flight gate

```bash
npm run test:setup-private   # after any branch switch
npm run lint
npm run test:jest
```

Run `npm run test` (adds the browser run) when the change touches bundling, module format, or anything browser-specific. Run `npm run docs:generate-function-docs` when the change touches a function or its catalogue entry — it fails on a bad or missing entry.

Read the output. Do not open a pull request on a red run and describe it as ready.

## The PR template

`.github/pull_request_template.md` is filled in, not deleted:

- **Context** — why the change is needed and what problem it solves. Written for a reviewer who has not seen the ticket.
- **How did you test your changes?** — the actual commands run and what they showed, not "added tests".
- **Types of changes** — tick every box that applies. Breaking change is its own box; tick it honestly.
- **Related issues** — `Fixes #...` for a public issue. A private ticket identifier may be named, its contents may not.
- **Checklist** — go through it. The OpenDocument, Excel, and Google Sheets compatibility boxes are real questions about the change, not formalities; if the behaviour deliberately deviates, say so in Context and record it in `docs/guide/list-of-differences.md`.

## Keep the description current

The most common failure in this repository is a description written once and never revisited. When the branch changes scope, update the description in the same push.

## Definition of done

Before requesting review, confirm every item in [`dev-docs/DEFINITION-OF-DONE.md`](../../../dev-docs/DEFINITION-OF-DONE.md): production change, tests, documentation, JSDoc, changelog entry, and a current PR description. One pull request holds one atomic change — unrelated refactors and clean-ups belong in their own.

Read your own diff end to end before asking anyone else to.
