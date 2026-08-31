# Pull requests

## Branch naming

`<type>/<ticket>-<slug>`, lowercase, hyphen-separated:

```
feat/hf-305-overwrite-flag
fix/hf-357-mod-divisor-sign
docs/hf-282-counts-guide
spike/hf-270-null-to-zero
```

Never put a client name, a customer report's wording, or anything from a private ticket in a branch name. The ticket identifier alone is fine.

Never force-push to `master`, `develop`, or a branch that already has an open pull request.

## Order of operations

1. Commit the source change on a feature branch.
2. Run the pre-flight gate below.
3. Push, and open the pull request.
4. Add the changelog entry, linking that pull request or the public issue it fixes — see [`DOC-STANDARDS.md`](DOC-STANDARDS.md#the-changelog).
5. Commit and push the entry to the same branch.

The entry comes after the pull request exists, because it carries the link. Do not guess the number.

## Pre-flight gate

```bash
npm run test:setup-private   # after any branch switch
npm run lint
npm run test:jest
```

Add `npm run test` (which includes the browser run) when the change touches bundling, module format, or anything browser-specific. Add `npm run docs:generate-function-docs` when it touches a function or its catalogue entry.

Read the output. Do not open a pull request on a red run and describe it as ready.

## The template

[`.github/pull_request_template.md`](../.github/pull_request_template.md) is filled in, not deleted.

- **Context** — why the change is needed, written for a reviewer who has not seen the ticket.
- **How did you test your changes?** — the commands actually run and what they showed, not "added tests".
- **Types of changes** — tick every box that applies, breaking change included, honestly.
- **Related issues** — `Fixes #...` for a public issue. A private ticket identifier may be named; its contents may not.
- **Checklist** — the OpenDocument, Excel, and Google Sheets boxes are real questions about the change. If the behaviour deliberately deviates, say so in Context and record it in [`docs/guide/list-of-differences.md`](../docs/guide/list-of-differences.md).

## Scope and upkeep

One pull request holds one atomic, self-contained change. Unrelated refactors, reformatting, and clean-ups belong in their own — including the ones that are obviously improvements.

**Keep the description current.** A description written once and never revisited is the most common failure in this repository. When the branch changes scope, update it in the same push.

Read your own diff end to end before asking anyone else to. Everything a change must contain is in [`DEFINITION-OF-DONE.md`](DEFINITION-OF-DONE.md).
