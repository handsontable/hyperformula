---
name: hyperformula-unit-testing
description: Use when writing or modifying tests for HyperFormula, or when a change to `hyperformula/src/` needs test coverage. Covers the two suites, fetching the private suite, how to build an engine in a test, and what a function or CRUD change must cover.
---

## 1. Read the relevant files from `dev-docs/`

| File | Why |
|---|---|
| [`TESTING.md`](../../../hyperformula/dev-docs/TESTING.md) | The two suites, attaching the private one, the commands, and what each kind of change must cover |
| [`TESTING.md`](../../../dev-docs/TESTING.md#how-to-write-a-test-case) | How to write the case itself, and what a test must prove to count |
| [`WORKTREES.md`](../../../dev-docs/WORKTREES.md) | Only when working in a linked worktree, where the private suite is absent entirely |

And [`hyperformula/test/README.md`](../../../hyperformula/test/README.md) for how the private suite is fetched and the environment variables it honours.

## 2. Work through them in order

1. Attach the private suite — [Fetching the private suite](../../../hyperformula/dev-docs/TESTING.md#fetching-the-private-suite).
2. Decide what to cover — [What each kind of change needs](../../../hyperformula/dev-docs/TESTING.md#what-each-kind-of-change-needs).
3. Write the case — [How to write a test case](../../../dev-docs/TESTING.md#how-to-write-a-test-case) — and watch it fail first, with skill `test-writing-discipline`.
4. Run it — [Running tests](../../../hyperformula/dev-docs/TESTING.md#running-tests) — and read the output.
