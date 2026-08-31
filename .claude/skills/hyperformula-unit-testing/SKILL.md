---
name: hyperformula-unit-testing
paths: test/**
description: Use when writing or modifying tests for HyperFormula, or when a change to `src/` needs test coverage. Covers the two suites, fetching the private suite, how to build an engine in a test, and what a function or CRUD change must cover.
---

How to write a case, and what each kind of change must cover, are in [`TESTING.md`](../../../dev-docs/TESTING.md). What the two suites are and how to attach the private one is in [`test/README.md`](../../../test/README.md). This skill is the loop.

## Before you trust a green run

```bash
npm run test:setup-private
```

Run it after every branch switch. Without `test/hyperformula-tests/` the Jest run covers only the smoke tests and reports a clean pass over almost nothing — the most common false signal in this repository. `test:performance` and `test:compatibility` fail on a missing path rather than an assertion; read the error before concluding the code is broken.

## The loop

```bash
npm run test:jest -- <pattern>    # one file or one describe
npm run test:watch
npm run test                      # lint + jest + browser, the full local gate
```

## Order

1. Write the case from the requirement, not from the implementation.
2. Run it and watch it fail. A bug-fix test that has never failed proves nothing — skill `test-writing-discipline`.
3. Fix the code.
4. Run it again, and read the output rather than assuming it.
