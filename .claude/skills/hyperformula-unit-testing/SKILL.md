---
name: hyperformula-unit-testing
paths: test/**
description: Use when writing or modifying tests for HyperFormula, or when a change to `src/` needs test coverage. Covers the two suites, fetching the private suite, how to build an engine in a test, and what a function or CRUD change must cover.
---

## Two suites

| Suite | Path | Availability |
|---|---|---|
| Smoke tests | `test/smoke.spec.ts` | In this repository |
| Full suite | `test/hyperformula-tests/` | Private repository, git-ignored |

**The private suite is branch-matched.** `npm run test:setup-private` checks out the branch of the same name, creating it from `develop` if it does not exist. Run it after every branch switch — otherwise the previous branch's tests run against the current source and the results mean nothing.

In a fresh git worktree the directory is absent entirely, and `npm run test:jest` covers only the smoke tests. It looks like a clean pass.

## Running

```bash
npm run test:jest                 # fast loop
npm run test:jest -- <pattern>    # one file or one describe
npm run test:watch
npm run test                      # lint + jest + browser — the full local gate
```

`test:performance` and `test:compatibility` resolve into `test/hyperformula-tests/`. Without it they fail on a missing path, not on an assertion. Read the error before concluding the code is broken.

## Shape of a case

```ts
it('returns the divisor sign for arguments with opposite signs', () => {
  const engine = HyperFormula.buildFromArray([['=MOD(-3, 12)']])

  expect(engine.getCellValue(adr('A1'))).toBe(9)
})
```

- **One assertion per case.** Split rather than adding a second `expect`.
- **No loops, no conditionals.** A parameterised loop hides which input failed. Write the cases out.
- **Name the case after the behaviour**, not after the function: "returns `#VALUE!` when the range is empty", not "test SUMIFS".
- Build the smallest engine that exhibits the behaviour. A two-cell array beats a realistic sheet.

## What to cover

**A bug fix** ships a test that fails against the unfixed code. Write it first, run it, watch it fail, then fix. A test written after the fix proves nothing about the bug.

**A function change** — see skill `hyperformula-function-dev` for the full list: ordinary arguments, each declared boundary, wrong argument count, wrong argument type with the specific `CellError`, error propagation, empty cell and empty range, array shape, omitted optional argument.

**A CRUD or structural change** — add and remove rows and columns around a formula, move a range across a formula that references it, then assert **both** the recalculated value and the formula text afterwards. Structural bugs usually show up in the formula text first.

**A parser change** — the parse, the round trip through `Unparser`, at least one non-English language, and malformed input that must produce a parsing error rather than a throw.

**A config option** — the default, a valid non-default value, and an invalid value that must be rejected.

## Never

- Never relax an assertion, widen a matcher, add `toBeCloseTo` where an exact value is expected, or skip a case to turn a run green. When a test is red the default assumption is that the **code** is wrong. See skill `test-writing-discipline`.
- Never test `docs/`, `examples/`, or `script/`.
- Never assert on internals a public API already exposes — use `getCellValue`, `getCellFormula`, `getSheetValues`.
