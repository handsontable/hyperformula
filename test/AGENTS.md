# `test/` — the test suite

Two suites live here. Only one of them is in this repository.

| Suite | Path | Availability |
|---|---|---|
| Smoke tests | `smoke.spec.ts` | Everyone |
| Full suite | `hyperformula-tests/` | Private repository, git-ignored, fetched on demand |

## The private suite is branch-matched

[`fetch-tests.sh`](fetch-tests.sh) checks out the branch of the **same name** in the private test repository, creating it from `develop` when it does not exist.

```bash
npm run test:setup-private
```

**Run this after every branch switch.** Skipping it runs the previous branch's tests against the current source: the results are meaningless, and they look like ordinary passes and failures. In a fresh git worktree the directory is absent entirely — see [`dev-docs/WORKTREES.md`](../dev-docs/WORKTREES.md).

`test:performance`, `test:compatibility`, and the benchmark scripts all resolve into `hyperformula-tests/`. Without it they fail with a missing path, not with a test failure. Read the error before concluding the code is broken.

## What a change must cover

Every change to `src/` ships tests here. A bug fix ships a test that **fails against the unfixed code** — write it first and watch it fail. A feature ships a set of tests precise enough to serve as its specification.

Cover more than the happy path: boundary values, empty and invalid input, error results, and interaction with related features.

`docs/`, `examples/`, and `script/` are not tested.

## How to write a case

- **One assertion per case.** Each case is very simple and focused.
- **No loops, no conditionals in a case.** A parameterised loop hides which input failed; write the cases out.
- Name the case after the behaviour it pins, not after the function under test.
- Never relax an assertion, widen a matcher, or skip a case to turn a run green. When a test is red the default assumption is that the **code** is wrong.

External contributors put tests here; the internal team moves them into the private repository through a separate pull request.

Commands and detail: [`dev-docs/TESTING.md`](../dev-docs/TESTING.md), [`README.md`](README.md). Skills: `hyperformula-unit-testing`, `test-writing-discipline`.
