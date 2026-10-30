# Code review

Every pull request is reviewed by a teammate before it is merged. This page says how to review: the principles, the questions to ask, the order to work in, the checks that only a reviewer makes, and how to report findings. The rules the change itself must follow live on the pages listed under [The change follows our guidelines](#the-change-follows-our-guidelines); this page points to them instead of repeating them.

## Principles

- **Humans decide.** AI tools may be used to find issues in a pull request, but the developer decides whether and how each one is fixed. An AI finding is input, not a verdict: understand it before acting on it.
- **Approval means co-ownership.** Approve only if you would be comfortable with the pull request being merged without any further review.
- **Questions, not a pass/fail form.** Many points below are judgement calls. If you accept a trade-off, say so in the review, with the reason.
- **Skip consciously.** Not every section applies to every pull request. Know which ones you skipped, and why.
- **Behaviour and tests first.** Review them at least as carefully as the code. Running the change — a formula in a cell, a small demo — often says more than reading the diff.
- **Review against a source of truth:** the task and its spec, Excel's documentation, the upstream README, or the process the change follows. Without one, a review only checks whether the code looks good.
- **Fix the tooling.** When a linter or CI could catch a problem, change the tooling instead of commenting on the same problem in every pull request.

## The questions to ask

Authors ask these of their own diff before requesting a review; reviewers ask them again.

1. Is the code logical?
2. Is it self-documenting?
3. Does it choose readability over brevity?
4. Does it follow clean code principles and best practices?
5. Does the style match the rest of the project?
6. Does it avoid duplication?
7. Is it maintainable in the long term?
8. Do tests cover the new code?
9. What other important tests could be added?
10. Is the changelog entry correct?
11. Are the documentation changes correct?
12. Are all changes relevant to this issue?
13. What could be done better?

## Review order

Review in this order, and report the first serious finding rather than burying it under style notes:

1. **Correctness** — does the change do what it claims, and would its tests fail without it? Ask the second question of every bug fix.
2. **Completeness** — everything the [definition of done](DEFINITION-OF-DONE.md) requires is present and correct.
3. **Performance** — on the hot paths, see [`PERFORMANCE.md`](../hyperformula/dev-docs/PERFORMANCE.md).
4. **Public API** — every change to it follows [`PUBLIC-API.md`](../hyperformula/dev-docs/PUBLIC-API.md), and [Breaking changes](DEFINITION-OF-DONE.md#breaking-changes) decides whether it breaks. JSDoc on it is published output, so review it as documentation.
5. **Scope** — the pull request holds [one change](DEFINITION-OF-DONE.md#one-pull-request-one-change). Say so when unrelated changes have been folded in, rather than approving them through.
6. **Style, last and briefly** — ESLint owns formatting. Comment only on what it cannot check: a misleading name, a function doing two things, duplicated logic an existing helper already covers.

What to look for in each category in an engine change: [`hyperformula/dev-docs/REVIEWING.md`](../hyperformula/dev-docs/REVIEWING.md). In a `hyperformula-ui` change: [`hyperformula-ui/dev-docs/REVIEWING.md`](../hyperformula-ui/dev-docs/REVIEWING.md).

## The change follows our guidelines

Each line names the page that owns the rules and when it applies. Where reviews often find a rule broken, a "Most often missed" line lists it.

- [ ] The pull request meets the [Definition of Done](DEFINITION-OF-DONE.md) — *always*
  - Most often missed: paired tests pull request on the same branch name; rationale and big picture in the description; one change per pull request; no unrelated changes; no behaviour change outside the pull request's topic; no product decision nobody made; every asserted behaviour traceable to the spec; less obvious breaking changes.
- [ ] The code follows the [code style guide](CODE-STYLE.md) — *any code change*
  - Most often missed: names that say what things do now; dead code; duplication; JSDoc; comments that describe behaviour, not history; single source of truth; concepts nobody can explain.
- [ ] New and moved files sit where the [repository structure](STRUCTURE.md) puts them — *files added or moved; new scripts*
- [ ] The tests meet the [testing standards](TESTING.md) and the [engine testing guide](../hyperformula/dev-docs/TESTING.md) — *any change to production code*
  - Most often missed: every change in `hyperformula/src/` tested; a bug-fix test that fails without the fix; edge cases; tests written from the spec, not the implementation; assertions that tell the cases apart; tests in the right suite; expected values from real Excel.
- [ ] Engine code respects the [architecture invariants](../hyperformula/dev-docs/ARCHITECTURE.md#invariants) — *any change in `hyperformula/src/`*
- [ ] The change follows the page of each subsystem it touches: [interpreter](../hyperformula/dev-docs/INTERPRETER.md), [parser](../hyperformula/dev-docs/PARSER.md), [dependency graph](../hyperformula/dev-docs/DEPENDENCY-GRAPH.md), [function catalogue](../hyperformula/dev-docs/FUNCTION-CATALOGUE.md), [i18n](../hyperformula/dev-docs/I18N.md), [licensing](../hyperformula/dev-docs/LICENSING.md) — *the subsystems in the diff*
  - Most often missed: reusing the engine's mechanisms instead of working around them; a complete catalogue entry; descriptions of HyperFormula's behaviour, not Excel's; every language pack; translations confirmed against a source.
- [ ] Engine results follow the [Excel compatibility rules](../hyperformula/dev-docs/EXCEL-COMPATIBILITY.md) — *any change to what a formula or function returns*
  - Most often missed: values verified in real Excel; every argument type; the right error type and message; arrays.
- [ ] Public API changes follow the [public API rules](../hyperformula/dev-docs/PUBLIC-API.md) — *`HyperFormula.ts`, exported types, configuration options*
  - Most often missed: every change intended and described; the API describes what the engine actually does.
- [ ] Hot-path code follows the [performance rules](../hyperformula/dev-docs/PERFORMANCE.md) — *code on the hot paths that page lists*
  - Most often missed: complexity on the hot paths; reading a whole range when only part of it is needed.
- [ ] Docs, JSDoc and the changelog follow the [documentation standards](DOC-STANDARDS.md) and the [docs content guide](DOCS-CONTENT-GUIDE.md) — *always: every change needs a changelog decision*
  - Most often missed: docs updated; deviations from Excel documented; every statement accurate; an entry where one is needed, from the user's perspective, in the right section, ending with a link; snippets that run when pasted.
- [ ] Changes to `dev-docs/`, `AGENTS.md`, skills and `.claude/` follow the [`dev-docs/` conventions](README.md#conventions) and [agent tooling](AGENT-TOOLING.md) — *always: every pull request updates the `dev-docs/` pages its task touched*
- [ ] Scripts, CI, dependencies, packaging and releases follow [building and releasing](BUILD.md), the [engine build](../hyperformula/dev-docs/BUILD.md) and the [release script README](../script/release/release-README.md) — *build, CI, `package.json`, release changes*
- [ ] Nothing breaks the [sensitive information rules](SENSITIVE-INFORMATION.md) — *always: code, comments, commits, pull request text, changelog, docs*
  - Most often missed: client names; personal data; credentials; private URLs; internal ticket content.
- [ ] None of the mistakes in [Common ways agents fail](../AGENTS.md#common-ways-agents-fail) slipped through — *pull requests written with an AI agent*
- [ ] An external contribution follows the [contributing guide](../CONTRIBUTING.md): CLA signed, tests in `hyperformula/test/` — *pull requests from outside the team*

## Review-specific checks

### Before you start

- [ ] I understand the problem and the requirement this pull request implements.
- [ ] CI is green on the current head, including the run against the paired branch of the private test suite.
- [ ] I am reviewing the code pull request and its paired tests pull request together, not only one of them.

### While reviewing

- [ ] Every claim in the description is true — "matches Excel", "no performance impact", "all tests pass", every listed test exists — and every "cannot", "known gap" or "known limitation" has a real technical reason. Under-selling is an error too.
- [ ] The implementation matches the spec item by item: each table row, each numbered decision.
- [ ] The description's compatibility section matches reality, and no test locks in a divergence from Excel.
- [ ] For a non-trivial behaviour change, I ran it — checked out the branch, or at least evaluated the key formulas — instead of only reading the diff.
- [ ] For a bug fix, I reverted the fix and saw its test fail.
- [ ] Every line the coverage report marks as uncovered in the patch has a test or a stated reason.
- [ ] Earlier review comments were actually addressed, not only marked as resolved.
- [ ] Every fix made during the review has its own test.
- [ ] Every [product decision](DEFINITION-OF-DONE.md#one-pull-request-one-change) hidden in the change — a deprecation, a new public option, a breaking change, a licensing behaviour, an unrequested feature — is escalated, not approved through.
- [ ] An agent mistake worth remembering is added to [Common ways agents fail](../AGENTS.md#common-ways-agents-fail).

### Before you approve

- [ ] I know which sections of this page I applied and which I skipped, and why.
- [ ] Every `blocking:` comment is resolved, and I re-checked the fix — not only the "resolved" status.
- [ ] The spec, changelog entry, documentation, translations, tests and description are consistent with the final code.
- [ ] Every accepted trade-off and every accepted risk is written down — in the review, and in JSDoc where it matters for the code. No silent open threads.
- [ ] I would co-own this pull request — see [Approval means co-ownership](#principles).

### Recurring errors no page names

- [ ] **A change to one sibling reaches all of them.** A guard, fix, `@category` tag or guide section added to one of several siblings (related functions, the undo entries, the `stringify*` callbacks in `ConfigParams`, guides built on one pattern) is added to the others, or the description says why not. [Consistency](../hyperformula/dev-docs/EXCEL-COMPATIBILITY.md#consistency) covers what related functions return; this covers their code and docs.
- [ ] **Links and anchors in changed docs resolve.** Nothing in the docs build checks them yet. When a check does, remove this line (see [Fix the tooling](#principles)).

## Reporting findings

- **One line per finding:** what is wrong, where, and what to do instead. No praise, no summary of what the pull request does.
- **Label every comment.** `blocking:` must be fixed before merge; `suggestion:` and `nit:` are the author's call; `question:` means you need an answer to judge. Separate "this is a bug" from "I would have done it differently", and never present the second as the first.
- **Comments stand on their own.** The author should not need to open the spec to understand them. Explain why, so the author — human or agent — learns the rule, not only the fix.
- **Use `suggestion` blocks** for small textual changes: changelog, docs, naming.
- **Every comment you post is yours.** Verify each finding yourself, including the ones an AI review produced. Never paste raw AI output into a pull request.
