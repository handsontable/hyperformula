---
name: hyperformula-unit-testing
paths: hyperformula/test/**
description: Use when writing or modifying tests for HyperFormula, or when a change to `hyperformula/src/` needs test coverage. Covers the two suites, fetching the private suite, how to build an engine in a test, and what a function or CRUD change must cover.
---

## 1. Read the relevant files from `dev-docs/`

| File | Why |
|---|---|
| [`TESTING.md`](../../../hyperformula/dev-docs/TESTING.md) | The two suites, how to run them, and what each kind of change must cover |
| [`TESTING.md`](../../../dev-docs/TESTING.md#how-to-write-a-test-case) | How to write the case itself, and what a test must prove to count |
| [`WORKTREES.md`](../../../dev-docs/WORKTREES.md) | Only when working in a linked worktree, where the private suite is absent entirely |

And [`hyperformula/test/README.md`](../../../hyperformula/test/README.md) for how the private suite is fetched and the environment variables it honours.

## 2. Attach the private suite before trusting anything

```bash
npm run test:setup-private
```

Run it after every branch switch. Without `hyperformula/test/hyperformula-tests/` the Jest run covers only the smoke tests and reports a clean pass over almost nothing — the most common false signal in this repository. `test:performance` and `test:compatibility` fail on a missing path rather than an assertion; read the error before concluding the code is broken.

## 3. Write the case from the requirement

Not from the implementation. A test written from the code passes for any implementation, including the wrong one.

## 4. Run it and watch it fail

For a bug fix this is not optional — skill `test-writing-discipline`.

```bash
npm run test:jest -- <pattern>    # one file or one describe
npm run test:watch
```

## 5. Fix the code, then run again

Read the output rather than assuming it. `npm run test` is the full local gate: lint, Jest, and the browser run.
