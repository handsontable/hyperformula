# Definition of done

Every change to production code — bug fix, feature, or improvement — must include all of the following **before** a code review is requested.

1. **The production change**, including every supported language pack in `hyperformula/src/i18n/languages/` when function names are involved.
2. **Automatic tests** in `hyperformula/test/`:
   - bug fix — at least one test that reproduces the bug;
   - new feature — a set of tests that precisely describe the feature;
   - the internal team's tests go to the private suite, through a paired pull request on the branch of the same name — see [The two suites](../hyperformula/dev-docs/TESTING.md#the-two-suites).
   See [`TESTING.md`](TESTING.md).
3. **Documentation updates** matching the change. A breaking change also needs a section in the migration guide. See [`DOC-STANDARDS.md`](DOC-STANDARDS.md).
4. **JSDoc** on classes and functions, plus a high-level description of the concepts used in any complex fragment.
5. **A changelog entry**. Not needed for documentation-only, test-only, or CI and tooling changes, nor for a bug that was introduced and never released. The full rule, and how to write the entry, is in [`DOC-STANDARDS.md`](DOC-STANDARDS.md#the-changelog).
6. **A pull request description**, filled in from [the template](#the-template) and [kept current](#one-pull-request-one-change) as the branch evolves.
7. **The developer docs.** Every pull request updates the `dev-docs/` pages its task touched. On every task, ask: *how can the developer docs be made better, so that the next tasks go smoother and reach higher quality?*

Every element must be not only present but correct: the changelog entry must describe the change accurately, and the documentation must match the new behaviour.

Changes in other repositories that depend on this one, such as the website or the demos, are prepared alongside it and merged together with it.

## Before requesting a review

Read your own diff end to end and ask what could be done better. Fix what you find while the change is still yours. The questions in [`CODE-REVIEW.md`](CODE-REVIEW.md#the-questions-to-ask) are the self-review list.

The branch has no merge conflicts and is reasonably up to date with `develop`, or with its feature branch.

### Pre-flight gate

```bash
npm run test:setup-private   # after any branch switch
npm run lint
npm run test:jest
```

Add `npm run test` (which includes the browser run) when the change touches bundling, module format, or anything browser-specific. Add `npm run docs:generate-function-docs` when it touches a function or its catalogue entry — from the repository root, after `npm run docs:install`, because the generator runs in the portal's own install.

Read the output. Do not open a pull request on a red run and describe it as ready. A green Jest run without the private suite covers only the smoke tests — see [Fetching the private suite](../hyperformula/dev-docs/TESTING.md#fetching-the-private-suite). A red CI job unrelated to the change is explained in the pull request and reported, not ignored.

## Opening the pull request

### Branch naming

`<type>/<ticket>-<slug>`, lowercase, hyphen-separated:

```
feat/hf-123-overwrite-flag
fix/hf-123-mod-divisor-sign
docs/hf-123-counts-guide
spike/hf-123-null-to-zero
```

The ticket identifier alone is fine; nothing else from the ticket is. What must never appear in a branch name is in [`SENSITIVE-INFORMATION.md`](SENSITIVE-INFORMATION.md).

Never force-push to `master`, `develop`, or a branch that already has an open pull request.

### Order of operations

1. Commit the source change on a feature branch cut from `develop`.
2. Run the [pre-flight gate](#pre-flight-gate).
3. Push, and open the pull request against `develop` (`gh pr create --base develop`). The repository's default branch is `master`, so without `--base` the pull request targets `master`. Fill in every section of [the template](#the-template).
4. Add the changelog entry, linking that pull request or the public issue it fixes — see [`DOC-STANDARDS.md`](DOC-STANDARDS.md#the-changelog).
5. Commit and push the entry to the same branch.

The entry comes after the pull request exists, because it carries the link. Do not guess the number: read it from the URL `gh pr create` prints.

**Multi-part features.** Each part's branch is cut from, and its pull request targets, the feature branch (type `feature`, otherwise named as in [Branch naming](#branch-naming): `feature/<ticket>-<slug>`) instead of `develop`. The whole feature is merged into `develop` once.

### The template

[`.github/pull_request_template.md`](../.github/pull_request_template.md) is filled in, not deleted. Answer every section, with "None" or "Not applicable" where that is the answer. The template's own comments say what each section needs.

A deliberate deviation from Excel is explained in the template's [Compatibility with Excel and Google Sheets](../.github/pull_request_template.md#compatibility-with-excel-and-google-sheets) section, and recorded in the list of differences as [Describing behaviour](DOC-STANDARDS.md#describing-behaviour) says.

## One pull request, one change

A pull request contains a single atomic, self-contained functional change: one bug fix, one feature, or one improvement. A pull request with several of those should be split.

**Every change is relevant to the issue.** Unrelated refactors, reformatting, and clean-ups go to a separate pull request — including the ones that are obviously improvements. So do edits to unrelated guides, and configuration, CI, or ESLint changes made only to get something passing.

**No behaviour change outside the topic.** A pull request does not change the behaviour of something it is not about, for example a function's behaviour inside a docs or metadata pull request. That change gets its own pull request.

**No product decision nobody made.** A pull request does not introduce a deprecation, a new public option, a breaking change, or a licensing behaviour on its own. Nor does it add features, docs sections, or files nobody asked for, which is typical for AI agents. Raise it with the product team instead.

**Follow-up tasks.** Every issue or improvement found during implementation or code review that this pull request does not address gets a follow-up task, unless one already exists. A bug's task includes reproduction steps, the expected result, and example code. A pre-existing bug that blocks the change is fixed in this pull request, with a test and a changelog entry.

**Keep the description current.** A description written once and never revisited is the most common failure in this repository. When the branch changes scope, update it in the same push.

## Changes that implement a spec

This applies to tasks that come with a spec: a document with numbered decisions. How a spec is written and approved belongs to the internal delivery process, not this page.

- Every behaviour the code or the tests assert can be traced back to the spec. Ask: *where in the spec does it say that?*
- Where the code and the spec disagree, fix one of them explicitly: either the code, or the spec, with a note in it saying what changed.

## Breaking changes

The public API is `hyperformula/src/HyperFormula.ts` and the types re-exported from `hyperformula/src/index.ts`. Avoid breaking it. When a change genuinely requires a break:

- state it explicitly in the pull request description and the changelog entry;
- add a migration-guide section describing what breaks and what to do instead;
- keep a test proving the old behaviour where the old behaviour is meant to keep working.

**The less obvious breaking changes** count too:

- a new member of an enum that every translation package must cover (`ErrorType` except `LIC`, and `UIElement`): a language registered with `registerLanguage` and missing the new key fails with `MissingTranslationError`;
- a changed default value;
- a different return for an existing input: another type, `undefined` instead of `null`, a copy instead of a live object;
- changed import paths of the package — keep the old ones working;
- fixed behaviour that users may rely on.

**The reverse.** A change is breaking only if it breaks something that worked before. A change in a state that was already unusable is not breaking, but it still gets a changelog entry.

**Planning.** A breaking change is planned for a major release, and its task is tagged "breaking change".

**Found during development.** If a change turns out to be breaking, consult the product team before going further (see [One pull request, one change](#one-pull-request-one-change)). The solution is designed together for that specific problem.

**Deprecations** are decided like any other [product decision](#one-pull-request-one-change), not introduced by a pull request on its own. A deprecated API keeps working until the next major release.
