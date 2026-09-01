# Definition of done

Every change to production code — bug fix, feature, or improvement — must include all of the following **before** a code review is requested.

1. **The production change**, including every supported language pack in `hyperformula/src/i18n/languages/` when function names are involved.
2. **Automatic tests** in `hyperformula/test/`:
   - bug fix — at least one test that reproduces the bug;
   - new feature — a set of tests that precisely describe the feature;
   - pull requests from external contributors put tests in `hyperformula/test/`; the internal team adds them to the private repository through a separate pull request.
   See [`TESTING.md`](TESTING.md).
3. **Documentation updates** matching the change. A breaking change also needs a section in the migration guide. See [`DOC-STANDARDS.md`](DOC-STANDARDS.md).
4. **JSDoc** on classes and functions, plus a high-level description of the concepts used in any complex fragment.
5. **A changelog entry**. Not needed for documentation-only, test-only, or CI and tooling changes, nor for a bug that was introduced and never released. The full rule, and how to write the entry, is in [`DOC-STANDARDS.md`](DOC-STANDARDS.md#the-changelog).
6. **A pull request description** — kept current as the branch evolves, not written once and left to rot.

Every element must be not only present but correct: the changelog entry must describe the change accurately, and the documentation must match the new behaviour.

## Before requesting a review

Read your own diff end to end and ask what could be done better. Fix what you find while the change is still yours.

## One pull request, one change

A pull request contains a single atomic, self-contained functional change: one bug fix, one feature, or one improvement. A pull request with several of those should be split.

Every change in the pull request must be relevant to the issue it solves. Unrelated refactors, reformatting, and clean-ups belong in a separate pull request — including the ones that are obviously improvements.

## Breaking changes

The public API is `hyperformula/src/HyperFormula.ts` and the types it exports. Avoid breaking it. When a change genuinely requires a break:

- state it explicitly in the pull request description and the changelog entry;
- add a migration-guide section describing what breaks and what to do instead;
- keep a test proving the old behaviour where the old behaviour is meant to keep working.
